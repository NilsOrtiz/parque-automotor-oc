'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase, type Vehiculo } from '@/lib/supabase'
import { ArrowLeft, Search, Save, AlertCircle, Droplets, Settings, Disc, Cog, Truck, Wrench, Zap, Circle } from 'lucide-react'

interface OrdenCompra {
  id: number
  codigo_oc: string
  proveedor: string
  items: string
  monto_vehiculo: number
  moneda: string
}

interface ConfiguracionVehiculo {
  id: number
  nombre_configuracion: string
  descripcion?: string
  tipo_vehiculo?: number
  componentes_aplicables: Record<string, boolean>
  activo: boolean
}

export default function RegistroServicioPage() {
  const [vehiculo, setVehiculo] = useState<Vehiculo | null>(null)
  const [configuracionVehiculo, setConfiguracionVehiculo] = useState<any>(null)
  const [busquedaVehiculo, setBusquedaVehiculo] = useState('')
  const [tipoBusqueda, setTipoBusqueda] = useState<'placa' | 'interno'>('placa')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Campos del formulario
  const [clasificacion, setClasificacion] = useState<'revision' | 'mantenimiento' | 'reparacion'>('mantenimiento')
  const [subclasificacion, setSubclasificacion] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [items, setItems] = useState('')
  const [kilometrajeServicio, setKilometrajeServicio] = useState<number | ''>('')
  const [ordenesSeleccionadas, setOrdenesSeleccionadas] = useState<number[]>([])
  
  // Órdenes de compra disponibles
  const [ordenesDisponibles, setOrdenesDisponibles] = useState<OrdenCompra[]>([])
  const [loadingOrdenes, setLoadingOrdenes] = useState(false)
  const [totalOrdenes, setTotalOrdenes] = useState(0)

  // Pendientes del vehículo
  const [pendientesDisponibles, setPendientesDisponibles] = useState<any[]>([])
  const [pendienteSeleccionado, setPendienteSeleccionado] = useState<number | null>(null)
  const [loadingPendientes, setLoadingPendientes] = useState(false)

  // Estados para formularios rápidos por sección
  const [seccionSeleccionada, setSeccionSeleccionada] = useState<string | null>(null)
  const [seccionesSeleccionadas, setSeccionesSeleccionadas] = useState<Set<string>>(new Set())
  const [datosSeccion, setDatosSeccion] = useState<Record<string, any>>({})
  
  // Estados para interfaz mejorada con datos globales
  const [datosGlobales, setDatosGlobales] = useState({
    kilometraje: '',
    fecha: new Date().toISOString().split('T')[0],
    usarKmActual: false
  })
  const [componentesSeleccionados, setComponentesSeleccionados] = useState<Set<string>>(new Set())

  // Actualizar descripción e items automáticamente cuando cambian los componentes
  useEffect(() => {
    if (clasificacion === 'mantenimiento' && seccionesSeleccionadas.size > 0) {
      // Actualizar en tiempo real cuando se usa formulario rápido
      if (componentesSeleccionados.size > 0) {
        setDescripcion(generarDescripcionAutomatica())
        setItems(generarItemsAutomaticos())
      } else {
        // Limpiar cuando no hay componentes seleccionados
        setDescripcion('')
        setItems('')
      }
    }
  }, [componentesSeleccionados, seccionesSeleccionadas, clasificacion, datosGlobales, vehiculo])

  const subclasificaciones = [
    'Motor', 'Transmisión', 'Frenos', 'Suspensión', 'Neumáticos', 
    'Eléctrico', 'Electrónico', 'Carrocería', 'Interior', 'Documentación',
    'Climatización', 'Dirección', 'Filtros', 'Fluidos', 'Escape', 
    'Combustible', 'Seguridad'
  ]

  // Configuración de secciones con iconos (igual que en busqueda)
  const secciones = [
    { id: 'aceites-filtros', nombre: 'Aceites y Filtros', icono: Droplets, color: 'blue' },
    { id: 'transmision-liquidos', nombre: 'Transmisión y Líquidos', icono: Settings, color: 'green' },
    { id: 'frenos', nombre: 'Sistema de Frenos', icono: Disc, color: 'red' },
    { id: 'motor-embrague', nombre: 'Motor y Embrague', icono: Cog, color: 'orange' },
    { id: 'suspension', nombre: 'Suspensión', icono: Truck, color: 'purple' },
    { id: 'correas', nombre: 'Correas', icono: Wrench, color: 'yellow' },
    { id: 'electrico', nombre: 'Sistema Eléctrico', icono: Zap, color: 'indigo' },
    { id: 'neumaticos', nombre: 'Neumáticos', icono: Circle, color: 'gray' }
  ]

  // Configuración de campos por sección (igual que en busqueda)
  const camposPorSeccion: Record<string, any[]> = {
    'aceites-filtros': [
      { label: "Aceite de Motor", kmField: "aceite_motor_km", dateField: "aceite_motor_fecha", modelField: "aceite_motor_modelo", litersField: "aceite_motor_litros", hrField: "aceite_motor_hr" },
      { label: "Filtro Aceite Motor", modelField: "filtro_aceite_motor_modelo" },
      { label: "Filtro de Combustible", kmField: "filtro_combustible_km", dateField: "filtro_combustible_fecha", modelField: "filtro_combustible_modelo" },
      { label: "Filtro de Aire", kmField: "filtro_aire_km", dateField: "filtro_aire_fecha", modelField: "filtro_aire_modelo" },
      { label: "Filtro de Cabina", kmField: "filtro_cabina_km", dateField: "filtro_cabina_fecha", modelField: "filtro_cabina_modelo" },
      { label: "Filtro Deshumidificador", kmField: "filtro_deshumidificador_km", dateField: "filtro_deshumidificador_fecha", modelField: "filtro_deshumidificador_modelo" },
      { label: "Filtro Secador", kmField: "filtro_secador_km", dateField: "filtro_secador_fecha", modelField: "filtro_secador_modelo" },
      { label: "Filtro de Aire Secundario", kmField: "filtro_aire_secundario_km", dateField: "filtro_aire_secundario_fecha", modelField: "filtro_aire_secundario_modelo" },
      { label: "Trampa de Agua", kmField: "trampa_agua_km", dateField: "trampa_agua_fecha", modelField: "trampa_agua_modelo" }
    ],
    'transmision-liquidos': [
      { label: "Aceite de Transmisión", kmField: "aceite_transmicion_km", dateField: "aceite_transmicion_fecha", modelField: "aceite_transmicion_modelo" },
      { label: "Líquido Refrigerante", kmField: "liquido_refrigerante_km", dateField: "liquido_refrigerante_fecha", modelField: "liquido_refrigerante_modelo" },
      { label: "Líquido de Frenos", kmField: "liquido_frenos_km", dateField: "liquido_frenos_fecha", modelField: "liquido_frenos_modelo" }
    ],
    'frenos': [
      { label: "Pastillas/Cintas Freno A", kmField: "pastilla_cinta_freno_km_a", dateField: "pastilla_cinta_freno_fecha_a", modelField: "pastilla_cinta_freno_modelo_a" },
      { label: "Pastillas/Cintas Freno B", kmField: "pastilla_cinta_freno_km_b", dateField: "pastilla_cinta_freno_fecha_b", modelField: "pastilla_cinta_freno_modelo_b" },
      { label: "Pastillas/Cintas Freno C", kmField: "pastilla_cinta_freno_km_c", dateField: "pastilla_cinta_freno_fecha_c", modelField: "pastilla_cinta_freno_modelo_c" },
      { label: "Pastillas/Cintas Freno D", kmField: "pastilla_cinta_freno_km_d", dateField: "pastilla_cinta_freno_fecha_d", modelField: "pastilla_cinta_freno_modelo_d" }
    ],
    'motor-embrague': [
      { label: "Embrague", kmField: "embrague_km", dateField: "embrague_fecha", modelField: "embrague_modelo" }
    ],
    'suspension': [
      { label: "Suspensión A", kmField: "suspencion_km_a", dateField: "suspencion_fecha_a", modelField: "suspencion_modelo_a" },
      { label: "Suspensión B", kmField: "suspencion_km_b", dateField: "suspencion_fecha_b", modelField: "suspencion_modelo_b" },
      { label: "Suspensión C", kmField: "suspencion_km_c", dateField: "suspencion_fecha_c", modelField: "suspencion_modelo_c" },
      { label: "Suspensión D", kmField: "suspencion_km_d", dateField: "suspencion_fecha_d", modelField: "suspencion_modelo_d" }
    ],
    'correas': [
      { label: "Correa de Distribución", kmField: "correa_distribucion_km", dateField: "correa_distribucion_fecha", modelField: "correa_distribucion_modelo" },
      { label: "Correa de Alternador", kmField: "correa_alternador_km", dateField: "correa_alternador_fecha", modelField: "correa_alternador_modelo" },
      { label: "Correa de Dirección", kmField: "correa_direccion_km", dateField: "correa_direccion_fecha", modelField: "correa_direccion_modelo" },
      { label: "Correa de Aire Acondicionado", kmField: "correa_aire_acondicionado_km", dateField: "correa_aire_acondicionado_fecha", modelField: "correa_aire_acondicionado_modelo" },
      { label: "Correa Poly-V", kmField: "correa_polyv_km", dateField: "correa_polyv_fecha", modelField: "correa_polyv_modelo" },
      { label: "Tensor de Correa", kmField: "tensor_correa_km", dateField: "tensor_correa_fecha", modelField: "tensor_correa_modelo" },
      { label: "Polea Tensora", kmField: "polea_tensora_correa_km", dateField: "polea_tensora_correa_fecha", modelField: "polea_tensora_correa_modelo" }
    ],
    'electrico': [
      { label: "Batería", kmField: "bateria_km", dateField: "bateria_fecha", modelField: "bateria_modelo" },
      { label: "Escobillas", kmField: "escobillas_km", dateField: "escobillas_fecha", modelField: "escobillas_modelo" }
    ],
    'neumaticos': [
      { label: "Modelo/Marca General", modelField: "neumatico_modelo_marca" },
      { label: "Neumático A", kmField: "neumatico_km_a", dateField: "neumatico_fecha_a" },
      { label: "Neumático B", kmField: "neumatico_km_b", dateField: "neumatico_fecha_b" },
      { label: "Neumático C", kmField: "neumatico_km_c", dateField: "neumatico_fecha_c" },
      { label: "Neumático D", kmField: "neumatico_km_d", dateField: "neumatico_fecha_d" },
      { label: "Neumático E", kmField: "neumatico_km_e", dateField: "neumatico_fecha_e" },
      { label: "Neumático F", kmField: "neumatico_km_f", dateField: "neumatico_fecha_f" },
      { label: "Alineación", kmField: "alineacion_neumaticos_km", dateField: "alineacion_neumaticos_fecha" },
      { label: "Rotación", kmField: "rotacion_neumaticos_km", dateField: "rotacion_neumaticos_fecha" }
    ]
  }

  async function buscarVehiculo() {
    if (!busquedaVehiculo.trim()) {
      setError('Por favor ingresa un término de búsqueda')
      return
    }

    setLoading(true)
    setError('')
    setVehiculo(null)
    setConfiguracionVehiculo(null)

    try {
      const campo = tipoBusqueda === 'placa' ? 'Placa' : 'Nro_Interno'
      const valor = tipoBusqueda === 'placa' ? busquedaVehiculo.trim() : parseInt(busquedaVehiculo)

      const { data, error } = await supabase
        .from('vehiculos')
        .select(`
          *,
          configuracion:configuraciones_vehiculo(*)
        `)
        .eq(campo, valor)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          setError('No se encontró ningún vehículo con ese criterio')
        } else {
          throw error
        }
      } else {
        setVehiculo(data)
        setConfiguracionVehiculo(data.configuracion)
        await cargarOrdenesDisponibles(data.Placa)
        await cargarPendientesDisponibles(data.id)
      }
    } catch (error) {
      console.error('Error en búsqueda:', error)
      setError('Error al buscar el vehículo')
    } finally {
      setLoading(false)
    }
  }

  async function cargarOrdenesDisponibles(placa: string) {
    setLoadingOrdenes(true)
    try {
      // Obtener todas las órdenes del vehículo
      const { data: todasLasOrdenes, error: errorOrdenes } = await supabase
        .from('ordenes_de_compra_por_vehiculo')
        .select('id, codigo_oc, proveedor, items, monto_vehiculo, moneda')
        .eq('placa', placa)
        .order('fecha', { ascending: false })

      if (errorOrdenes) throw errorOrdenes

      // Obtener órdenes ya utilizadas en el historial
      const { data: historialConOrdenes, error: errorHistorial } = await supabase
        .from('historial')
        .select('ocs_vehiculos')
        .not('ocs_vehiculos', 'is', null)

      if (errorHistorial) throw errorHistorial

      // Extraer IDs de órdenes ya utilizadas
      const ordenesUtilizadas = new Set<number>()
      historialConOrdenes?.forEach(registro => {
        if (registro.ocs_vehiculos) {
          try {
            const ids = JSON.parse(registro.ocs_vehiculos)
            if (Array.isArray(ids)) {
              ids.forEach(id => ordenesUtilizadas.add(id))
            }
          } catch (e) {
            console.error('Error parseando ocs_vehiculos:', e)
          }
        }
      })

      // Filtrar órdenes disponibles (excluir las ya utilizadas)
      const ordenesDisponibles = (todasLasOrdenes || []).filter(orden => 
        !ordenesUtilizadas.has(orden.id)
      )

      setOrdenesDisponibles(ordenesDisponibles)
      setTotalOrdenes((todasLasOrdenes || []).length)
    } catch (error) {
      console.error('Error cargando órdenes:', error)
      setOrdenesDisponibles([])
    } finally {
      setLoadingOrdenes(false)
    }
  }

  async function cargarPendientesDisponibles(vehiculoId: number) {
    setLoadingPendientes(true)
    try {
      const { data, error } = await supabase
        .from('pendientes_observaciones')
        .select('*')
        .eq('id', vehiculoId)
        .neq('estado', 'completado')
        .order('fecha_creacion', { ascending: false })

      if (error) throw error
      setPendientesDisponibles(data || [])
    } catch (error) {
      console.error('Error cargando pendientes:', error)
      setPendientesDisponibles([])
    } finally {
      setLoadingPendientes(false)
    }
  }

  async function guardarServicio() {
    if (!vehiculo) return

    if (!descripcion.trim()) {
      setError('La descripción es obligatoria')
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const ocsVehiculosJson = ordenesSeleccionadas.length > 0 
        ? JSON.stringify(ordenesSeleccionadas) 
        : null

      // Determinar automáticamente quién reportó el problema
      const problemaReportadoPor = pendienteSeleccionado ? 'chofer' : 'mecanico'
      
      // Determinar kilometraje (desde formulario rápido o campo manual)
      let kilometrajeFinal: number | '' = kilometrajeServicio
      if (clasificacion === 'mantenimiento' && (seccionSeleccionada || seccionesSeleccionadas.size > 0)) {
        const kmGlobal = datosGlobales.usarKmActual ?
          (vehiculo.kilometraje_actual || '') :
          (datosGlobales.kilometraje ? parseInt(datosGlobales.kilometraje) : '')
        kilometrajeFinal = kmGlobal
      }
      
      // Usar descripción manual o generar automáticamente
      const descripcionFinal = descripcion.trim() || generarDescripcionAutomatica()
      
      // Usar items manuales o generar automáticamente
      const itemsFinal = items.trim() || generarItemsAutomaticos()

      const { error } = await supabase
        .from('historial')
        .insert({
          id: vehiculo.id,
          clasificacion,
          subclasificacion: subclasificacion || null,
          descripcion: descripcionFinal,
          items: itemsFinal || null,
          kilometraje_al_servicio: kilometrajeFinal || null,
          problema_reportado_por: problemaReportadoPor,
          ocs_vehiculos: ocsVehiculosJson,
          fecha_servicio: new Date().toISOString().split('T')[0] // Fecha actual
        })

      if (error) throw error

      // Actualizar campos específicos del vehículo
      let actualizacionesVehiculo: any = {}
      
      // Datos de la interfaz mejorada (tiene prioridad)
      if (componentesSeleccionados.size > 0) {
        actualizacionesVehiculo = generarDatosSeccionMejorado()
      } 
      // Datos de la interfaz original (compatibilidad)
      else if (Object.keys(datosSeccion).length > 0) {
        Object.entries(datosSeccion).forEach(([campo, valor]) => {
          if (valor !== '' && valor !== null && valor !== undefined) {
            actualizacionesVehiculo[campo] = valor
          }
        })
      }
      
      // Si hay actualizaciones, aplicarlas al vehículo
      if (Object.keys(actualizacionesVehiculo).length > 0) {
        console.log('Datos a actualizar en vehículo:', actualizacionesVehiculo)
        
        const { error: errorVehiculo } = await supabase
          .from('vehiculos')
          .update(actualizacionesVehiculo)
          .eq('id', vehiculo.id)
        
        if (errorVehiculo) {
          console.error('Error actualizando datos del vehículo:', errorVehiculo)
          console.error('Campos que intentamos actualizar:', Object.keys(actualizacionesVehiculo))
          setError(`Error actualizando vehículo: ${errorVehiculo.message}. Campos: ${Object.keys(actualizacionesVehiculo).join(', ')}`)
          return // Detener el proceso si hay error en la actualización
        }
      }

      // Si se seleccionó un pendiente, marcarlo como resuelto
      if (pendienteSeleccionado) {
        const { error: errorPendiente } = await supabase
          .from('pendientes_observaciones')
          .delete()
          .eq('id_pendiente', pendienteSeleccionado)

        if (errorPendiente) {
          console.error('Error eliminando pendiente:', errorPendiente)
          // No falla el guardado por esto, solo logueamos el error
        }
      }

      setSuccess('Servicio registrado correctamente' + (pendienteSeleccionado ? ' y problema resuelto' : ''))
      
      // Limpiar formulario
      setClasificacion('mantenimiento')
      setSubclasificacion('')
      setDescripcion('')
      setItems('')
      setKilometrajeServicio('')
      setOrdenesSeleccionadas([])
      setPendienteSeleccionado(null)
      setSeccionSeleccionada(null)
      setSeccionesSeleccionadas(new Set())
      setDatosSeccion({})
      limpiarFormularioMejorado()
      
      // Recargar pendientes para actualizar la lista
      if (vehiculo) {
        await cargarPendientesDisponibles(vehiculo.id)
      }
    } catch (error) {
      console.error('Error guardando servicio:', error)
      setError('Error al guardar el servicio')
    } finally {
      setSaving(false)
    }
  }

  const toggleOrden = (ordenId: number) => {
    setOrdenesSeleccionadas(prev => 
      prev.includes(ordenId) 
        ? prev.filter(id => id !== ordenId)
        : [...prev, ordenId]
    )
  }

  // Funciones para formularios rápidos
  const seleccionarSeccion = (seccionId: string) => {
    setSeccionSeleccionada(seccionId)
    setSubclasificacion(secciones.find(s => s.id === seccionId)?.nombre || '')
  }

  const toggleSeccionMultiple = (seccionId: string) => {
    const nuevasSecciones = new Set(seccionesSeleccionadas)
    if (nuevasSecciones.has(seccionId)) {
      nuevasSecciones.delete(seccionId)
    } else {
      nuevasSecciones.add(seccionId)
    }
    setSeccionesSeleccionadas(nuevasSecciones)

    // Actualizar subclasificación con sistemas seleccionados
    if (nuevasSecciones.size > 0) {
      const nombresSecciones = Array.from(nuevasSecciones)
        .map(id => secciones.find(s => s.id === id)?.nombre)
        .filter(Boolean)
        .join(', ')
      setSubclasificacion(nombresSecciones)
    } else {
      setSubclasificacion('')
    }
  }

  const volverASeecciones = () => {
    setSeccionSeleccionada(null)
    setSeccionesSeleccionadas(new Set())
    setDatosSeccion({})
  }

  // Función legacy mantenida para compatibilidad
  const actualizarDatoSeccion = (campo: string, valor: any) => {
    setDatosSeccion(prev => ({
      ...prev,
      [campo]: valor
    }))
  }

  const obtenerColorSeccion = (color: string) => {
    const colores = {
      blue: 'border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700',
      green: 'border-green-200 bg-green-50 hover:bg-green-100 text-green-700',
      red: 'border-red-200 bg-red-50 hover:bg-red-100 text-red-700',
      orange: 'border-orange-200 bg-orange-50 hover:bg-orange-100 text-orange-700',
      purple: 'border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700',
      yellow: 'border-yellow-200 bg-yellow-50 hover:bg-yellow-100 text-yellow-700',
      indigo: 'border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700',
      gray: 'border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700'
    }
    return colores[color as keyof typeof colores] || colores.gray
  }

  // Mapeo de secciones a números
  const seccionANumero: Record<string, string> = {
    'aceites-filtros': '1',
    'transmision-liquidos': '2', 
    'frenos': '3',
    'motor-embrague': '4',
    'suspension': '5',
    'correas': '6',
    'electrico': '7',
    'neumaticos': '8'
  }

  // Mapeo de componentes a números por sección
  const componenteANumero: Record<string, Record<string, string>> = {
    'aceites-filtros': {
      'aceite_motor': '1.1',
      'filtro_aceite_motor': '1.2',
      'filtro_combustible': '1.3',
      'filtro_aire': '1.4',
      'filtro_cabina': '1.5',
      'filtro_deshumidificador': '1.6',
      'filtro_secador': '1.7',
      'filtro_aire_secundario': '1.8',
      'trampa_agua': '1.9'
    },
    'transmision-liquidos': {
      'aceite_transmicion': '2.1', // CORREGIDO
      'liquido_refrigerante': '2.2',
      'liquido_frenos': '2.3'
    },
    'frenos': {
      'pastilla_cinta_freno_a': '3.1', // CORREGIDO
      'pastilla_cinta_freno_b': '3.2', // CORREGIDO
      'pastilla_cinta_freno_c': '3.3', // CORREGIDO
      'pastilla_cinta_freno_d': '3.4'  // CORREGIDO
    },
    'motor-embrague': {
      'embrague': '4.1'
    },
    'suspension': {
      'suspencion_a': '5.1', // CORREGIDO
      'suspencion_b': '5.2', // CORREGIDO
      'suspencion_c': '5.3', // CORREGIDO
      'suspencion_d': '5.4'  // CORREGIDO
    },
    'correas': {
      'correa_distribucion': '6.1',
      'correa_alternador': '6.2',
      'correa_direccion': '6.3',
      'correa_aire_acondicionado': '6.4',
      'correa_polyv': '6.5',
      'tensor_correa': '6.6',
      'polea_tensora_correa': '6.7' // CORREGIDO
    },
    'electrico': {
      'bateria': '7.1',
      'escobillas': '7.2'
    },
    'neumaticos': {
      'neumatico_modelo_marca': '8.1',
      'neumatico_a': '8.2',
      'neumatico_b': '8.3',
      'neumatico_c': '8.4',
      'neumatico_d': '8.5',
      'neumatico_e': '8.6',
      'neumatico_f': '8.7',
      'alineacion_neumaticos': '8.8', // CORREGIDO
      'rotacion_neumaticos': '8.9'    // CORREGIDO
    }
  }

  // Función para verificar si un componente debe mostrarse
  const debeMotrarComponente = (seccionId: string, componenteKey: string): boolean => {
    if (!configuracionVehiculo?.componentes_aplicables) {
      return true // Si no hay configuración, mostrar todos
    }
    
    const numeroComponente = componenteANumero[seccionId]?.[componenteKey]
    if (!numeroComponente) {
      return true // Si no está mapeado, mostrar por defecto
    }
    
    return configuracionVehiculo.componentes_aplicables[numeroComponente] === true
  }

  // Función para filtrar campos por configuración
  const obtenerCamposFiltrados = (seccionId: string) => {
    if (!configuracionVehiculo?.componentes_aplicables) {
      return camposPorSeccion[seccionId] || []
    }
    
    return (camposPorSeccion[seccionId] || []).filter((campo) => {
      // Mapear el label del campo a su clave
      const componenteKey = mapearLabelAKey(campo.label)
      return debeMotrarComponente(seccionId, componenteKey)
    })
  }

  // Función helper para mapear labels a keys
  const mapearLabelAKey = (label: string): string => {
    const mapeo: Record<string, string> = {
      'Aceite de Motor': 'aceite_motor',
      'Filtro Aceite Motor': 'filtro_aceite_motor',
      'Filtro de Combustible': 'filtro_combustible',
      'Filtro de Aire': 'filtro_aire',
      'Filtro de Cabina': 'filtro_cabina',
      'Filtro Deshumidificador': 'filtro_deshumidificador',
      'Filtro Secador': 'filtro_secador',
      'Filtro de Aire Secundario': 'filtro_aire_secundario',
      'Trampa de Agua': 'trampa_agua',
      'Aceite de Transmisión': 'aceite_transmicion', // Nota: tabla usa 'transmicion'
      'Líquido Refrigerante': 'liquido_refrigerante',
      'Líquido de Frenos': 'liquido_frenos',
      'Pastillas/Cintas Freno A': 'pastilla_cinta_freno_a', // CORREGIDO
      'Pastillas/Cintas Freno B': 'pastilla_cinta_freno_b', // CORREGIDO
      'Pastillas/Cintas Freno C': 'pastilla_cinta_freno_c', // CORREGIDO
      'Pastillas/Cintas Freno D': 'pastilla_cinta_freno_d', // CORREGIDO
      'Embrague': 'embrague',
      'Suspensión A': 'suspencion_a', // Nota: tabla usa 'suspencion'
      'Suspensión B': 'suspencion_b', // Nota: tabla usa 'suspencion'
      'Suspensión C': 'suspencion_c', // Nota: tabla usa 'suspencion'
      'Suspensión D': 'suspencion_d', // Nota: tabla usa 'suspencion'
      'Correa de Distribución': 'correa_distribucion',
      'Correa de Alternador': 'correa_alternador',
      'Correa de Dirección': 'correa_direccion',
      'Correa de Aire Acondicionado': 'correa_aire_acondicionado',
      'Correa Poly-V': 'correa_polyv',
      'Tensor de Correa': 'tensor_correa',
      'Polea Tensora': 'polea_tensora_correa', // CORREGIDO
      'Batería': 'bateria',
      'Escobillas': 'escobillas',
      'Modelo/Marca General': 'neumatico_modelo_marca',
      'Neumático A': 'neumatico_a',
      'Neumático B': 'neumatico_b',
      'Neumático C': 'neumatico_c',
      'Neumático D': 'neumatico_d',
      'Neumático E': 'neumatico_e',
      'Neumático F': 'neumatico_f',
      'Alineación': 'alineacion_neumaticos', // CORREGIDO
      'Rotación': 'rotacion_neumaticos' // CORREGIDO
    }
    return mapeo[label] || label.toLowerCase().replace(/[^a-z0-9]/g, '_')
  }

  // Funciones para la interfaz mejorada
  const toggleComponente = (componenteKey: string) => {
    const nuevosSeleccionados = new Set(componentesSeleccionados)
    if (nuevosSeleccionados.has(componenteKey)) {
      nuevosSeleccionados.delete(componenteKey)
    } else {
      nuevosSeleccionados.add(componenteKey)
    }
    setComponentesSeleccionados(nuevosSeleccionados)
  }


  const limpiarFormularioMejorado = () => {
    setDatosGlobales({
      kilometraje: '',
      fecha: new Date().toISOString().split('T')[0],
      usarKmActual: false
    })
    setComponentesSeleccionados(new Set())
  }

  const generarDatosSeccionMejorado = () => {
    const datosGenerados: Record<string, any> = {}
    const kmFinal: number | '' = datosGlobales.usarKmActual ?
      (vehiculo?.kilometraje_actual || '') :
      (datosGlobales.kilometraje ? parseInt(datosGlobales.kilometraje) : '')

    componentesSeleccionados.forEach(componenteKey => {
      // Buscar la definición del campo en todas las secciones activas
      let definicionCampo: any = null

      // Iterar sobre todas las secciones seleccionadas
      for (const seccionId of seccionesSeleccionadas) {
        const camposDeSeccion = camposPorSeccion[seccionId] || []
        const campo = camposDeSeccion.find(campo =>
          mapearLabelAKey(campo.label) === componenteKey
        )
        if (campo) {
          definicionCampo = campo
          break
        }
      }

      // Solo generar campos que están definidos en camposPorSeccion
      if (definicionCampo) {
        // Ya no necesitamos el campo modelo

        // Kilometraje - solo si existe kmField en la definición
        if (definicionCampo.kmField && kmFinal) {
          datosGenerados[definicionCampo.kmField] = kmFinal
        }

        // Fecha - solo si existe dateField en la definición
        if (definicionCampo.dateField && datosGlobales.fecha) {
          datosGenerados[definicionCampo.dateField] = datosGlobales.fecha
        }

        // Campos especiales
        if (definicionCampo.hrField && vehiculo?.hora_actual) {
          datosGenerados[definicionCampo.hrField] = vehiculo.hora_actual
        }

        if (definicionCampo.litersField) {
          // Por ahora no tenemos interfaz para litros, pero el campo existe
          // datosGenerados[definicionCampo.litersField] = litros
        }
      }
    })

    return datosGenerados
  }

  // Generar descripción automática del trabajo (narrativa)
  const generarDescripcionAutomatica = (): string => {
    if (componentesSeleccionados.size === 0) return ''

    const componentesArray = Array.from(componentesSeleccionados)

    // Generar descripción breve basada en los componentes
    const tiposDeMantenimiento = []

    // Detectar tipos de mantenimiento según componentes
    if (componentesArray.some(key => key.includes('aceite'))) {
      tiposDeMantenimiento.push('cambio de aceites')
    }
    if (componentesArray.some(key => key.includes('filtro'))) {
      tiposDeMantenimiento.push('reemplazo de filtros')
    }
    if (componentesArray.some(key => key.includes('correa'))) {
      tiposDeMantenimiento.push('reemplazo de correas')
    }
    if (componentesArray.some(key => key.includes('pastilla') || key.includes('freno'))) {
      tiposDeMantenimiento.push('servicio de frenos')
    }
    if (componentesArray.some(key => key.includes('neumatico'))) {
      tiposDeMantenimiento.push('mantenimiento de neumáticos')
    }
    if (componentesArray.some(key => key.includes('suspencion'))) {
      tiposDeMantenimiento.push('revisión de suspensión')
    }
    if (componentesArray.some(key => key.includes('bateria') || key.includes('escobillas'))) {
      tiposDeMantenimiento.push('mantenimiento eléctrico')
    }

    if (tiposDeMantenimiento.length > 0) {
      return `Mantenimiento preventivo: ${tiposDeMantenimiento.join(', ')}`
    } else {
      return 'Mantenimiento preventivo del vehículo'
    }
  }

  // Generar items/materiales automáticamente
  const generarItemsAutomaticos = (): string => {
    if (componentesSeleccionados.size === 0) return ''

    const items: string[] = []

    componentesSeleccionados.forEach(componenteKey => {
      const labelMap: Record<string, string> = {
        'aceite_motor': 'Aceite Motor',
        'filtro_aceite_motor': 'Filtro Aceite Motor',
        'filtro_combustible': 'Filtro Combustible',
        'filtro_aire': 'Filtro Aire',
        'filtro_cabina': 'Filtro Cabina',
        'filtro_deshumidificador': 'Filtro Deshumidificador',
        'filtro_secador': 'Filtro Secador',
        'filtro_aire_secundario': 'Filtro Aire Secundario',
        'trampa_agua': 'Trampa Agua',
        'aceite_transmicion': 'Aceite Transmisión',
        'liquido_refrigerante': 'Líquido Refrigerante',
        'liquido_frenos': 'Líquido Frenos',
        'pastilla_cinta_freno_a': 'Pastillas Freno Del. Izq.',
        'pastilla_cinta_freno_b': 'Pastillas Freno Del. Der.',
        'pastilla_cinta_freno_c': 'Pastillas Freno Tras. Izq.',
        'pastilla_cinta_freno_d': 'Pastillas Freno Tras. Der.',
        'embrague': 'Embrague',
        'suspencion_a': 'Amortiguador Del. Izq.',
        'suspencion_b': 'Amortiguador Del. Der.',
        'suspencion_c': 'Amortiguador Tras. Izq.',
        'suspencion_d': 'Amortiguador Tras. Der.',
        'correa_distribucion': 'Correa Distribución',
        'correa_alternador': 'Correa Alternador',
        'correa_direccion': 'Correa Dirección',
        'correa_aire_acondicionado': 'Correa A/C',
        'correa_polyv': 'Correa Poly-V',
        'tensor_correa': 'Tensor Correa',
        'polea_tensora_correa': 'Polea Tensora',
        'bateria': 'Batería',
        'escobillas': 'Escobillas',
        'neumatico_a': 'Neumático Del. Izq.',
        'neumatico_b': 'Neumático Del. Der.',
        'neumatico_c': 'Neumático Tras. Izq.',
        'neumatico_d': 'Neumático Tras. Der.',
        'neumatico_e': 'Neumático Auxilio',
        'neumatico_f': 'Neumático Extra',
        'neumatico_modelo_marca': 'Modelo/Marca Neumáticos',
        'alineacion_neumaticos': 'Alineación Neumáticos',
        'rotacion_neumaticos': 'Rotación Neumáticos'
      }

      const nombreItem = labelMap[componenteKey] || componenteKey
      items.push(nombreItem)
    })

    return items.join(', ')
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/vehiculos" 
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Vehículos
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Registro de Servicio</h1>
              <p className="text-gray-600">Documentar trabajos realizados en el taller</p>
            </div>
            <Link
              href="/vehiculos/registro-servicio-ordenes"
              className="opacity-20 hover:opacity-100 transition-opacity duration-300 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-2 rounded-lg"
              title="Registro por Órdenes Pendientes"
            >
              📋 Órdenes
            </Link>
          </div>
        </div>

        {/* Búsqueda de Vehículo */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Buscar Vehículo</h3>
          
          <div className="space-y-4">
            <div className="flex space-x-4">
              <button
                onClick={() => setTipoBusqueda('placa')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  tipoBusqueda === 'placa'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Por Placa
              </button>
              <button
                onClick={() => setTipoBusqueda('interno')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  tipoBusqueda === 'interno'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Por Número Interno
              </button>
            </div>

            <div className="flex gap-4">
              <input
                type={tipoBusqueda === 'placa' ? 'text' : 'number'}
                value={busquedaVehiculo}
                onChange={(e) => setBusquedaVehiculo(e.target.value)}
                placeholder={tipoBusqueda === 'placa' ? 'Ej: ABC123' : 'Ej: 101'}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && buscarVehiculo()}
              />
              <button
                onClick={buscarVehiculo}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Search className="h-4 w-4" />
                {loading ? 'Buscando...' : 'Buscar'}
              </button>
            </div>
          </div>

          {/* Vehículo encontrado */}
          {vehiculo && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-semibold text-green-900">
                {vehiculo.Marca} {vehiculo.Modelo} - {vehiculo.Placa}
              </h4>
              <p className="text-green-700 text-sm">
                Número Interno: {vehiculo.Nro_Interno} | Titular: {vehiculo.Titular}
              </p>
            </div>
          )}

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              {error}
            </div>
          )}

          {success && (
            <div className="mt-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
              {success}
            </div>
          )}
        </div>

        {/* Formulario de Servicio */}
        {vehiculo && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Datos del Servicio</h3>
            
            <div className="space-y-6">
              {/* Clasificación */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Clasificación *
                </label>
                <div className="flex space-x-4">
                  {['revision', 'mantenimiento', 'reparacion'].map((tipo) => (
                    <button
                      key={tipo}
                      onClick={() => {
                        setClasificacion(tipo as any)
                        setSeccionSeleccionada(null)
                        setDatosSeccion({})
                      }}
                      className={`px-4 py-2 rounded-lg transition-colors capitalize ${
                        clasificacion === tipo
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {tipo}
                    </button>
                  ))}
                </div>
              </div>

              {/* Formularios Rápidos por Sección - Solo para Mantenimiento */}
              {clasificacion === 'mantenimiento' && (
                <div className="border-t pt-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">
                    🚀 Formulario Rápido por Sistema
                  </h4>
                  <p className="text-sm text-gray-600 mb-6">
                    Activa los sistemas en los que trabajarás - puedes seleccionar múltiples:
                  </p>

                  {/* Iconos Permanentes como Toggles */}
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
                    {secciones.map((seccion) => {
                      const IconoComponente = seccion.icono
                      const estaActiva = seccionesSeleccionadas.has(seccion.id)

                      return (
                        <button
                          key={seccion.id}
                          onClick={() => toggleSeccionMultiple(seccion.id)}
                          className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all duration-200 hover:scale-105 hover:shadow-md ${
                            estaActiva
                              ? 'border-green-500 bg-green-100 shadow-lg transform scale-105'
                              : obtenerColorSeccion(seccion.color) + ' hover:shadow-md'
                          }`}
                          title={`${seccion.nombre} - ${estaActiva ? 'Activo' : 'Inactivo'}`}
                        >
                          <IconoComponente className={`h-6 w-6 mb-2 transition-all ${
                            estaActiva ? 'text-green-700 scale-110' : ''
                          }`} />
                          <span className={`text-xs font-medium text-center leading-tight transition-all ${
                            estaActiva ? 'text-green-800 font-bold' : ''
                          }`}>
                            {seccion.nombre.split(' ').map((palabra, i) => (
                              <div key={i}>{palabra}</div>
                            ))}
                          </span>
                          {/* Indicador de estado */}
                          <div className={`mt-1 w-2 h-2 rounded-full transition-all ${
                            estaActiva ? 'bg-green-500' : 'bg-gray-300'
                          }`}></div>
                        </button>
                      )
                    })}
                  </div>

                  {/* Estado actual */}
                  {seccionesSeleccionadas.size > 0 && (
                    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-semibold text-green-800">
                            ✅ {seccionesSeleccionadas.size} Sistema{seccionesSeleccionadas.size > 1 ? 's' : ''} Activo{seccionesSeleccionadas.size > 1 ? 's' : ''}
                          </h5>
                          <p className="text-sm text-green-700">
                            {Array.from(seccionesSeleccionadas)
                              .map(id => secciones.find(s => s.id === id)?.nombre)
                              .join(', ')}
                          </p>
                        </div>
                        <button
                          onClick={() => setSeccionesSeleccionadas(new Set())}
                          className="text-sm text-green-600 hover:text-green-800 underline"
                        >
                          Limpiar todo
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Formulario de Sistemas Activos */}
                  {seccionesSeleccionadas.size > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className="flex -space-x-2">
                            {Array.from(seccionesSeleccionadas).slice(0, 3).map(seccionId => {
                              const seccion = secciones.find(s => s.id === seccionId)
                              const IconoComponente = seccion?.icono || Circle
                              return (
                                <div
                                  key={seccionId}
                                  className={`p-2 rounded-lg border-2 border-white ${obtenerColorSeccion(seccion?.color || 'gray')}`}
                                >
                                  <IconoComponente className="h-5 w-5" />
                                </div>
                              )
                            })}
                            {seccionesSeleccionadas.size > 3 && (
                              <div className="p-2 rounded-lg bg-gray-100 text-gray-600 border-2 border-white text-xs font-medium flex items-center justify-center">
                                +{seccionesSeleccionadas.size - 3}
                              </div>
                            )}
                          </div>
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900">
                              Formulario de Mantenimiento ({seccionesSeleccionadas.size} sistemas)
                            </h4>
                            <p className="text-sm text-gray-600">
                              {Array.from(seccionesSeleccionadas)
                                .map(id => secciones.find(s => s.id === id)?.nombre)
                                .join(', ')}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Datos Globales */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <h5 className="font-semibold text-blue-900 mb-3">
                          📅 Datos Globales del Servicio
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Kilometraje */}
                          <div>
                            <label className="block text-sm font-medium text-blue-800 mb-2">
                              Kilometraje
                            </label>
                            <div className="space-y-2">
                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                                  id="usar-km-actual"
                                  checked={datosGlobales.usarKmActual}
                                  onChange={(e) => setDatosGlobales(prev => ({
                                    ...prev,
                                    usarKmActual: e.target.checked
                                  }))}
                                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label htmlFor="usar-km-actual" className="ml-2 text-sm text-blue-700">
                                  Usar km actual ({vehiculo?.kilometraje_actual?.toLocaleString() || 'No registrado'})
                                </label>
                              </div>
                              {!datosGlobales.usarKmActual && (
                                <input
                                  type="number"
                                  value={datosGlobales.kilometraje}
                                  onChange={(e) => setDatosGlobales(prev => ({
                                    ...prev,
                                    kilometraje: e.target.value
                                  }))}
                                  className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  placeholder="Kilometraje del servicio"
                                />
                              )}
                            </div>
                          </div>

                          {/* Fecha */}
                          <div>
                            <label className="block text-sm font-medium text-blue-800 mb-2">
                              Fecha del Servicio
                            </label>
                            <input
                              type="date"
                              value={datosGlobales.fecha}
                              onChange={(e) => setDatosGlobales(prev => ({
                                ...prev,
                                fecha: e.target.value
                              }))}
                              className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>

                          {/* Resumen */}
                          <div className="flex items-center">
                            <div className="text-sm text-blue-700">
                              <div className="font-medium">Resumen:</div>
                              <div>Componentes: {componentesSeleccionados.size}</div>
                              <div>Fecha: {new Date(datosGlobales.fecha).toLocaleDateString()}</div>
                              <div>Km: {datosGlobales.usarKmActual ?
                                vehiculo?.kilometraje_actual?.toLocaleString() || 'N/A' :
                                (datosGlobales.kilometraje || 'No definido')}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Lista de Componentes */}
                      <div className="bg-white border border-gray-200 rounded-lg">
                        <div className="p-4 border-b border-gray-200">
                          <h5 className="font-semibold text-gray-900">
                            ☑️ Seleccionar Componentes a Cambiar
                          </h5>
                          <p className="text-sm text-gray-600 mt-1">
                            Marca los componentes que se cambiaron en este servicio
                          </p>
                        </div>
                        <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
                          {/* Mostrar componentes agrupados por sistema */}
                          {Array.from(seccionesSeleccionadas).map(seccionId => {
                            const seccion = secciones.find(s => s.id === seccionId)
                            const campos = obtenerCamposFiltrados(seccionId)
                            const IconoComponente = seccion?.icono || Circle

                            return (
                              <div key={seccionId} className="border border-gray-200 rounded-lg overflow-hidden">
                                <div className={`p-3 ${obtenerColorSeccion(seccion?.color || 'gray')} border-b`}>
                                  <div className="flex items-center gap-2">
                                    <IconoComponente className="h-5 w-5" />
                                    <h6 className="font-semibold">{seccion?.nombre}</h6>
                                    <span className="text-xs bg-white bg-opacity-30 px-2 py-1 rounded-full">
                                      {campos.length} componentes
                                    </span>
                                  </div>
                                </div>
                                <div className="p-3 space-y-2">
                                  {campos.map((campo, index) => {
                                    const componenteKey = mapearLabelAKey(campo.label)
                                    const isSelected = componentesSeleccionados.has(componenteKey)

                                    return (
                                      <div key={`${seccionId}-${index}`} className={`p-2 border rounded-lg transition-colors ${
                                        isSelected ? 'border-green-300 bg-green-50' : 'border-gray-200 hover:bg-gray-50'
                                      }`}>
                                        <div className="flex items-start space-x-3">
                                          <input
                                            type="checkbox"
                                            id={`componente-${seccionId}-${index}`}
                                            checked={isSelected}
                                            onChange={() => toggleComponente(componenteKey)}
                                            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded mt-1"
                                          />
                                          <div className="flex-1">
                                            <label htmlFor={`componente-${seccionId}-${index}`} className="cursor-pointer">
                                              <div className="font-medium text-gray-900 text-sm">{campo.label}</div>
                                            </label>
                                          </div>
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Subclasificación - Solo si no se está usando formulario rápido */}
              {!(clasificacion === 'mantenimiento' && (seccionSeleccionada || seccionesSeleccionadas.size > 0)) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subclasificación
                  </label>
                  <select
                    value={subclasificacion}
                    onChange={(e) => setSubclasificacion(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">Seleccionar sistema...</option>
                    {subclasificaciones.map((sub) => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Problemas Reportados */}
              {pendientesDisponibles.length > 0 && (
                <div className="border-t pt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    ¿Este servicio resuelve algún problema reportado? (Opcional)
                  </label>
                  
                  {loadingPendientes ? (
                    <div className="text-center py-4">
                      <div className="text-sm text-gray-500">Cargando problemas reportados...</div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="sin-pendiente"
                          name="pendiente"
                          checked={pendienteSeleccionado === null}
                          onChange={() => setPendienteSeleccionado(null)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                        />
                        <label htmlFor="sin-pendiente" className="ml-2 text-sm text-gray-700">
                          No resuelve ningún problema reportado
                        </label>
                      </div>
                      
                      {pendientesDisponibles.map((pendiente) => (
                        <div key={pendiente.id_pendiente} className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                          <input
                            type="radio"
                            id={`pendiente-${pendiente.id_pendiente}`}
                            name="pendiente"
                            checked={pendienteSeleccionado === pendiente.id_pendiente}
                            onChange={() => setPendienteSeleccionado(pendiente.id_pendiente)}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 mt-1"
                          />
                          <label htmlFor={`pendiente-${pendiente.id_pendiente}`} className="flex-1 cursor-pointer">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium ${
                                pendiente.prioridad === 'critico' ? 'bg-red-100 text-red-800' :
                                pendiente.prioridad === 'medio' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {pendiente.clasificacion}
                              </span>
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                pendiente.prioridad === 'critico' ? 'bg-red-100 text-red-800' :
                                pendiente.prioridad === 'medio' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {pendiente.prioridad === 'critico' ? '🔴 Crítico' :
                                 pendiente.prioridad === 'medio' ? '🟡 Medio' :
                                 '🟢 Leve'}
                              </span>
                              {pendiente.tiempo_estimado && (
                                <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                  ~{pendiente.tiempo_estimado}h
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-900 font-medium">{pendiente.descripcion}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Reportado el {new Date(pendiente.fecha_creacion).toLocaleDateString()}
                            </p>
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Kilometraje al Servicio - Solo mostrar si NO se está usando formulario rápido */}
              {!(clasificacion === 'mantenimiento' && (seccionSeleccionada || seccionesSeleccionadas.size > 0)) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kilometraje al Momento del Servicio
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={kilometrajeServicio}
                      onChange={(e) => setKilometrajeServicio(e.target.value ? parseInt(e.target.value) : '')}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder={`Kilometraje actual: ${vehiculo?.kilometraje_actual?.toLocaleString() || 'No registrado'}`}
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 text-sm">km</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Ingresa el kilometraje actual que muestra el odómetro del vehículo
                  </p>
                </div>
              )}
              
              {/* Mostrar kilometraje automático cuando se usa formulario rápido */}
              {clasificacion === 'mantenimiento' && (seccionSeleccionada || seccionesSeleccionadas.size > 0) && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-green-800 mb-2">
                    ✅ Kilometraje del Servicio (Automático)
                  </h4>
                  <p className="text-green-700">
                    <span className="font-semibold">
                      {datosGlobales.usarKmActual ? 
                        `${vehiculo?.kilometraje_actual?.toLocaleString() || 'No definido'} km (actual del vehículo)` :
                        `${datosGlobales.kilometraje || 'No definido'} km (ingresado)`
                      }
                    </span>
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Se toma automáticamente de los datos globales del formulario rápido
                  </p>
                </div>
              )}

              {/* Descripción */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Descripción del Trabajo *
                  </label>
                  {clasificacion === 'mantenimiento' && seccionesSeleccionadas.size > 0 && componentesSeleccionados.size > 0 && (
                    <div className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                      ✨ Se actualiza automáticamente
                    </div>
                  )}
                </div>
                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder={
                    clasificacion === 'mantenimiento' && seccionesSeleccionadas.size > 0 ?
                      "Se actualiza automáticamente según componentes seleccionados..." :
                      "Describir detalladamente el trabajo realizado..."
                  }
                />
                {clasificacion === 'mantenimiento' && (seccionSeleccionada || seccionesSeleccionadas.size > 0) && (
                  <p className="text-xs text-blue-600 mt-1">
                    ✨ Se genera automáticamente. Puedes editarlo si necesitas agregar más detalles.
                  </p>
                )}
              </div>

              {/* Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Items Utilizados
                  </label>
                  {clasificacion === 'mantenimiento' && seccionesSeleccionadas.size > 0 && componentesSeleccionados.size > 0 && (
                    <div className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                      ✨ Se actualiza automáticamente
                    </div>
                  )}
                </div>
                <textarea
                  value={items}
                  onChange={(e) => setItems(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder={
                    clasificacion === 'mantenimiento' && seccionesSeleccionadas.size > 0 ?
                      "Se actualiza automáticamente: Filtro Aire Mann C123, Aceite Motor Mobil 1..." :
                      "Listar los items y repuestos utilizados..."
                  }
                />
                {clasificacion === 'mantenimiento' && (seccionSeleccionada || seccionesSeleccionadas.size > 0) && (
                  <p className="text-xs text-green-600 mt-1">
                    ✨ Se genera automáticamente desde los modelos ingresados. Puedes agregar más items.
                  </p>
                )}
              </div>

              {/* Órdenes de Compra */}
              {totalOrdenes > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Órdenes de Compra Relacionadas
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-green-600 bg-green-50 px-2 py-1 rounded">
                        {ordenesDisponibles.length} disponibles
                      </span>
                      {totalOrdenes > ordenesDisponibles.length && (
                        <span className="text-sm text-gray-500 bg-gray-50 px-2 py-1 rounded">
                          {totalOrdenes - ordenesDisponibles.length} ya utilizadas
                        </span>
                      )}
                    </div>
                  </div>
                  {ordenesDisponibles.length > 0 ? (
                    <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-4">
                      {ordenesDisponibles.map((orden) => (
                      <div key={orden.id} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`orden-${orden.id}`}
                          checked={ordenesSeleccionadas.includes(orden.id)}
                          onChange={() => toggleOrden(orden.id)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label htmlFor={`orden-${orden.id}`} className="ml-3 flex-1 cursor-pointer">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-medium text-gray-900">{orden.codigo_oc}</span>
                              <span className="text-gray-500 ml-2">{orden.proveedor}</span>
                            </div>
                            <div className="text-sm text-blue-600 font-medium">
                              ${orden.monto_vehiculo?.toLocaleString()} {orden.moneda}
                            </div>
                          </div>
                          <div className="text-sm text-gray-600 truncate">{orden.items}</div>
                        </label>
                      </div>
                      ))}
                    </div>
                  ) : (
                    <div className="border border-gray-200 rounded-lg p-4 text-center text-gray-500">
                      <p>📋 Todas las órdenes de compra de este vehículo ya han sido utilizadas en servicios anteriores.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Botón Guardar */}
              <div className="flex justify-end pt-6 border-t">
                <button
                  onClick={guardarServicio}
                  disabled={saving || !descripcion.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Save className="h-4 w-4" />
                  {saving ? 'Guardando...' : 'Guardar Servicio'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}