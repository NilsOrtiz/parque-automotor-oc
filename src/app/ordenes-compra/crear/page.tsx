'use client'

import React, { useState } from 'react'

// Declarar timeout global para verificación de código
declare global {
  interface Window {
    timeoutCodigoCheck?: NodeJS.Timeout
  }
}
import Link from 'next/link'
import { Search, ArrowRight, ArrowLeft } from "lucide-react"
import { supabase, type Vehiculo, type Proveedor, uploadOCDocument, getOCDocumentURL, STORAGE_BUCKET } from '@/lib/supabase'

interface VehiculoInfo {
  Nro_Interno: number
  Placa: string
  Titular: string
  Marca: string
  Modelo: string
  Año: number
}

interface ProveedorInfo {
  id: number
  nombre: string
  cuit?: string
  direccion?: string
  telefono?: string
  gmail?: string
  con_iva: string
}

export default function CrearOCPage() {
  const [paso, setPaso] = useState<1 | 2>(1)
  const [busquedaVehiculo, setBusquedaVehiculo] = useState('')
  const [busquedaProveedor, setBusquedaProveedor] = useState('')
  const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState<VehiculoInfo | null>(null)
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState<ProveedorInfo | null>(null)
  const [resultadosVehiculos, setResultadosVehiculos] = useState<VehiculoInfo[]>([])
  const [resultadosProveedores, setResultadosProveedores] = useState<ProveedorInfo[]>([])
  const [cargandoVehiculos, setCargandoVehiculos] = useState(false)
  const [cargandoProveedores, setCargandoProveedores] = useState(false)
  
  // Estados para OC múltiple 
  const [esOCMultiple, setEsOCMultiple] = useState(false)
  const [busquedaVehiculoItem, setBusquedaVehiculoItem] = useState('')
  const [resultadosVehiculosItem, setResultadosVehiculosItem] = useState<VehiculoInfo[]>([])
  
  // Datos de la orden - items individuales
  const [items, setItems] = useState<Array<{
    id: string, 
    descripcion: string, 
    cantidad: number, 
    precio: number,
    targetPlaca: string,
    targetInterno: number,
    vehiculoInfo?: VehiculoInfo // Información completa del vehículo destino
  }>>([])
  const [nuevoItem, setNuevoItem] = useState({
    descripcion: '',
    cantidad: 1,
    precio: 0,
    vehiculoDestino: null as VehiculoInfo | null // Para OCs múltiples
  })
  const [gastosAdicionales, setGastosAdicionales] = useState({
    envio: 0,
    otros: 0
  })
  const [modoSeleccion, setModoSeleccion] = useState<'placa' | 'interno'>('placa')
  const [tipoBusquedaVehiculo, setTipoBusquedaVehiculo] = useState<'placa' | 'interno'>('placa')
  const [adjuntos, setAdjuntos] = useState<File[]>([])
  const [cargandoAdjuntos, setCargandoAdjuntos] = useState(false)
  const [creandoOrden, setCreandoOrden] = useState(false)
  const [ordenCreada, setOrdenCreada] = useState<string | null>(null)
  const [mostrandoFormulario, setMostrandoFormulario] = useState(false)
  const [titulares, setTitulares] = useState<Array<{nombre_titular: string, cuit: string}>>([])
  const [cargandoTitulares, setCargandoTitulares] = useState(false)
  const [codigoOC, setCodigoOC] = useState('')
  const [codigoGenerado, setCodigoGenerado] = useState(false)
  const [codigoDuplicado, setCodigoDuplicado] = useState<{existe: boolean, fecha?: string}>({existe: false})
  const [esEmergencia, setEsEmergencia] = useState(false)

  // Cargar titulares al iniciar
  const cargarTitulares = async () => {
    setCargandoTitulares(true)
    try {
      const { data, error } = await supabase
        .from('titulares')
        .select('nombre_titular, cuit')

      if (error) {
        console.log('Tabla titulares no encontrada, usando valores por defecto')
        // Si la tabla no existe, usar valores por defecto
        setTitulares([
          { nombre_titular: 'Forest Rent a Car SRL', cuit: '30-70990756-1' },
          { nombre_titular: 'CUENCA DEL PLATA', cuit: '30-70759714-9' }
        ])
      } else {
        setTitulares(data || [])
      }
    } catch (error) {
      console.log('Error cargando titulares, usando valores por defecto:', error)
      // Usar valores por defecto en caso de error
      setTitulares([
        { nombre_titular: 'Forest Rent a Car SRL', cuit: '30-70990756-1' },
        { nombre_titular: 'CUENCA DEL PLATA', cuit: '30-70759714-9' }
      ])
    } finally {
      setCargandoTitulares(false)
    }
  }

  // Verificar si un código ya existe
  const verificarCodigoExistente = async (codigo: string) => {
    try {
      const { data, error } = await supabase
        .from('ordenes_de_compra')
        .select('id, fecha')
        .eq('codigo', codigo)
        .limit(1)

      if (error) throw error
      return data && data.length > 0 ? data[0] : null
    } catch (error) {
      console.error('Error verificando código:', error)
      return null
    }
  }

  // Verificar duplicados en tiempo real cuando el usuario edita el código
  const verificarCodigoEnTiempoReal = async (codigo: string) => {
    if (!codigo.trim()) {
      setCodigoDuplicado({existe: false})
      return
    }

    const ocExistente = await verificarCodigoExistente(codigo.trim())
    if (ocExistente) {
      setCodigoDuplicado({
        existe: true, 
        fecha: new Date(ocExistente.fecha).toLocaleDateString()
      })
    } else {
      setCodigoDuplicado({existe: false})
    }
  }

  // Generar código automático al cargar la página (SOLO MOSTRAR, no incrementar)
  const generarCodigoAutomatico = async () => {
    try {
      const codigo = await previewCodigoOC() // Nueva función que solo lee
      setCodigoOC(codigo)
      setCodigoGenerado(true)
      setCodigoDuplicado({existe: false}) // Resetear estado de duplicado
    } catch (error) {
      console.error('Error generando código automático:', error)
    }
  }

  // Función para SOLO MOSTRAR el próximo código (sin incrementar en BD)
  const previewCodigoOC = async (): Promise<string> => {
    const hoy = new Date()
    const year = hoy.getFullYear()
    const month = hoy.getMonth() + 1
    const day = hoy.getDate()
    
    const yearStr = year.toString().slice(-2)
    const monthStr = month.toString().padStart(2, '0')
    const dayStr = day.toString().padStart(2, '0')
    
    // Formato: YYMMDDAGT-NNNNNN
    const fechaParte = `${yearStr}${monthStr}${dayStr}AGT`
    
    try {
      // Usar función que SOLO LEE (no incrementa)
      const { data, error } = await supabase
        .rpc('peek_next_correlativo_oc', {
          p_year: year
        })
      
      if (error) throw error
      
      const numeroCorrelativo = data || 1
      return `${fechaParte}-${numeroCorrelativo.toString().padStart(6, '0')}`
      
    } catch (error) {
      console.error('Error obteniendo preview del código:', error)
      
      // Fallback: método anterior (también solo lectura)
      try {
        const { data, error } = await supabase
          .from('ordenes_de_compra')
          .select('codigo')
          .like('codigo', `${fechaParte}-%`)
          .order('codigo', { ascending: false })
          .limit(1)
        
        if (error) throw error
        
        let siguienteNumero = 1
        if (data && data.length > 0) {
          const ultimoCodigo = data[0].codigo
          const match = ultimoCodigo.match(/-(\d+)(-[A-Z])?$/)
          if (match) {
            siguienteNumero = parseInt(match[1]) + 1
          }
        }
        
        return `${fechaParte}-${siguienteNumero.toString().padStart(6, '0')}`
      } catch (fallbackError) {
        console.error('Error en fallback preview:', fallbackError)
        return `${fechaParte}-000001`
      }
    }
  }

  // Cargar titulares al montar el componente
  React.useEffect(() => {
    cargarTitulares()
    generarCodigoAutomatico()
  }, [])

  // Manejar selección de archivos adjuntos
  const manejarAdjuntos = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    const archivosValidos = files.filter(file => {
      // Aceptar PDFs, imágenes y documentos
      const tiposPermitidos = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
      return tiposPermitidos.includes(file.type) && file.size <= 10 * 1024 * 1024 // 10MB max
    })
    
    if (archivosValidos.length !== files.length) {
      alert('Algunos archivos no son válidos. Solo se permiten PDFs e imágenes (máx. 10MB cada uno)')
    }
    
    setAdjuntos(prev => [...prev, ...archivosValidos])
  }

  // Remover adjunto
  const removerAdjunto = (index: number) => {
    setAdjuntos(prev => prev.filter((_, i) => i !== index))
  }

  // Convertir imagen a PDF usando jsPDF
  const imagenToPDF = async (file: File): Promise<Uint8Array> => {
    console.log(`🖼️ Convirtiendo imagen a PDF: ${file.name} (${file.type}, ${file.size} bytes)`)
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          console.log(`  📄 Archivo leído, creando PDF...`)
          const { jsPDF } = await import('jspdf')
          const doc = new jsPDF()
          
          const img = new Image()
          img.onload = () => {
            console.log(`  🖼️ Imagen cargada: ${img.width}x${img.height}px`)
            
            // Calcular dimensiones para ajustar a la página
            const pageWidth = 210 // A4 width in mm
            const pageHeight = 297 // A4 height in mm
            const margin = 10
            
            const imgWidth = pageWidth - 2 * margin
            const imgHeight = (img.height * imgWidth) / img.width
            
            if (imgHeight <= pageHeight - 2 * margin) {
              console.log(`  📐 Ajustando por ancho: ${imgWidth}x${imgHeight}mm`)
              doc.addImage(img, 'JPEG', margin, margin, imgWidth, imgHeight)
            } else {
              // Si la imagen es muy alta, ajustarla a la altura de la página
              const scaledHeight = pageHeight - 2 * margin
              const scaledWidth = (img.width * scaledHeight) / img.height
              console.log(`  📐 Ajustando por altura: ${scaledWidth}x${scaledHeight}mm`)
              doc.addImage(img, 'JPEG', (pageWidth - scaledWidth) / 2, margin, scaledWidth, scaledHeight)
            }
            
            const result = doc.output('arraybuffer')
            console.log(`  ✅ PDF de imagen creado: ${result.byteLength} bytes`)
            resolve(result)
          }
          img.onerror = (error) => {
            console.error(`  ❌ Error cargando imagen:`, error)
            reject(error)
          }
          img.src = e.target?.result as string
        } catch (error) {
          console.error(`  ❌ Error en jsPDF:`, error)
          reject(error)
        }
      }
      reader.onerror = (error) => {
        console.error(`  ❌ Error leyendo archivo:`, error)
        reject(error)
      }
      reader.readAsDataURL(file)
    })
  }

  // Función para probar con API REST directa
  const probarStorageDirecto = async () => {
    try {
      console.log('🔍 Probando Storage con API REST directa...')
      
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Variables de entorno faltantes')
      }
      
      // Crear archivo de prueba
      const contenido = 'Test directo'
      const archivo = new File([contenido], 'test-directo.txt', { type: 'text/plain' })
      
      const formData = new FormData()
      formData.append('file', archivo)
      
      const response = await fetch(`${supabaseUrl}/storage/v1/object/oc-documents/test-directo.txt`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: formData
      })
      
      const result = await response.text()
      console.log('📤 Respuesta API:', { status: response.status, result })
      
      if (response.ok) {
        alert('✅ Conexión directa exitosa!')
      } else {
        alert(`❌ Error directo: ${response.status} - ${result}`)
      }
      
    } catch (error: unknown) {
      console.error('❌ Error en prueba directa:', error)
      alert(`❌ Error directo: ${error.message}`)
    }
  }

  // Función para probar conexión con Supabase Storage
  const probarStorage = async () => {
    try {
      console.log('🔍 Probando conexión con Supabase Storage...')
      console.log('🔧 URL Supabase:', process.env.NEXT_PUBLIC_SUPABASE_URL)
      console.log('🔧 Anon Key (primeros 20 chars):', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + '...')
      console.log('🔧 Bucket:', STORAGE_BUCKET)
      
      // Probar si podemos listar buckets
      console.log('🔍 Probando listar buckets...')
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
      if (bucketsError) {
        console.error('❌ Error listando buckets:', bucketsError)
      } else {
        console.log('✅ Buckets disponibles:', buckets.map(b => b.name))
        const bucketExists = buckets.some(b => b.name === STORAGE_BUCKET)
        console.log(`🔍 Bucket "${STORAGE_BUCKET}" existe:`, bucketExists)
      }
      
      // Crear un PDF de prueba pequeño (tipo MIME permitido)
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF()
      doc.text('Test de conexión con Supabase Storage', 20, 20)
      doc.text(new Date().toISOString(), 20, 40)
      
      const pdfBytes = doc.output('arraybuffer')
      const archivoPrueba = new Blob([pdfBytes], { type: 'application/pdf' })
      const nombrePrueba = `test/conexion_${Date.now()}.pdf`
      
      const resultado = await uploadOCDocument(nombrePrueba, archivoPrueba)
      console.log('✅ Conexión exitosa:', resultado)
      
      alert('✅ Conexión con Supabase Storage exitosa!')
      
      // Limpiar archivo de prueba
      const { error: deleteError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([nombrePrueba])
      
      if (deleteError) {
        console.log('Archivo de prueba no eliminado:', deleteError)
      } else {
        console.log('🗑️ Archivo de prueba eliminado')
      }
      
    } catch (error: unknown) {
      console.error('❌ Error en conexión con Storage:', error)
      alert(`❌ Error de conexión con Storage:\n${error.message}\n\nRevisa:\n1. Que el bucket 'oc-documents' exista\n2. Las políticas RLS\n3. La configuración de autenticación`)
    }
  }


  // Crear PDF multipágina con OC + adjuntos
  const crearPDFMultipagina = async (ocPDFBytes: Uint8Array, adjuntos: File[]): Promise<Uint8Array> => {
    console.log('🔧 Iniciando creación PDF multipágina:', { totalAdjuntos: adjuntos.length, ocSize: ocPDFBytes.byteLength })
    
    const { PDFDocument } = await import('pdf-lib')
    
    // Crear documento PDF final
    const pdfFinal = await PDFDocument.create()
    console.log('📄 PDF final creado')
    
    // Agregar la OC como primera página
    console.log('📋 Agregando OC como primera página...')
    const ocPDF = await PDFDocument.load(ocPDFBytes)
    const ocPages = await pdfFinal.copyPages(ocPDF, [0])
    pdfFinal.addPage(ocPages[0])
    console.log('✅ OC agregada (página 1)')
    
    // Procesar cada adjunto
    for (let i = 0; i < adjuntos.length; i++) {
      const adjunto = adjuntos[i]
      console.log(`📎 Procesando adjunto ${i + 1}/${adjuntos.length}: ${adjunto.name} (${adjunto.type}, ${adjunto.size} bytes)`)
      
      try {
        if (adjunto.type === 'application/pdf') {
          console.log('📄 Procesando PDF adjunto...')
          // Si es PDF, copiar todas sus páginas
          const adjuntoPDFBytes = await adjunto.arrayBuffer()
          console.log(`  📊 PDF cargado: ${adjuntoPDFBytes.byteLength} bytes`)
          
          const adjuntoPDF = await PDFDocument.load(adjuntoPDFBytes)
          const totalPaginasAdjunto = adjuntoPDF.getPageCount()
          console.log(`  📑 PDF tiene ${totalPaginasAdjunto} páginas`)
          
          const adjuntoPages = await pdfFinal.copyPages(adjuntoPDF, adjuntoPDF.getPageIndices())
          adjuntoPages.forEach((page, idx) => {
            pdfFinal.addPage(page)
            console.log(`    ✅ Página ${idx + 1} del PDF agregada`)
          })
        } else {
          console.log('🖼️ Procesando imagen adjunta...')
          // Si es imagen, convertir a PDF y agregar
          const imagenPDFBytes = await imagenToPDF(adjunto)
          console.log(`  📊 Imagen convertida a PDF: ${imagenPDFBytes.byteLength} bytes`)
          
          const imagenPDF = await PDFDocument.load(imagenPDFBytes)
          const imagenPages = await pdfFinal.copyPages(imagenPDF, [0])
          pdfFinal.addPage(imagenPages[0])
          console.log(`    ✅ Imagen agregada como página PDF`)
        }
        
        console.log(`✅ Adjunto ${adjunto.name} procesado correctamente`)
      } catch (error) {
        console.error(`❌ Error procesando adjunto ${adjunto.name}:`, error)
        console.error(`  Tipo: ${adjunto.type}, Tamaño: ${adjunto.size} bytes`)
        console.error(`  Error detallado:`, error)
        // Continuar con los demás adjuntos aunque uno falle
      }
    }
    
    console.log(`📚 PDF final tiene ${pdfFinal.getPageCount()} páginas totales`)
    const pdfFinalBytes = await pdfFinal.save()
    console.log(`💾 PDF final guardado: ${pdfFinalBytes.byteLength} bytes`)
    
    return pdfFinalBytes
  }

  const buscarVehiculos = async (termino: string) => {
    if (!termino.trim()) {
      setResultadosVehiculos([])
      return
    }

    setCargandoVehiculos(true)
    try {
      let query = supabase
        .from('vehiculos')
        .select('Nro_Interno, Placa, Titular, Marca, Modelo, Año')
        .limit(10)

      // Buscar según el tipo seleccionado
      if (tipoBusquedaVehiculo === 'placa') {
        query = query.ilike('Placa', `%${termino}%`)
      } else {
        // Para interno, buscar coincidencia exacta si es número, o parcial si contiene texto
        const esNumero = /^\d+$/.test(termino)
        if (esNumero) {
          query = query.eq('Nro_Interno', parseInt(termino))
        } else {
          query = query.ilike('Nro_Interno', `%${termino}%`)
        }
      }

      const { data, error } = await query

      if (error) throw error
      setResultadosVehiculos(data || [])
    } catch (error) {
      console.error('Error buscando vehículos:', error)
      setResultadosVehiculos([])
    } finally {
      setCargandoVehiculos(false)
    }
  }

  const buscarProveedores = async (termino: string) => {
    if (!termino.trim()) {
      setResultadosProveedores([])
      return
    }

    setCargandoProveedores(true)
    try {
      const { data, error } = await supabase
        .from('proveedores')
        .select('*')
        .or(`nombre.ilike.%${termino}%,cuit.ilike.%${termino}%`)
        .limit(10)

      if (error) throw error
      setResultadosProveedores(data || [])
    } catch (error) {
      console.error('Error buscando proveedores:', error)
      setResultadosProveedores([])
    } finally {
      setCargandoProveedores(false)
    }
  }

  const seleccionarVehiculo = (vehiculo: VehiculoInfo) => {
    setVehiculoSeleccionado(vehiculo)
    setResultadosVehiculos([])
    setBusquedaVehiculo('')
  }

  const seleccionarProveedor = (proveedor: ProveedorInfo) => {
    setProveedorSeleccionado(proveedor)
    setResultadosProveedores([])
    setBusquedaProveedor('')
    setMostrandoFormulario(true)
  }

  const agregarItem = () => {
    if (!nuevoItem.descripcion.trim()) return
    if (!vehiculoSeleccionado) return
    
    // Determinar vehículo destino: específico o principal
    const vehiculoTarget = nuevoItem.vehiculoDestino || vehiculoSeleccionado
    
    const item = {
      id: Date.now().toString(),
      descripcion: nuevoItem.descripcion,
      cantidad: nuevoItem.cantidad,
      precio: nuevoItem.precio,
      targetPlaca: vehiculoTarget.Placa,
      targetInterno: vehiculoTarget.Nro_Interno,
      vehiculoInfo: vehiculoTarget // Guardar información completa del vehículo
    }
    
    setItems(prev => [...prev, item])
    setNuevoItem({ descripcion: '', cantidad: 1, precio: 0, vehiculoDestino: null })
    setBusquedaVehiculoItem('')
    setResultadosVehiculosItem([])
  }

  const eliminarItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id))
  }

  // Buscar vehículos para items específicos
  const buscarVehiculosParaItem = async (termino: string) => {
    if (termino.length < 2) {
      setResultadosVehiculosItem([])
      return
    }

    try {
      const { data, error } = await supabase
        .from('vehiculos')
        .select('Nro_Interno, Placa, Titular, Marca, Modelo')
        .or(`Placa.ilike.%${termino}%,Nro_Interno.eq.${parseInt(termino) || 0}`)
        .limit(10)

      if (error) throw error
      setResultadosVehiculosItem(data || [])
    } catch (error) {
      console.error('Error buscando vehículos para item:', error)
      setResultadosVehiculosItem([])
    }
  }

  const seleccionarVehiculoParaItem = (vehiculo: VehiculoInfo) => {
    setNuevoItem(prev => ({ ...prev, vehiculoDestino: vehiculo }))
    setResultadosVehiculosItem([])
    setBusquedaVehiculoItem('')
  }

  // Insertar en tabla ordenes_de_compra_por_vehiculo
  const insertarEnTablaDetallePorVehiculo = async (codigoOC: string, esNuevaOC: boolean, pdfUrl?: string | null, esEmergencia?: boolean) => {
    try {
      console.log('📝 Insertando en tabla de detalle por vehículo...')
      
      // Si es actualización, primero eliminar registros existentes de esta OC
      if (!esNuevaOC) {
        await supabase
          .from('ordenes_de_compra_por_vehiculo')
          .delete()
          .eq('codigo_oc', codigoOC)
      }

      // Obtener ID de la OC principal
      const { data: ocPrincipal, error: errorOC } = await supabase
        .from('ordenes_de_compra')
        .select('id')
        .eq('codigo', codigoOC)
        .single()
      
      if (errorOC || !ocPrincipal) {
        console.error('Error obteniendo ID de OC principal:', errorOC)
        return
      }

      // Agrupar items por vehículo
      const itemsPorVehiculo = new Map<number, {
        vehiculo: { interno: number, placa: string, modelo: string, titular: string },
        items: typeof items,
        monto: number
      }>()

      // Procesar cada item
      items.forEach(item => {
        const interno = item.targetInterno
        const placa = item.targetPlaca
        
        // Usar información del vehículo guardada en el item
        const vehiculoInfo = item.vehiculoInfo || vehiculoSeleccionado
        const modelo = vehiculoInfo ? `${vehiculoInfo.Marca} ${vehiculoInfo.Modelo}` : ''
        // SIEMPRE usar el titular del vehículo raíz (para facturación)
        const titular = vehiculoSeleccionado?.Titular || ''

        if (!itemsPorVehiculo.has(interno)) {
          itemsPorVehiculo.set(interno, {
            vehiculo: { interno, placa, modelo, titular },
            items: [],
            monto: 0
          })
        }

        const grupo = itemsPorVehiculo.get(interno)!
        grupo.items.push(item)
        grupo.monto += item.cantidad * item.precio
      })

      // Crear registros en la tabla de detalle
      const registrosDetalle: any[] = []
      const vehiculos = Array.from(itemsPorVehiculo.entries())
      
      vehiculos.forEach(([interno, datos], index) => {
        const version = vehiculos.length > 1 ? String.fromCharCode(65 + index) : null // A, B, C... o null

        const itemsTexto = datos.items.map(item => 
          `${item.descripcion} (${item.cantidad}x$${item.precio.toFixed(2)})`
        ).join(', ')

        registrosDetalle.push({
          id_oc_original: ocPrincipal.id,
          codigo_oc: codigoOC,
          fecha: new Date().toISOString().split('T')[0],
          interno: datos.vehiculo.interno,
          placa: datos.vehiculo.placa,
          modelo: datos.vehiculo.modelo,
          titular: datos.vehiculo.titular,
          proveedor: proveedorSeleccionado?.nombre,
          items: itemsTexto,
          monto_vehiculo: datos.monto,
          version: version,
          moneda: proveedorSeleccionado?.moneda || 'ARS', // Usar moneda del proveedor
          es_emergencia: esEmergencia || false,
          pdf_url: pdfUrl
        })
      })

      // Insertar todos los registros
      const { error: errorInsert } = await supabase
        .from('ordenes_de_compra_por_vehiculo')
        .insert(registrosDetalle)

      if (errorInsert) {
        console.error('Error insertando en tabla detalle:', errorInsert)
        throw errorInsert
      }

      console.log(`✅ Insertados ${registrosDetalle.length} registros en tabla de detalle por vehículo`)
      
    } catch (error) {
      console.error('Error en insertarEnTablaDetallePorVehiculo:', error)
      // No fallar la creación de OC principal por este error
    }
  }

  const actualizarTargetItem = (itemId: string, newValue: string) => {
    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        if (modoSeleccion === 'placa') {
          return { ...item, targetPlaca: newValue }
        } else {
          const interno = parseInt(newValue)
          return { ...item, targetInterno: isNaN(interno) ? 0 : interno }
        }
      }
      return item
    }))
  }

  const calcularSubtotal = () => {
    return items.reduce((total, item) => total + (item.cantidad * item.precio), 0)
  }

  const calcularIVA = (subtotal: number) => {
    if (!proveedorSeleccionado) return 0
    
    const conIVA = proveedorSeleccionado.con_iva?.toUpperCase()
    if (conIVA === 'SI' || conIVA === 'NO') {
      return subtotal * 0.21
    }
    return 0
  }

  const calcularTotal = () => {
    const subtotal = calcularSubtotal()
    const iva = calcularIVA(subtotal)
    const gastosTotal = gastosAdicionales.envio + gastosAdicionales.otros
    return subtotal + iva + gastosTotal
  }

  // Generar código de OC automático
  const generarCodigoOC = async (): Promise<string> => {
    const hoy = new Date()
    const year = hoy.getFullYear()
    const month = hoy.getMonth() + 1
    const day = hoy.getDate()
    
    const yearStr = year.toString().slice(-2)
    const monthStr = month.toString().padStart(2, '0')
    const dayStr = day.toString().padStart(2, '0')
    
    // Formato: YYMMDDAGT-NNNNNN
    const fechaParte = `${yearStr}${monthStr}${dayStr}AGT`
    
    try {
      // Usar la función que SÍ INCREMENTA el correlativo (solo al crear OC)
      const { data, error } = await supabase
        .rpc('increment_correlativo_oc', {
          p_year: year
        })
      
      if (error) throw error
      
      const numeroCorrelativo = data || 1
      return `${fechaParte}-${numeroCorrelativo.toString().padStart(6, '0')}`
      
    } catch (error) {
      console.error('Error generando código OC con correlativo:', error)
      
      // Fallback: Usar el método anterior si la función RPC falla
      try {
        console.log('🔄 Usando método fallback...')
        const { data, error } = await supabase
          .from('ordenes_de_compra')
          .select('codigo')
          .like('codigo', `${fechaParte}-%`)
          .order('codigo', { ascending: false })
          .limit(1)
        
        if (error) throw error
        
        let siguienteNumero = 1
        if (data && data.length > 0) {
          const ultimoCodigo = data[0].codigo
          const match = ultimoCodigo.match(/-(\d+)(-[A-Z])?$/)
          if (match) {
            siguienteNumero = parseInt(match[1]) + 1
          }
        }
        
        return `${fechaParte}-${siguienteNumero.toString().padStart(6, '0')}`
      } catch (fallbackError) {
        console.error('Error en fallback:', fallbackError)
        // Último recurso: número aleatorio
        return `${fechaParte}-${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`
      }
    }
  }

  const crearOrdenCompra = async () => {
    if (!vehiculoSeleccionado || !proveedorSeleccionado || items.length === 0) {
      alert('Por favor complete todos los datos requeridos')
      return
    }

    if (!codigoOC.trim()) {
      alert('El código de la OC es requerido')
      return
    }

    const codigo = codigoOC.trim()

    // Verificar si el código ya existe
    const ocExistente = await verificarCodigoExistente(codigo)
    if (ocExistente) {
      const fechaExistente = new Date(ocExistente.fecha).toLocaleDateString()
      const confirmacion = confirm(
        `⚠️ CÓDIGO DUPLICADO\n\nYa existe una OC con el código "${codigo}" creada el ${fechaExistente}.\n\n¿Estás seguro de que quieres reescribir esta orden de compra?\n\n• SÍ = Sobreescribir la OC existente\n• NO = Cancelar y cambiar el código`
      )
      
      if (!confirmacion) {
        return
      }
    }

    setCreandoOrden(true)
    const esActualizacion = ocExistente !== null
    try {
      const hoy = new Date().toISOString().split('T')[0]
      
      // Si es nueva OC (no actualización), generar nuevo código con incremento de correlativo
      let codigoFinal = codigo
      if (!esActualizacion) {
        try {
          console.log('🔢 Generando nuevo código con incremento de correlativo...')
          codigoFinal = await generarCodigoOC()
          console.log('✅ Nuevo código generado:', codigoFinal)
          setCodigoOC(codigoFinal) // Actualizar el estado para mostrarlo en UI
        } catch (error) {
          console.error('⚠️ Error generando código con correlativo, usando código ingresado:', error)
          codigoFinal = codigo // Usar el código ingresado manualmente como fallback
        }
      }
      
      // Formatear items como string (igual que en el Excel)
      const itemsTexto = items.map(item => 
        `${item.descripcion} (${item.cantidad}x$${item.precio.toFixed(2)})`
      ).join(', ')
      
      const monto = calcularTotal()
      
      const ordenData = {
        fecha: hoy,
        codigo: codigoFinal,
        titular: vehiculoSeleccionado.Titular,
        cuit: proveedorSeleccionado.cuit || null,
        monto: monto > 0 ? monto : null,
        interno: vehiculoSeleccionado.Nro_Interno,
        modelo: `${vehiculoSeleccionado.Marca} ${vehiculoSeleccionado.Modelo}`,
        placa: vehiculoSeleccionado.Placa,
        proveedor: proveedorSeleccionado.nombre,
        items: itemsTexto,
        adjuntos: adjuntos.length > 0 ? `${adjuntos.length} archivo(s)` : 'Sin adjuntos',
        moneda: proveedorSeleccionado.moneda || 'ARS', // Usar moneda del proveedor
        es_emergencia: esEmergencia,
        est_compras: false,
        est_tesoreria: false,
        est_gerencia: false
      }

      // Si hay una OC existente, usar upsert para actualizar
      const { error } = ocExistente 
        ? await supabase
            .from('ordenes_de_compra')
            .update(ordenData)
            .eq('codigo', codigo)
        : await supabase
            .from('ordenes_de_compra')
            .insert(ordenData)

      if (error) {
        console.error('Error en operación de base de datos:', error)
        throw error
      }

      // Generar PDF y guardarlo en Storage
      console.log('📄 Generando PDF para almacenamiento en Storage...')
      let pdfUrl = null
      try {
        const pdfBytes = await generarPDF(true, codigoFinal)
        
        // Crear nombre de archivo con estructura de fecha  
        const fechaActual = new Date()
        const añoMes = fechaActual.getFullYear().toString() + (fechaActual.getMonth() + 1).toString().padStart(2, '0')
        const nombreArchivo = `${añoMes}/OC_${codigoFinal.replace('-', '_')}.pdf`
        
        // Subir a Supabase Storage
        const blob = new Blob([pdfBytes], { type: 'application/pdf' })
        console.log('📤 Subiendo PDF a Storage:', { nombreArchivo, tamano: blob.size })
        await uploadOCDocument(nombreArchivo, blob)
        
        // Obtener URL pública del archivo
        pdfUrl = await getOCDocumentURL(nombreArchivo)
        console.log('✅ PDF guardado exitosamente en Storage:', pdfUrl)
        
      } catch (pdfError) {
        console.error('⚠️ Error generando/guardando PDF:', pdfError)
        // No fallar la creación de OC si hay error con el PDF
      }

      // Actualizar URL del PDF en la tabla principal
      if (pdfUrl) {
        await supabase
          .from('ordenes_de_compra')
          .update({ pdf_url: pdfUrl })
          .eq('codigo', codigoFinal)
      }

      // Insertar en tabla de detalle por vehículo
      await insertarEnTablaDetallePorVehiculo(codigoFinal, !esActualizacion, pdfUrl, esEmergencia)

      setOrdenCreada(codigoFinal)
      alert(esActualizacion 
        ? `✅ Orden de Compra ${codigoFinal} actualizada exitosamente\n\n📄 PDF guardado en Storage` 
        : `✅ Orden de Compra ${codigoFinal} creada exitosamente\n\n📄 PDF guardado en Storage`
      )
    } catch (error) {
      console.error('Error creando/actualizando orden:', error)
      alert(`❌ Error al ${esActualizacion ? 'actualizar' : 'crear'} la orden de compra. Por favor inténtelo de nuevo.`)
    } finally {
      setCreandoOrden(false)
    }
  }


  const generarPDF = async (paraStorage: boolean = false, codigoOverride?: string): Promise<Uint8Array | void> => {
    if (!vehiculoSeleccionado || !proveedorSeleccionado || items.length === 0) {
      if (!paraStorage) alert('Por favor complete todos los datos requeridos')
      return
    }

    if (!codigoOC.trim() && !codigoOverride) {
      if (!paraStorage) alert('El código de la OC es requerido')
      return
    }

    try {
      const codigo = codigoOverride || ordenCreada || codigoOC.trim()
      console.log(paraStorage ? '🔧 Generando PDF para Storage...' : '📥 Generando vista previa del PDF...')
      
      // Generar PDF con formato exacto del proyecto ejemplo
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF('portrait', 'pt', 'a4')
      
      // Configuración de colores exactos del proyecto ejemplo  
      const colors = {
        azulOscuro: '#052F61',
        azulClaro: '#C1E1F7',
        textoNegro: '#000000',
        textoBlanco: '#FFFFFF',
        grisClaro: '#F2F2F2',
        bordeNegro: '#000000'
      }

      // ENCABEZADO SUPERIOR - FACTURAR A (coordenadas exactas)
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(colors.textoNegro)
      doc.text('FACTURAR A:', 45, 57)
      
      // Empresa (usar datos dinámicos del vehículo)
      const vehicleTitular = vehiculoSeleccionado.Titular || 'Forest Rent a Car SRL'
      const vehicleCUIT = titulares.find(t => t.nombre_titular === vehiculoSeleccionado.Titular)?.cuit || '30-70990756-1'
      
      doc.setFontSize(18)
      doc.setFont('helvetica', 'bold')  
      doc.setTextColor(colors.azulOscuro)
      doc.text(vehicleTitular, 45, 80)
      
      // Datos de la empresa - usar CUIT dinámico, resto fijo (coordenadas exactas)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(colors.azulOscuro)
      doc.text(`CUIT: ${vehicleCUIT}`, 45, 95)
      doc.text('Dirección: Tarefereros 111 Dpto B', 45, 107)
      doc.text('Ciudad: Puerto Iguazu', 45, 119)
      doc.text('E-mail: transporte@cuencadelplata.com', 45, 131)
      doc.text('Código postal: 3370', 45, 143)
      doc.text('Teléfono: 3757304029', 45, 155)

      // LOGO CUENCA DEL PLATA (usando imagen real)
      try {
        // Intentar cargar la imagen desde public/images
        const img = new Image()
        img.src = '/images/Imagen1.jpg'
        
        await new Promise((resolve, reject) => {
          img.onload = resolve
          img.onerror = reject
        })
        
        // Agregar imagen al PDF (coordenadas exactas del proyecto ejemplo)
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        canvas.width = img.width
        canvas.height = img.height
        ctx?.drawImage(img, 0, 0)
        
        const imageData = canvas.toDataURL('image/jpeg', 1.0)
        doc.addImage(imageData, 'JPEG', 250, 75, 120, 60)
        
      } catch (error) {
        // Si no se puede cargar la imagen, usar texto como respaldo (coordenadas exactas)
        doc.setFontSize(20)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor('#e91e63') // Rosa del logo
        doc.text('CUENCA', 310, 95)
        doc.setTextColor('#333333')   // Gris
        doc.text('DEL PLATA', 310, 115)
        
        doc.setFontSize(8)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor('#333333')
        doc.text('OPERADOR MAYORISTA RECEPTIVO', 310, 125)
      }

      // ORDEN DE COMPRA (coordenadas exactas)
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(colors.azulOscuro)
      doc.text('ORDEN DE COMPRA', 470, 80, { align: 'center' })

      // Recuadro para fecha y OC (coordenadas exactas)
      doc.setDrawColor(colors.bordeNegro)
      doc.setLineWidth(1)
      doc.rect(400, 90, 140, 35)

      // Fecha (coordenadas exactas)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(colors.azulOscuro)
      doc.text('Fecha:', 405, 105)
      
      // Fecha Argentina (UTC-3)
      const today = new Date()
      const argentinaDate = new Date(today.getTime() - (3 * 60 * 60 * 1000))
      const pdfDate = argentinaDate.toLocaleDateString('es-ES')
      
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(colors.textoNegro)
      doc.text(pdfDate, 445, 105)

      // OC (coordenadas exactas)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(colors.azulOscuro)
      doc.text('OC# :', 405, 120)
      
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(colors.textoNegro)
      doc.text(codigo, 445, 120)

      // SECCIÓN PROVEEDOR (coordenadas exactas del proyecto ejemplo)
      // Barra azul de proveedor (y: 168 según config)
      doc.setFillColor(colors.azulOscuro)
      doc.rect(45, 168, 500, 13, 'F')
      
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(colors.textoBlanco)
      doc.text('PROVEEDOR', 50, 178)
      doc.text('ENVIAR A:', 320, 178)

      // Datos del proveedor (coordenadas exactas)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(colors.azulOscuro)
      doc.text(`Empresa: ${proveedorSeleccionado.nombre || 'N/A'}`, 45, 193)
      doc.text(`CUIT: ${proveedorSeleccionado.cuit || 'N/A'}`, 45, 206)
      doc.text(`DIRECCION: ${proveedorSeleccionado.direccion || 'N/A'}`, 45, 219)
      doc.text(`Telf: ${proveedorSeleccionado.telefono || ''}`, 45, 232)
      doc.text(`Email: ${proveedorSeleccionado.email || ''}`, 45, 245)

      // Datos de envío (coordenadas exactas)
      doc.text('Local de Venta: CUENCA DEL PLATA', 315, 193)
      doc.text('Dirección: TAREFEROS 111', 315, 206)
      doc.text('Ciudad: PUERTO IGUAZU', 315, 219)
      doc.text('Telf:', 315, 232)
      doc.text('Email:', 315, 245)

      // TABLA DE TÉRMINOS (coordenadas exactas: y: 254 según config)
      doc.setFillColor(colors.azulOscuro)
      doc.rect(45, 254, 500, 13, 'F')
      
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(colors.textoBlanco)
      doc.text('SOLICITADO POR', 50, 264)
      doc.text('TERMINOS DE PAGO', 200, 264)
      doc.text('CONDICIONES DE ENVÍO', 320, 264)

      // Bordes de las cajas de términos
      doc.setDrawColor(colors.bordeNegro)
      doc.setLineWidth(1)
      doc.rect(95, 269, 100, 15) // SOLICITADO POR
      doc.rect(265, 269, 100, 15) // TÉRMINOS DE PAGO  
      doc.rect(415, 269, 130, 15) // CONDICIONES DE ENVÍO

      // Valores de términos (coordenadas exactas)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(colors.textoNegro)
      doc.text('TALLER', 100, 279)
      doc.text('CTA CTE', 270, 279)

      // TABLA DE PRODUCTOS (coordenadas exactas: y: 288 según config)
      doc.setFillColor(colors.azulOscuro)
      doc.rect(45, 288, 500, 13, 'F')
      
      // Borde negro del header
      doc.setDrawColor(colors.bordeNegro)
      doc.setLineWidth(1)
      doc.rect(45, 288, 500, 13)
      
      // Headers de la tabla con separadores verticales
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(colors.textoBlanco)
      
      // Líneas separadoras verticales blancas en el header
      doc.setDrawColor(colors.textoBlanco)
      doc.setLineWidth(1)
      doc.line(95, 288, 95, 301)    // Separador después de CODIGO
      doc.line(315, 288, 315, 301)  // Separador después de PRODUCTO
      doc.line(365, 288, 365, 301)  // Separador después de CANTIDAD
      doc.line(415, 288, 415, 301)  // Separador después de PRECIO
      doc.line(445, 288, 445, 301)  // Separador después de IVA
      
      doc.text('CODIGO', 50, 298)
      doc.text('PRODUCTO', 100, 298)
      doc.text('CANTIDAD', 320, 298)
      doc.text('PRECIO UNIT', 370, 298)
      doc.text('IVA', 420, 298)
      doc.text('TOTAL', 450, 298)

      // Filas de productos (comenzar en y: 301 según config, altura 13pt cada fila)
      let yPosProducts = 314
      items.forEach((item, index) => {
        const rowY = yPosProducts - 10
        
        // Fondo alternado para filas pares (como Excel)
        if (index % 2 === 0) {
          doc.setFillColor(colors.grisClaro)
          doc.rect(45, rowY, 500, 13, 'F')
        }
        
        // Restablecer color de trazo para bordes negros
        doc.setDrawColor(colors.bordeNegro)
        doc.setLineWidth(1)
        
        // Bordes de cada celda individual (como en Excel)
        doc.rect(45, rowY, 50, 13)      // CODIGO
        doc.rect(95, rowY, 220, 13)     // PRODUCTO  
        doc.rect(315, rowY, 50, 13)     // CANTIDAD
        doc.rect(365, rowY, 50, 13)     // PRECIO UNIT
        doc.rect(415, rowY, 30, 13)     // IVA
        doc.rect(445, rowY, 100, 13)    // TOTAL
        
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(colors.textoNegro)
        
        doc.text(`${index + 1}`, 50, yPosProducts)
        doc.text(item.descripcion.substring(0, 32), 100, yPosProducts) // Truncar para que quepa
        doc.text(item.cantidad.toString(), 335, yPosProducts, { align: 'center' })
        doc.text(`$${item.precio.toFixed(2)}`, 385, yPosProducts, { align: 'center' })
        
        // IVA según el proveedor
        const ivaText = proveedorSeleccionado.con_iva?.toUpperCase() === 'SI' ? 'SI' : 
                       proveedorSeleccionado.con_iva?.toUpperCase() === 'NO' ? 'NO' : 'N/A'
        doc.text(ivaText, 430, yPosProducts, { align: 'center' })
        doc.text(`$${(item.cantidad * item.precio).toFixed(2)}`, 470, yPosProducts, { align: 'center' })
        
        yPosProducts += 13
      })
      
      // Si hay menos de 19 filas (máximo del formato), dibujar filas vacías con bordes
      const maxRows = 19
      const remainingRows = maxRows - items.length
      for (let i = 0; i < remainingRows && yPosProducts < 566; i++) {
        const rowY = yPosProducts - 10
        
        // Fondo alternado también para filas vacías
        if ((items.length + i) % 2 === 0) {
          doc.setFillColor(colors.grisClaro)
          doc.rect(45, rowY, 500, 13, 'F')
        }
        
        // Bordes de cada celda vacía
        doc.setDrawColor(colors.bordeNegro)
        doc.setLineWidth(1)
        doc.rect(45, rowY, 50, 13)      // CODIGO
        doc.rect(95, rowY, 220, 13)     // PRODUCTO  
        doc.rect(315, rowY, 50, 13)     // CANTIDAD
        doc.rect(365, rowY, 50, 13)     // PRECIO UNIT
        doc.rect(415, rowY, 30, 13)     // IVA
        doc.rect(445, rowY, 100, 13)    // TOTAL
        
        yPosProducts += 13
      }

      // COMENTARIOS (coordenadas exactas: y: 566 según config)
      doc.setFillColor(colors.azulOscuro)
      doc.rect(45, 566, 280, 13, 'F')
      
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(colors.textoBlanco)
      doc.text('COMENTARIOS E INTRUCCIONES DE ENVÍO', 50, 576)

      // Área de comentarios con borde (coordenadas exactas)
      doc.setDrawColor(colors.bordeNegro)
      doc.setLineWidth(1)
      doc.rect(45, 579, 280, 65)
      
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(colors.textoNegro)
      doc.text(`${vehiculoSeleccionado.Marca} ${vehiculoSeleccionado.Modelo} ${vehiculoSeleccionado.Placa}`, 50, 595)

      // TOTALES (coordenadas exactas de la derecha)
      const subtotal = calcularSubtotal()
      const iva = calcularIVA(subtotal)
      const total = calcularTotal()
      
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(colors.textoNegro)
      
      // Labels de totales (columna izquierda, coordenadas exactas)
      doc.text('SUBTOTAL', 365, 578)
      doc.text('IMPONIBLE', 365, 591) 
      doc.text('IMPUESTO', 365, 604)
      doc.text('ENVIO', 365, 617)
      doc.text('OTROS', 365, 630)
      
      doc.setFont('helvetica', 'bold')
      doc.text('TOTAL', 365, 643)

      // Valores de totales (columna derecha, alineados a la derecha, coordenadas exactas)
      doc.setFont('helvetica', 'normal')
      doc.text(`$${subtotal.toFixed(2)}`, 525, 578, { align: 'right' })
      doc.text(`$${subtotal.toFixed(2)}`, 525, 591, { align: 'right' })
      
      // IVA según tipo de proveedor (Argentina vs Brasil)
      if (proveedorSeleccionado.con_iva?.toUpperCase() === 'SI' || proveedorSeleccionado.con_iva?.toUpperCase() === 'NO') {
        doc.text(`$${iva.toFixed(2)}`, 525, 604, { align: 'right' })
      } else {
        // Para Brasil (N/A)
        doc.text('N/A', 525, 604, { align: 'right' })
      }
      
      doc.text(`$${gastosAdicionales.envio.toFixed(2)}`, 525, 617, { align: 'right' })
      doc.text(`$${gastosAdicionales.otros.toFixed(2)}`, 525, 630, { align: 'right' })
      
      doc.setFont('helvetica', 'bold')
      doc.text(`$${total.toFixed(2)}`, 525, 643, { align: 'right' })

      // FIRMAS (coordenadas exactas: y: 680 según config)
      // Líneas de firma (coordenadas exactas)
      doc.setDrawColor(colors.bordeNegro)
      doc.setLineWidth(1)
      doc.line(45, 675, 280, 675)   // Línea izquierda
      doc.line(315, 675, 495, 675)  // Línea derecha
      
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(colors.textoNegro)
      doc.text('Hecho por:', 45, 690)
      doc.text('NILS ORTIZ VALVERDE', 95, 690)
      doc.text('Autorizado por:', 315, 690)
      doc.text('PATRICIA DURAN VACA', 415, 690)

      // Generar PDF de la OC
      const ocPDFBytes = new Uint8Array(doc.output('arraybuffer'))
      
      // Si hay adjuntos, crear PDF multipágina; si no, usar solo la OC
      let pdfFinal: Uint8Array
      console.log(`📊 Estado de adjuntos: ${adjuntos.length} archivos`)
      console.log(`📊 Lista de adjuntos:`, adjuntos.map(a => `${a.name} (${a.type}, ${a.size}b)`))
      
      if (adjuntos.length > 0) {
        console.log('🔧 Creando PDF multipágina...')
        setCargandoAdjuntos(true)
        try {
          pdfFinal = await crearPDFMultipagina(ocPDFBytes, adjuntos)
          console.log('✅ PDF multipágina creado exitosamente')
        } catch (error) {
          console.error('❌ Error creando PDF multipágina:', error)
          setCargandoAdjuntos(false)
          throw error
        }
        setCargandoAdjuntos(false)
      } else {
        console.log('📄 Usando solo PDF de la OC (sin adjuntos)')
        pdfFinal = ocPDFBytes
      }
      
      // Crear nombre de archivo con estructura de fecha
      const fechaActual = new Date()
      const añoMes = fechaActual.getFullYear().toString() + (fechaActual.getMonth() + 1).toString().padStart(2, '0')
      const nombreArchivo = `${añoMes}/OC_${codigo.replace('-', '_')}.pdf`
      
      if (paraStorage) {
        // Modo Storage: solo devolver los bytes
        console.log(`📦 PDF para Storage generado: ${pdfFinal.byteLength} bytes`)
        return pdfFinal
      } else {
        // Modo Preview: descargar localmente
        const blob = new Blob([pdfFinal], { type: 'application/pdf' })
        console.log('📥 Generando vista previa del PDF:', { tamano: blob.size, tipo: blob.type })
        
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `OC_${codigo.replace('-', '_')}_PREVIEW.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        
        alert(`📄 Vista previa de PDF generada exitosamente\n\n${adjuntos.length > 0 ? `${adjuntos.length + 1} páginas (OC + ${adjuntos.length} adjuntos)` : '1 página (solo OC)'}\n\n⚠️ Esto es solo una VISTA PREVIA\nPara guardar la OC definitiva, usa el botón "Crear Orden de Compra"`)
      }
      
    } catch (error) {
      console.error('Error generando PDF:', error)
      alert('Error al generar el PDF')
    }
  }

  const siguientePaso = () => {
    if (paso === 1 && vehiculoSeleccionado) {
      setPaso(2)
    }
  }

  const pasoAnterior = () => {
    if (paso === 2 && !mostrandoFormulario) {
      setPaso(1)
    } else if (mostrandoFormulario) {
      setMostrandoFormulario(false)
      setProveedorSeleccionado(null)
    }
  }

  const volverAProveedores = () => {
    setMostrandoFormulario(false)
    setProveedorSeleccionado(null)
    setItems([])
    setNuevoItem({ descripcion: '', cantidad: 1, precio: 0 })
    setGastosAdicionales({ envio: 0, otros: 0 })
  }

  const nuevaOrden = () => {
    setVehiculoSeleccionado(null)
    setProveedorSeleccionado(null)
    setItems([])
    setNuevoItem({ descripcion: '', cantidad: 1, precio: 0 })
    setGastosAdicionales({ envio: 0, otros: 0 })
    setAdjuntos([])
    setOrdenCreada(null)
    setMostrandoFormulario(false)
    setPaso(1)
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <Link 
          href="/ordenes-compra" 
          className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Órdenes de Compra
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Crear Orden de Compra</h1>
        <p className="text-gray-600 mt-2">Sistema paso a paso para generar órdenes de compra</p>
      </div>

      {/* Indicador de pasos */}
      <div className="flex items-center justify-center mb-8">
        <div className={`flex items-center ${paso >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold ${paso >= 1 ? 'bg-blue-600' : 'bg-gray-400'}`}>
            1
          </div>
          <span className="ml-2 font-medium">Seleccionar Vehículo</span>
        </div>
        <ArrowRight className="mx-4 h-4 w-4 text-gray-400" />
        <div className={`flex items-center ${paso >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold ${paso >= 2 ? 'bg-blue-600' : 'bg-gray-400'}`}>
            2
          </div>
          <span className="ml-2 font-medium">Seleccionar Proveedor y Crear OC</span>
        </div>
      </div>

      {/* Paso 1: Búsqueda de Vehículos */}
      {paso === 1 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <Search className="h-5 w-5" />
            <h2 className="text-lg font-semibold text-gray-900">Paso 1: Buscar Vehículo</h2>
          </div>
          <p className="text-gray-600 mb-6">Busca por número interno o placa del vehículo</p>
          
          <div className="space-y-4">
            {/* Selector de tipo de búsqueda */}
            <div className="flex gap-4 mb-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="tipoBusquedaVehiculo"
                  value="placa"
                  checked={tipoBusquedaVehiculo === 'placa'}
                  onChange={(e) => {
                    setTipoBusquedaVehiculo('placa')
                    setBusquedaVehiculo('')
                    setResultadosVehiculos([])
                  }}
                  className="mr-2"
                />
                <span className="text-gray-700">Buscar por Placa</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="tipoBusquedaVehiculo"
                  value="interno"
                  checked={tipoBusquedaVehiculo === 'interno'}
                  onChange={(e) => {
                    setTipoBusquedaVehiculo('interno')
                    setBusquedaVehiculo('')
                    setResultadosVehiculos([])
                  }}
                  className="mr-2"
                />
                <span className="text-gray-700">Buscar por Interno</span>
              </label>
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder={tipoBusquedaVehiculo === 'placa' ? 'Ingresa placa del vehículo...' : 'Ingresa número interno...'}
                value={busquedaVehiculo}
                onChange={(e) => {
                  setBusquedaVehiculo(e.target.value)
                  buscarVehiculos(e.target.value)
                }}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              />
              <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
            </div>

            {cargandoVehiculos && (
              <div className="text-center py-4">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Buscando...</span>
              </div>
            )}

            {resultadosVehiculos.length > 0 && (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {resultadosVehiculos.map((vehiculo, index) => (
                  <div
                    key={index}
                    onClick={() => seleccionarVehiculo(vehiculo)}
                    className="p-3 border rounded-lg cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-gray-900">
                          Interno: {vehiculo.Nro_Interno} | Placa: {vehiculo.Placa}
                        </p>
                        <p className="text-gray-600">{vehiculo.Marca} {vehiculo.Modelo} ({vehiculo.Año})</p>
                        <p className="text-sm text-gray-500">Titular: {vehiculo.Titular}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {vehiculoSeleccionado && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">Vehículo Seleccionado:</h3>
                <p className="text-green-700">
                  <strong>Interno:</strong> {vehiculoSeleccionado.Nro_Interno} | 
                  <strong> Placa:</strong> {vehiculoSeleccionado.Placa}
                </p>
                <p className="text-green-700">
                  <strong>Vehículo:</strong> {vehiculoSeleccionado.Marca} {vehiculoSeleccionado.Modelo} ({vehiculoSeleccionado.Año})
                </p>
                <p className="text-green-700">
                  <strong>Titular:</strong> {vehiculoSeleccionado.Titular}
                </p>
                <div className="mt-4">
                  <button 
                    onClick={siguientePaso} 
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    Continuar al Paso 2 <ArrowRight className="ml-2 h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Paso 2: Búsqueda de Proveedores o Formulario de Orden */}
      {paso === 2 && !mostrandoFormulario && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <Search className="h-5 w-5" />
            <h2 className="text-lg font-semibold text-gray-900">Paso 2: Buscar Proveedor</h2>
          </div>
          <p className="text-gray-600 mb-6">Busca por nombre o CUIT del proveedor</p>
          
          <div className="space-y-4">
            {vehiculoSeleccionado && (
              <div className="p-3 bg-gray-50 border rounded-lg mb-4">
                <p className="text-sm text-gray-600">
                  <strong>Vehículo:</strong> {vehiculoSeleccionado.Nro_Interno} - {vehiculoSeleccionado.Placa} 
                  ({vehiculoSeleccionado.Marca} {vehiculoSeleccionado.Modelo})
                </p>
              </div>
            )}

            <div className="relative">
              <input
                type="text"
                placeholder="Ingresa nombre o CUIT del proveedor..."
                value={busquedaProveedor}
                onChange={(e) => {
                  setBusquedaProveedor(e.target.value)
                  buscarProveedores(e.target.value)
                }}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              />
              <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
            </div>

            {cargandoProveedores && (
              <div className="text-center py-4">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Buscando...</span>
              </div>
            )}

            {resultadosProveedores.length > 0 && (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {resultadosProveedores.map((proveedor) => (
                  <div
                    key={proveedor.id}
                    onClick={() => seleccionarProveedor(proveedor)}
                    className="p-3 border rounded-lg cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-gray-900">{proveedor.nombre}</p>
                        {proveedor.cuit && (
                          <p className="text-gray-600">CUIT: {proveedor.cuit}</p>
                        )}
                        {proveedor.direccion && (
                          <p className="text-sm text-gray-500">{proveedor.direccion}</p>
                        )}
                        {proveedor.telefono && (
                          <p className="text-sm text-gray-500">Tel: {proveedor.telefono}</p>
                        )}
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          proveedor.con_iva === 'SI' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {proveedor.con_iva === 'SI' ? 'Con IVA' : 'Sin IVA'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4">
              <button 
                onClick={pasoAnterior} 
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" /> Volver al Paso 1
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Formulario de Creación de Orden */}
      {paso === 2 && mostrandoFormulario && !ordenCreada && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">📝 Nueva Orden de Compra</h2>
            <button 
              onClick={volverAProveedores}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" /> Cambiar Proveedor
            </button>
          </div>

          {/* Información seleccionada */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Vehículo seleccionado */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-3">🚗 Vehículo Seleccionado</h3>
              <div className="space-y-1 text-blue-700 text-sm">
                <p><strong>{vehiculoSeleccionado?.Marca} {vehiculoSeleccionado?.Modelo}</strong> ({vehiculoSeleccionado?.Año})</p>
                <p>Interno: {vehiculoSeleccionado?.Nro_Interno} | Placa: {vehiculoSeleccionado?.Placa}</p>
                <p>Titular: {vehiculoSeleccionado?.Titular}</p>
              </div>
            </div>

            {/* Proveedor seleccionado */}
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-3">🏢 Proveedor Seleccionado</h3>
              <div className="space-y-1 text-green-700 text-sm">
                <p><strong>{proveedorSeleccionado?.nombre}</strong></p>
                {proveedorSeleccionado?.cuit && <p>CUIT: {proveedorSeleccionado.cuit}</p>}
                {proveedorSeleccionado?.telefono && <p>Tel: {proveedorSeleccionado.telefono}</p>}
                <p>IVA: {proveedorSeleccionado?.con_iva}</p>
              </div>
            </div>
          </div>

          {/* Código de Orden de Compra */}
          <div className="mb-6">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="font-semibold text-yellow-800 mb-3">📋 Código de Orden de Compra</h3>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <input
                    type="text"
                    value={codigoOC}
                    onChange={(e) => {
                      const valor = e.target.value.toUpperCase()
                      setCodigoOC(valor)
                      setCodigoGenerado(false) // Marcar como editado manualmente
                      // Verificar duplicados con un pequeño delay para evitar muchas consultas
                      clearTimeout(window.timeoutCodigoCheck)
                      window.timeoutCodigoCheck = setTimeout(() => verificarCodigoEnTiempoReal(valor), 500)
                    }}
                    placeholder="Código de la OC"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 text-gray-900 bg-white font-mono text-lg ${
                      codigoDuplicado.existe 
                        ? 'border-orange-300 focus:ring-orange-500 bg-orange-50' 
                        : 'border-gray-300 focus:ring-yellow-500'
                    }`}
                  />
                  {codigoDuplicado.existe && (
                    <div className="mt-1 text-orange-600 text-xs flex items-center gap-1">
                      ⚠️ Este código ya existe (creado el {codigoDuplicado.fecha})
                    </div>
                  )}
                </div>
                <button
                  onClick={async () => {
                    try {
                      const codigo = await previewCodigoOC()
                      setCodigoOC(codigo)
                      setCodigoGenerado(true)
                      setCodigoDuplicado({existe: false})
                    } catch (error) {
                      console.error('Error regenerando código:', error)
                    }
                  }}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm flex items-center gap-2"
                >
                  🔄 Regenerar
                </button>
              </div>
              <p className="text-yellow-700 text-xs mt-2">
                {codigoGenerado ? "Código generado automáticamente. Puedes editarlo si es necesario." : "Generando código..."}
              </p>
            </div>
          </div>

          {/* Formulario de items */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">📝 Items de Compra</h3>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Asignar por:</span>
                <button
                  onClick={() => setModoSeleccion(modoSeleccion === 'placa' ? 'interno' : 'placa')}
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200 transition-colors"
                >
                  {modoSeleccion === 'placa' ? '🔢 Cambiar a Interno' : '🚗 Cambiar a Placa'}
                </button>
              </div>
            </div>
            
            {/* Agregar nuevo item */}
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              {/* Toggle para OC múltiple */}
              <div className="mb-4 flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={esOCMultiple}
                    onChange={(e) => setEsOCMultiple(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    🚗 Items para múltiples vehículos
                  </span>
                </label>
                {esOCMultiple && (
                  <span className="text-xs text-gray-500 italic">
                    Podrás asignar cada item a un vehículo específico
                  </span>
                )}
              </div>

              {/* Campo de vehículo destino (solo si OC múltiple) */}
              {esOCMultiple && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🎯 Vehículo destino para este item:
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Buscar por placa o interno..."
                      value={busquedaVehiculoItem}
                      onChange={(e) => {
                        setBusquedaVehiculoItem(e.target.value)
                        buscarVehiculosParaItem(e.target.value)
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    />
                    {nuevoItem.vehiculoDestino && (
                      <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                        <span className="text-sm text-green-700">
                          ✅ {nuevoItem.vehiculoDestino.Nro_Interno} - {nuevoItem.vehiculoDestino.Placa} 
                          ({nuevoItem.vehiculoDestino.Marca} {nuevoItem.vehiculoDestino.Modelo})
                        </span>
                        <button
                          onClick={() => setNuevoItem(prev => ({ ...prev, vehiculoDestino: null }))}
                          className="ml-2 text-red-600 hover:text-red-800"
                        >
                          ❌
                        </button>
                      </div>
                    )}
                    {resultadosVehiculosItem.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {resultadosVehiculosItem.map((vehiculo, index) => (
                          <div
                            key={index}
                            onClick={() => seleccionarVehiculoParaItem(vehiculo)}
                            className="p-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                          >
                            <div className="text-sm">
                              <span className="font-medium">{vehiculo.Nro_Interno} - {vehiculo.Placa}</span>
                              <span className="text-gray-600 ml-2">({vehiculo.Marca} {vehiculo.Modelo})</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {!nuevoItem.vehiculoDestino && (
                    <p className="text-xs text-gray-500 mt-1">
                      Si no seleccionas un vehículo, se usará el vehículo principal de la OC
                    </p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <input
                  type="text"
                  placeholder="Descripción del producto/servicio"
                  value={nuevoItem.descripcion}
                  onChange={(e) => setNuevoItem(prev => ({ ...prev, descripcion: e.target.value }))}
                  className="md:col-span-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                />
                <input
                  type="number"
                  placeholder="Cantidad"
                  min="1"
                  value={nuevoItem.cantidad}
                  onChange={(e) => setNuevoItem(prev => ({ ...prev, cantidad: parseInt(e.target.value) || 1 }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Precio unitario"
                  min="0"
                  value={nuevoItem.precio}
                  onChange={(e) => setNuevoItem(prev => ({ ...prev, precio: parseFloat(e.target.value) || 0 }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                />
              </div>
              <button 
                onClick={agregarItem}
                disabled={!nuevoItem.descripcion.trim()}
                className="mt-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg transition-colors"
              >
                ➕ Agregar Item
              </button>
            </div>

            {/* Lista de items con columnas */}
            {items.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                {/* Header de tabla */}
                <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                  <div className="grid grid-cols-6 gap-3 text-sm font-semibold text-gray-700">
                    <div className="col-span-2">Descripción</div>
                    <div>Cant.</div>
                    <div>Precio Unit.</div>
                    <div>{modoSeleccion === 'placa' ? 'Placa' : 'Interno'}</div>
                    <div>Total</div>
                  </div>
                </div>
                
                {/* Items */}
                <div className="divide-y divide-gray-200">
                  {items.map((item) => (
                    <div key={item.id} className="px-4 py-3">
                      <div className="grid grid-cols-6 gap-3 items-center">
                        <div className="col-span-2">
                          <p className="font-medium text-gray-900">{item.descripcion}</p>
                        </div>
                        <div className="text-gray-700">{item.cantidad}</div>
                        <div className="text-gray-700">${item.precio.toFixed(2)}</div>
                        <div>
                          <input
                            type={modoSeleccion === 'placa' ? 'text' : 'number'}
                            value={modoSeleccion === 'placa' ? item.targetPlaca : item.targetInterno}
                            onChange={(e) => actualizarTargetItem(item.id, e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                            placeholder={modoSeleccion === 'placa' ? 'Placa' : 'Interno'}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-gray-900">
                            ${(item.cantidad * item.precio).toFixed(2)}
                          </span>
                          <button 
                            onClick={() => eliminarItem(item.id)}
                            className="text-red-600 hover:text-red-800 ml-2"
                            title="Eliminar item"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Gastos adicionales */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📦 Gastos Adicionales (Opcional)</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">🚛 Envío:</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    min="0"
                    value={gastosAdicionales.envio}
                    onChange={(e) => setGastosAdicionales(prev => ({ ...prev, envio: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">💼 Otros gastos:</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    min="0"
                    value={gastosAdicionales.otros}
                    onChange={(e) => setGastosAdicionales(prev => ({ ...prev, otros: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  />
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">💡 Estos gastos se sumarán al total con IVA incluido</p>
            </div>
          </div>

          {/* Resumen de totales */}
          {items.length > 0 && (
            <div className="mb-6">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">💰 Resumen de Totales</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal (sin IVA):</span>
                    <span>${calcularSubtotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>IVA (21%):</span>
                    <span>${calcularIVA(calcularSubtotal()).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Subtotal con IVA:</span>
                    <span>${(calcularSubtotal() + calcularIVA(calcularSubtotal())).toFixed(2)}</span>
                  </div>
                  {(gastosAdicionales.envio > 0 || gastosAdicionales.otros > 0) && (
                    <>
                      {gastosAdicionales.envio > 0 && (
                        <div className="flex justify-between text-blue-600">
                          <span>🚛 Envío:</span>
                          <span>${gastosAdicionales.envio.toFixed(2)}</span>
                        </div>
                      )}
                      {gastosAdicionales.otros > 0 && (
                        <div className="flex justify-between text-blue-600">
                          <span>💼 Otros gastos:</span>
                          <span>${gastosAdicionales.otros.toFixed(2)}</span>
                        </div>
                      )}
                    </>
                  )}
                  <div className="border-t pt-2">
                    <div className="flex justify-between font-bold text-lg">
                      <span>TOTAL FINAL:</span>
                      <span className="text-green-600">${calcularTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Adjuntos - Sistema de archivos */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">📎 Adjuntos</h3>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
              <input
                type="file"
                id="adjuntos"
                multiple
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={manejarAdjuntos}
                className="hidden"
              />
              <label htmlFor="adjuntos" className="cursor-pointer">
                <div className="text-gray-600 mb-2">
                  <span className="text-2xl">📄</span>
                  <p className="mt-2">Haz clic para seleccionar archivos o arrastra y suelta</p>
                  <p className="text-sm text-gray-400 mt-1">PDFs, JPG, PNG (máx. 10MB cada uno)</p>
                </div>
              </label>
            </div>
            
            {/* Lista de archivos adjuntos */}
            {adjuntos.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="font-medium text-gray-900">Archivos seleccionados:</p>
                {adjuntos.map((archivo, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {archivo.type === 'application/pdf' ? '📄' : '🖼️'}
                      </span>
                      <div>
                        <p className="font-medium text-gray-900">{archivo.name}</p>
                        <p className="text-sm text-gray-500">
                          {(archivo.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => removerAdjunto(index)}
                      className="text-red-500 hover:text-red-700 px-2 py-1 rounded transition-colors"
                    >
                      ❌
                    </button>
                  </div>
                ))}
                <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
                  ℹ️ El PDF final tendrá {adjuntos.length + 1} páginas: 1 OC + {adjuntos.length} adjunto(s)
                </div>
              </div>
            )}
          </div>

          {/* Checkbox de Emergencia */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={esEmergencia}
                onChange={(e) => setEsEmergencia(e.target.checked)}
                className="w-5 h-5 text-red-600 border-red-300 rounded focus:ring-red-500 focus:ring-2"
              />
              <div className="flex items-center gap-2">
                <span className="text-red-700 text-lg font-semibold">🚨 Orden de Emergencia</span>
                <span className="text-red-600 text-sm">(Pago urgente requerido)</span>
              </div>
            </label>
          </div>

          {/* Botones de acción */}
          <div className="text-center">
            
            <div className="flex gap-4 justify-center">
              <button 
                onClick={crearOrdenCompra}
                disabled={items.length === 0 || creandoOrden}
                className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-8 py-3 rounded-lg text-lg font-semibold transition-colors flex items-center gap-2"
              >
                {creandoOrden ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Generando Orden...
                  </>
                ) : (
                  '💾 Crear OC'
                )}
              </button>
              <button 
                onClick={() => generarPDF(false)}
                disabled={items.length === 0 || cargandoAdjuntos}
                className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-8 py-3 rounded-lg text-lg font-semibold transition-colors flex items-center gap-2"
              >
                {cargandoAdjuntos ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Procesando adjuntos...
                  </>
                ) : (
                  <>📎 Generar PDF{adjuntos.length > 0 && ` (${adjuntos.length + 1} pág.)`}</>
                )}
              </button>
            </div>
            {items.length === 0 && (
              <p className="text-sm text-gray-500 mt-2">Agrega al menos un item para continuar</p>
            )}
          </div>
        </div>
      )}

      {/* Pantalla de Confirmación - Orden Creada */}
      {ordenCreada && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Orden de Compra Creada!</h2>
            <p className="text-gray-600 mb-6">La orden ha sido generada exitosamente</p>
            
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
              <p className="text-lg font-semibold text-gray-900">Código de OC:</p>
              <p className="text-2xl font-bold text-blue-600">{ordenCreada}</p>
            </div>

            <div className="flex gap-4 justify-center">
              <Link
                href="/ordenes-compra/listado"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Ver Órdenes Creadas
              </Link>
              <button 
                onClick={nuevaOrden}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Crear Nueva Orden
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}