'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase, type OrdenCompra, getMonedaInfo } from '@/lib/supabase'
import { ArrowLeft, CheckCircle, Clock, XCircle, ArrowUp, ArrowDown, ArrowUpDown, Search } from 'lucide-react'
import FiltroMonedas from '@/components/FiltroMonedas'
import FiltroFechas from '@/components/FiltroFechas'

type SortField = 'codigo' | 'fecha' | 'proveedor' | 'monto' | 'placa' | 'estado'
type SortDirection = 'asc' | 'desc'

export default function ListadoOCPage() {
  const [ordenes, setOrdenes] = useState<OrdenCompra[]>([])
  const [loading, setLoading] = useState(true)
  const [sortField, setSortField] = useState<SortField>('fecha')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [filterEstado, setFilterEstado] = useState<'todas' | 'pendientes' | 'aprobadas'>('todas')
  const [monedasSeleccionadas, setMonedasSeleccionadas] = useState<string[]>(['ARS', 'BRL', 'USD']) // Por defecto las principales
  const [simbolosMonedas, setSimbolosMonedas] = useState<Record<string, string>>({})
  const [fechaInicio, setFechaInicio] = useState<string | null>(null)
  const [fechaFin, setFechaFin] = useState<string | null>(null)
  const [buscarCodigo, setBuscarCodigo] = useState('')

  useEffect(() => {
    fetchOrdenes()
    cargarSimbolosMonedas()
  }, [])

  // Cargar símbolos de monedas para mostrar correctamente
  async function cargarSimbolosMonedas() {
    const simbolos: Record<string, string> = {}
    const monedasUnicas = [...new Set(ordenes.map(o => o.moneda).filter(Boolean))]
    
    for (const codigo of monedasUnicas) {
      if (codigo) {
        try {
          const info = await getMonedaInfo(codigo)
          simbolos[codigo] = info.simbolo
        } catch (error) {
          simbolos[codigo] = '$' // Fallback
        }
      }
    }
    setSimbolosMonedas(simbolos)
  }

  async function fetchOrdenes() {
    try {
      const { data, error } = await supabase
        .from('ordenes_de_compra')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setOrdenes(data || [])
    } catch (error) {
      console.error('Error fetching ordenes:', error)
    } finally {
      setLoading(false)
    }
  }

  function getEstadoOrden(orden: OrdenCompra) {
    if (orden.est_compras && orden.est_tesoreria) return 'completada'
    if (orden.est_compras && !orden.est_tesoreria) return 'tesoreria'
    return 'compras'
  }

  function getEstadoInfo(estado: string, esEmergencia: boolean = false) {
    switch (estado) {
      case 'completada':
        return {
          color: esEmergencia 
            ? 'bg-green-100 text-green-800 border-green-300 pulso-emergencia-verde' 
            : 'bg-green-100 text-green-800 border-green-300',
          texto: '✅ Completada',
          icono: esEmergencia ? '🚨' : '✅',
          clickeable: false,
          emergencia: esEmergencia
        }
      case 'tesoreria':
        return {
          color: esEmergencia 
            ? 'bg-yellow-100 text-yellow-800 border-yellow-300 sirena-emergencia-amarilla cursor-pointer' 
            : 'bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200 cursor-pointer',
          texto: esEmergencia ? '🚨 URGENTE Tesorería' : '🟡 En Tesorería',
          icono: '💰',
          clickeable: true,
          emergencia: esEmergencia
        }
      case 'compras':
        return {
          color: esEmergencia 
            ? 'bg-red-100 text-red-800 border-red-300 sirena-emergencia-roja cursor-pointer' 
            : 'bg-red-100 text-red-800 border-red-300 hover:bg-red-200 cursor-pointer',
          texto: esEmergencia ? '🚨 URGENTE Compras' : '🔴 Pend. Compras',
          icono: '📋',
          clickeable: true,
          emergencia: esEmergencia
        }
      default:
        return {
          color: 'bg-gray-100 text-gray-800',
          texto: 'Desconocido',
          icono: '❓',
          clickeable: false,
          emergencia: false
        }
    }
  }

  // Función para cambiar estado de OC
  async function cambiarEstadoOC(ordenId: number, estadoActual: string) {
    try {
      let updateData: { est_compras?: boolean, est_tesoreria?: boolean } = {}
      
      if (estadoActual === 'compras') {
        // De "Pend. Compras" → "En Tesorería"
        updateData = { est_compras: true }
      } else if (estadoActual === 'tesoreria') {
        // De "En Tesorería" → "Completada"
        updateData = { est_tesoreria: true }
      } else {
        return // No hacer nada si ya está completada
      }

      const { error } = await supabase
        .from('ordenes_de_compra')
        .update(updateData)
        .eq('id', ordenId)

      if (error) throw error

      // Recargar la lista para mostrar el cambio
      fetchOrdenes()
      
    } catch (error) {
      console.error('Error actualizando estado:', error)
      alert('Error al actualizar el estado de la orden')
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

  function getSortIcon(field: SortField) {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 text-gray-400" />
    }
    return sortDirection === 'asc' ? 
      <ArrowUp className="h-4 w-4 text-blue-600" /> : 
      <ArrowDown className="h-4 w-4 text-blue-600" />
  }

  function getSortedOrdenes() {
    let filtered = ordenes

    // Aplicar filtro por estado
    if (filterEstado !== 'todas') {
      filtered = ordenes.filter(orden => {
        const estado = getEstadoOrden(orden)
        if (filterEstado === 'pendientes') {
          return estado === 'compras' || estado === 'tesoreria'
        }
        if (filterEstado === 'aprobadas') {
          return estado === 'completada'
        }
        return true
      })
    }

    // Aplicar filtro por moneda
    if (monedasSeleccionadas.length > 0) {
      filtered = filtered.filter(orden => 
        !orden.moneda || monedasSeleccionadas.includes(orden.moneda)
      )
    }

    // Aplicar filtro por fecha
    if (fechaInicio && fechaFin) {
      filtered = filtered.filter(orden => {
        const fechaOrden = new Date(orden.fecha)
        const inicio = new Date(fechaInicio)
        const fin = new Date(fechaFin)
        // Incluir todo el día final
        fin.setHours(23, 59, 59, 999)
        return fechaOrden >= inicio && fechaOrden <= fin
      })
    }

    // Aplicar filtro por código de OC
    if (buscarCodigo.trim()) {
      filtered = filtered.filter(orden => 
        orden.codigo.toLowerCase().includes(buscarCodigo.toLowerCase().trim())
      )
    }

    // Aplicar ordenamiento
    const sorted = [...filtered].sort((a, b) => {
      let aValue: any, bValue: any

      switch (sortField) {
        case 'codigo':
          aValue = a.codigo
          bValue = b.codigo
          break
        case 'fecha':
          aValue = new Date(a.fecha)
          bValue = new Date(b.fecha)
          break
        case 'proveedor':
          aValue = a.proveedor || ''
          bValue = b.proveedor || ''
          break
        case 'monto':
          aValue = a.monto || 0
          bValue = b.monto || 0
          break
        case 'placa':
          aValue = a.placa || ''
          bValue = b.placa || ''
          break
        case 'estado':
          const estadoOrder = { 'pendiente': 0, 'compras': 1, 'tesoreria': 2, 'aprobada': 3 }
          aValue = estadoOrder[getEstadoOrden(a) as keyof typeof estadoOrder]
          bValue = estadoOrder[getEstadoOrden(b) as keyof typeof estadoOrder]
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Cargando órdenes de compra...</div>
      </div>
    )
  }

  const sortedOrdenes = getSortedOrdenes()

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/ordenes-compra" 
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Órdenes de Compra
          </Link>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Órdenes de Compra Creadas</h1>
              <p className="text-gray-600">Listado y seguimiento de todas las OC</p>
            </div>
            <Link
              href="/ordenes-compra/crear"
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
            >
              Nueva OC
            </Link>
          </div>
        </div>

        {/* Resumen */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center">
              <XCircle className="h-8 w-8 text-gray-500 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{ordenes.filter(o => getEstadoOrden(o) === 'compras').length}</p>
                <p className="text-sm text-gray-600">Pend. Compras</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{ordenes.filter(o => getEstadoOrden(o) === 'tesoreria').length}</p>
                <p className="text-sm text-gray-600">En Tesorería</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{ordenes.filter(o => getEstadoOrden(o) === 'completada').length}</p>
                <p className="text-sm text-gray-600">Completadas</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-blue-600 font-bold text-sm">T</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{ordenes.length}</p>
                <p className="text-sm text-gray-600">Total</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="space-y-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">Filtrar por estado:</label>
              <select
                value={filterEstado}
                onChange={(e) => setFilterEstado(e.target.value as any)}
                className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              >
                <option value="todas">Todas</option>
                <option value="pendientes">Pendientes/En Proceso</option>
                <option value="aprobadas">Aprobadas</option>
              </select>
            </div>
          </div>

          {/* Buscador por código de OC */}
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-gray-500" />
                <label className="text-sm font-medium text-gray-700">Buscar por código:</label>
              </div>
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="text"
                  placeholder="Ej: 250713AGT-000017"
                  value={buscarCodigo}
                  onChange={(e) => setBuscarCodigo(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white min-w-60 flex-1 max-w-80"
                />
                {buscarCodigo && (
                  <button
                    onClick={() => setBuscarCodigo('')}
                    className="text-red-600 hover:text-red-800 text-sm px-3 py-1 rounded-md hover:bg-red-50 transition-colors border border-red-200"
                  >
                    Limpiar
                  </button>
                )}
              </div>
              {buscarCodigo && (
                <div className="text-sm text-blue-600 font-medium bg-blue-50 px-3 py-1 rounded-full">
                  {getSortedOrdenes().length} resultado(s)
                </div>
              )}
            </div>
          </div>

          {/* Filtro de monedas */}
          <FiltroMonedas
            monedasSeleccionadas={monedasSeleccionadas}
            onMonedasChange={setMonedasSeleccionadas}
          />

          {/* Filtro de fechas */}
          <FiltroFechas
            fechaInicio={fechaInicio}
            fechaFin={fechaFin}
            onFechasChange={(inicio, fin) => {
              setFechaInicio(inicio)
              setFechaFin(fin)
            }}
          />
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('codigo')}
                  >
                    <div className="flex items-center justify-between">
                      <span>ID OC</span>
                      {getSortIcon('codigo')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('fecha')}
                  >
                    <div className="flex items-center justify-between">
                      <span>Fecha</span>
                      {getSortIcon('fecha')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('placa')}
                  >
                    <div className="flex items-center justify-between">
                      <span>Vehículo</span>
                      {getSortIcon('placa')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('proveedor')}
                  >
                    <div className="flex items-center justify-between">
                      <span>Proveedor</span>
                      {getSortIcon('proveedor')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('monto')}
                  >
                    <div className="flex items-center justify-between">
                      <span>Monto</span>
                      {getSortIcon('monto')}
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PDF
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedOrdenes.map((orden) => {
                  const estado = getEstadoOrden(orden)
                  const estadoInfo = getEstadoInfo(estado, orden.es_emergencia)
                  return (
                    <tr key={orden.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {orden.codigo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(orden.fecha + 'T12:00:00').toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{orden.placa}</span>
                            {orden.interno && (
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                                Int. {orden.interno}
                              </span>
                            )}
                          </div>
                          <div className="text-gray-500 text-xs">{orden.modelo}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {orden.proveedor}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {orden.monto ? (
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">
                              {simbolosMonedas[orden.moneda || 'ARS'] || '$'}{orden.monto.toLocaleString()}
                            </span>
                            {orden.moneda && (
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                {orden.moneda}
                              </span>
                            )}
                          </div>
                        ) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div 
                          className={`inline-flex items-center px-3 py-1 rounded-lg border text-xs font-medium transition-all ${estadoInfo.color}`}
                          onClick={() => estadoInfo.clickeable ? cambiarEstadoOC(orden.id, estado) : undefined}
                          title={estadoInfo.clickeable ? `Click para avanzar con ${estadoInfo.icono}` : ''}
                        >
                          <span>{estadoInfo.texto}</span>
                          {estadoInfo.clickeable && (
                            <span className="ml-2 opacity-70">{estadoInfo.icono}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                        {orden.pdf_url ? (
                          <a
                            href={orden.pdf_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-2 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                            title="Ver PDF"
                          >
                            📄 PDF
                          </a>
                        ) : (
                          <span className="text-gray-400 text-xs">Sin PDF</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {sortedOrdenes.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <XCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No hay órdenes de compra</p>
            <p className="text-gray-400 text-sm mt-2">Las órdenes creadas aparecerán aquí</p>
          </div>
        )}
      </div>
    </div>
  )
}