import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { type OrdenCompra } from '@/lib/supabase';

interface GrupoProveedor {
  proveedor: string
  ordenes: OrdenCompra[]
  totalPorMoneda: Record<string, number>
  cantidadOrdenes: number
  estadosResumen: { compras: number, tesoreria: number, completada: number }
}

interface ExportOptions {
  vistaAgrupada: boolean
  simbolosMonedas: Record<string, string>
  incluirPDFs: boolean
}

// Función para obtener estado de OC
function getEstadoOrden(orden: OrdenCompra): string {
  if (orden.est_compras && orden.est_tesoreria) return 'completada'
  if (orden.est_compras && !orden.est_tesoreria) return 'tesoreria'
  return 'compras'
}

// Función para obtener texto del estado
function getEstadoTexto(estado: string, esEmergencia: boolean = false): string {
  switch (estado) {
    case 'completada':
      return esEmergencia ? '🚨 URGENTE - Completada' : '✅ Completada'
    case 'tesoreria':
      return esEmergencia ? '🚨 URGENTE - En Tesorería' : '🟡 En Tesorería'
    case 'compras':
      return esEmergencia ? '🚨 URGENTE - Pend. Compras' : '🔴 Pend. Compras'
    default:
      return 'Desconocido'
  }
}

// Función para formatear fecha
function formatearFecha(fecha: string): string {
  return new Date(fecha + 'T12:00:00').toLocaleDateString('es-ES')
}

// Función para formatear monto con símbolo
function formatearMonto(monto: number | null, moneda: string | null, simbolosMonedas: Record<string, string>): string {
  if (!monto) return '-'
  const simbolo = simbolosMonedas[moneda || 'ARS'] || '$'
  return `${simbolo}${monto.toLocaleString()}`
}

// Crear hoja de resumen por proveedor
function crearHojaResumenProveedores(grupos: GrupoProveedor[], simbolosMonedas: Record<string, string>) {
  const headers = [
    'Proveedor',
    'Cantidad OC',
    'Total ARS',
    'Total USD', 
    'Total BRL',
    'Otros Totales',
    'Pend. Compras',
    'En Tesorería',
    'Completadas',
    'Estado General'
  ]

  const rows = grupos.map(grupo => {
    // Calcular estado general del proveedor
    const { compras, tesoreria, completada } = grupo.estadosResumen
    let estadoGeneral = ''
    if (compras > 0) estadoGeneral += `${compras} Pendientes`
    if (tesoreria > 0) estadoGeneral += `${estadoGeneral ? ', ' : ''}${tesoreria} En Tesorería`
    if (completada > 0) estadoGeneral += `${estadoGeneral ? ', ' : ''}${completada} Completadas`

    // Obtener totales por moneda principales
    const totalARS = grupo.totalPorMoneda['ARS'] || 0
    const totalUSD = grupo.totalPorMoneda['USD'] || 0
    const totalBRL = grupo.totalPorMoneda['BRL'] || 0
    
    // Otras monedas
    const otrasMonedas = Object.entries(grupo.totalPorMoneda)
      .filter(([moneda]) => !['ARS', 'USD', 'BRL'].includes(moneda))
      .map(([moneda, total]) => `${simbolosMonedas[moneda] || '$'}${total.toLocaleString()} ${moneda}`)
      .join(', ')

    return [
      grupo.proveedor,
      grupo.cantidadOrdenes,
      totalARS > 0 ? formatearMonto(totalARS, 'ARS', simbolosMonedas) : '-',
      totalUSD > 0 ? formatearMonto(totalUSD, 'USD', simbolosMonedas) : '-',
      totalBRL > 0 ? formatearMonto(totalBRL, 'BRL', simbolosMonedas) : '-',
      otrasMonedas || '-',
      compras,
      tesoreria,
      completada,
      estadoGeneral
    ]
  })

  return [headers, ...rows]
}

// Crear hoja de detalle individual
function crearHojaDetalleIndividual(ordenes: OrdenCompra[], simbolosMonedas: Record<string, string>) {
  const headers = [
    'Código OC',
    'Fecha',
    'Proveedor',
    'Vehículo (Placa)',
    'Vehículo (Modelo)',
    'Interno',
    'Monto',
    'Moneda',
    'Estado',
    'Es Emergencia',
    'Titular',
    'CUIT',
    'Items/Descripción',
    'PDF Disponible',
    'Fecha Creación'
  ]

  const rows = ordenes.map(orden => {
    const estado = getEstadoOrden(orden)
    return [
      orden.codigo,
      formatearFecha(orden.fecha),
      orden.proveedor || '-',
      orden.placa || '-',
      orden.modelo || '-',
      orden.interno || '-',
      orden.monto ? orden.monto.toLocaleString() : '-',
      orden.moneda || 'ARS',
      getEstadoTexto(estado, orden.es_emergencia),
      orden.es_emergencia ? 'SÍ' : 'NO',
      orden.titular || '-',
      orden.cuit || '-',
      orden.items || '-',
      orden.pdf_url ? 'SÍ' : 'NO',
      orden.created_at ? new Date(orden.created_at).toLocaleString('es-ES') : '-'
    ]
  })

  return [headers, ...rows]
}

// Crear hoja de PDFs incluidos
function crearHojaPDFsIncluidos(ordenes: OrdenCompra[]) {
  const headers = [
    'Código OC',
    'Nombre Archivo PDF',
    'URL Original',
    'Estado',
    'Proveedor'
  ]

  const rows = ordenes
    .filter(orden => orden.pdf_url)
    .map(orden => [
      orden.codigo,
      `${orden.codigo}.pdf`,
      orden.pdf_url,
      getEstadoTexto(getEstadoOrden(orden), orden.es_emergencia),
      orden.proveedor || '-'
    ])

  return [headers, ...rows]
}

// Función principal de exportación
export async function exportarOrdenesCompleto(
  ordenes: OrdenCompra[],
  grupos: GrupoProveedor[],
  options: ExportOptions
): Promise<void> {
  try {
    // Crear workbook de Excel
    const wb = XLSX.utils.book_new()

    // Hoja 1: Resumen por Proveedor (solo en vista agrupada)
    if (options.vistaAgrupada && grupos.length > 0) {
      const datosResumen = crearHojaResumenProveedores(grupos, options.simbolosMonedas)
      const wsResumen = XLSX.utils.aoa_to_sheet(datosResumen)
      
      // Estilo para la hoja resumen
      wsResumen['!cols'] = [
        { width: 25 }, // Proveedor
        { width: 12 }, // Cantidad OC
        { width: 15 }, // Total ARS
        { width: 15 }, // Total USD
        { width: 15 }, // Total BRL
        { width: 20 }, // Otros Totales
        { width: 12 }, // Pend. Compras
        { width: 12 }, // En Tesorería
        { width: 12 }, // Completadas
        { width: 30 }  // Estado General
      ]
      
      XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen por Proveedor')
    }

    // Hoja 2: Detalle Individual
    const datosDetalle = crearHojaDetalleIndividual(ordenes, options.simbolosMonedas)
    const wsDetalle = XLSX.utils.aoa_to_sheet(datosDetalle)
    
    // Estilo para hoja detalle
    wsDetalle['!cols'] = [
      { width: 20 }, // Código OC
      { width: 12 }, // Fecha
      { width: 25 }, // Proveedor
      { width: 15 }, // Placa
      { width: 20 }, // Modelo
      { width: 10 }, // Interno
      { width: 15 }, // Monto
      { width: 10 }, // Moneda
      { width: 20 }, // Estado
      { width: 12 }, // Es Emergencia
      { width: 25 }, // Titular
      { width: 15 }, // CUIT
      { width: 40 }, // Items
      { width: 12 }, // PDF
      { width: 18 }  // Fecha Creación
    ]
    
    XLSX.utils.book_append_sheet(wb, wsDetalle, 'Detalle Individual')

    // Hoja 3: PDFs Incluidos
    const ordenesBConPDF = ordenes.filter(o => o.pdf_url)
    if (ordenesBConPDF.length > 0) {
      const datosPDFs = crearHojaPDFsIncluidos(ordenes)
      const wsPDFs = XLSX.utils.aoa_to_sheet(datosPDFs)
      
      wsPDFs['!cols'] = [
        { width: 20 }, // Código OC
        { width: 25 }, // Nombre Archivo
        { width: 50 }, // URL Original
        { width: 20 }, // Estado
        { width: 25 }  // Proveedor
      ]
      
      XLSX.utils.book_append_sheet(wb, wsPDFs, 'PDFs Incluidos')
    }

    // Generar archivo Excel
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    
    if (options.incluirPDFs && ordenesBConPDF.length > 0) {
      // Crear ZIP con Excel + PDFs
      await crearZipConPDFs(excelBuffer, ordenesBConPDF, options.vistaAgrupada)
    } else {
      // Solo descargar Excel
      const fechaHoy = new Date().toISOString().split('T')[0]
      const nombreArchivo = options.vistaAgrupada 
        ? `Reporte_OC_Agrupado_${fechaHoy}.xlsx`
        : `Reporte_OC_Individual_${fechaHoy}.xlsx`
      
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      saveAs(blob, nombreArchivo)
    }

  } catch (error) {
    console.error('Error exportando órdenes:', error)
    throw new Error('Error al generar la exportación')
  }
}

// Crear ZIP con Excel + PDFs
async function crearZipConPDFs(
  excelBuffer: ArrayBuffer,
  ordenes: OrdenCompra[],
  vistaAgrupada: boolean
): Promise<void> {
  const zip = new JSZip()
  const fechaHoy = new Date().toISOString().split('T')[0]
  
  // Agregar Excel al ZIP
  const nombreExcel = vistaAgrupada 
    ? `Reporte_OC_Agrupado_${fechaHoy}.xlsx`
    : `Reporte_OC_Individual_${fechaHoy}.xlsx`
  
  zip.file(nombreExcel, excelBuffer)
  
  // Crear carpeta para PDFs
  const carpetaPDFs = zip.folder('PDFs')
  
  // Descargar y agregar PDFs
  const promesasPDFs = ordenes.map(async (orden) => {
    if (!orden.pdf_url) return
    
    try {
      const response = await fetch(orden.pdf_url)
      if (response.ok) {
        const pdfBuffer = await response.arrayBuffer()
        const nombrePDF = `${orden.codigo}.pdf`
        carpetaPDFs?.file(nombrePDF, pdfBuffer)
      }
    } catch (error) {
      console.warn(`Error descargando PDF para OC ${orden.codigo}:`, error)
    }
  })
  
  // Esperar a que se descarguen todos los PDFs
  await Promise.all(promesasPDFs)
  
  // Generar y descargar ZIP
  const zipBuffer = await zip.generateAsync({ type: 'blob' })
  const nombreZip = `Export_OC_${fechaHoy}.zip`
  
  saveAs(zipBuffer, nombreZip)
}

// Función auxiliar para exportación rápida sin PDFs
export function exportarSoloExcel(
  ordenes: OrdenCompra[],
  grupos: GrupoProveedor[],
  options: Omit<ExportOptions, 'incluirPDFs'>
): Promise<void> {
  return exportarOrdenesCompleto(ordenes, grupos, { ...options, incluirPDFs: false })
}