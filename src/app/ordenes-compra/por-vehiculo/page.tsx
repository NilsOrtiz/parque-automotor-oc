'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase, type OrdenCompraPorVehiculo, getMonedaInfo } from '@/lib/supabase'
import { ArrowLeft, Car, FileText, DollarSign, Calendar } from 'lucide-react'
import FiltroMonedas from '@/components/FiltroMonedas'
import FiltroFechas from '@/components/FiltroFechas'

export default function OCPorVehiculoPage() {
  const [ordenesDetalle, setOrdenesDetalle] = useState<OrdenCompraPorVehiculo[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroInterno, setFiltroInterno] = useState('')
  const [monedasSeleccionadas, setMonedasSeleccionadas] = useState<string[]>(['ARS', 'BRL', 'USD'])
  const [simbolosMonedas, setSimbolosMonedas] = useState<Record<string, string>>({})
  const [fechaInicio, setFechaInicio] = useState<string | null>(null)
  const [fechaFin, setFechaFin] = useState<string | null>(null)

  useEffect(() => {
    fetchOrdenesDetalle()
  }, [])

  async function fetchOrdenesDetalle() {
    try {
      const { data, error } = await supabase
        .from('ordenes_de_compra_por_vehiculo')
        .select('*')
        .order('fecha', { ascending: false })

      if (error) throw error
      setOrdenesDetalle(data || [])
    } catch (error) {
      console.error('Error fetching ordenes detalle:', error)
    } finally {
      setLoading(false)
    }
  }

  const ordenesFiltradas = ordenesDetalle.filter(orden => {
    const matchesInterno = filtroInterno === '' || orden.interno.toString().includes(filtroInterno)
    const matchesMoneda = monedasSeleccionadas.length === 0 || !orden.moneda || monedasSeleccionadas.includes(orden.moneda)
    
    // Filtro por fecha
    let matchesFecha = true
    if (fechaInicio && fechaFin) {
      const fechaOrden = new Date(orden.fecha)
      const inicio = new Date(fechaInicio)
      const fin = new Date(fechaFin)
      fin.setHours(23, 59, 59, 999)
      matchesFecha = fechaOrden >= inicio && fechaOrden <= fin
    }
    
    return matchesInterno && matchesMoneda && matchesFecha
  })

  const totalMonto = ordenesFiltradas.reduce((sum, orden) => sum + (orden.monto_vehiculo || 0), 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Cargando órdenes por vehículo...</div>
      </div>
    )
  }

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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">📊 Análisis por Vehículo</h1>
              <p className="text-gray-600">Detalle granular de gastos por vehículo específico</p>
            </div>
          </div>
        </div>

        {/* Resumen */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{ordenesFiltradas.length}</p>
                <p className="text-sm text-gray-600">Registros Totales</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center">
              <Car className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {new Set(ordenesFiltradas.map(o => o.interno)).size}
                </p>
                <p className="text-sm text-gray-600">Vehículos Únicos</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">${totalMonto.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Monto Total</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="space-y-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">Filtrar por Interno:</label>
              <input
                type="text"
                placeholder="Número interno..."
                value={filtroInterno}
                onChange={(e) => setFiltroInterno(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              />
              {filtroInterno && (
                <button
                  onClick={() => setFiltroInterno('')}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Limpiar
                </button>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Código OC
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vehículo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Versión
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PDF
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {ordenesFiltradas.map((orden) => (
                  <tr key={orden.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {orden.codigo_oc}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(orden.fecha).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div className="font-medium">Int. {orden.interno} - {orden.placa}</div>
                        <div className="text-gray-500 text-xs">{orden.modelo}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                      <div className="truncate" title={orden.items || ''}>
                        {orden.items || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="font-semibold">
                        ${(orden.monto_vehiculo || 0).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      {orden.version ? (
                        <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                          {orden.version}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
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
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {ordenesFiltradas.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No hay registros por vehículo</p>
            <p className="text-gray-400 text-sm mt-2">
              {filtroInterno ? 'Intenta con otro filtro' : 'Los registros aparecerán aquí al crear OCs'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}