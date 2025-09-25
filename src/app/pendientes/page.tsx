'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase, type Vehiculo } from '@/lib/supabase'
import { ArrowLeft, AlertTriangle, Clock, Wrench, RefreshCw, Truck } from 'lucide-react'

export default function PendientesPage() {
  const [vehiculosPendientes, setVehiculosPendientes] = useState<Vehiculo[]>([])
  const [loading, setLoading] = useState(true)
  const [ultimaActualizacion, setUltimaActualizacion] = useState<string>('')

  useEffect(() => {
    cargarVehiculosPendientes()
    // Auto-refresh cada 30 minutos
    const interval = setInterval(cargarVehiculosPendientes, 30 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  async function cargarVehiculosPendientes() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('vehiculos')
        .select('*')
        .not('Nro_Interno', 'is', null) // Solo vehículos de Cuenca del Plata (tienen número interno)
        .order('Nro_Interno', { ascending: true })

      if (error) throw error

      // Filtrar solo vehículos con ≤5% vida útil (estado crítico)
      const vehiculosCriticos = (data || []).filter(vehiculo => {
        const porcentaje = getPorcentajeRestante(
          vehiculo.kilometraje_actual,
          vehiculo.aceite_motor_km,
          vehiculo.intervalo_cambio_aceite
        )
        const porcentajeHoras = getPorcentajeRestanteHoras(
          vehiculo.hora_actual,
          vehiculo.aceite_motor_hr,
          vehiculo.intervalo_cambio_aceite_hr
        )

        // Considerar crítico si cualquiera de los dos está ≤5%
        const esCriticoKm = porcentaje !== null && porcentaje <= 5
        const esCriticoHr = porcentajeHoras !== null && porcentajeHoras <= 5

        return esCriticoKm || esCriticoHr
      })

      setVehiculosPendientes(vehiculosCriticos)
      setUltimaActualizacion(new Date().toLocaleString('es-UY', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }))
    } catch (error) {
      console.error('Error cargando vehículos pendientes:', error)
    } finally {
      setLoading(false)
    }
  }

  // Funciones copiadas de mantenimientos para calcular vida útil
  function getPorcentajeRestante(kilometrajeActual?: number, aceiteMotorKm?: number, intervaloCambio?: number) {
    if (!kilometrajeActual || !aceiteMotorKm) return null

    const intervalo = intervaloCambio || 10000
    const kmRecorridos = kilometrajeActual - aceiteMotorKm
    const kmFaltantes = intervalo - kmRecorridos
    const porcentaje = (kmFaltantes / intervalo) * 100
    return Math.max(0, Math.min(100, porcentaje))
  }

  function getPorcentajeRestanteHoras(horaActual?: number, aceiteMotorHr?: number, intervaloCambioHr?: number) {
    if (!horaActual || !aceiteMotorHr || !intervaloCambioHr) return null

    const hrRecorridas = horaActual - aceiteMotorHr
    const hrFaltantes = intervaloCambioHr - hrRecorridas
    const porcentaje = (hrFaltantes / intervaloCambioHr) * 100
    return Math.max(0, Math.min(100, porcentaje))
  }

  function getKmFaltantes(kilometrajeActual?: number, aceiteMotorKm?: number, intervaloCambio?: number) {
    if (!kilometrajeActual || !aceiteMotorKm) return null

    const intervalo = intervaloCambio || 10000
    const kmRecorridos = kilometrajeActual - aceiteMotorKm
    const kmFaltantes = intervalo - kmRecorridos
    return kmFaltantes > 0 ? kmFaltantes : 0
  }

  function getHrFaltantes(horaActual?: number, aceiteMotorHr?: number, intervaloCambioHr?: number) {
    if (!horaActual || !aceiteMotorHr || !intervaloCambioHr) return null

    const hrRecorridas = horaActual - aceiteMotorHr
    const hrFaltantes = intervaloCambioHr - hrRecorridas
    return hrFaltantes > 0 ? hrFaltantes : 0
  }

  function getTiempoEstimadoTaller(vehiculo: Vehiculo): string {
    // Estimar tiempo basado en estado crítico
    const porcentajeKm = getPorcentajeRestante(vehiculo.kilometraje_actual, vehiculo.aceite_motor_km, vehiculo.intervalo_cambio_aceite)
    const porcentajeHr = getPorcentajeRestanteHoras(vehiculo.hora_actual, vehiculo.aceite_motor_hr, vehiculo.intervalo_cambio_aceite_hr)

    if ((porcentajeKm !== null && porcentajeKm <= 1) || (porcentajeHr !== null && porcentajeHr <= 1)) {
      return '4-6 horas (mantenimiento completo)'
    } else if ((porcentajeKm !== null && porcentajeKm <= 3) || (porcentajeHr !== null && porcentajeHr <= 3)) {
      return '3-4 horas (cambio aceite + filtros)'
    } else {
      return '2-3 horas (cambio aceite)'
    }
  }

  function getPrioridadColor(vehiculo: Vehiculo): string {
    const porcentajeKm = getPorcentajeRestante(vehiculo.kilometraje_actual, vehiculo.aceite_motor_km, vehiculo.intervalo_cambio_aceite)
    const porcentajeHr = getPorcentajeRestanteHoras(vehiculo.hora_actual, vehiculo.aceite_motor_hr, vehiculo.intervalo_cambio_aceite_hr)

    const minPorcentaje = Math.min(porcentajeKm || 100, porcentajeHr || 100)

    if (minPorcentaje <= 1) return 'border-l-red-600 bg-red-50'
    if (minPorcentaje <= 3) return 'border-l-orange-500 bg-orange-50'
    return 'border-l-yellow-500 bg-yellow-50'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-600" />
          <div className="text-lg">Cargando vehículos pendientes...</div>
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
            <button
              onClick={cargarVehiculosPendientes}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar lista
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Pendientes de Mantenimiento
              </h1>
              <p className="text-gray-600">
                Vehículos de Cuenca del Plata que requieren mantenimiento urgente (≤5% vida útil)
              </p>
            </div>

            <div className="text-right">
              <div className="text-2xl font-bold text-red-600">{vehiculosPendientes.length}</div>
              <div className="text-sm text-gray-500">vehículos pendientes</div>
            </div>
          </div>

          {ultimaActualizacion && (
            <div className="mt-4 text-xs text-gray-500">
              Última actualización: {ultimaActualizacion}
            </div>
          )}
        </div>
      </div>

      {/* Lista de vehículos pendientes */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        {vehiculosPendientes.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-white rounded-lg shadow-sm p-8">
              <div className="text-green-500 mb-4">
                <svg className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                ¡Excelente trabajo!
              </h3>
              <p className="text-gray-600">
                Todos los vehículos de Cuenca del Plata están al día con sus mantenimientos
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {vehiculosPendientes.map((vehiculo) => {
              const porcentajeKm = getPorcentajeRestante(vehiculo.kilometraje_actual, vehiculo.aceite_motor_km, vehiculo.intervalo_cambio_aceite)
              const porcentajeHr = getPorcentajeRestanteHoras(vehiculo.hora_actual, vehiculo.aceite_motor_hr, vehiculo.intervalo_cambio_aceite_hr)
              const kmFaltantes = getKmFaltantes(vehiculo.kilometraje_actual, vehiculo.aceite_motor_km, vehiculo.intervalo_cambio_aceite)
              const hrFaltantes = getHrFaltantes(vehiculo.hora_actual, vehiculo.aceite_motor_hr, vehiculo.intervalo_cambio_aceite_hr)

              return (
                <div
                  key={vehiculo.id}
                  className={`bg-white rounded-lg shadow-sm border-l-4 ${getPrioridadColor(vehiculo)} p-4 hover:shadow-md transition-shadow`}
                >
                  <div className="flex items-center justify-between">
                    {/* Info básica del vehículo */}
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="bg-gray-100 rounded-lg p-2">
                          <Truck className="h-5 w-5 text-gray-600" />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-baseline space-x-2">
                          <span className="text-lg font-bold text-gray-900">
                            Móvil #{vehiculo.Nro_Interno}
                          </span>
                          <span className="text-sm text-gray-600">{vehiculo.Placa}</span>
                          <span className="text-xs text-gray-400">
                            {vehiculo.Marca} {vehiculo.Modelo}
                          </span>
                        </div>

                        <div className="text-xs text-gray-500 mt-1">
                          {vehiculo.kilometraje_actual?.toLocaleString() || 'N/A'} km
                          {vehiculo.hora_actual && (
                            <span className="ml-2">• {vehiculo.hora_actual.toLocaleString()} hrs</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Estado crítico compacto */}
                    <div className="flex items-center space-x-4">
                      <div className="text-center">
                        <div className="flex items-center text-red-600 mb-1">
                          <AlertTriangle className="h-4 w-4 mr-1" />
                          <span className="text-sm font-medium">Crítico</span>
                        </div>
                        <div className="space-y-1">
                          {porcentajeKm !== null && (
                            <div className="text-xs">
                              <span className="font-medium text-red-700">{porcentajeKm.toFixed(1)}%</span>
                              <span className="text-gray-600 ml-1">vida km</span>
                            </div>
                          )}
                          {porcentajeHr !== null && (
                            <div className="text-xs">
                              <span className="font-medium text-red-700">{porcentajeHr.toFixed(1)}%</span>
                              <span className="text-gray-600 ml-1">vida hrs</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Tiempo y urgencia */}
                      <div className="text-center">
                        <div className="text-xs text-gray-600 mb-1">Tiempo estimado</div>
                        <div className="text-sm font-medium text-blue-900 mb-2">
                          {getTiempoEstimadoTaller(vehiculo).split(' ')[0]}
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          (porcentajeKm !== null && porcentajeKm <= 1) || (porcentajeHr !== null && porcentajeHr <= 1)
                            ? 'bg-red-100 text-red-800'
                            : (porcentajeKm !== null && porcentajeKm <= 3) || (porcentajeHr !== null && porcentajeHr <= 3)
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {(porcentajeKm !== null && porcentajeKm <= 1) || (porcentajeHr !== null && porcentajeHr <= 1)
                            ? 'INMEDIATA'
                            : (porcentajeKm !== null && porcentajeKm <= 3) || (porcentajeHr !== null && porcentajeHr <= 3)
                              ? 'ALTA'
                              : 'MEDIA'
                          }
                        </span>
                      </div>

                      {/* Botón de acción */}
                      <div>
                        <Link
                          href={`/vehiculos/registro-servicio?placa=${vehiculo.Placa}`}
                          className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Wrench className="h-4 w-4 mr-1" />
                          Registrar
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}