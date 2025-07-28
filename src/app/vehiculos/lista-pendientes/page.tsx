'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, AlertTriangle, CheckCircle, Clock, ArrowUp, ArrowDown, ArrowUpDown, User } from 'lucide-react'

interface PendienteConVehiculo {
  id_pendiente: number
  id: number
  clasificacion: string
  subclasificacion?: string
  descripcion: string
  prioridad: 'leve' | 'medio' | 'critico'
  tiempo_estimado?: number
  estado?: string
  fecha_creacion: string
  fecha_programada?: string
  created_at: string
  // Datos del vehículo
  placa: string
  nro_interno: number
  marca: string
  modelo: string
  año: number
}

type SortField = 'interno' | 'placa' | 'marca' | 'clasificacion' | 'prioridad' | 'fecha_creacion' | 'tiempo_estimado'
type SortDirection = 'asc' | 'desc'

export default function ListaPendientesPage() {
  const [pendientes, setPendientes] = useState<PendienteConVehiculo[]>([])
  const [loading, setLoading] = useState(true)
  const [sortField, setSortField] = useState<SortField>('fecha_creacion')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [tipoFlota, setTipoFlota] = useState<'rent-car' | 'ambos' | 'cuenca'>('ambos')
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'pendiente' | 'en_progreso'>('todos')
  const [filtroPrioridad, setFiltroPrioridad] = useState<'todos' | 'critico' | 'medio' | 'leve'>('todos')

  useEffect(() => {
    fetchPendientes()
  }, [])

  async function fetchPendientes() {
    try {
      const { data, error } = await supabase
        .from('pendientes_observaciones')
        .select(`
          *,
          vehiculos!inner (
            Placa,
            Nro_Interno,
            Marca,
            Modelo,
            Año
          )
        `)
        .order('fecha_creacion', { ascending: false })

      if (error) throw error

      // Transformar datos para incluir información del vehículo
      const pendientesConVehiculo = (data || []).map(item => ({
        ...item,
        placa: item.vehiculos.Placa,
        nro_interno: item.vehiculos.Nro_Interno,
        marca: item.vehiculos.Marca,
        modelo: item.vehiculos.Modelo,
        año: item.vehiculos.Año
      }))

      setPendientes(pendientesConVehiculo)
    } catch (error) {
      console.error('Error fetching pendientes:', error)
    } finally {
      setLoading(false)
    }
  }

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  function getSortedPendientes() {
    let filtrados = pendientes

    // Filtrar por tipo de flota
    if (tipoFlota === 'rent-car') {
      filtrados = filtrados.filter(p => !p.nro_interno || p.nro_interno === 0)
    } else if (tipoFlota === 'cuenca') {
      filtrados = filtrados.filter(p => p.nro_interno && p.nro_interno > 0)
    }

    // Filtrar por estado
    if (filtroEstado !== 'todos') {
      filtrados = filtrados.filter(p => p.estado === filtroEstado)
    }

    // Filtrar por prioridad
    if (filtroPrioridad !== 'todos') {
      filtrados = filtrados.filter(p => p.prioridad === filtroPrioridad)
    }

    const sorted = [...filtrados].sort((a, b) => {
      let aValue: any, bValue: any

      switch (sortField) {
        case 'interno':
          aValue = a.nro_interno || 0
          bValue = b.nro_interno || 0
          break
        case 'placa':
          aValue = a.placa
          bValue = b.placa
          break
        case 'marca':
          aValue = `${a.marca} ${a.modelo}`
          bValue = `${b.marca} ${b.modelo}`
          break
        case 'clasificacion':
          aValue = a.clasificacion
          bValue = b.clasificacion
          break
        case 'prioridad':
          const prioridadOrder = { 'critico': 0, 'medio': 1, 'leve': 2 }
          aValue = prioridadOrder[a.prioridad]
          bValue = prioridadOrder[b.prioridad]
          break
        case 'fecha_creacion':
          aValue = new Date(a.fecha_creacion).getTime()
          bValue = new Date(b.fecha_creacion).getTime()
          break
        case 'tiempo_estimado':
          aValue = a.tiempo_estimado || 0
          bValue = b.tiempo_estimado || 0
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

  function getIconoPrioridad(prioridad: string) {
    switch (prioridad) {
      case 'critico':
        return <AlertTriangle className="h-5 w-5 text-red-600" />
      case 'medio':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      case 'leve':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-400" />
    }
  }

  function getColorPrioridad(prioridad: string) {
    switch (prioridad) {
      case 'critico':
        return 'bg-red-50 text-red-700'
      case 'medio':
        return 'bg-yellow-50 text-yellow-700'
      case 'leve':
        return 'bg-green-50 text-green-700'
      default:
        return 'bg-gray-50 text-gray-700'
    }
  }

  function getDiasTranscurridos(fecha: string) {
    const fechaCreacion = new Date(fecha)
    const fechaActual = new Date()
    return Math.floor((fechaActual.getTime() - fechaCreacion.getTime()) / (1000 * 60 * 60 * 24))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Cargando lista de pendientes...</div>
      </div>
    )
  }

  const pendientesFiltrados = getSortedPendientes()

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Lista de Pendientes</h1>
          <p className="text-gray-600">Problemas reportados pendientes de resolver por vehículo</p>
        </div>

        {/* Controles de filtrado */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="space-y-4">
            {/* Selector de flota */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Flota</label>
              <div className="flex space-x-4">
                {[
                  { value: 'rent-car', label: '🚗 Rent Car', desc: 'Solo Placa' },
                  { value: 'ambos', label: '🚛 Ambas Flotas', desc: 'Todas' },
                  { value: 'cuenca', label: '🚚 Cuenca del Plata', desc: 'Placa + Interno' }
                ].map(({ value, label, desc }) => (
                  <button
                    key={value}
                    onClick={() => setTipoFlota(value as any)}
                    className={`px-4 py-2 rounded-lg transition-colors text-sm ${
                      tipoFlota === value
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <div>{label}</div>
                    <div className="text-xs opacity-80">{desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Filtros adicionales */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
                <select
                  value={filtroEstado}
                  onChange={(e) => setFiltroEstado(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="todos">Todos los estados</option>
                  <option value="pendiente">Pendiente</option>
                  <option value="en_progreso">En Progreso</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Prioridad</label>
                <select
                  value={filtroPrioridad}
                  onChange={(e) => setFiltroPrioridad(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="todos">Todas las prioridades</option>
                  <option value="critico">🔴 Crítico</option>
                  <option value="medio">🟡 Medio</option>
                  <option value="leve">🟢 Leve</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Resumen */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {pendientesFiltrados.filter(p => p.prioridad === 'critico').length}
                </p>
                <p className="text-sm text-gray-600">Críticos</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-yellow-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {pendientesFiltrados.filter(p => p.prioridad === 'medio').length}
                </p>
                <p className="text-sm text-gray-600">Medios</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {pendientesFiltrados.filter(p => p.prioridad === 'leve').length}
                </p>
                <p className="text-sm text-gray-600">Leves</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {pendientesFiltrados.reduce((sum, p) => sum + (p.tiempo_estimado || 0), 0)}h
                </p>
                <p className="text-sm text-gray-600">Tiempo Total</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabla de pendientes */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Problemas Pendientes ({pendientesFiltrados.length})
            </h2>
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
                      <span>Vehículo</span>
                      {getSortIcon('interno')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('clasificacion')}
                  >
                    <div className="flex items-center justify-between">
                      <span>Problema</span>
                      {getSortIcon('clasificacion')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('prioridad')}
                  >
                    <div className="flex items-center justify-between">
                      <span>Prioridad</span>
                      {getSortIcon('prioridad')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('tiempo_estimado')}
                  >
                    <div className="flex items-center justify-between">
                      <span>Tiempo Est.</span>
                      {getSortIcon('tiempo_estimado')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('fecha_creacion')}
                  >
                    <div className="flex items-center justify-between">
                      <span>Reportado</span>
                      {getSortIcon('fecha_creacion')}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descripción
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendientesFiltrados.map((pendiente) => (
                  <tr key={pendiente.id_pendiente} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div className="font-medium">
                          {pendiente.nro_interno ? `#${pendiente.nro_interno}` : ''} {pendiente.placa}
                        </div>
                        <div className="text-gray-500 text-xs">
                          {pendiente.marca} {pendiente.modelo}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <span className="font-medium">{pendiente.clasificacion}</span>
                        {pendiente.subclasificacion && (
                          <div className="text-xs text-gray-500">{pendiente.subclasificacion}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getColorPrioridad(pendiente.prioridad)}`}>
                        {getIconoPrioridad(pendiente.prioridad)}
                        <span className="ml-2">
                          {pendiente.prioridad === 'critico' && '🔴 Crítico'}
                          {pendiente.prioridad === 'medio' && '🟡 Medio'}
                          {pendiente.prioridad === 'leve' && '🟢 Leve'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {pendiente.tiempo_estimado ? (
                        <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                          <Clock className="h-3 w-3 mr-1" />
                          {pendiente.tiempo_estimado}h
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div className="font-medium">
                          {new Date(pendiente.fecha_creacion).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          Hace {getDiasTranscurridos(pendiente.fecha_creacion)} días
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                      <div className="truncate" title={pendiente.descripcion}>
                        {pendiente.descripcion}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {pendientesFiltrados.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No hay problemas pendientes</p>
            <p className="text-gray-400 text-sm mt-2">¡Excelente! Todos los vehículos están en buen estado</p>
          </div>
        )}
      </div>
    </div>
  )
}