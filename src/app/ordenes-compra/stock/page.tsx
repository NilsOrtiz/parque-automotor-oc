'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Package, Filter, Droplets, Lightbulb } from 'lucide-react'

export default function StockPage() {
  const [categoria, setCategoria] = useState<'filtros' | 'aceite' | 'focos' | null>(null)
  const [tipoVista, setTipoVista] = useState<'modelo' | 'cantidad'>('modelo')

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
        {categoria && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {categoria === 'filtros' && '🔧 Gestión de Filtros'}
              {categoria === 'aceite' && '🛢️ Gestión de Aceites'}
              {categoria === 'focos' && '💡 Gestión de Focos'}
            </h2>
            <div className="text-center py-8">
              <div className="text-6xl mb-4">
                {categoria === 'filtros' && '🔧'}
                {categoria === 'aceite' && '🛢️'}
                {categoria === 'focos' && '💡'}
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Vista por {tipoVista === 'modelo' ? 'Modelos' : 'Cantidades'}
              </h3>
              <p className="text-gray-600 mb-4">
                Mostrando {categoria} organizados por {tipoVista}
              </p>
              <div className="inline-flex items-center px-4 py-2 bg-orange-100 text-orange-800 rounded-lg">
                <Package className="h-4 w-4 mr-2" />
                En desarrollo
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