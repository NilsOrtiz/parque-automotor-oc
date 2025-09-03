'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Package, Filter, Droplets, Lightbulb } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Vehiculo {
  id: number
  Nro_Interno: number
  Placa: string
  Titular: string
  Marca: string
  Modelo: string
  Año: number
  // Modelos de filtros
  filtro_aceite_motor_modelo?: string
  filtro_combustible_modelo?: string
  filtro_aire_modelo?: string
  filtro_cabina_modelo?: string
  filtro_deshumidificador_modelo?: string
  filtro_secador_modelo?: string
  filtro_aire_secundario_modelo?: string
  // Modelos de aceites y líquidos
  aceite_motor_modelo?: string
  aceite_transmicion_modelo?: string
  liquido_refrigerante_modelo?: string
  liquido_frenos_modelo?: string
  // Otros componentes (para focos si los hay)
  bateria_modelo?: string
  escobillas_modelo?: string
}

export default function StockPage() {
  const [categoria, setCategoria] = useState<'filtros' | 'aceite' | 'focos' | null>(null)
  const [tipoVista, setTipoVista] = useState<'modelo' | 'cantidad'>('modelo')
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (categoria && tipoVista === 'modelo') {
      fetchVehiculos()
    }
  }, [categoria, tipoVista])

  async function fetchVehiculos() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('vehiculos')
        .select(`
          id, Nro_Interno, Placa, Titular, Marca, Modelo, Año,
          filtro_aceite_motor_modelo, filtro_combustible_modelo, filtro_aire_modelo,
          filtro_cabina_modelo, filtro_deshumidificador_modelo, filtro_secador_modelo,
          filtro_aire_secundario_modelo, aceite_motor_modelo, aceite_transmicion_modelo,
          liquido_refrigerante_modelo, liquido_frenos_modelo, bateria_modelo, escobillas_modelo
        `)
        .order('Nro_Interno', { ascending: true })

      if (error) throw error
      setVehiculos(data || [])
    } catch (error) {
      console.error('Error fetching vehiculos:', error)
    } finally {
      setLoading(false)
    }
  }

  function getModelosCategoria(vehiculo: Vehiculo, cat: string) {
    switch (cat) {
      case 'filtros':
        return [
          { nombre: 'Filtro Aceite Motor', modelo: vehiculo.filtro_aceite_motor_modelo },
          { nombre: 'Filtro Combustible', modelo: vehiculo.filtro_combustible_modelo },
          { nombre: 'Filtro Aire', modelo: vehiculo.filtro_aire_modelo },
          { nombre: 'Filtro Cabina', modelo: vehiculo.filtro_cabina_modelo },
          { nombre: 'Filtro Deshumidificador', modelo: vehiculo.filtro_deshumidificador_modelo },
          { nombre: 'Filtro Secador', modelo: vehiculo.filtro_secador_modelo },
          { nombre: 'Filtro Aire Secundario', modelo: vehiculo.filtro_aire_secundario_modelo }
        ]
      case 'aceite':
        return [
          { nombre: 'Aceite Motor', modelo: vehiculo.aceite_motor_modelo },
          { nombre: 'Aceite Transmisión', modelo: vehiculo.aceite_transmicion_modelo },
          { nombre: 'Líquido Refrigerante', modelo: vehiculo.liquido_refrigerante_modelo },
          { nombre: 'Líquido Frenos', modelo: vehiculo.liquido_frenos_modelo }
        ]
      case 'focos':
        return [
          { nombre: 'Batería', modelo: vehiculo.bateria_modelo },
          { nombre: 'Escobillas', modelo: vehiculo.escobillas_modelo }
        ]
      default:
        return []
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link 
              href="/ordenes-compra" 
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Volver a Órdenes de Compra
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-orange-100 p-3 rounded-lg">
              <Package className="h-8 w-8 text-orange-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Stock e Inventario</h1>
              <p className="text-gray-600">Control de filtros, aceites y repuestos del parque automotor</p>
            </div>
          </div>
        </div>

        {/* Interruptor de Categoría - 3 posiciones */}
        <div className="mb-8 flex justify-center">
          <div className="bg-white rounded-lg shadow-sm p-1 inline-flex">
            <button
              onClick={() => setCategoria('filtros')}
              className={`px-6 py-3 rounded-md text-sm font-medium transition-colors ${
                categoria === 'filtros'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              <Filter className="h-4 w-4 inline mr-2" />
              Filtros
              <div className="text-xs mt-1 opacity-80">Aire, Aceite, Combustible</div>
            </button>
            <button
              onClick={() => setCategoria('aceite')}
              className={`px-6 py-3 rounded-md text-sm font-medium transition-colors ${
                categoria === 'aceite'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              <Droplets className="h-4 w-4 inline mr-2" />
              Aceite
              <div className="text-xs mt-1 opacity-80">Motor, Transmisión, Hidráulico</div>
            </button>
            <button
              onClick={() => setCategoria('focos')}
              className={`px-6 py-3 rounded-md text-sm font-medium transition-colors ${
                categoria === 'focos'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              <Lightbulb className="h-4 w-4 inline mr-2" />
              Focos
              <div className="text-xs mt-1 opacity-80">Luces y bombillas</div>
            </button>
          </div>
        </div>

        {/* Interruptor secundario - Modelo/Cantidad (solo si hay categoría seleccionada) */}
        {categoria && (
          <div className="mb-8 flex justify-center">
            <div className="bg-white rounded-lg shadow-sm p-1 inline-flex">
              <button
                onClick={() => setTipoVista('modelo')}
                className={`px-6 py-3 rounded-md text-sm font-medium transition-colors ${
                  tipoVista === 'modelo'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                📋 Modelo
                <div className="text-xs mt-1 opacity-80">Ver por modelos</div>
              </button>
              <button
                onClick={() => setTipoVista('cantidad')}
                className={`px-6 py-3 rounded-md text-sm font-medium transition-colors ${
                  tipoVista === 'cantidad'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                📊 Cantidad
                <div className="text-xs mt-1 opacity-80">Ver por cantidades</div>
              </button>
            </div>
          </div>
        )}

        {/* Contenido dinámico basado en la selección */}
        {categoria && tipoVista === 'modelo' && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">
                {categoria === 'filtros' && '🔧 Modelos de Filtros por Vehículo'}
                {categoria === 'aceite' && '🛢️ Modelos de Aceites y Líquidos por Vehículo'}
                {categoria === 'focos' && '💡 Modelos de Componentes Eléctricos por Vehículo'}
              </h2>
            </div>

            {loading ? (
              <div className="p-8 text-center">
                <div className="text-lg text-gray-600">Cargando información...</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nro. Interno
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Placa
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Vehículo
                      </th>
                      {getModelosCategoria(vehiculos[0] || {} as Vehiculo, categoria).map((item, index) => (
                        <th key={index} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {item.nombre}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {vehiculos.map((vehiculo) => (
                      <tr key={vehiculo.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {vehiculo.Nro_Interno || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {vehiculo.Placa}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div className="font-medium">{vehiculo.Marca} {vehiculo.Modelo}</div>
                          <div className="text-gray-500">{vehiculo.Año}</div>
                        </td>
                        {getModelosCategoria(vehiculo, categoria).map((item, index) => (
                          <td key={index} className="px-4 py-4 text-sm text-gray-900">
                            <div className="max-w-[120px]">
                              {item.modelo ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  {item.modelo}
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                                  Sin modelo
                                </span>
                              )}
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {vehiculos.length === 0 && !loading && (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No hay vehículos registrados</p>
              </div>
            )}
          </div>
        )}

        {/* Vista de cantidad (placeholder) */}
        {categoria && tipoVista === 'cantidad' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              📊 Vista por Cantidades
            </h2>
            <div className="text-center py-8">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Control de Stock por Cantidades
              </h3>
              <p className="text-gray-600 mb-4">
                Esta vista mostrará inventario disponible y stock mínimo
              </p>
              <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-lg">
                <Package className="h-4 w-4 mr-2" />
                Próximamente
              </div>
            </div>
          </div>
        )}

        {/* Mensaje inicial si no hay categoría seleccionada */}
        {!categoria && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-center py-8">
              <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Selecciona una categoría</h3>
              <p className="text-gray-600">
                Elige entre Filtros, Aceite o Focos para comenzar a gestionar el inventario
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}