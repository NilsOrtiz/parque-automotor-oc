'use client'

import Link from 'next/link'
import { ArrowLeft, Package, Plus, Search, AlertTriangle } from 'lucide-react'

export default function StockPage() {
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

        {/* Acciones principales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Agregar Stock */}
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border-l-4 border-green-500">
            <div className="flex items-center mb-4">
              <div className="bg-green-100 p-2 rounded-lg mr-3">
                <Plus className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Agregar Stock</h3>
                <p className="text-sm text-gray-600">Nuevo producto al inventario</p>
              </div>
            </div>
            <button className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors">
              Agregar Producto
            </button>
          </div>

          {/* Consultar Stock */}
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border-l-4 border-blue-500">
            <div className="flex items-center mb-4">
              <div className="bg-blue-100 p-2 rounded-lg mr-3">
                <Search className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Consultar Stock</h3>
                <p className="text-sm text-gray-600">Buscar productos disponibles</p>
              </div>
            </div>
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
              Buscar Productos
            </button>
          </div>

          {/* Stock Crítico */}
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border-l-4 border-red-500">
            <div className="flex items-center mb-4">
              <div className="bg-red-100 p-2 rounded-lg mr-3">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Stock Crítico</h3>
                <p className="text-sm text-gray-600">Productos con stock bajo</p>
              </div>
            </div>
            <button className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors">
              Ver Alertas
            </button>
          </div>
        </div>

        {/* Categorías de productos */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Categorías de Productos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-orange-50 p-4 rounded-lg text-center">
              <h3 className="font-medium text-orange-900 mb-2">Filtros</h3>
              <p className="text-sm text-orange-700">Filtros de aire, aceite y combustible</p>
              <div className="mt-2 text-xs text-orange-600">0 productos</div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <h3 className="font-medium text-blue-900 mb-2">Aceites</h3>
              <p className="text-sm text-blue-700">Aceites motor, transmisión e hidráulico</p>
              <div className="mt-2 text-xs text-blue-600">0 productos</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <h3 className="font-medium text-gray-900 mb-2">Repuestos</h3>
              <p className="text-sm text-gray-700">Piezas de recambio generales</p>
              <div className="mt-2 text-xs text-gray-600">0 productos</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg text-center">
              <h3 className="font-medium text-purple-900 mb-2">Consumibles</h3>
              <p className="text-sm text-purple-700">Material de uso frecuente</p>
              <div className="mt-2 text-xs text-purple-600">0 productos</div>
            </div>
          </div>
        </div>

        {/* Estado actual del inventario */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Estado del Inventario</h2>
          <div className="text-center py-8">
            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Inventario en construcción</h3>
            <p className="text-gray-600 mb-4">
              El sistema de stock está siendo desarrollado para gestionar filtros, aceites y repuestos
            </p>
            <div className="inline-flex items-center px-4 py-2 bg-orange-100 text-orange-800 rounded-lg">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Próximamente disponible
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}