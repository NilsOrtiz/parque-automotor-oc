'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase, type OrdenCompraPorVehiculo, getMonedaInfo } from '@/lib/supabase'
import { ArrowLeft, Car, FileText, DollarSign, Calendar } from 'lucide-react'
import FiltroMonedas from '@/components/FiltroMonedas'
import FiltroFechas from '@/components/FiltroFechas'

type ResumenVehiculo = {
  interno: number
  placa: string
  modelo: string
  titular: string
  gastosPorMoneda: Record<string, number>
  cantidadOrdenes: number
  ultimaOrden: string
  monedaPrincipal: string
  ordenes: OrdenCompraPorVehiculo[]
}

export default function OCPorVehiculoPage() {
  const [ordenesDetalle, setOrdenesDetalle] = useState<OrdenCompraPorVehiculo[]>([])
  const [loading, setLoading] = useState(true)
  const [vistaDetalle, setVistaDetalle] = useState<number | string | null>(null) // null = vista resumen, number = interno del vehículo, 'TALLER' = taller
  const [filtroInterno, setFiltroInterno] = useState('')
  const [monedasSeleccionadas, setMonedasSeleccionadas] = useState<string[]>(['ARS', 'BRL', 'USD'])
  const [simbolosMonedas, setSimbolosMonedas] = useState<Record<string, string>>({})
  const [fechaInicio, setFechaInicio] = useState<string | null>(null)
  const [fechaFin, setFechaFin] = useState<string | null>(null)

  useEffect(() => {
    fetchOrdenesDetalle()
  }, [])

  useEffect(() => {
    if (ordenesDetalle.length > 0) {
      cargarSimbolosMonedas()
    }
  }, [ordenesDetalle])

  // Cargar símbolos de monedas para mostrar correctamente
  async function cargarSimbolosMonedas() {
    const simbolos: Record<string, string> = {}
    const monedasUnicas = [...new Set(ordenesDetalle.map(o => o.moneda).filter(Boolean))]
    
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

  // Calcular total general agrupado por monedas
  const totalPorMoneda = ordenesFiltradas.reduce((acc, orden) => {
    const moneda = orden.moneda || 'ARS'
    const monto = orden.monto_vehiculo || 0
    acc[moneda] = (acc[moneda] || 0) + monto
    return acc
  }, {} as Record<string, number>)

  // Agrupar órdenes por vehículo para crear resumen
  const resumenVehiculos: ResumenVehiculo[] = []
  const vehiculosMap = new Map<string, OrdenCompraPorVehiculo[]>()
  
  // Agrupar por placa (esto separa correctamente TALLER de vehículos sin interno)
  ordenesFiltradas.forEach(orden => {
    const clave = orden.placa // Usar placa como clave principal
    if (!vehiculosMap.has(clave)) {
      vehiculosMap.set(clave, [])
    }
    vehiculosMap.get(clave)!.push(orden)
  })
  
  // Crear resumen por vehículo
  vehiculosMap.forEach((ordenes, placa) => {
    const primeraOrden = ordenes[0]
    const fechasOrdenes = ordenes.map(o => new Date(o.fecha)).sort((a, b) => b.getTime() - a.getTime())
    const ultimaOrden = fechasOrdenes[0]?.toLocaleDateString() || '-'
    
    // Agrupar gastos por moneda
    const gastosPorMoneda = ordenes.reduce((acc, orden) => {
      const moneda = orden.moneda || 'ARS'
      const monto = orden.monto_vehiculo || 0
      acc[moneda] = (acc[moneda] || 0) + monto
      return acc
    }, {} as Record<string, number>)
    
    // Moneda con mayor gasto total (no por frecuencia)
    const monedaPrincipal = Object.entries(gastosPorMoneda)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'ARS'
    
    resumenVehiculos.push({
      interno: primeraOrden.interno || 0, // Usar interno del registro o 0 si no tiene
      placa: primeraOrden.placa,
      modelo: primeraOrden.modelo || 'Sin modelo',
      titular: primeraOrden.titular || 'Sin titular',
      gastosPorMoneda,
      cantidadOrdenes: ordenes.length,
      ultimaOrden,
      monedaPrincipal,
      ordenes
    })
  })
  
  // Ordenar por gasto total descendente (usando moneda principal)
  resumenVehiculos.sort((a, b) => {
    const gastoA = a.gastosPorMoneda[a.monedaPrincipal] || 0
    const gastoB = b.gastosPorMoneda[b.monedaPrincipal] || 0
    return gastoB - gastoA
  })
  
  // Si estamos en vista detalle, obtener las órdenes del vehículo específico
  const ordenesDetalleFiltradas = vistaDetalle 
    ? resumenVehiculos.find(v => {
        // Ahora usamos placa como identificador principal
        return v.placa === vistaDetalle
      })?.ordenes || []
    : []

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
          <div className="flex items-center gap-2 mb-4">
            {vistaDetalle ? (
              <button
                onClick={() => setVistaDetalle(null)}
                className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al Resumen
              </button>
            ) : (
              <Link 
                href="/ordenes-compra" 
                className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver a Órdenes de Compra
              </Link>
            )}
          </div>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {vistaDetalle 
                  ? `🚗 Detalle ${vistaDetalle}` 
                  : '📊 Dashboard por Vehículo'
                }
              </h1>
              <p className="text-gray-600">
                {vistaDetalle 
                  ? 'Órdenes de compra específicas del vehículo'
                  : 'Resumen de gastos agrupados por vehículo'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Resumen General */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{ordenesFiltradas.length}</p>
                <p className="text-sm text-gray-600">Órdenes Totales</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center">
              <Car className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{resumenVehiculos.length}</p>
                <p className="text-sm text-gray-600">Vehículos</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <div className="space-y-1">
                  {Object.entries(totalPorMoneda)
                    .sort(([,a], [,b]) => b - a)
                    .map(([moneda, total]) => {
                      const simbolo = simbolosMonedas[moneda] || '$'
                      return (
                        <div key={moneda} className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-600 min-w-[35px]">{moneda}</span>
                          <span className="text-lg font-bold text-gray-900">
                            {simbolo}{total.toLocaleString()}
                          </span>
                        </div>
                      )
                    })}
                </div>
                <p className="text-sm text-gray-600">Gastos Totales</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-orange-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{resumenVehiculos.length}</p>
                <p className="text-sm text-gray-600">Vehículos con Gastos</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros - Solo mostrar en vista resumen */}
        {!vistaDetalle && (
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
        )}

        {/* Vista Resumen: Cards por Vehículo */}
        {!vistaDetalle ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resumenVehiculos.map((vehiculo) => (
              <div
                key={vehiculo.placa}
                onClick={() => setVistaDetalle(vehiculo.placa)}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-blue-500 hover:border-blue-600"
              >
                <div className="p-6">
                  {/* Header del vehículo */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="bg-blue-100 p-2 rounded-lg mr-3">
                        <Car className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        {vehiculo.placa === 'TALLER' ? (
                          // Caso especial TALLER
                          <>
                            <h3 className="text-lg font-bold text-gray-900">🔧 TALLER</h3>
                            <p className="text-sm text-gray-600">Gastos internos</p>
                          </>
                        ) : vehiculo.interno > 0 ? (
                          // Vehículo CON interno: Móvil arriba, placa abajo
                          <>
                            <h3 className="text-lg font-bold text-gray-900">Móvil {vehiculo.interno}</h3>
                            <p className="text-sm text-gray-600">{vehiculo.placa}</p>
                          </>
                        ) : (
                          // Vehículo SIN interno: Solo placa arriba
                          <>
                            <h3 className="text-lg font-bold text-gray-900">{vehiculo.placa}</h3>
                            <p className="text-sm text-gray-600">Sin número interno</p>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="space-y-1.5">
                        {Object.entries(vehiculo.gastosPorMoneda)
                          .sort(([,a], [,b]) => b - a)
                          .map(([moneda, total]) => {
                            const simbolo = simbolosMonedas[moneda] || '$'
                            return (
                              <div key={moneda} className="flex items-center justify-end gap-2">
                                <span className="text-xs font-medium text-gray-500 min-w-[30px]">
                                  {moneda}
                                </span>
                                <span className="text-lg font-bold text-green-600">
                                  {simbolo}{total.toLocaleString()}
                                </span>
                              </div>
                            )
                          })}
                      </div>
                    </div>
                  </div>

                  {/* Información adicional */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Modelo:</span>
                      <span className="font-medium text-gray-900 truncate ml-2" title={vehiculo.modelo}>
                        {vehiculo.modelo}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Titular:</span>
                      <span className="font-medium text-gray-900 truncate ml-2" title={vehiculo.titular}>
                        {vehiculo.titular}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Órdenes:</span>
                      <span className="font-medium text-blue-600">{vehiculo.cantidadOrdenes}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Última orden:</span>
                      <span className="font-medium text-gray-900">{vehiculo.ultimaOrden}</span>
                    </div>
                  </div>

                  {/* Footer con llamada a la acción */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Click para ver detalle</span>
                      <ArrowLeft className="h-4 w-4 text-gray-400 rotate-180" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Vista Detalle: Tabla de órdenes del vehículo específico */
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">
                {vistaDetalle === 'TALLER' 
                  ? '🔧 Órdenes del TALLER'
                  : `Órdenes del Vehículo ${vistaDetalle} - ${resumenVehiculos.find(v => v.placa === vistaDetalle)?.interno ? 'Int. ' + resumenVehiculos.find(v => v.placa === vistaDetalle)?.interno : 'Sin interno'}`
                }
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {ordenesDetalleFiltradas.length} órdenes • Total: ${ordenesDetalleFiltradas.reduce((sum, o) => sum + (o.monto_vehiculo || 0), 0).toLocaleString()}
              </p>
            </div>
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
                  {ordenesDetalleFiltradas.map((orden) => (
                    <tr key={orden.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {orden.codigo_oc}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(orden.fecha).toLocaleDateString()}
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
        )}

        {/* Mensaje cuando no hay datos */}
        {!vistaDetalle && resumenVehiculos.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No hay vehículos con órdenes</p>
            <p className="text-gray-400 text-sm mt-2">
              {filtroInterno ? 'Intenta con otro filtro' : 'Los vehículos aparecerán aquí al crear OCs'}
            </p>
          </div>
        )}

        {vistaDetalle && ordenesDetalleFiltradas.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No hay órdenes para este vehículo</p>
            <p className="text-gray-400 text-sm mt-2">Este vehículo no tiene órdenes registradas</p>
          </div>
        )}
      </div>
    </div>
  )
}