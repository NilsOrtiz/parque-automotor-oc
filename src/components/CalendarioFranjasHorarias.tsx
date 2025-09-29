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

  return (
    <div className="space-y-4">
      {weekDays.map((day) => {
        const dateKey = formatDateKey(day)
        const isToday = dateKey === formatDateKey(new Date())
        const isPast = day < new Date(new Date().setHours(0, 0, 0, 0))

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
                <div className="grid grid-cols-5 gap-1 h-20 border border-gray-200 rounded-lg overflow-hidden">
                  {FRANJAS_HORARIAS.map((franja, index) => {
                    const vehiculosEnFranja = getScheduledVehiclesForFranja(dateKey, franja.inicio)

                    const colorClasses = {
                      'blue': 'bg-blue-50 hover:bg-blue-100 border-blue-200',
                      'indigo': 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200',
                      'cyan': 'bg-cyan-50 hover:bg-cyan-100 border-cyan-200',
                      'orange': 'bg-orange-50 hover:bg-orange-100 border-orange-200',
                      'amber': 'bg-amber-50 hover:bg-amber-100 border-amber-200'
                    }[franja.color]

                    const gradientClasses = {
                      'blue': 'from-blue-100 to-blue-200 text-blue-800',
                      'indigo': 'from-indigo-100 to-indigo-200 text-indigo-800',
                      'cyan': 'from-cyan-100 to-cyan-200 text-cyan-800',
                      'orange': 'from-orange-100 to-orange-200 text-orange-800',
                      'amber': 'from-amber-100 to-amber-200 text-amber-800'
                    }[franja.color]

                    return (
                      <div
                        key={franja.inicio}
                        className={`flex flex-col relative cursor-pointer transition-all ${
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
                          {vehiculosEnFranja.map((scheduled, vehicleIndex) => (
                            <div
                              key={scheduled.pendienteId}
                              className={`bg-gradient-to-r ${gradientClasses} px-2 py-1 rounded text-xs mb-1 group transition-all flex items-center justify-between`}
                              style={{
                                marginTop: vehicleIndex > 0 ? '2px' : '0'
                              }}
                            >
                              <div className="flex items-center gap-1 min-w-0">
                                <Truck className="h-3 w-3 flex-shrink-0" />
                                <span className="font-semibold truncate">#{scheduled.interno}</span>
                                {scheduled.duracion_franjas && scheduled.duracion_franjas > 1 && (
                                  <span className="bg-white/30 px-1 rounded text-xs flex-shrink-0">
                                    {scheduled.duracion_franjas}f
                                  </span>
                                )}
                              </div>
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
                            </div>
                          ))}
                        </div>

                        {/* Indicador de click */}
                        {vehiculosEnFranja.length === 0 && selectedPendiente && !isPast && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Calendar className="h-4 w-4 text-gray-400" />
                          </div>
                        )}

                        {/* Estado vacío */}
                        {vehiculosEnFranja.length === 0 && !selectedPendiente && !isPast && (
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