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
  const [datosSeccion, setDatosSeccion] = useState<Record<string, any>>({})

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

      const { error } = await supabase
        .from('historial')
        .insert({
          id: vehiculo.id,
          clasificacion,
          subclasificacion: subclasificacion || null,
          descripcion: descripcion.trim(),
          items: items.trim() || null,
          kilometraje_al_servicio: kilometrajeServicio || null,
          problema_reportado_por: problemaReportadoPor,
          ocs_vehiculos: ocsVehiculosJson,
          fecha_servicio: new Date().toISOString().split('T')[0] // Fecha actual
        })

      if (error) throw error

      // Actualizar campos específicos del vehículo si hay datos de sección
      if (Object.keys(datosSeccion).length > 0) {
        const actualizacionesVehiculo: any = {}
        
        // Procesar cada campo de la sección
        Object.entries(datosSeccion).forEach(([campo, valor]) => {
          if (valor !== '' && valor !== null && valor !== undefined) {
            actualizacionesVehiculo[campo] = valor
          }
        })
        
        // Si hay actualizaciones, aplicarlas al vehículo
        if (Object.keys(actualizacionesVehiculo).length > 0) {
          const { error: errorVehiculo } = await supabase
            .from('vehiculos')
            .update(actualizacionesVehiculo)
            .eq('id', vehiculo.id)
          
          if (errorVehiculo) {
            console.error('Error actualizando datos del vehículo:', errorVehiculo)
            // No fallar el guardado por esto, pero informar al usuario
          }
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
      setDatosSeccion({})
      
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

  const volverASeecciones = () => {
    setSeccionSeleccionada(null)
    setDatosSeccion({})
  }

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
      'aceite_transmision': '2.1',
      'liquido_refrigerante': '2.2',
      'liquido_frenos': '2.3'
    },
    'frenos': {
      'pastillas_freno_a': '3.1',
      'pastillas_freno_b': '3.2',
      'pastillas_freno_c': '3.3',
      'pastillas_freno_d': '3.4'
    },
    'motor-embrague': {
      'embrague': '4.1'
    },
    'suspension': {
      'suspension_a': '5.1',
      'suspension_b': '5.2',
      'suspension_c': '5.3',
      'suspension_d': '5.4'
    },
    'correas': {
      'correa_distribucion': '6.1',
      'correa_alternador': '6.2',
      'correa_direccion': '6.3',
      'correa_aire_acondicionado': '6.4',
      'correa_polyv': '6.5',
      'tensor_correa': '6.6',
      'polea_tensora': '6.7'
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
      'alineacion': '8.8',
      'rotacion': '8.9'
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
      'Aceite de Transmisión': 'aceite_transmision',
      'Líquido Refrigerante': 'liquido_refrigerante',
      'Líquido de Frenos': 'liquido_frenos',
      'Pastillas/Cintas Freno A': 'pastillas_freno_a',
      'Pastillas/Cintas Freno B': 'pastillas_freno_b',
      'Pastillas/Cintas Freno C': 'pastillas_freno_c',
      'Pastillas/Cintas Freno D': 'pastillas_freno_d',
      'Embrague': 'embrague',
      'Suspensión A': 'suspension_a',
      'Suspensión B': 'suspension_b',
      'Suspensión C': 'suspension_c',
      'Suspensión D': 'suspension_d',
      'Correa de Distribución': 'correa_distribucion',
      'Correa de Alternador': 'correa_alternador',
      'Correa de Dirección': 'correa_direccion',
      'Correa de Aire Acondicionado': 'correa_aire_acondicionado',
      'Correa Poly-V': 'correa_polyv',
      'Tensor de Correa': 'tensor_correa',
      'Polea Tensora': 'polea_tensora',
      'Batería': 'bateria',
      'Escobillas': 'escobillas',
      'Modelo/Marca General': 'neumatico_modelo_marca',
      'Neumático A': 'neumatico_a',
      'Neumático B': 'neumatico_b',
      'Neumático C': 'neumatico_c',
      'Neumático D': 'neumatico_d',
      'Neumático E': 'neumatico_e',
      'Neumático F': 'neumatico_f',
      'Alineación': 'alineacion',
      'Rotación': 'rotacion'
    }
    return mapeo[label] || label.toLowerCase().replace(/[^a-z0-9]/g, '_')
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Registro de Servicio</h1>
          <p className="text-gray-600">Documentar trabajos realizados en el taller</p>
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
                  {!seccionSeleccionada ? (
                    // Selección de Sección
                    <>
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">
                        🚀 Formulario Rápido por Sistema
                      </h4>
                      <p className="text-sm text-gray-600 mb-6">
                        Selecciona el sistema del vehículo para un formulario especializado:
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
                        {secciones.map((seccion) => {
                          const IconoComponente = seccion.icono
                          return (
                            <button
                              key={seccion.id}
                              onClick={() => seleccionarSeccion(seccion.id)}
                              className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all duration-200 hover:scale-105 hover:shadow-md ${
                                obtenerColorSeccion(seccion.color)
                              }`}
                              title={seccion.nombre}
                            >
                              <IconoComponente className="h-6 w-6 mb-2" />
                              <span className="text-xs font-medium text-center leading-tight">
                                {seccion.nombre.split(' ').map((palabra, i) => (
                                  <div key={i}>{palabra}</div>
                                ))}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                          💡 <strong>Ventaja:</strong> Al usar estos formularios, los datos del vehículo se actualizarán automáticamente
                        </p>
                        {configuracionVehiculo && (
                          <p className="text-xs text-blue-600 mt-2">
                            🔧 <strong>Configuración activa:</strong> {configuracionVehiculo.nombre_configuracion}
                            <br />
                            Solo se muestran los componentes relevantes para este tipo de vehículo
                          </p>
                        )}
                      </div>
                    </>
                  ) : (
                    // Formulario de Sección Específica
                    <div>
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          {(() => {
                            const seccion = secciones.find(s => s.id === seccionSeleccionada)
                            const IconoComponente = seccion?.icono || Circle
                            return (
                              <>
                                <div className={`p-2 rounded-lg ${obtenerColorSeccion(seccion?.color || 'gray')}`}>
                                  <IconoComponente className="h-6 w-6" />
                                </div>
                                <div>
                                  <h4 className="text-lg font-semibold text-gray-900">
                                    {seccion?.nombre}
                                  </h4>
                                  <p className="text-sm text-gray-600">
                                    Formulario especializado para este sistema
                                  </p>
                                </div>
                              </>
                            )
                          })()} 
                        </div>
                        <button
                          onClick={volverASeecciones}
                          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                        >
                          ← Volver a Secciones
                        </button>
                      </div>

                      {/* Campos dinámicos de la sección - FILTRADOS por configuración */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        {obtenerCamposFiltrados(seccionSeleccionada).map((campo, index) => (
                          <div key={index} className="space-y-3">
                            <h5 className="font-medium text-gray-900 border-b pb-1">
                              {campo.label}
                            </h5>
                            
                            {/* Kilometraje */}
                            {campo.kmField && (
                              <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">
                                  Kilometraje
                                </label>
                                <input
                                  type="number"
                                  value={datosSeccion[campo.kmField] || ''}
                                  onChange={(e) => actualizarDatoSeccion(campo.kmField, e.target.value ? parseInt(e.target.value) : '')}
                                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                  placeholder="Km del servicio"
                                />
                              </div>
                            )}
                            
                            {/* Fecha */}
                            {campo.dateField && (
                              <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">
                                  Fecha
                                </label>
                                <input
                                  type="date"
                                  value={datosSeccion[campo.dateField] || new Date().toISOString().split('T')[0]}
                                  onChange={(e) => actualizarDatoSeccion(campo.dateField, e.target.value)}
                                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                              </div>
                            )}
                            
                            {/* Modelo/Marca */}
                            {campo.modelField && (
                              <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">
                                  Modelo/Marca
                                </label>
                                <input
                                  type="text"
                                  value={datosSeccion[campo.modelField] || ''}
                                  onChange={(e) => actualizarDatoSeccion(campo.modelField, e.target.value)}
                                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                  placeholder="Marca y modelo del repuesto"
                                />
                              </div>
                            )}
                            
                            {/* Litros */}
                            {campo.litersField && (
                              <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">
                                  Litros
                                </label>
                                <input
                                  type="number"
                                  step="0.1"
                                  value={datosSeccion[campo.litersField] || ''}
                                  onChange={(e) => actualizarDatoSeccion(campo.litersField, e.target.value ? parseFloat(e.target.value) : '')}
                                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                  placeholder="Cantidad en litros"
                                />
                              </div>
                            )}
                            
                            {/* Horas */}
                            {campo.hrField && (
                              <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">
                                  Horas
                                </label>
                                <input
                                  type="number"
                                  value={datosSeccion[campo.hrField] || ''}
                                  onChange={(e) => actualizarDatoSeccion(campo.hrField, e.target.value ? parseInt(e.target.value) : '')}
                                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                  placeholder="Horas de motor"
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Subclasificación - Solo si no se está usando formulario rápido */}
              {!(clasificacion === 'mantenimiento' && seccionSeleccionada) && (
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

              {/* Kilometraje al Servicio */}
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

              {/* Descripción */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción del Trabajo *
                </label>
                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Describir detalladamente el trabajo realizado..."
                />
              </div>

              {/* Items */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Items Utilizados
                </label>
                <textarea
                  value={items}
                  onChange={(e) => setItems(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Listar los items y repuestos utilizados..."
                />
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