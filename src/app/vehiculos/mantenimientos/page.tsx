'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase, type Vehiculo } from '@/lib/supabase'
import { ArrowLeft, Settings, AlertTriangle, CheckCircle, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react'

type SortField = 'interno' | 'placa' | 'marca' | 'km_actual' | 'ultimo_cambio' | 'km_faltantes' | 'estado'
type SortDirection = 'asc' | 'desc'

export default function MantenimientosPage() {
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([])
  const [loading, setLoading] = useState(true)
  const [sortField, setSortField] = useState<SortField>('interno')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [tipoFlota, setTipoFlota] = useState<'rent-car' | 'ambos' | 'cuenca'>('ambos')

  useEffect(() => {
    fetchVehiculos()
  }, [])

  async function fetchVehiculos() {
    try {
      const { data, error } = await supabase
        .from('vehiculos')
        .select('*')
        .order('Nro_Interno', { ascending: true })

      if (error) throw error
      setVehiculos(data || [])
    } catch (error) {
      console.error('Error fetching vehiculos:', error)
    } finally {
      setLoading(false)
    }
  }

  function getEstadoMantenimiento(kilometrajeActual?: number, aceiteMotorKm?: number, intervaloCambio?: number) {
    if (!kilometrajeActual || !aceiteMotorKm) return 'sin-datos'
    
    // Usar intervalo personalizado o 10000 km por defecto
    const intervalo = intervaloCambio || 10000
    
    const kmRecorridos = kilometrajeActual - aceiteMotorKm
    const kmFaltantes = intervalo - kmRecorridos
    const porcentajeRestante = (kmFaltantes / intervalo) * 100
    
    if (porcentajeRestante >= 30) return 'ok'
    if (porcentajeRestante >= 10) return 'atencion'
    return 'critico'
  }

  function getKmFaltantes(kilometrajeActual?: number, aceiteMotorKm?: number, intervaloCambio?: number) {
    if (!kilometrajeActual || !aceiteMotorKm) return null
    
    // Usar intervalo personalizado o 10000 km por defecto
    const intervalo = intervaloCambio || 10000
    
    const kmRecorridos = kilometrajeActual - aceiteMotorKm
    const kmFaltantes = intervalo - kmRecorridos
    return kmFaltantes > 0 ? kmFaltantes : 0
  }

  function getPorcentajeRestante(kilometrajeActual?: number, aceiteMotorKm?: number, intervaloCambio?: number) {
    if (!kilometrajeActual || !aceiteMotorKm) return null
    
    // Usar intervalo personalizado o 10000 km por defecto
    const intervalo = intervaloCambio || 10000
    
    const kmRecorridos = kilometrajeActual - aceiteMotorKm
    const kmFaltantes = intervalo - kmRecorridos
    const porcentaje = (kmFaltantes / intervalo) * 100
    return Math.max(0, Math.min(100, porcentaje))
  }

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  function getSortedVehiculos() {
    // Primero filtrar por tipo de flota
    let filtrados = vehiculos
    
    if (tipoFlota === 'rent-car') {
      // Solo vehículos sin interno (Rent Car)
      filtrados = vehiculos.filter(v => !v.Nro_Interno || v.Nro_Interno === 0)
    } else if (tipoFlota === 'cuenca') {
      // Solo vehículos con interno (Cuenca del Plata)
      filtrados = vehiculos.filter(v => v.Nro_Interno && v.Nro_Interno > 0)
    }
    // Si es 'ambos', no filtramos (filtrados = vehiculos)
    
    const sorted = [...filtrados].sort((a, b) => {
      let aValue: any, bValue: any

      switch (sortField) {
        case 'interno':
          aValue = a.Nro_Interno
          bValue = b.Nro_Interno
          break
        case 'placa':
          aValue = a.Placa
          bValue = b.Placa
          break
        case 'marca':
          aValue = `${a.Marca} ${a.Modelo}`
          bValue = `${b.Marca} ${b.Modelo}`
          break
        case 'km_actual':
          aValue = a.kilometraje_actual || 0
          bValue = b.kilometraje_actual || 0
          break
        case 'ultimo_cambio':
          aValue = a.aceite_motor_km || 0
          bValue = b.aceite_motor_km || 0
          break
        case 'km_faltantes':
          aValue = getKmFaltantes(a.kilometraje_actual, a.aceite_motor_km) || 0
          bValue = getKmFaltantes(b.kilometraje_actual, b.aceite_motor_km) || 0
          break
        case 'estado':
          const estadoOrder = { 'critico': 0, 'atencion': 1, 'ok': 2, 'sin-datos': 3 }
          aValue = estadoOrder[getEstadoMantenimiento(a.kilometraje_actual, a.aceite_motor_km, a.intervalo_cambio_aceite) as keyof typeof estadoOrder]
          bValue = estadoOrder[getEstadoMantenimiento(b.kilometraje_actual, b.aceite_motor_km, b.intervalo_cambio_aceite) as keyof typeof estadoOrder]
          break
        default:
          return 0
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue)
        return sortDirection === 'asc' ? comparison : -comparison
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    return sorted
  }

  function getSortIcon(field: SortField) {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 text-gray-400" />
    }
    return sortDirection === 'asc' ? 
      <ArrowUp className="h-4 w-4 text-blue-600" /> : 
      <ArrowDown className="h-4 w-4 text-blue-600" />
  }

  function getIconoEstado(estado: string) {
    switch (estado) {
      case 'ok':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'atencion':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      case 'critico':
        return <AlertTriangle className="h-5 w-5 text-red-600" />
      default:
        return <Settings className="h-5 w-5 text-gray-400" />
    }
  }

  function getColorEstado(estado: string) {
    switch (estado) {
      case 'ok':
        return 'bg-green-50 text-green-700'
      case 'atencion':
        return 'bg-yellow-50 text-yellow-700'
      case 'critico':
        return 'bg-red-50 text-red-700'
      default:
        return 'bg-gray-50 text-gray-700'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Cargando información de mantenimientos...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/vehiculos" 
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Vehículos
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Lista de Mantenimientos</h1>
          <p className="text-gray-600">Control de cambios de aceite por vehículo</p>
        </div>

        {/* Interruptor de Flota */}
        <div className="mb-8 flex justify-center">
          <div className="bg-white rounded-lg shadow-sm p-1 inline-flex">
            <button
              onClick={() => setTipoFlota('rent-car')}
              className={`px-6 py-3 rounded-md text-sm font-medium transition-colors ${
                tipoFlota === 'rent-car'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              🚗 Rent Car
              <div className="text-xs mt-1 opacity-80">Solo Placa</div>
            </button>
            <button
              onClick={() => setTipoFlota('ambos')}
              className={`px-6 py-3 rounded-md text-sm font-medium transition-colors ${
                tipoFlota === 'ambos'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              🚛 Ambas Flotas
              <div className="text-xs mt-1 opacity-80">Todas</div>
            </button>
            <button
              onClick={() => setTipoFlota('cuenca')}
              className={`px-6 py-3 rounded-md text-sm font-medium transition-colors ${
                tipoFlota === 'cuenca'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              🚚 Cuenca del Plata
              <div className="text-xs mt-1 opacity-80">Placa + Interno</div>
            </button>
          </div>
        </div>

        {/* Resumen */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{getSortedVehiculos().filter(v => getEstadoMantenimiento(v.kilometraje_actual, v.aceite_motor_km, v.intervalo_cambio_aceite) === 'ok').length}</p>
                <p className="text-sm text-gray-600">Al día (30-100%)</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-yellow-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{getSortedVehiculos().filter(v => getEstadoMantenimiento(v.kilometraje_actual, v.aceite_motor_km, v.intervalo_cambio_aceite) === 'atencion').length}</p>
                <p className="text-sm text-gray-600">Atención (10-30%)</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{getSortedVehiculos().filter(v => getEstadoMantenimiento(v.kilometraje_actual, v.aceite_motor_km, v.intervalo_cambio_aceite) === 'critico').length}</p>
                <p className="text-sm text-gray-600">Crítico (0-10%)</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center">
              <Settings className="h-8 w-8 text-gray-400 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{getSortedVehiculos().filter(v => !v.aceite_motor_km || !v.kilometraje_actual).length}</p>
                <p className="text-sm text-gray-600">Sin datos</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabla de vehículos */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Estado de Mantenimientos</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('interno')}
                  >
                    <div className="flex items-center justify-between">
                      <span>Nro. Interno</span>
                      {getSortIcon('interno')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('placa')}
                  >
                    <div className="flex items-center justify-between">
                      <span>Placa</span>
                      {getSortIcon('placa')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('marca')}
                  >
                    <div className="flex items-center justify-between">
                      <span>Vehículo</span>
                      {getSortIcon('marca')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('km_actual')}
                  >
                    <div className="flex items-center justify-between">
                      <span>Km Actual</span>
                      {getSortIcon('km_actual')}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Intervalo
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('ultimo_cambio')}
                  >
                    <div className="flex items-center justify-between">
                      <span>Último Cambio</span>
                      {getSortIcon('ultimo_cambio')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('km_faltantes')}
                  >
                    <div className="flex items-center justify-between">
                      <span>Km Faltantes</span>
                      {getSortIcon('km_faltantes')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('estado')}
                  >
                    <div className="flex items-center justify-between">
                      <span>Estado</span>
                      {getSortIcon('estado')}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getSortedVehiculos().map((vehiculo) => {
                  const estado = getEstadoMantenimiento(vehiculo.kilometraje_actual, vehiculo.aceite_motor_km, vehiculo.intervalo_cambio_aceite)
                  const kmFaltantes = getKmFaltantes(vehiculo.kilometraje_actual, vehiculo.aceite_motor_km, vehiculo.intervalo_cambio_aceite)
                  const porcentaje = getPorcentajeRestante(vehiculo.kilometraje_actual, vehiculo.aceite_motor_km, vehiculo.intervalo_cambio_aceite)
                  return (
                    <tr key={vehiculo.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {vehiculo.Nro_Interno}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {vehiculo.Placa}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div className="font-medium">{vehiculo.Marca} {vehiculo.Modelo}</div>
                          <div className="text-gray-500">{vehiculo.Año}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {vehiculo.kilometraje_actual 
                          ? vehiculo.kilometraje_actual.toLocaleString() + ' km'
                          : 'No registrado'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                          {(vehiculo.intervalo_cambio_aceite || 10000).toLocaleString()} km
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {vehiculo.aceite_motor_km 
                          ? vehiculo.aceite_motor_km.toLocaleString() + ' km'
                          : 'No registrado'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {kmFaltantes !== null ? (
                          <div className="flex flex-col">
                            <span className="font-medium">{kmFaltantes.toLocaleString()} km</span>
                            {porcentaje !== null && (
                              <div className="flex items-center mt-1">
                                <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                  <div 
                                    className={`h-2 rounded-full ${
                                      porcentaje >= 30 ? 'bg-green-500' :
                                      porcentaje >= 10 ? 'bg-yellow-500' : 'bg-red-500'
                                    }`}
                                    style={{ width: `${porcentaje}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs text-gray-500">{Math.round(porcentaje)}%</span>
                              </div>
                            )}
                          </div>
                        ) : 'Sin datos'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getColorEstado(estado)}`}>
                          {getIconoEstado(estado)}
                          <span className="ml-2">
                            {estado === 'ok' && 'Al día'}
                            {estado === 'atencion' && 'Requiere atención'}
                            {estado === 'critico' && 'Crítico'}
                            {estado === 'sin-datos' && 'Sin datos'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {vehiculos.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No hay vehículos registrados</p>
            <p className="text-gray-400 text-sm mt-2">Los vehículos aparecerán aquí una vez que sean agregados al sistema</p>
          </div>
        )}
      </div>
    </div>
  )
}