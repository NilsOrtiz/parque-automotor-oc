'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase, type Vehiculo } from '@/lib/supabase'
import { ArrowLeft, Search, Save, AlertCircle, Package, Truck, Clock, CheckCircle2, ArrowRight, Droplets, Settings, Disc, Cog, Wrench, Zap, Circle } from 'lucide-react'

interface OrdenPendiente {
  id: number
  codigo_oc: string
  fecha: string
  placa: string
  interno?: number
  modelo?: string
  titular?: string
  proveedor?: string
  items?: string
  monto_vehiculo?: number
  moneda?: string
  es_emergencia?: boolean
  vehiculo?: Vehiculo
}

export default function RegistroServicioOrdenesPage() {
  const [ordenesPendientes, setOrdenesPendientes] = useState<OrdenPendiente[]>([])
  const [loading, setLoading] = useState(true)
  const [ordenesSeleccionadas, setOrdenesSeleccionadas] = useState<OrdenPendiente[]>([])
  const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState<Vehiculo | null>(null)
  const [filtroTexto, setFiltroTexto] = useState('')
  const [filtroEmergencia, setFiltroEmergencia] = useState<'todas' | 'emergencia' | 'normal'>('todas')

  // Formulario de servicio
  const [clasificacion, setClasificacion] = useState<'revision' | 'mantenimiento' | 'reparacion'>('mantenimiento')
  const [subclasificacion, setSubclasificacion] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [items, setItems] = useState('')
  const [kilometrajeServicio, setKilometrajeServicio] = useState<number | ''>('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Estados para formularios rápidos por sección (toggles)
  const [seccionesSeleccionadas, setSeccionesSeleccionadas] = useState<Set<string>>(new Set())
  const [componentesSeleccionados, setComponentesSeleccionados] = useState<Set<string>>(new Set())

  // Estados para datos globales
  const [datosGlobales, setDatosGlobales] = useState({
    kilometraje: '',
    fecha: new Date().toISOString().split('T')[0],
    usarKmActual: false
  })

  // Configuración de secciones con iconos
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

  // Configuración de campos por sección
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

  useEffect(() => {
    cargarOrdenesPendientes()
  }, [])

  // Actualizar descripción e items automáticamente cuando cambian los componentes
  useEffect(() => {
    if (clasificacion === 'mantenimiento' && seccionesSeleccionadas.size > 0) {
      // Actualizar en tiempo real cuando se usa formulario rápido
      if (componentesSeleccionados.size > 0) {
        // Mantener información de órdenes y generar descripción con componentes
        const codigosOC = ordenesSeleccionadas.map(o => o.codigo_oc).join(', ')
        const proveedoresUnicos = [...new Set(ordenesSeleccionadas.map(o => o.proveedor).filter(Boolean))]
        const proveedoresTexto = proveedoresUnicos.join(', ')

        const descripcionNarrativa = generarDescripcionTrabajoOrdenes(codigosOC, proveedoresTexto)
        const itemsComponentes = generarItemsAutomaticos()

        setDescripcion(descripcionNarrativa)
        setItems(itemsComponentes)
      }
    }
  }, [componentesSeleccionados, seccionesSeleccionadas, clasificacion, ordenesSeleccionadas])

  async function cargarOrdenesPendientes() {
    setLoading(true)
    try {
      // Obtener todas las órdenes por vehículo
      const { data: todasLasOrdenes, error: errorOrdenes } = await supabase
        .from('ordenes_de_compra_por_vehiculo')
        .select('*')
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

      // Filtrar órdenes pendientes
      const pendientes = (todasLasOrdenes || []).filter(orden =>
        !ordenesUtilizadas.has(orden.id)
      )

      // Obtener placas únicas para evitar consultas duplicadas
      const placasUnicas = [...new Set(pendientes.map(orden => orden.placa))]

      // Cargar datos de vehículos en una sola consulta por lotes
      const { data: vehiculos, error: errorVehiculos } = await supabase
        .from('vehiculos')
        .select('*')
        .in('Placa', placasUnicas)

      if (errorVehiculos) {
        console.error('Error cargando vehículos:', errorVehiculos)
      }

      // Crear mapa de vehículos por placa para acceso rápido
      const vehiculosPorPlaca = new Map()
      if (vehiculos) {
        vehiculos.forEach(vehiculo => {
          vehiculosPorPlaca.set(vehiculo.Placa, vehiculo)
        })
      }

      // Asociar cada orden con su vehículo correspondiente
      const ordenesConVehiculos = pendientes.map((orden) => {
        const vehiculo = vehiculosPorPlaca.get(orden.placa)
        return {
          ...orden,
          vehiculo: vehiculo || undefined
        }
      })

      setOrdenesPendientes(ordenesConVehiculos)
    } catch (error) {
      console.error('Error cargando órdenes pendientes:', error)
      setError('Error al cargar las órdenes pendientes')
    } finally {
      setLoading(false)
    }
  }

  function seleccionarOrden(orden: OrdenPendiente) {
    // Si es la primera orden o es del mismo vehículo, agregar a la selección
    if (ordenesSeleccionadas.length === 0 || ordenesSeleccionadas[0].placa === orden.placa) {
      // Verificar si ya está seleccionada
      if (ordenesSeleccionadas.some(o => o.id === orden.id)) {
        // Deseleccionar
        const nuevasSeleccionadas = ordenesSeleccionadas.filter(o => o.id !== orden.id)
        setOrdenesSeleccionadas(nuevasSeleccionadas)

        // Si queda vacío, limpiar vehículo
        if (nuevasSeleccionadas.length === 0) {
          setVehiculoSeleccionado(null)
          limpiarFormulario()
        } else {
          // Actualizar formulario con las órdenes restantes
          actualizarFormularioConOrdenes(nuevasSeleccionadas)
        }
      } else {
        // Seleccionar nueva orden
        const nuevasSeleccionadas = [...ordenesSeleccionadas, orden]
        setOrdenesSeleccionadas(nuevasSeleccionadas)
        setVehiculoSeleccionado(orden.vehiculo || null)
        actualizarFormularioConOrdenes(nuevasSeleccionadas)
      }
    } else {
      // Si es de otro vehículo, empezar nueva selección
      setOrdenesSeleccionadas([orden])
      setVehiculoSeleccionado(orden.vehiculo || null)
      actualizarFormularioConOrdenes([orden])
    }

    // Limpiar mensajes
    setError('')
    setSuccess('')
  }

  function actualizarFormularioConOrdenes(ordenes: OrdenPendiente[]) {
    if (ordenes.length === 0) return

    // Generar descripción combinada
    const codigosOC = ordenes.map(o => o.codigo_oc).join(', ')
    const proveedoresUnicos = [...new Set(ordenes.map(o => o.proveedor).filter(Boolean))]
    const proveedoresTexto = proveedoresUnicos.join(', ')

    setSubclasificacion('Documentación')
    setDescripcion(`Servicio realizado según OCs: ${codigosOC} - Proveedores: ${proveedoresTexto}`)

    // Combinar todos los items
    const todosLosItems = ordenes
      .map(o => o.items || '')
      .filter(Boolean)
      .join(', ')
    setItems(todosLosItems)

    setKilometrajeServicio(ordenes[0].vehiculo?.kilometraje_actual || '')
  }

  function obtenerOrdenesDelMismoVehiculo(placaVehiculo: string): OrdenPendiente[] {
    return ordenesPendientes.filter(orden => orden.placa === placaVehiculo)
  }

  async function guardarServicio() {
    if (ordenesSeleccionadas.length === 0 || !vehiculoSeleccionado) return

    if (!descripcion.trim()) {
      setError('La descripción es obligatoria')
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      // Obtener IDs de todas las órdenes seleccionadas
      const idsOrdenesSeleccionadas = ordenesSeleccionadas.map(o => o.id)

      // Determinar kilometraje (desde formulario rápido o campo manual)
      let kilometrajeFinal: number | '' = kilometrajeServicio
      if (clasificacion === 'mantenimiento' && seccionesSeleccionadas.size > 0) {
        const kmGlobal = datosGlobales.usarKmActual ?
          (vehiculoSeleccionado.kilometraje_actual || '') :
          (datosGlobales.kilometraje ? parseInt(datosGlobales.kilometraje) : '')
        kilometrajeFinal = kmGlobal
      }

      // Registrar en historial
      const { error: errorHistorial } = await supabase
        .from('historial')
        .insert({
          id: vehiculoSeleccionado.id,
          clasificacion,
          subclasificacion: subclasificacion || null,
          descripcion: descripcion.trim(),
          items: items.trim() || null,
          kilometraje_al_servicio: kilometrajeFinal || null,
          problema_reportado_por: 'mecanico',
          ocs_vehiculos: JSON.stringify(idsOrdenesSeleccionadas),
          fecha_servicio: new Date().toISOString().split('T')[0]
        })

      if (errorHistorial) throw errorHistorial

      // Actualizar campos específicos del vehículo si se usó formulario rápido
      if (componentesSeleccionados.size > 0) {
        const actualizacionesVehiculo = generarDatosComponentes()

        if (Object.keys(actualizacionesVehiculo).length > 0) {
          console.log('Datos a actualizar en vehículo:', actualizacionesVehiculo)

          const { error: errorVehiculo } = await supabase
            .from('vehiculos')
            .update(actualizacionesVehiculo)
            .eq('id', vehiculoSeleccionado.id)

          if (errorVehiculo) {
            console.error('Error actualizando datos del vehículo:', errorVehiculo)
            console.error('Campos que intentamos actualizar:', Object.keys(actualizacionesVehiculo))
            setError(`Error actualizando vehículo: ${errorVehiculo.message}. Campos: ${Object.keys(actualizacionesVehiculo).join(', ')}`)
            return // Detener el proceso si hay error en la actualización
          }
        }
      }

      const codigosOC = ordenesSeleccionadas.map(o => o.codigo_oc).join(', ')
      const cantidadOrdenes = ordenesSeleccionadas.length
      setSuccess(`Servicio registrado correctamente para ${cantidadOrdenes} órden${cantidadOrdenes > 1 ? 'es' : ''}: ${codigosOC}`)

      // Limpiar formulario y recargar órdenes
      limpiarFormulario()
      await cargarOrdenesPendientes()

    } catch (error) {
      console.error('Error guardando servicio:', error)
      setError('Error al guardar el servicio')
    } finally {
      setSaving(false)
    }
  }

  function limpiarFormulario() {
    setOrdenesSeleccionadas([])
    setVehiculoSeleccionado(null)
    setClasificacion('mantenimiento')
    setSubclasificacion('')
    setDescripcion('')
    setItems('')
    setKilometrajeServicio('')
    // Limpiar datos de formulario rápido
    setSeccionesSeleccionadas(new Set())
    setComponentesSeleccionados(new Set())
    setDatosGlobales({
      kilometraje: '',
      fecha: new Date().toISOString().split('T')[0],
      usarKmActual: false
    })
  }

  // Funciones para interfaz de toggles
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
    }
  }

  const toggleComponente = (componenteKey: string) => {
    const nuevosSeleccionados = new Set(componentesSeleccionados)
    if (nuevosSeleccionados.has(componenteKey)) {
      nuevosSeleccionados.delete(componenteKey)
    } else {
      nuevosSeleccionados.add(componenteKey)
    }
    setComponentesSeleccionados(nuevosSeleccionados)
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
      'Aceite de Transmisión': 'aceite_transmicion',
      'Líquido Refrigerante': 'liquido_refrigerante',
      'Líquido de Frenos': 'liquido_frenos',
      'Pastillas/Cintas Freno A': 'pastilla_cinta_freno_a',
      'Pastillas/Cintas Freno B': 'pastilla_cinta_freno_b',
      'Pastillas/Cintas Freno C': 'pastilla_cinta_freno_c',
      'Pastillas/Cintas Freno D': 'pastilla_cinta_freno_d',
      'Embrague': 'embrague',
      'Suspensión A': 'suspencion_a',
      'Suspensión B': 'suspencion_b',
      'Suspensión C': 'suspencion_c',
      'Suspensión D': 'suspencion_d',
      'Correa de Distribución': 'correa_distribucion',
      'Correa de Alternador': 'correa_alternador',
      'Correa de Dirección': 'correa_direccion',
      'Correa de Aire Acondicionado': 'correa_aire_acondicionado',
      'Correa Poly-V': 'correa_polyv',
      'Tensor de Correa': 'tensor_correa',
      'Polea Tensora': 'polea_tensora_correa',
      'Batería': 'bateria',
      'Escobillas': 'escobillas',
      'Modelo/Marca General': 'neumatico_modelo_marca',
      'Neumático A': 'neumatico_a',
      'Neumático B': 'neumatico_b',
      'Neumático C': 'neumatico_c',
      'Neumático D': 'neumatico_d',
      'Neumático E': 'neumatico_e',
      'Neumático F': 'neumatico_f',
      'Alineación': 'alineacion_neumaticos',
      'Rotación': 'rotacion_neumaticos'
    }
    return mapeo[label] || label.toLowerCase().replace(/[^a-z0-9]/g, '_')
  }

  // Función para filtrar campos por configuración
  const obtenerCamposFiltrados = (seccionId: string) => {
    return camposPorSeccion[seccionId] || []
  }

  // Generar datos de componentes para actualizar vehículo
  const generarDatosComponentes = () => {
    const datosGenerados: Record<string, any> = {}
    const kmFinal: number | '' = datosGlobales.usarKmActual ?
      (vehiculoSeleccionado?.kilometraje_actual || '') :
      (datosGlobales.kilometraje ? parseInt(datosGlobales.kilometraje) : '')

    componentesSeleccionados.forEach(componenteKey => {
      const modelo = modelosComponentes[componenteKey] || ''

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
        // Modelo - solo si existe modelField en la definición
        if (definicionCampo.modelField && modelo) {
          datosGenerados[definicionCampo.modelField] = modelo
        }

        // Kilometraje - solo si existe kmField en la definición
        if (definicionCampo.kmField && kmFinal) {
          datosGenerados[definicionCampo.kmField] = kmFinal
        }

        // Fecha - solo si existe dateField en la definición
        if (definicionCampo.dateField && datosGlobales.fecha) {
          datosGenerados[definicionCampo.dateField] = datosGlobales.fecha
        }

        // Campos especiales
        if (definicionCampo.hrField && vehiculoSeleccionado?.hora_actual) {
          datosGenerados[definicionCampo.hrField] = vehiculoSeleccionado.hora_actual
        }
      }
    })

    return datosGenerados
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

  // Generar descripción narrativa del trabajo para modo órdenes
  const generarDescripcionTrabajoOrdenes = (codigosOC: string, proveedoresTexto: string): string => {
    if (componentesSeleccionados.size === 0) return `Servicio realizado según OCs: ${codigosOC} - Proveedores: ${proveedoresTexto}`

    const sistemasActivos = Array.from(seccionesSeleccionadas)
      .map(id => secciones.find(s => s.id === id)?.nombre)
      .filter(Boolean)

    const componentesArray = Array.from(componentesSeleccionados)

    // Obtener kilometraje para contexto
    const kmFinal: number | '' = datosGlobales.usarKmActual ?
      (vehiculoSeleccionado?.kilometraje_actual || '') :
      (datosGlobales.kilometraje ? parseInt(datosGlobales.kilometraje) : '')

    // Generar descripción narrativa del trabajo
    let descripcion = `Servicio realizado según órdenes de compra ${codigosOC} de ${proveedoresTexto}. `

    if (sistemasActivos.length === 1) {
      descripcion += `Se realizó mantenimiento preventivo del sistema de ${sistemasActivos[0].toLowerCase()}`
    } else if (sistemasActivos.length > 1) {
      descripcion += `Se realizó mantenimiento preventivo de múltiples sistemas: ${sistemasActivos.join(', ').toLowerCase()}`
    } else {
      descripcion += 'Se realizó mantenimiento preventivo del vehículo'
    }

    // Agregar detalles de los componentes
    if (componentesArray.length > 0) {
      const tiposDeMantenimiento = []

      // Detectar tipos de mantenimiento según componentes
      if (componentesArray.some(key => key.includes('aceite'))) {
        tiposDeMantenimiento.push('cambio de aceites')
      }
      if (componentesArray.some(key => key.includes('filtro'))) {
        tiposDeMantenimiento.push('reemplazo de filtros')
      }
      if (componentesArray.some(key => key.includes('correa'))) {
        tiposDeMantenimiento.push('inspección y reemplazo de correas')
      }
      if (componentesArray.some(key => key.includes('pastilla') || key.includes('freno'))) {
        tiposDeMantenimiento.push('servicio del sistema de frenos')
      }
      if (componentesArray.some(key => key.includes('neumatico'))) {
        tiposDeMantenimiento.push('mantenimiento de neumáticos')
      }
      if (componentesArray.some(key => key.includes('suspencion'))) {
        tiposDeMantenimiento.push('revisión de la suspensión')
      }
      if (componentesArray.some(key => key.includes('bateria') || key.includes('escobillas'))) {
        tiposDeMantenimiento.push('mantenimiento del sistema eléctrico')
      }

      if (tiposDeMantenimiento.length > 0) {
        descripcion += ` incluyendo ${tiposDeMantenimiento.join(', ')}`
      }
    }

    // Agregar información de contexto
    if (kmFinal) {
      descripcion += `. Trabajo realizado a los ${kmFinal.toLocaleString()} kilómetros`
    }

    if (vehiculoSeleccionado) {
      descripcion += ` en vehículo ${vehiculoSeleccionado.Marca} ${vehiculoSeleccionado.Modelo} placa ${vehiculoSeleccionado.Placa}`
    }

    descripcion += '. Todos los componentes fueron inspeccionados y reemplazados según especificaciones técnicas del fabricante.'

    return descripcion
  }

  const ordenesFiltradas = ordenesPendientes.filter(orden => {
    const coincideTexto = !filtroTexto ||
      orden.codigo_oc.toLowerCase().includes(filtroTexto.toLowerCase()) ||
      orden.placa.toLowerCase().includes(filtroTexto.toLowerCase()) ||
      orden.proveedor?.toLowerCase().includes(filtroTexto.toLowerCase()) ||
      orden.items?.toLowerCase().includes(filtroTexto.toLowerCase())

    const coincideEmergencia = filtroEmergencia === 'todas' ||
      (filtroEmergencia === 'emergencia' && orden.es_emergencia) ||
      (filtroEmergencia === 'normal' && !orden.es_emergencia)

    return coincideTexto && coincideEmergencia
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Cargando órdenes pendientes...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <Link
            href="/vehiculos/registro-servicio"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Registro Normal
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Registro por Órdenes Pendientes</h1>
              <p className="text-gray-600">Registrar servicios para órdenes de compra no utilizadas</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">{ordenesFiltradas.length}</div>
              <div className="text-sm text-gray-500">órdenes pendientes</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-200px)]">

          {/* Panel Izquierdo - Lista de Órdenes */}
          <div className="bg-white rounded-lg shadow-md flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Package className="h-5 w-5 mr-2 text-blue-600" />
                  Órdenes Sin Registrar
                </h2>
                <div className="flex items-center gap-2">
                  <select
                    value={filtroEmergencia}
                    onChange={(e) => setFiltroEmergencia(e.target.value as any)}
                    className="text-sm border border-gray-300 rounded px-2 py-1"
                  >
                    <option value="todas">Todas</option>
                    <option value="emergencia">🚨 Emergencias</option>
                    <option value="normal">📋 Normales</option>
                  </select>
                </div>
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={filtroTexto}
                  onChange={(e) => setFiltroTexto(e.target.value)}
                  placeholder="Buscar por código, placa, proveedor..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Search className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {ordenesFiltradas.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {ordenesFiltradas.map((orden) => {
                    const estaSeleccionada = ordenesSeleccionadas.some(o => o.id === orden.id)
                    const haySeleccionDeOtroVehiculo = ordenesSeleccionadas.length > 0 && ordenesSeleccionadas[0].placa !== orden.placa
                    const ordenesDelMismoVehiculo = obtenerOrdenesDelMismoVehiculo(orden.placa)
                    const tieneMultiplesOrdenes = ordenesDelMismoVehiculo.length > 1

                    return (
                      <div
                        key={orden.id}
                        onClick={() => seleccionarOrden(orden)}
                        className={`p-4 cursor-pointer transition-colors relative ${
                          estaSeleccionada
                            ? 'bg-green-100 border-r-4 border-green-500'
                            : haySeleccionDeOtroVehiculo
                              ? 'bg-gray-50 opacity-50 cursor-not-allowed'
                              : 'hover:bg-blue-50'
                        } ${tieneMultiplesOrdenes && !haySeleccionDeOtroVehiculo ? 'border-l-4 border-l-orange-300' : ''}`}
                        title={haySeleccionDeOtroVehiculo ? 'Selecciona primero las órdenes del vehículo actual' : ''}
                      >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-gray-900">{orden.codigo_oc}</span>
                            {orden.es_emergencia && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                🚨 Emergencia
                              </span>
                            )}
                            <span className="text-xs text-gray-500">
                              {new Date(orden.fecha).toLocaleDateString()}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 mb-2">
                            <div className="flex items-center text-sm text-gray-600">
                              <Truck className="h-4 w-4 mr-1" />
                              {orden.placa}
                              {orden.interno && <span className="ml-1">#{orden.interno}</span>}
                            </div>
                            {orden.vehiculo && (
                              <div className="text-sm text-gray-500">
                                {orden.vehiculo.Marca} {orden.vehiculo.Modelo}
                              </div>
                            )}
                          </div>

                          <div className="text-sm text-gray-700 mb-1">
                            <strong>Proveedor:</strong> {orden.proveedor}
                          </div>

                          {orden.items && (
                            <div className="text-sm text-gray-600 truncate">
                              <strong>Items:</strong> {orden.items}
                            </div>
                          )}

                          {orden.monto_vehiculo && (
                            <div className="text-sm font-medium text-green-600 mt-2">
                              ${orden.monto_vehiculo.toLocaleString()} {orden.moneda || 'ARS'}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {estaSeleccionada && (
                            <div className="flex items-center bg-green-600 text-white px-2 py-1 rounded-full text-xs">
                              ✓ Seleccionada
                            </div>
                          )}
                          {tieneMultiplesOrdenes && !haySeleccionDeOtroVehiculo && (
                            <div className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                              +{ordenesDelMismoVehiculo.length - 1} más
                            </div>
                          )}
                          {estaSeleccionada && (
                            <ArrowRight className="h-5 w-5 text-green-500 mt-1" />
                          )}
                        </div>
                      </div>

                      {/* Mostrar órdenes adicionales del mismo vehículo cuando hay selección */}
                      {estaSeleccionada && tieneMultiplesOrdenes && (
                        <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                          <div className="text-sm font-medium text-orange-800 mb-2">
                            📦 Otras órdenes del mismo vehículo ({orden.placa}):
                          </div>
                          <div className="space-y-1">
                            {ordenesDelMismoVehiculo
                              .filter(o => o.id !== orden.id)
                              .map(otraOrden => {
                                const estaOtraSeleccionada = ordenesSeleccionadas.some(o => o.id === otraOrden.id)
                                return (
                                  <div
                                    key={otraOrden.id}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      seleccionarOrden(otraOrden)
                                    }}
                                    className={`text-xs p-2 rounded cursor-pointer transition-colors ${
                                      estaOtraSeleccionada
                                        ? 'bg-green-200 text-green-800'
                                        : 'bg-white hover:bg-green-50 text-gray-700'
                                    }`}
                                  >
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <div className="flex items-center">
                                          <span className="font-medium">{otraOrden.codigo_oc}</span>
                                          {estaOtraSeleccionada && <span className="ml-2">✓</span>}
                                          <span className="ml-2 text-gray-600">- {otraOrden.proveedor}</span>
                                        </div>
                                        {otraOrden.items && (
                                          <div className="mt-1 text-gray-600 text-xs">
                                            <span className="font-medium">Items:</span> {otraOrden.items}
                                          </div>
                                        )}
                                      </div>
                                      {otraOrden.monto_vehiculo && (
                                        <div className="ml-2 text-green-600 font-medium text-xs">
                                          ${otraOrden.monto_vehiculo.toLocaleString()}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )
                              })}
                          </div>
                        </div>
                      )}
                    </div>
                    )
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
                    <p className="text-lg font-medium">¡Excelente trabajo!</p>
                    <p className="text-sm">Todas las órdenes tienen su servicio registrado</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Panel Derecho - Formulario de Registro */}
          <div className="bg-white rounded-lg shadow-md">
            {ordenesSeleccionadas.length > 0 ? (
              <div className="p-6 h-full flex flex-col">
                <div className="border-b border-gray-200 pb-4 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Registrar Servicio
                  </h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    {ordenesSeleccionadas.length === 1 ? (
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium text-blue-900">{ordenesSeleccionadas[0].codigo_oc}</span>
                          <span className="text-blue-700 ml-2">{ordenesSeleccionadas[0].placa}</span>
                        </div>
                        <div className="text-sm text-blue-600">
                          ${ordenesSeleccionadas[0].monto_vehiculo?.toLocaleString()} {ordenesSeleccionadas[0].moneda}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <span className="font-medium text-blue-900">{ordenesSeleccionadas.length} Órdenes Seleccionadas</span>
                            <span className="text-blue-700 ml-2">{ordenesSeleccionadas[0].placa}</span>
                          </div>
                          <div className="text-sm text-blue-600">
                            ${ordenesSeleccionadas.reduce((total, orden) => total + (orden.monto_vehiculo || 0), 0).toLocaleString()} {ordenesSeleccionadas[0].moneda}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {ordenesSeleccionadas.map((orden) => (
                            <div key={orden.id} className="bg-white border border-blue-200 rounded p-2 text-sm">
                              <div className="font-medium text-blue-800">{orden.codigo_oc}</div>
                              <div className="text-blue-600">{orden.proveedor}</div>
                              <div className="text-xs text-blue-500">
                                ${orden.monto_vehiculo?.toLocaleString()} {orden.moneda}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-4">
                  {/* Clasificación */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Clasificación *
                    </label>
                    <div className="flex space-x-3">
                      {['revision', 'mantenimiento', 'reparacion'].map((tipo) => (
                        <button
                          key={tipo}
                          onClick={() => setClasificacion(tipo as any)}
                          className={`px-3 py-2 rounded-lg text-sm transition-colors capitalize ${
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
                    <div className="border-t pt-4">
                      <h4 className="text-md font-semibold text-gray-900 mb-3">
                        🚀 Formulario Rápido por Sistema
                      </h4>
                      <p className="text-sm text-gray-600 mb-4">
                        Activa los sistemas en los que trabajarás:
                      </p>

                      {/* Iconos Permanentes como Toggles */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                        {secciones.map((seccion) => {
                          const IconoComponente = seccion.icono
                          const estaActiva = seccionesSeleccionadas.has(seccion.id)

                          return (
                            <button
                              key={seccion.id}
                              onClick={() => toggleSeccionMultiple(seccion.id)}
                              className={`flex flex-col items-center p-2 rounded-lg border-2 transition-all duration-200 hover:scale-105 hover:shadow-md text-xs ${
                                estaActiva
                                  ? 'border-green-500 bg-green-100 shadow-lg transform scale-105'
                                  : obtenerColorSeccion(seccion.color) + ' hover:shadow-md'
                              }`}
                              title={`${seccion.nombre} - ${estaActiva ? 'Activo' : 'Inactivo'}`}
                            >
                              <IconoComponente className={`h-5 w-5 mb-1 transition-all ${
                                estaActiva ? 'text-green-700 scale-110' : ''
                              }`} />
                              <span className={`font-medium text-center leading-tight transition-all ${
                                estaActiva ? 'text-green-800 font-bold' : ''
                              }`}>
                                {seccion.nombre.split(' ').map((palabra, i) => (
                                  <div key={i}>{palabra}</div>
                                ))}
                              </span>
                              {/* Indicador de estado */}
                              <div className={`mt-1 w-1.5 h-1.5 rounded-full transition-all ${
                                estaActiva ? 'bg-green-500' : 'bg-gray-300'
                              }`}></div>
                            </button>
                          )
                        })}
                      </div>

                      {/* Estado actual */}
                      {seccionesSeleccionadas.size > 0 && (
                        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <h5 className="font-semibold text-green-800 text-sm">
                                ✅ {seccionesSeleccionadas.size} Sistema{seccionesSeleccionadas.size > 1 ? 's' : ''} Activo{seccionesSeleccionadas.size > 1 ? 's' : ''}
                              </h5>
                              <p className="text-xs text-green-700">
                                {Array.from(seccionesSeleccionadas)
                                  .map(id => secciones.find(s => s.id === id)?.nombre)
                                  .join(', ')}
                              </p>
                            </div>
                            <button
                              onClick={() => setSeccionesSeleccionadas(new Set())}
                              className="text-xs text-green-600 hover:text-green-800 underline"
                            >
                              Limpiar
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Formulario de Sistemas Activos */}
                      {seccionesSeleccionadas.size > 0 && (
                        <div className="space-y-4">
                          {/* Datos Globales */}
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <h5 className="font-semibold text-blue-900 mb-2 text-sm">
                              📅 Datos Globales del Servicio
                            </h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {/* Kilometraje */}
                              <div>
                                <label className="block text-xs font-medium text-blue-800 mb-1">
                                  Kilometraje
                                </label>
                                <div className="space-y-2">
                                  <div className="flex items-center">
                                    <input
                                      type="checkbox"
                                      id="usar-km-actual-ordenes"
                                      checked={datosGlobales.usarKmActual}
                                      onChange={(e) => setDatosGlobales(prev => ({
                                        ...prev,
                                        usarKmActual: e.target.checked
                                      }))}
                                      className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor="usar-km-actual-ordenes" className="ml-2 text-xs text-blue-700">
                                      Usar km actual ({vehiculoSeleccionado?.kilometraje_actual?.toLocaleString() || 'N/A'})
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
                                      className="w-full px-2 py-1 text-sm border border-blue-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                      placeholder="Kilometraje del servicio"
                                    />
                                  )}
                                </div>
                              </div>

                              {/* Fecha */}
                              <div>
                                <label className="block text-xs font-medium text-blue-800 mb-1">
                                  Fecha del Servicio
                                </label>
                                <input
                                  type="date"
                                  value={datosGlobales.fecha}
                                  onChange={(e) => setDatosGlobales(prev => ({
                                    ...prev,
                                    fecha: e.target.value
                                  }))}
                                  className="w-full px-2 py-1 text-sm border border-blue-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Lista de Componentes */}
                          <div className="bg-white border border-gray-200 rounded-lg">
                            <div className="p-3 border-b border-gray-200">
                              <h5 className="font-semibold text-gray-900 text-sm">
                                ☑️ Seleccionar Componentes a Cambiar
                              </h5>
                              <p className="text-xs text-gray-600 mt-1">
                                Marca los componentes que se cambiaron
                              </p>
                            </div>
                            <div className="p-3 space-y-3 max-h-60 overflow-y-auto">
                              {/* Mostrar componentes agrupados por sistema */}
                              {Array.from(seccionesSeleccionadas).map(seccionId => {
                                const seccion = secciones.find(s => s.id === seccionId)
                                const campos = obtenerCamposFiltrados(seccionId)
                                const IconoComponente = seccion?.icono || Circle

                                return (
                                  <div key={seccionId} className="border border-gray-200 rounded-lg overflow-hidden">
                                    <div className={`p-2 ${obtenerColorSeccion(seccion?.color || 'gray')} border-b`}>
                                      <div className="flex items-center gap-2">
                                        <IconoComponente className="h-4 w-4" />
                                        <h6 className="font-semibold text-sm">{seccion?.nombre}</h6>
                                        <span className="text-xs bg-white bg-opacity-30 px-1 py-0.5 rounded">
                                          {campos.length}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="p-2 space-y-1">
                                      {campos.map((campo, index) => {
                                        const componenteKey = mapearLabelAKey(campo.label)
                                        const isSelected = componentesSeleccionados.has(componenteKey)

                                        return (
                                          <div key={`${seccionId}-${index}`} className={`p-2 border rounded transition-colors ${
                                            isSelected ? 'border-green-300 bg-green-50' : 'border-gray-200 hover:bg-gray-50'
                                          }`}>
                                            <div className="flex items-start space-x-2">
                                              <input
                                                type="checkbox"
                                                id={`comp-ordenes-${seccionId}-${index}`}
                                                checked={isSelected}
                                                onChange={() => toggleComponente(componenteKey)}
                                                className="h-3 w-3 text-green-600 focus:ring-green-500 border-gray-300 rounded mt-1"
                                              />
                                              <div className="flex-1">
                                                <label htmlFor={`comp-ordenes-${seccionId}-${index}`} className="cursor-pointer">
                                                  <div className="font-medium text-gray-900 text-xs">{campo.label}</div>
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
                  {!(clasificacion === 'mantenimiento' && seccionesSeleccionadas.size > 0) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Subclasificación
                      </label>
                      <input
                        type="text"
                        value={subclasificacion}
                        onChange={(e) => setSubclasificacion(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Ej: Motor, Frenos, Documentación..."
                      />
                    </div>
                  )}

                  {/* Kilometraje - Solo mostrar si NO se está usando formulario rápido */}
                  {!(clasificacion === 'mantenimiento' && seccionesSeleccionadas.size > 0) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Kilometraje al Servicio
                      </label>
                      <input
                        type="number"
                        value={kilometrajeServicio}
                        onChange={(e) => setKilometrajeServicio(e.target.value ? parseInt(e.target.value) : '')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder={`Actual: ${vehiculoSeleccionado?.kilometraje_actual?.toLocaleString() || 'No registrado'} km`}
                      />
                    </div>
                  )}

                  {/* Mostrar kilometraje automático cuando se usa formulario rápido */}
                  {clasificacion === 'mantenimiento' && seccionesSeleccionadas.size > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <h4 className="text-sm font-medium text-green-800 mb-2">
                        ✅ Kilometraje del Servicio (Automático)
                      </h4>
                      <p className="text-green-700 text-sm">
                        <span className="font-semibold">
                          {datosGlobales.usarKmActual ?
                            `${vehiculoSeleccionado?.kilometraje_actual?.toLocaleString() || 'No definido'} km (actual del vehículo)` :
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder={
                        clasificacion === 'mantenimiento' && seccionesSeleccionadas.size > 0 ?
                          "Se actualiza automáticamente según componentes seleccionados..." :
                          "Descripción detallada del trabajo realizado..."
                      }
                    />
                    {clasificacion === 'mantenimiento' && seccionesSeleccionadas.size > 0 && (
                      <p className="text-xs text-blue-600 mt-1">
                        ✨ Se actualiza automáticamente. Puedes editarlo si necesitas agregar más detalles.
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder={
                        clasificacion === 'mantenimiento' && seccionesSeleccionadas.size > 0 ?
                          "Se actualiza automáticamente: Filtro Aire Mann C123, Aceite Motor Mobil 1..." :
                          "Repuestos y materiales utilizados..."
                      }
                    />
                    {clasificacion === 'mantenimiento' && seccionesSeleccionadas.size > 0 && (
                      <p className="text-xs text-green-600 mt-1">
                        ✨ Se actualiza automáticamente desde los modelos ingresados. Puedes agregar más items.
                      </p>
                    )}
                  </div>
                </div>

                {/* Botones */}
                <div className="flex justify-between pt-4 border-t border-gray-200 mt-6">
                  <button
                    onClick={limpiarFormulario}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={guardarServicio}
                    disabled={saving || !descripcion.trim()}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <Save className="h-4 w-4" />
                    {saving ? 'Guardando...' : 'Guardar Servicio'}
                  </button>
                </div>

                {/* Mensajes */}
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
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Clock className="h-12 w-12 mx-auto mb-4" />
                  <p className="text-lg font-medium">Selecciona una orden</p>
                  <p className="text-sm">Elige una orden de compra de la lista para registrar su servicio</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}