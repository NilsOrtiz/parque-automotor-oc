'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase, type PendienteOperacion } from '@/lib/supabase'
import { ArrowLeft, AlertTriangle, Clock, Wrench, RefreshCw, Truck, Calendar, ChevronLeft, ChevronRight, Settings, PlayCircle, CheckCircle } from 'lucide-react'
import CalendarioFranjasHorarias from '@/components/CalendarioFranjasHorarias'

type ScheduledVehicle = {
  pendienteId: number
  interno: string
  placa: string
  fecha: string
  turno: 'mañana' | 'tarde'
  franja_horaria_inicio?: string
  franja_horaria_fin?: string
  duracion_franjas?: number
  es_trabajo_continuo?: boolean
}

// Franjas horarias disponibles (5 franjas: 8:00 a 18:00)
const FRANJAS_HORARIAS = [
  { inicio: '08:00', fin: '10:00', label: 'Inicio mañana', color: 'blue' },
  { inicio: '10:00', fin: '12:00', label: 'Mitad mañana', color: 'indigo' },
  { inicio: '12:00', fin: '14:00', label: 'Final mañana', color: 'cyan' },
  { inicio: '14:00', fin: '16:00', label: 'Inicio tarde', color: 'orange' },
  { inicio: '16:00', fin: '18:00', label: 'Final tarde', color: 'amber' }
]

export default function PendientesPage() {
  const [pendientes, setPendientes] = useState<PendienteOperacion[]>([])
  const [loading, setLoading] = useState(true)
  const [actualizando, setActualizando] = useState(false)
  const [ultimaActualizacion, setUltimaActualizacion] = useState<string>('')
  const [selectedPendiente, setSelectedPendiente] = useState<PendienteOperacion | null>(null)
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'pendiente' | 'programado' | 'en_proceso' | 'completado'>('todos')

  useEffect(() => {
    cargarPendientes()
    // Auto-refresh cada 30 minutos
    const interval = setInterval(cargarPendientes, 30 * 60 * 1000)
    return () => clearInterval(interval)
  }, [filtroEstado])

  async function cargarPendientes() {
    setLoading(true)
    try {
      let query = supabase
        .from('pendientes_operaciones')
        .select('*')
        .order('criticidad', { ascending: false }) // Críticos primero
        .order('fecha_creacion', { ascending: true })

      if (filtroEstado !== 'todos') {
        query = query.eq('estado', filtroEstado)
      }

      const { data, error } = await query

      if (error) throw error

      setPendientes(data || [])
      setUltimaActualizacion(new Date().toLocaleString('es-UY', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }))
    } catch (error) {
      console.error('Error cargando pendientes:', error)
    } finally {
      setLoading(false)
    }
  }

  async function actualizarPendientesAutomaticos() {
    setActualizando(true)
    try {
      console.log('🔄 Ejecutando actualización automática...')

      const response = await fetch('/api/actualizar-pendientes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const result = await response.json()

      if (result.success) {
        console.log('✅ Actualización exitosa:', result)
        // Recargar la lista después de actualizar
        await cargarPendientes()
      } else {
        console.error('❌ Error en actualización:', result.message)
        alert(`Error actualizando pendientes: ${result.message}`)
      }
    } catch (error) {
      console.error('❌ Error ejecutando actualización:', error)
      alert('Error ejecutando actualización automática')
    } finally {
      setActualizando(false)
    }
  }

  function getPrioridadColor(criticidad: string, estado?: string): string {
    // Si está programado, usar color verde más intenso
    if (estado === 'programado') {
      return 'border-l-green-600 bg-green-100'
    }

    // Si no está programado, usar color según criticidad
    switch (criticidad) {
      case 'critico':
        return 'border-l-red-600 bg-red-50'
      case 'medio':
        return 'border-l-orange-500 bg-orange-50'
      case 'leve':
        return 'border-l-yellow-500 bg-yellow-50'
      default:
        return 'border-l-gray-500 bg-gray-50'
    }
  }

  function getCriticidadBadge(criticidad: string) {
    switch (criticidad) {
      case 'critico':
        return 'bg-red-100 text-red-800'
      case 'medio':
        return 'bg-orange-100 text-orange-800'
      case 'leve':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  function getEstadoBadge(estado: string) {
    switch (estado) {
      case 'pendiente':
        return 'bg-gray-100 text-gray-800'
      case 'programado':
        return 'bg-blue-100 text-blue-800'
      case 'en_proceso':
        return 'bg-yellow-100 text-yellow-800'
      case 'completado':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  function getEstadoTexto(estado: string) {
    switch (estado) {
      case 'pendiente':
        return 'Pendiente'
      case 'programado':
        return 'Programado'
      case 'en_proceso':
        return 'En Proceso'
      case 'completado':
        return 'Completado'
      default:
        return estado
    }
  }

  // Funciones para el calendario (similar a la versión anterior)
  function getWeekDays(startDate: Date): Date[] {
    const days: Date[] = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Generar 7 días consecutivos desde hoy
    for (let i = 0; i < 7; i++) {
      const day = new Date(today)
      day.setDate(today.getDate() + i)
      days.push(day)
    }

    return days
  }

  function formatDate(date: Date): string {
    return date.toLocaleDateString('es-UY', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit'
    })
  }

  function formatDateKey(date: Date): string {
    return date.toISOString().split('T')[0]
  }

  async function handleSchedulePendiente(pendiente: PendienteOperacion, fecha: string, franjaInicio: string) {
    try {
      const franja = FRANJAS_HORARIAS.find(f => f.inicio === franjaInicio)
      if (!franja) {
        alert('❌ Franja horaria inválida')
        return
      }

      const response = await fetch('/api/pendientes/programar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pendiente_id: pendiente.id,
          fecha_programada: fecha,
          franja_horaria_inicio: franjaInicio,
          programado_por: 'Operaciones',
          notas_programacion: `Programado en ${franja.label} (${franja.inicio}-${franja.fin})`
        })
      })

      const result = await response.json()

      if (result.success) {
        await cargarPendientes()
        console.log('✅ Programación exitosa:', result.detalles)
        alert('✅ ' + result.message)
        setSelectedPendiente(null)
      } else {
        console.error('Error programando:', result.message)
        alert('❌ Error al programar: ' + result.message)
      }
    } catch (error) {
      console.error('Error en la programación:', error)
      alert('❌ Error inesperado al programar')
    }
  }

  // Nueva función para obtener vehículos por franja horaria específica
  function getScheduledVehiclesForFranja(fecha: string, franjaInicio: string): ScheduledVehicle[] {
    return pendientes
      .filter(p =>
        p.fecha_programada === fecha &&
        p.franja_horaria_inicio === franjaInicio &&
        p.estado === 'programado'
      )
      .map(p => ({
        pendienteId: p.id,
        interno: p.interno?.toString() || '',
        placa: p.placa,
        fecha: p.fecha_programada || '',
        turno: p.turno_programado as 'mañana' | 'tarde',
        franja_horaria_inicio: p.franja_horaria_inicio,
        franja_horaria_fin: p.franja_horaria_fin,
        duracion_franjas: p.duracion_franjas,
        es_trabajo_continuo: p.es_trabajo_continuo
      }))
  }

  // Función para obtener trabajos "Indeterminado" que aparecen todos los días
  function getTrabajosContinuos(fecha: string): ScheduledVehicle[] {
    const fechaActual = new Date(fecha)
    return pendientes
      .filter(p =>
        p.es_trabajo_continuo &&
        p.fecha_programada &&
        new Date(p.fecha_programada) <= fechaActual &&
        p.estado === 'programado'
      )
      .map(p => ({
        pendienteId: p.id,
        interno: p.interno?.toString() || '',
        placa: p.placa,
        fecha: fecha, // Mostrar en la fecha consultada
        turno: 'mañana' as const,
        franja_horaria_inicio: p.franja_horaria_inicio,
        franja_horaria_fin: p.franja_horaria_fin,
        duracion_franjas: p.duracion_franjas,
        es_trabajo_continuo: true
      }))
  }

  // Mantener función legacy para compatibilidad
  function getScheduledVehiclesForSlot(fecha: string, turno: 'mañana' | 'tarde'): ScheduledVehicle[] {
    // Mapear turnos a franjas horarias para compatibilidad
    const franjasDelTurno = turno === 'mañana'
      ? ['08:00', '10:00', '12:00']
      : ['14:00', '16:00']

    const vehiculosEnFranjas = franjasDelTurno.flatMap(franja =>
      getScheduledVehiclesForFranja(fecha, franja)
    )

    // Agregar trabajos continuos solo en el turno mañana para evitar duplicados
    if (turno === 'mañana') {
      vehiculosEnFranjas.push(...getTrabajosContinuos(fecha))
    }

    return vehiculosEnFranjas
  }

  async function removeScheduledVehicle(pendienteId: number) {
    try {
      const response = await fetch(`/api/pendientes/programar?id=${pendienteId}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (result.success) {
        // Recargar pendientes para ver los cambios
        await cargarPendientes()
      } else {
        console.error('Error desprogramando:', result.message)
        alert('❌ Error al desprogramar: ' + result.message)
      }
    } catch (error) {
      console.error('Error desprogramando:', error)
      alert('❌ Error inesperado al desprogramar')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-600" />
          <div className="text-lg">Cargando pendientes de operaciones...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <Link
              href="/vehiculos/mantenimientos"
              className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Ver todos los mantenimientos
            </Link>

            <div className="flex space-x-3">
              <button
                onClick={actualizarPendientesAutomaticos}
                disabled={actualizando}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {actualizando ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Settings className="h-4 w-4 mr-2" />
                )}
                {actualizando ? 'Actualizando...' : 'Actualizar Automáticos'}
              </button>

              <button
                onClick={cargarPendientes}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refrescar Lista
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Pendientes de Operaciones
              </h1>
              <p className="text-gray-600">
                Lista controlada de vehículos que requieren atención para coordinación operativa
              </p>
            </div>

            <div className="text-right">
              <div className="text-2xl font-bold text-red-600">{pendientes.length}</div>
              <div className="text-sm text-gray-500">elementos en lista</div>
            </div>
          </div>

          {/* Filtros */}
          <div className="mt-4 flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Filtrar por estado:</span>
            {['todos', 'pendiente', 'programado', 'en_proceso', 'completado'].map((estado) => (
              <button
                key={estado}
                onClick={() => setFiltroEstado(estado as any)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  filtroEstado === estado
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {estado === 'todos' ? 'Todos' : getEstadoTexto(estado)}
              </button>
            ))}
          </div>

          {ultimaActualizacion && (
            <div className="mt-4 text-xs text-gray-500">
              Última actualización: {ultimaActualizacion}
            </div>
          )}
        </div>
      </div>

      {/* Layout de dos columnas */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          {/* Columna izquierda: Tabla de pendientes */}
          <div className="xl:col-span-7">
            {pendientes.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow-md">
                <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {filtroEstado === 'todos' ? '¡Perfecto! No hay pendientes' : `No hay pendientes en estado "${getEstadoTexto(filtroEstado)}"`}
                </h3>
                <p className="text-gray-600 mb-4">
                  {filtroEstado === 'todos'
                    ? 'Todos los vehículos están al día con el mantenimiento'
                    : 'Prueba cambiando el filtro de estado o ejecuta una actualización automática'
                  }
                </p>
                {filtroEstado === 'todos' && (
                  <button
                    onClick={actualizarPendientesAutomaticos}
                    disabled={actualizando}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    <PlayCircle className="h-4 w-4 mr-2" />
                    Ejecutar Actualización
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">
                    Lista de Pendientes para Operaciones
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Lista controlada desde taller - vehículos que requieren coordinación operativa
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Vehículo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Trasladar a
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tiempo Estimado
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Motivo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Criticidad
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Estado
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acción
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {pendientes.map((pendiente) => (
                        <tr key={pendiente.id} className={`hover:bg-gray-50 ${getPrioridadColor(pendiente.criticidad, pendiente.estado)}`}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            <div className="flex flex-col">
                              <div className="flex items-center space-x-2">
                                {pendiente.interno && (
                                  <span className="font-bold">#{pendiente.interno}</span>
                                )}
                                <span className="font-medium">{pendiente.placa}</span>
                                {pendiente.es_automatico && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                                    AUTO
                                  </span>
                                )}
                              </div>
                              {(pendiente.porcentaje_vida_km !== null || pendiente.porcentaje_vida_hr !== null) && (
                                <div className="text-xs text-gray-500 mt-1">
                                  {pendiente.porcentaje_vida_km !== null && (
                                    <span>KM: {pendiente.porcentaje_vida_km.toFixed(1)}%</span>
                                  )}
                                  {pendiente.porcentaje_vida_km !== null && pendiente.porcentaje_vida_hr !== null && (
                                    <span> | </span>
                                  )}
                                  {pendiente.porcentaje_vida_hr !== null && (
                                    <span>HR: {pendiente.porcentaje_vida_hr.toFixed(1)}%</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                              <Wrench className="h-3 w-3 mr-1" />
                              {pendiente.trasladar_a}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span className="font-medium text-blue-900">
                              {pendiente.tiempo_estimado}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 max-w-[200px]">
                            <div className="truncate" title={pendiente.motivo}>
                              {pendiente.motivo}
                            </div>
                            {pendiente.observaciones && (
                              <div className="text-xs text-gray-500 mt-1 truncate" title={pendiente.observaciones}>
                                {pendiente.observaciones}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCriticidadBadge(pendiente.criticidad)}`}>
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              {pendiente.criticidad.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getEstadoBadge(pendiente.estado)}`}>
                              {getEstadoTexto(pendiente.estado)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {pendiente.estado === 'programado' && pendiente.fecha_programada ? (
                              <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span className="text-green-700 text-xs font-medium">
                                  Programado para {new Date(pendiente.fecha_programada).toLocaleDateString()}
                                  {pendiente.turno_programado && ` (${pendiente.turno_programado})`}
                                </span>
                              </div>
                            ) : (
                              <button
                                onClick={() => setSelectedPendiente(selectedPendiente?.id === pendiente.id ? null : pendiente)}
                                className={`inline-flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
                                  selectedPendiente?.id === pendiente.id
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-600 text-white hover:bg-gray-700'
                                }`}
                              >
                                <Clock className="h-4 w-4 mr-1" />
                                {selectedPendiente?.id === pendiente.id ? 'Seleccionado' : 'Programar'}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Columna derecha: Calendario semanal - igual que antes */}
          <div className="xl:col-span-5">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Programación Semanal
                </h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      const newWeek = new Date(currentWeek)
                      newWeek.setDate(newWeek.getDate() - 7)
                      setCurrentWeek(newWeek)
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      const newWeek = new Date(currentWeek)
                      newWeek.setDate(newWeek.getDate() + 7)
                      setCurrentWeek(newWeek)
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Calendario con 5 Franjas Horarias */}
              <CalendarioFranjasHorarias
                weekDays={getWeekDays(currentWeek)}
                pendientes={pendientes}
                selectedPendiente={selectedPendiente}
                onSchedulePendiente={handleSchedulePendiente}
                onRemoveScheduled={removeScheduledVehicle}
                formatDate={formatDate}
                formatDateKey={formatDateKey}
              />

              {/* Instrucciones mejoradas */}
              <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm font-semibold text-blue-900">Cómo programar</span>
                </div>
                <div className="space-y-1 text-xs text-blue-800">
                  <p>1. 🎯 Selecciona un pendiente haciendo clic en "Programar"</p>
                  <p>2. 📅 Elige el día y franja horaria (08:00-18:00) en el calendario</p>
                  <p>3. ⏱️ El sistema calcula automáticamente la duración según el tiempo estimado</p>
                  <p>4. ✅ La programación se guarda automáticamente</p>
                </div>

                <div className="mt-3 pt-3 border-t border-blue-200">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                    <span className="text-xs font-medium text-gray-700">Información</span>
                  </div>
                  <p className="text-xs text-gray-600">
                    Los pendientes "AUTO" son generados automáticamente. Los datos persisten al recargar la página.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}