'use client'

import Link from 'next/link'
import { Plus, FileText, ArrowRight, BarChart3 } from 'lucide-react'

export default function OrdenesCompraPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Órdenes de Compra</h1>
          <p className="text-gray-600">Gestión completa de órdenes de compra del parque automotor</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Crear OC */}
          <Link href="/ordenes-compra/crear" className="group">
            <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 border-l-4 border-green-500 group-hover:border-green-600">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="bg-green-100 p-3 rounded-lg mr-4">
                    <Plus className="h-8 w-8 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 group-hover:text-green-600">
                      Crear OC
                    </h2>
                    <p className="text-gray-500">Nueva orden de compra</p>
                  </div>
                </div>
                <ArrowRight className="h-6 w-6 text-gray-400 group-hover:text-green-600 transition-colors" />
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                  Seleccionar vehículo
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                  Datos del proveedor
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                  Detalles de compra
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                  Flujo de aprobaciones
                </div>
              </div>
            </div>
          </Link>

          {/* OC Creadas */}
          <Link href="/ordenes-compra/listado" className="group">
            <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 border-l-4 border-blue-500 group-hover:border-blue-600">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="bg-blue-100 p-3 rounded-lg mr-4">
                    <FileText className="h-8 w-8 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600">
                      OC Creadas
                    </h2>
                    <p className="text-gray-500">Listado y seguimiento</p>
                  </div>
                </div>
                <ArrowRight className="h-6 w-6 text-gray-400 group-hover:text-blue-600 transition-colors" />
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
                  Todas las órdenes creadas
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
                  Estados de aprobación
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
                  Filtros por vehículo/proveedor
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
                  Seguimiento de estados
                </div>
              </div>
            </div>
          </Link>

          {/* Análisis por Vehículo */}
          <Link href="/ordenes-compra/por-vehiculo" className="group">
            <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 border-l-4 border-purple-500 group-hover:border-purple-600">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="bg-purple-100 p-3 rounded-lg mr-4">
                    <BarChart3 className="h-8 w-8 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 group-hover:text-purple-600">
                      Por Vehículo
                    </h2>
                    <p className="text-gray-500">Análisis detallado</p>
                  </div>
                </div>
                <ArrowRight className="h-6 w-6 text-gray-400 group-hover:text-purple-600 transition-colors" />
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mr-3"></div>
                  Gastos por vehículo específico
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mr-3"></div>
                  OCs múltiples (versiones A, B, C)
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mr-3"></div>
                  Análisis granular de costos
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mr-3"></div>
                  Acceso directo a PDFs
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Información adicional */}
        <div className="mt-12 bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Estados de Aprobación</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <h4 className="font-medium text-yellow-900">Compras</h4>
              <p className="text-sm text-yellow-700">Revisión del departamento de compras</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <h4 className="font-medium text-purple-900">Tesorería</h4>
              <p className="text-sm text-purple-700">Aprobación financiera</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-900">Gerencia</h4>
              <p className="text-sm text-green-700">Aprobación final</p>
            </div>
          </div>
        </div>

        {/* Navegación de regreso */}
        <div className="mt-8">
          <Link 
            href="/" 
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}