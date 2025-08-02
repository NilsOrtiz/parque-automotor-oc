import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
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

// Crear hoja principal única (como la tabla web)
function crearHojaPrincipal(ordenes: OrdenCompra[], simbolosMonedas: Record<string, string>) {
  const headers = [
    'ID OC',
    'Fecha',
    'Vehículo',
    'Placa',
    'Interno',
    'Modelo',
    'Proveedor',
    'Monto',
    'Moneda',
    'Estado',
    'Emergencia',
    'PDF',
    'Nombre Archivo',
    'Titular',
    'CUIT',
    'Items/Descripción',
    'Fecha Creación'
  ]

  const rows = ordenes.map(orden => {
    const estado = getEstadoOrden(orden)
    const vehiculo = orden.placa && orden.modelo 
      ? `${orden.placa} • ${orden.modelo}`
      : (orden.placa || orden.modelo || '-')
    
    const montoFormateado = orden.monto 
      ? `${simbolosMonedas[orden.moneda || 'ARS'] || '$'}${orden.monto.toLocaleString()}`
      : '-'

    return [
      orden.codigo,
      formatearFecha(orden.fecha),
      vehiculo,
      orden.placa || '-',
      orden.interno || '-',
      orden.modelo || '-',
      orden.proveedor || '-',
      montoFormateado,
      orden.moneda || 'ARS',
      getEstadoTexto(estado, orden.es_emergencia),
      orden.es_emergencia ? '🚨 URGENTE' : 'Normal',
      orden.pdf_url ? '✅ Disponible' : '❌ Sin PDF',
      orden.pdf_url ? `${orden.codigo}.pdf` : '-',
      orden.titular || '-',
      orden.cuit || '-',
      orden.items || '-',
      orden.created_at ? new Date(orden.created_at).toLocaleString('es-ES') : '-'
    ]
  })

  return [headers, ...rows]
}

// Crear hoja agrupada por proveedor (como se ve en la web)
function crearHojaAgrupadaPorProveedor(grupos: GrupoProveedor[], simbolosMonedas: Record<string, string>) {
  const headers = [
    'ID OC',
    'Fecha',
    'Vehículo',
    'Placa',
    'Interno',
    'Modelo',
    'Proveedor',
    'Monto',
    'Moneda',
    'Estado',
    'Emergencia',
    'PDF',
    'Nombre Archivo',
    'Titular',
    'CUIT',
    'Items/Descripción',
    'Fecha Creación'
  ]

  const rows: any[] = []
  
  // Por cada grupo de proveedor
  grupos.forEach(grupo => {
    // Agregar las órdenes individuales del proveedor
    grupo.ordenes.forEach(orden => {
      const estado = getEstadoOrden(orden)
      const vehiculo = orden.placa && orden.modelo 
        ? `${orden.placa} • ${orden.modelo}`
        : (orden.placa || orden.modelo || '-')
      
      const montoFormateado = orden.monto 
        ? `${simbolosMonedas[orden.moneda || 'ARS'] || '$'}${orden.monto.toLocaleString()}`
        : '-'

      rows.push([
        orden.codigo,
        formatearFecha(orden.fecha),
        vehiculo,
        orden.placa || '-',
        orden.interno || '-',
        orden.modelo || '-',
        orden.proveedor || '-',
        montoFormateado,
        orden.moneda || 'ARS',
        getEstadoTexto(estado, orden.es_emergencia),
        orden.es_emergencia ? '🚨 URGENTE' : 'Normal',
        orden.pdf_url ? '✅ Disponible' : '❌ Sin PDF',
        orden.pdf_url ? `${orden.codigo}.pdf` : '-',
        orden.titular || '-',
        orden.cuit || '-',
        orden.items || '-',
        orden.created_at ? new Date(orden.created_at).toLocaleString('es-ES') : '-'
      ])
    })

    // Agregar fila de resumen del proveedor (como en la web - fila azul)
    const totalTextos = Object.entries(grupo.totalPorMoneda).map(([moneda, total]) => 
      `${simbolosMonedas[moneda] || '$'}${total.toLocaleString()} ${moneda}`
    ).join(' + ')

    const estadosTexto = []
    if (grupo.estadosResumen.compras > 0) estadosTexto.push(`${grupo.estadosResumen.compras} Compras`)
    if (grupo.estadosResumen.tesoreria > 0) estadosTexto.push(`${grupo.estadosResumen.tesoreria} Tesorería`)
    if (grupo.estadosResumen.completada > 0) estadosTexto.push(`${grupo.estadosResumen.completada} Completadas`)

    rows.push([
      '', // ID OC vacío
      '', // Fecha vacía
      '', // Vehículo vacío
      `📊 RESUMEN - ${grupo.proveedor}`, // En columna Placa
      '', // Interno vacío
      '', // Modelo vacío
      `${grupo.cantidadOrdenes} órdenes`, // En columna Proveedor
      totalTextos, // En columna Monto
      '', // Moneda vacía
      estadosTexto.join(', '), // En columna Estado
      '', // Emergencia vacía
      'TOTAL', // En columna PDF
      '', // Nombre archivo vacío
      '', // Titular vacío
      '', // CUIT vacío
      '', // Items vacío
      '' // Fecha creación vacía
    ])
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

// Función principal de exportación con formato visual
export async function exportarOrdenesCompleto(
  ordenes: OrdenCompra[],
  grupos: GrupoProveedor[],
  options: ExportOptions
): Promise<void> {
  try {
    // Crear workbook con ExcelJS para mejor formato
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet(
      options.vistaAgrupada ? 'OC Agrupadas por Proveedor' : 'Órdenes de Compra'
    )

    // Configurar anchos de columnas
    worksheet.columns = [
      { width: 22 }, // ID OC
      { width: 12 }, // Fecha
      { width: 30 }, // Vehículo
      { width: 12 }, // Placa
      { width: 8 },  // Interno
      { width: 20 }, // Modelo
      { width: 25 }, // Proveedor
      { width: 18 }, // Monto
      { width: 8 },  // Moneda
      { width: 20 }, // Estado
      { width: 15 }, // Emergencia
      { width: 15 }, // PDF
      { width: 25 }, // Nombre Archivo
      { width: 25 }, // Titular
      { width: 15 }, // CUIT
      { width: 40 }, // Items/Descripción
      { width: 18 }  // Fecha Creación
    ]

    // Headers
    const headers = [
      'ID OC', 'Fecha', 'Vehículo', 'Placa', 'Interno', 'Modelo', 'Proveedor',
      'Monto', 'Moneda', 'Estado', 'Emergencia', 'PDF', 'Nombre Archivo',
      'Titular', 'CUIT', 'Items/Descripción', 'Fecha Creación'
    ]

    // Agregar headers con formato
    const headerRow = worksheet.addRow(headers)
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } }
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
      cell.border = {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' }
      }
    })

    // Agregar datos según la vista
    if (options.vistaAgrupada) {
      grupos.forEach((grupo) => {
        // Agregar órdenes del proveedor
        grupo.ordenes.forEach(orden => {
          const estado = getEstadoOrden(orden)
          const vehiculo = orden.placa && orden.modelo 
            ? `${orden.placa} • ${orden.modelo}`
            : (orden.placa || orden.modelo || '-')
          
          const montoFormateado = orden.monto 
            ? `${options.simbolosMonedas[orden.moneda || 'ARS'] || '$'}${orden.monto.toLocaleString()}`
            : '-'

          worksheet.addRow([
            orden.codigo,
            formatearFecha(orden.fecha),
            vehiculo,
            orden.placa || '-',
            orden.interno || '-',
            orden.modelo || '-',
            orden.proveedor || '-',
            montoFormateado,
            orden.moneda || 'ARS',
            getEstadoTexto(estado, orden.es_emergencia),
            orden.es_emergencia ? '🚨 URGENTE' : 'Normal',
            orden.pdf_url ? '✅ Disponible' : '❌ Sin PDF',
            orden.pdf_url ? `${orden.codigo}.pdf` : '-',
            orden.titular || '-',
            orden.cuit || '-',
            orden.items || '-',
            orden.created_at ? new Date(orden.created_at).toLocaleString('es-ES') : '-'
          ])
        })

        // Agregar fila de resumen con formato especial
        const totalTextos = Object.entries(grupo.totalPorMoneda).map(([moneda, total]) => 
          `${options.simbolosMonedas[moneda] || '$'}${total.toLocaleString()} ${moneda}`
        ).join(' + ')

        const estadosTexto = []
        if (grupo.estadosResumen.compras > 0) estadosTexto.push(`${grupo.estadosResumen.compras} Compras`)
        if (grupo.estadosResumen.tesoreria > 0) estadosTexto.push(`${grupo.estadosResumen.tesoreria} Tesorería`)
        if (grupo.estadosResumen.completada > 0) estadosTexto.push(`${grupo.estadosResumen.completada} Completadas`)

        const resumenRow = worksheet.addRow([
          '',
          '',
          '',
          `📊 RESUMEN - ${grupo.proveedor}`,
          '',
          '',
          `${grupo.cantidadOrdenes} órdenes`,
          totalTextos,
          '',
          estadosTexto.join(', '),
          '',
          'TOTAL',
          '',
          '',
          '',
          '',
          ''
        ])

        // Formato especial para fila de resumen
        resumenRow.eachCell((cell) => {
          cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } }
          cell.alignment = { horizontal: 'center', vertical: 'middle' }
        })
      })
    } else {
      // Vista individual
      ordenes.forEach(orden => {
        const estado = getEstadoOrden(orden)
        const vehiculo = orden.placa && orden.modelo 
          ? `${orden.placa} • ${orden.modelo}`
          : (orden.placa || orden.modelo || '-')
        
        const montoFormateado = orden.monto 
          ? `${options.simbolosMonedas[orden.moneda || 'ARS'] || '$'}${orden.monto.toLocaleString()}`
          : '-'

        worksheet.addRow([
          orden.codigo,
          formatearFecha(orden.fecha),
          vehiculo,
          orden.placa || '-',
          orden.interno || '-',
          orden.modelo || '-',
          orden.proveedor || '-',
          montoFormateado,
          orden.moneda || 'ARS',
          getEstadoTexto(estado, orden.es_emergencia),
          orden.es_emergencia ? '🚨 URGENTE' : 'Normal',
          orden.pdf_url ? '✅ Disponible' : '❌ Sin PDF',
          orden.pdf_url ? `${orden.codigo}.pdf` : '-',
          orden.titular || '-',
          orden.cuit || '-',
          orden.items || '-',
          orden.created_at ? new Date(orden.created_at).toLocaleString('es-ES') : '-'
        ])
      })
    }

    // Generar buffer del Excel
    const excelBuffer = await workbook.xlsx.writeBuffer()
    
    const ordenesBConPDF = ordenes.filter(o => o.pdf_url)
    
    if (options.incluirPDFs && ordenesBConPDF.length > 0) {
      // Crear ZIP con Excel + PDFs
      await crearZipConPDFs(excelBuffer, ordenesBConPDF, options.vistaAgrupada)
    } else {
      // Solo descargar Excel
      const fechaHoy = new Date().toISOString().split('T')[0]
      const nombreArchivo = options.vistaAgrupada 
        ? `OC_Agrupado_${fechaHoy}.xlsx`
        : `OC_Listado_${fechaHoy}.xlsx`
      
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