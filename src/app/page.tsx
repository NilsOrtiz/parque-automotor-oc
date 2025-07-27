import Link from 'next/link'
import { Car, ShoppingCart, AlertTriangle } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Sistema de Gestión de Parque Automotor
          </h1>
          <p className="text-xl text-gray-600">
            Administración integral para empresa de turismo
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/vehiculos" className="group">
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border-l-4 border-blue-500">
              <div className="flex items-center mb-4">
                <Car className="h-8 w-8 text-blue-500 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600">
                  Vehículos
                </h2>
              </div>
              <p className="text-gray-600">
                Gestión completa del parque automotor, registro y mantenimiento
              </p>
            </div>
          </Link>

          <Link href="/ordenes-compra" className="group">
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border-l-4 border-green-500">
              <div className="flex items-center mb-4">
                <ShoppingCart className="h-8 w-8 text-green-500 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900 group-hover:text-green-600">
                  Órdenes de Compra
                </h2>
              </div>
              <p className="text-gray-600">
                Gestión de órdenes, aprobaciones y seguimiento de compras
              </p>
            </div>
          </Link>

          <Link href="/pendientes" className="group">
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border-l-4 border-red-500">
              <div className="flex items-center mb-4">
                <AlertTriangle className="h-8 w-8 text-red-500 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900 group-hover:text-red-600">
                  Pendientes
                </h2>
              </div>
              <p className="text-gray-600">
                Observaciones y tareas pendientes por resolver
              </p>
            </div>
          </Link>
        </div>

        <div className="mt-12 bg-white p-8 rounded-lg shadow-md">
          <h3 className="text-2xl font-semibold text-gray-900 mb-6">Departamentos</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900">Taller</h4>
              <p className="text-sm text-blue-700">Mantenimiento y reparaciones</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-900">Compras</h4>
              <p className="text-sm text-green-700">Adquisiciones y proveedores</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <h4 className="font-medium text-purple-900">Tesorería</h4>
              <p className="text-sm text-purple-700">Aprobaciones financieras</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <h4 className="font-medium text-orange-900">Logística</h4>
              <p className="text-sm text-orange-700">Coordinación de flota</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900">Choferes</h4>
              <p className="text-sm text-gray-700">Operadores de vehículos</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
