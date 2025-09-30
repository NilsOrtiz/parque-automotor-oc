'use client'

import { Calendar, Clock, Truck } from 'lucide-react'
import { type PendienteOperacion } from '@/lib/supabase'

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

// Paleta de colores para asignar a cada vehículo
const COLORES_VEHICULOS = [
  { bg: 'from-blue-100 to-blue-200', text: 'text-blue-800', hover: 'hover:from-blue-200 hover:to-blue-300' },
  { bg: 'from-green-100 to-green-200', text: 'text-green-800', hover: 'hover:from-green-200 hover:to-green-300' },
  { bg: 'from-purple-100 to-purple-200', text: 'text-purple-800', hover: 'hover:from-purple-200 hover:to-purple-300' },
  { bg: 'from-pink-100 to-pink-200', text: 'text-pink-800', hover: 'hover:from-pink-200 hover:to-pink-300' },
  { bg: 'from-yellow-100 to-yellow-200', text: 'text-yellow-800', hover: 'hover:from-yellow-200 hover:to-yellow-300' },
  { bg: 'from-red-100 to-red-200', text: 'text-red-800', hover: 'hover:from-red-200 hover:to-red-300' },
  { bg: 'from-indigo-100 to-indigo-200', text: 'text-indigo-800', hover: 'hover:from-indigo-200 hover:to-indigo-300' },
  { bg: 'from-teal-100 to-teal-200', text: 'text-teal-800', hover: 'hover:from-teal-200 hover:to-teal-300' },
  { bg: 'from-orange-100 to-orange-200', text: 'text-orange-800', hover: 'hover:from-orange-200 hover:to-orange-300' },
  { bg: 'from-cyan-100 to-cyan-200', text: 'text-cyan-800', hover: 'hover:from-cyan-200 hover:to-cyan-300' }
]

// Función para obtener color basado en ID del vehículo
function getColorForVehicle(vehicleId: number): typeof COLORES_VEHICULOS[0] {
  const index = vehicleId % COLORES_VEHICULOS.length
  return COLORES_VEHICULOS[index]
}

interface CalendarioFranjasHorariasProps {
  weekDays: Date[]
  pendientes: PendienteOperacion[]
  selectedPendiente: PendienteOperacion | null
  onSchedulePendiente: (pendiente: PendienteOperacion, fecha: string, franjaInicio: string) => void
  onRemoveScheduled: (pendienteId: number) => void
  formatDate: (date: Date) => string
  formatDateKey: (date: Date) => string
}

export default function CalendarioFranjasHorarias({
  weekDays,
  pendientes,
  selectedPendiente,
  onSchedulePendiente,
  onRemoveScheduled,
  formatDate,
  formatDateKey
}: CalendarioFranjasHorariasProps) {

  // Función para obtener vehículos por franja horaria específica
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
        fecha: fecha,
        turno: 'mañana' as const,
        franja_horaria_inicio: p.franja_horaria_inicio,
        franja_horaria_fin: p.franja_horaria_fin,
        duracion_franjas: p.duracion_franjas,
        es_trabajo_continuo: true
      }))
  }

  // Función para obtener trabajos que empezaron días anteriores pero continúan en esta fecha
  function getTrabajosDesdeOtrosDias(fecha: string): ScheduledVehicle[] {
    const fechaActual = new Date(fecha)
    const trabajosContinuos: ScheduledVehicle[] = []

    // Buscar trabajos que empezaron antes y podrían continuar
    const trabajosAnteriores = pendientes.filter(p =>
      p.fecha_programada &&
      p.fecha_programada < fecha &&
      p.fecha_fin_estimada &&
      p.fecha_fin_estimada >= fecha &&
      p.estado === 'programado' &&
      p.franja_horaria_inicio
    )

    for (const trabajo of trabajosAnteriores) {
      const fechaInicio = new Date(trabajo.fecha_programada!)
      const franjaInicioIndex = FRANJAS_HORARIAS.findIndex(f => f.inicio === trabajo.franja_horaria_inicio)
      const duracion = trabajo.duracion_franjas || 1

      // Calcular cuántos días han pasado
      const diasTranscurridos = Math.floor((fechaActual.getTime() - fechaInicio.getTime()) / (1000 * 60 * 60 * 24))

      // Calcular franja de inicio en este día
      const franjasDelDiaInicio = 5 - franjaInicioIndex
      const franjasYaConsumidas = franjasDelDiaInicio + (diasTranscurridos - 1) * 5
      const franjasRestantes = duracion - franjasYaConsumidas

      if (franjasRestantes > 0) {
        trabajosContinuos.push({
          pendienteId: trabajo.id,
          interno: trabajo.interno?.toString() || '',
          placa: trabajo.placa,
          fecha: fecha,
          turno: 'mañana' as const,
          franja_horaria_inicio: '08:00', // Empieza desde el principio del día
          franja_horaria_fin: trabajo.franja_horaria_fin,
          duracion_franjas: franjasRestantes,
          es_trabajo_continuo: false,
          esContinuacionDeOtroDia: true
        } as ScheduledVehicle & { esContinuacionDeOtroDia: boolean })
      }
    }

    return trabajosContinuos
  }

  // Función para obtener TODOS los trabajos multi-franja que ocupan una franja específica
  function getTrabajosMultiFranjaEn(fecha: string, franjaInicio: string): ScheduledVehicle[] {
    const franjaIndex = FRANJAS_HORARIAS.findIndex(f => f.inicio === franjaInicio)

    // Buscar TODOS los trabajos programados en esta fecha
    const trabajosEnFecha = pendientes.filter(p =>
      p.fecha_programada === fecha &&
      p.estado === 'programado' &&
      p.franja_horaria_inicio
    )

    const trabajosQueOcupanEstaFranja: ScheduledVehicle[] = []

    for (const trabajo of trabajosEnFecha) {
      const inicioIndex = FRANJAS_HORARIAS.findIndex(f => f.inicio === trabajo.franja_horaria_inicio)
      const duracion = trabajo.duracion_franjas || 1

      // Solo incluir trabajos multi-franja (duracion > 1) que NO comienzan en esta franja
      // (los que comienzan en esta franja ya se manejan en getScheduledVehiclesForFranja)
      if (duracion > 1 && inicioIndex !== franjaIndex) {
        // Verificar si esta franja está dentro del rango del trabajo
        if (franjaIndex > inicioIndex && franjaIndex < inicioIndex + duracion) {
          trabajosQueOcupanEstaFranja.push({
            pendienteId: trabajo.id,
            interno: trabajo.interno?.toString() || '',
            placa: trabajo.placa,
            fecha: fecha,
            turno: trabajo.turno_programado as 'mañana' | 'tarde',
            franja_horaria_inicio: trabajo.franja_horaria_inicio,
            franja_horaria_fin: trabajo.franja_horaria_fin,
            duracion_franjas: trabajo.duracion_franjas,
            es_trabajo_continuo: trabajo.es_trabajo_continuo
          })
        }
      }
    }

    return trabajosQueOcupanEstaFranja
  }

  return (
    <div className="space-y-4">
      {weekDays.map((day) => {
        const dateKey = formatDateKey(day)
        const isToday = dateKey === formatDateKey(new Date())
        const isPast = day < new Date(new Date().setHours(0, 0, 0, 0))

        // Ocultar días pasados
        if (isPast) return null

        // Calcular total de vehículos en todas las franjas + trabajos continuos
        const totalVehicles = FRANJAS_HORARIAS.reduce((total, franja) =>
          total + getScheduledVehiclesForFranja(dateKey, franja.inicio).length, 0
        ) + getTrabajosContinuos(dateKey).length

        return (
          <div key={dateKey} className={`rounded-xl shadow-sm transition-all hover:shadow-md ${
            isToday
              ? 'border-2 border-blue-400 bg-gradient-to-r from-blue-50 to-indigo-50'
              : 'border border-gray-200 bg-white'
          } ${isPast ? 'opacity-60 bg-gray-50' : ''}`}>
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="font-semibold text-gray-900">
                    {formatDate(day)}
                  </div>
                  {isToday && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                      Hoy
                    </span>
                  )}
                </div>
                {totalVehicles > 0 && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                    {totalVehicles} programado{totalVehicles > 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {/* Trabajos Continuos (Indeterminado) */}
              {getTrabajosContinuos(dateKey).length > 0 && (
                <div className="mb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-purple-700">Trabajos Continuos</span>
                  </div>
                  <div className="space-y-1">
                    {getTrabajosContinuos(dateKey).map((scheduled) => (
                      <div
                        key={`continuo-${scheduled.pendienteId}`}
                        className="flex items-center justify-between bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 px-3 py-2 rounded-lg text-sm group hover:from-purple-200 hover:to-purple-300 transition-all"
                      >
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span className="font-semibold">#{scheduled.interno}</span>
                          <span className="text-xs opacity-75">{scheduled.placa}</span>
                          <span className="text-xs bg-purple-300 text-purple-800 px-2 py-1 rounded-full">
                            Indeterminado
                          </span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onRemoveScheduled(scheduled.pendienteId)
                          }}
                          className="text-purple-600 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all p-1 rounded-full hover:bg-white/50"
                          title="Desprogramar"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Barra Horizontal con 5 Franjas Horarias */}
              <div className="space-y-4">
                {/* Header con horarios */}
                <div className="grid grid-cols-5 gap-1 text-xs text-gray-500 text-center">
                  {FRANJAS_HORARIAS.map((franja) => (
                    <div key={franja.inicio} className="py-1">
                      {franja.inicio}-{franja.fin}
                    </div>
                  ))}
                </div>

                {/* Barra horizontal dividida en 5 secciones */}
                <div className="grid grid-cols-5 gap-1 min-h-[80px] border border-gray-200 rounded-lg overflow-hidden">
                  {FRANJAS_HORARIAS.map((franja, index) => {
                    const vehiculosEnFranja = getScheduledVehiclesForFranja(dateKey, franja.inicio)
                    const trabajosMultiFranja = getTrabajosMultiFranjaEn(dateKey, franja.inicio)

                    // Obtener trabajos que continúan desde días anteriores
                    const trabajosDesdeOtrosDias = getTrabajosDesdeOtrosDias(dateKey)

                    // Obtener TODOS los vehículos de TODAS las franjas del día para determinar orden global
                    const todosLosVehiculosDelDia = pendientes
                      .filter(p => p.fecha_programada === dateKey && p.estado === 'programado')

                    // Combinar: primero trabajos de días anteriores, luego trabajos del día actual
                    const todosLosVehiculos = [
                      ...trabajosDesdeOtrosDias.map(t => ({
                        ...pendientes.find(p => p.id === t.pendienteId)!,
                        // Sobrescribir con datos ajustados para este día
                        _continuacionData: t
                      })),
                      ...todosLosVehiculosDelDia
                    ].sort((a, b) => a.id - b.id) // Ordenar por ID (orden de creación)

                    // Crear mapa de posiciones globales: cada vehículo tiene su índice fijo
                    const posicionesGlobales = new Map<number, number>()
                    todosLosVehiculos.forEach((trabajo, idx) => {
                      posicionesGlobales.set(trabajo.id, idx)
                    })

                    // Crear array con slots (algunos pueden ser null para espacios vacíos)
                    const franjaActualIndex = FRANJAS_HORARIAS.findIndex(f => f.inicio === franja.inicio)
                    const maxPosiciones = todosLosVehiculos.length
                    const slotsConEspacios: (ScheduledVehicle | null)[] = new Array(maxPosiciones).fill(null)

                    todosLosVehiculos.forEach(trabajo => {
                      // Verificar si es una continuación de otro día
                      const continuacionData = (trabajo as any)._continuacionData

                      let inicioIndex: number
                      let duracion: number

                      if (continuacionData) {
                        // Es un trabajo que viene de otro día
                        inicioIndex = 0 // Empieza desde el principio del día
                        duracion = continuacionData.duracion_franjas
                      } else {
                        // Trabajo que empieza en este día
                        inicioIndex = FRANJAS_HORARIAS.findIndex(f => f.inicio === trabajo.franja_horaria_inicio)
                        duracion = trabajo.duracion_franjas || 1
                      }

                      // Verificar si este trabajo ocupa la franja actual
                      if (franjaActualIndex >= inicioIndex && franjaActualIndex < inicioIndex + duracion) {
                        const posicionGlobal = posicionesGlobales.get(trabajo.id)!
                        slotsConEspacios[posicionGlobal] = {
                          pendienteId: trabajo.id,
                          interno: trabajo.interno?.toString() || '',
                          placa: trabajo.placa,
                          fecha: dateKey,
                          turno: trabajo.turno_programado as 'mañana' | 'tarde',
                          franja_horaria_inicio: continuacionData ? '08:00' : trabajo.franja_horaria_inicio,
                          franja_horaria_fin: trabajo.franja_horaria_fin,
                          duracion_franjas: duracion,
                          es_trabajo_continuo: trabajo.es_trabajo_continuo
                        }
                      }
                    })

                    // NO filtrar nulls - mantener espacios vacíos para preservar posiciones
                    const vehiculosAMostrar = slotsConEspacios

                    const colorClasses = {
                      'blue': 'bg-blue-50 hover:bg-blue-100 border-blue-200',
                      'indigo': 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200',
                      'cyan': 'bg-cyan-50 hover:bg-cyan-100 border-cyan-200',
                      'orange': 'bg-orange-50 hover:bg-orange-100 border-orange-200',
                      'amber': 'bg-amber-50 hover:bg-amber-100 border-amber-200'
                    }[franja.color]

                    return (
                      <div
                        key={franja.inicio}
                        className={`flex flex-col relative cursor-pointer transition-all min-h-[80px] ${
                          selectedPendiente && !isPast
                            ? `${colorClasses} border-2 border-dashed`
                            : 'bg-gray-50 border-gray-200'
                        } ${index > 0 ? 'border-l' : ''}`}
                        onClick={() => {
                          if (selectedPendiente && !isPast) {
                            onSchedulePendiente(selectedPendiente, dateKey, franja.inicio)
                          }
                        }}
                      >
                        {/* Vehículos programados en esta franja */}
                        <div className="flex-1 p-1 overflow-hidden">
                          {vehiculosAMostrar.map((scheduled, vehicleIndex) => {
                            // Si es null, renderizar espacio vacío invisible
                            if (scheduled === null) {
                              return (
                                <div
                                  key={`empty-${vehicleIndex}`}
                                  className="px-2 py-1 text-xs mb-1"
                                  style={{
                                    marginTop: vehicleIndex > 0 ? '2px' : '0',
                                    height: '28px',
                                    visibility: 'hidden'
                                  }}
                                >
                                  &nbsp;
                                </div>
                              )
                            }

                            // Determinar si es inicio o continuación de trabajo multi-franja
                            const esInicioTrabajo = scheduled.franja_horaria_inicio === franja.inicio
                            const esContinuacionTrabajo = scheduled.franja_horaria_inicio !== franja.inicio &&
                                                        scheduled.duracion_franjas &&
                                                        scheduled.duracion_franjas > 1

                            // Obtener color único para este vehículo
                            const colorVehiculo = getColorForVehicle(scheduled.pendienteId)

                            return (
                              <div
                                key={`${scheduled.pendienteId}-${index}`}
                                className={`bg-gradient-to-r ${colorVehiculo.bg} ${colorVehiculo.text} px-2 py-1 rounded text-xs mb-1 group transition-all flex items-center justify-between ${
                                  esContinuacionTrabajo ? 'opacity-75' : ''
                                }`}
                                style={{
                                  marginTop: vehicleIndex > 0 ? '2px' : '0'
                                }}
                              >
                                <div className="flex items-center justify-center min-w-0 flex-1">
                                  <span className="font-bold text-sm">{scheduled.interno}</span>
                                  {esContinuacionTrabajo && (
                                    <span className="ml-1 text-xs opacity-60">...</span>
                                  )}
                                </div>
                                {/* Mostrar botón de eliminar si es inicio de trabajo multi-franja O trabajo individual */}
                                {(esInicioTrabajo || !esContinuacionTrabajo) && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      onRemoveScheduled(scheduled.pendienteId)
                                    }}
                                    className="opacity-0 group-hover:opacity-100 transition-all hover:bg-white/50 rounded flex-shrink-0 p-1"
                                    title="Desprogramar"
                                  >
                                    ×
                                  </button>
                                )}
                              </div>
                            )
                          })}
                        </div>

                        {/* Indicador de click */}
                        {vehiculosAMostrar.length === 0 && selectedPendiente && !isPast && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Calendar className="h-4 w-4 text-gray-400" />
                          </div>
                        )}

                        {/* Estado vacío */}
                        {vehiculosAMostrar.length === 0 && !selectedPendiente && !isPast && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-gray-300 text-xs">-</span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}