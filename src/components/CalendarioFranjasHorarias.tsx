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

              {/* 6 Franjas Horarias */}
              <div className="grid grid-cols-2 gap-2">
                {FRANJAS_HORARIAS.map((franja) => {
                  const vehiculosEnFranja = getScheduledVehiclesForFranja(dateKey, franja.inicio)

                  const colorClasses = {
                    'blue': {
                      border: 'border-blue-400 bg-blue-50 hover:bg-blue-100 hover:border-blue-500',
                      gradient: 'from-blue-100 to-blue-200 text-blue-800 hover:from-blue-200 hover:to-blue-300',
                      dot: 'bg-blue-500'
                    },
                    'indigo': {
                      border: 'border-indigo-400 bg-indigo-50 hover:bg-indigo-100 hover:border-indigo-500',
                      gradient: 'from-indigo-100 to-indigo-200 text-indigo-800 hover:from-indigo-200 hover:to-indigo-300',
                      dot: 'bg-indigo-500'
                    },
                    'cyan': {
                      border: 'border-cyan-400 bg-cyan-50 hover:bg-cyan-100 hover:border-cyan-500',
                      gradient: 'from-cyan-100 to-cyan-200 text-cyan-800 hover:from-cyan-200 hover:to-cyan-300',
                      dot: 'bg-cyan-500'
                    },
                    'orange': {
                      border: 'border-orange-400 bg-orange-50 hover:bg-orange-100 hover:border-orange-500',
                      gradient: 'from-orange-100 to-orange-200 text-orange-800 hover:from-orange-200 hover:to-orange-300',
                      dot: 'bg-orange-500'
                    },
                    'amber': {
                      border: 'border-amber-400 bg-amber-50 hover:bg-amber-100 hover:border-amber-500',
                      gradient: 'from-amber-100 to-amber-200 text-amber-800 hover:from-amber-200 hover:to-amber-300',
                      dot: 'bg-amber-500'
                    },
                  }[franja.color as keyof typeof colorClasses]

                  return (
                    <div key={franja.inicio} className="mb-2">
                      <div className="flex items-center gap-1 mb-1">
                        <div className={`w-2 h-2 ${colorClasses.dot} rounded-full`}></div>
                        <span className="text-xs font-medium text-gray-600">
                          {franja.inicio}-{franja.fin}
                        </span>
                      </div>
                      <div
                        className={`min-h-[50px] p-2 rounded-lg transition-all border cursor-pointer ${
                          selectedPendiente && !isPast
                            ? `border-2 border-dashed ${colorClasses.border}`
                            : 'border-gray-200 bg-gray-50'
                        }`}
                        onClick={() => {
                          if (selectedPendiente && !isPast) {
                            onSchedulePendiente(selectedPendiente, dateKey, franja.inicio)
                          }
                        }}
                      >
                        {vehiculosEnFranja.map((scheduled) => (
                          <div
                            key={scheduled.pendienteId}
                            className={`flex items-center justify-between bg-gradient-to-r ${colorClasses.gradient} px-2 py-1 rounded text-xs mb-1 group transition-all`}
                          >
                            <div className="flex items-center gap-1">
                              <Truck className="h-3 w-3" />
                              <span className="font-semibold">#{scheduled.interno}</span>
                              {scheduled.duracion_franjas && scheduled.duracion_franjas > 1 && (
                                <span className="bg-white/30 px-1 rounded text-xs">
                                  {scheduled.duracion_franjas}f
                                </span>
                              )}
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                onRemoveScheduled(scheduled.pendienteId)
                              }}
                              className="opacity-0 group-hover:opacity-100 transition-all p-1 rounded hover:bg-white/50"
                              title="Desprogramar"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                        {vehiculosEnFranja.length === 0 && selectedPendiente && !isPast && (
                          <div className="text-xs text-gray-600 text-center py-1 flex items-center justify-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Click
                          </div>
                        )}
                        {vehiculosEnFranja.length === 0 && !selectedPendiente && !isPast && (
                          <div className="text-xs text-gray-400 text-center py-1">
                            -
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}