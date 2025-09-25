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

      {/* Tabla de vehículos pendientes */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        {vehiculosPendientes.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <AlertTriangle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              ¡Excelente! No hay vehículos críticos
            </h3>
            <p className="text-gray-600">
              Todos los vehículos de Cuenca del Plata están en buen estado de mantenimiento
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Vehículos Pendientes - Operaciones</h2>
              <p className="text-sm text-gray-600 mt-1">Vehículos que requieren mantenimiento inmediato (≤5% vida útil)</p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Interno
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Placa
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trasladar a
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tiempo Estimado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Criticidad
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acción
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {vehiculosPendientes.map((vehiculo) => {
                    const porcentajeKm = getPorcentajeRestante(
                      vehiculo.kilometraje_actual,
                      vehiculo.aceite_motor_km,
                      vehiculo.intervalo_cambio_aceite
                    )

                    const porcentajeHr = getPorcentajeRestanteHoras(
                      vehiculo.hora_actual,
                      vehiculo.aceite_motor_hr,
                      vehiculo.intervalo_cambio_aceite_hr
                    )

                    return (
                      <tr key={vehiculo.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{vehiculo.Nro_Interno}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex flex-col">
                            <span className="font-medium">{vehiculo.Placa}</span>
                            <span className="text-xs text-gray-500">
                              {vehiculo.Marca} {vehiculo.Modelo}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                            <Wrench className="h-3 w-3 mr-1" />
                            Taller
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="font-medium text-blue-900">
                            {getTiempoEstimadoTaller(vehiculo)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col space-y-1">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              (porcentajeKm !== null && porcentajeKm <= 1) || (porcentajeHr !== null && porcentajeHr <= 1)
                                ? 'bg-red-100 text-red-800'
                                : (porcentajeKm !== null && porcentajeKm <= 3) || (porcentajeHr !== null && porcentajeHr <= 3)
                                  ? 'bg-orange-100 text-orange-800'
                                  : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              {(porcentajeKm !== null && porcentajeKm <= 1) || (porcentajeHr !== null && porcentajeHr <= 1)
                                ? 'INMEDIATA'
                                : (porcentajeKm !== null && porcentajeKm <= 3) || (porcentajeHr !== null && porcentajeHr <= 3)
                                  ? 'ALTA'
                                  : 'MEDIA'
                              }
                            </span>
                            <div className="text-xs text-gray-500">
                              {porcentajeKm !== null && (
                                <div>{porcentajeKm.toFixed(1)}% vida km</div>
                              )}
                              {porcentajeHr !== null && (
                                <div>{porcentajeHr.toFixed(1)}% vida hrs</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <button
                            className="inline-flex items-center px-3 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors"
                          >
                            <Clock className="h-4 w-4 mr-1" />
                            Programar
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}