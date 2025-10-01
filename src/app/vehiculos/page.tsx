'use client'

import Link from 'next/link'
import { Search, Settings, ArrowRight, BarChart3, ClipboardCheck, FileText, AlertTriangle, List, Fuel, Circle, Droplets, Link2, Cog } from 'lucide-react'
import { useState } from 'react'

export default function VehiculosPage() {
  const [showAdminMenu, setShowAdminMenu] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 relative">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestión de Vehículos</h1>
              <p className="text-gray-600">Selecciona una opción para continuar</p>
            </div>

            {/* Botón de administración discreto */}
            <div className="relative">
              <button
                onClick={() => setShowAdminMenu(!showAdminMenu)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Administración"
              >
                <Cog className="h-5 w-5" />
              </button>

              {/* Menú desplegable */}
              {showAdminMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10">
                  <Link
                    href="/admin/schema"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center">
                      <Settings className="h-4 w-4 mr-2" />
                      Administrar Schema
                    </div>
                  </Link>
                  <Link
                    href="/vehiculos/perfiles"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center">
                      <List className="h-4 w-4 mr-2" />
                      Perfiles de Vehículos
                    </div>
                  </Link>
                  <Link
                    href="/admin/exclusiones"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Exclusiones
                    </div>
                  </Link>
                  <Link
                    href="/admin/alias"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center">
                      <Link2 className="h-4 w-4 mr-2" />
                      Alias de Columnas
                    </div>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* Búsqueda de Vehículo */}
          <Link href="/vehiculos/busqueda" className="group">
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 border-l-4 border-blue-500 group-hover:border-blue-600">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="bg-blue-100 p-3 rounded-lg mr-4">
                    <Search className="h-8 w-8 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600">
                      Búsqueda de Vehículo
                    </h2>
                    <p className="text-gray-500">Buscar por placa o número interno</p>
                  </div>
                </div>
                <ArrowRight className="h-6 w-6 text-gray-400 group-hover:text-blue-600 transition-colors" />
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
                  Búsqueda por placa
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
                  Búsqueda por número interno
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
                  Ver información completa
                </div>
              </div>
            </div>
          </Link>

          {/* Lista de Mantenimientos */}
          <Link href="/vehiculos/mantenimientos" className="group">
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 border-l-4 border-green-500 group-hover:border-green-600">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="bg-green-100 p-3 rounded-lg mr-4">
                    <Settings className="h-8 w-8 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 group-hover:text-green-600">
                      Lista de Mantenimientos
                    </h2>
                    <p className="text-gray-500">Control de cambios de aceite</p>
                  </div>
                </div>
                <ArrowRight className="h-6 w-6 text-gray-400 group-hover:text-green-600 transition-colors" />
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                  Todos los vehículos
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                  Último kilometraje de cambio de aceite
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                  Estado de mantenimiento
                </div>
              </div>
            </div>
          </Link>

          {/* Gestión de Neumáticos */}
          <Link href="/vehiculos/neumaticos" className="group">
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 border-l-4 border-gray-500 group-hover:border-gray-600">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="bg-gray-100 p-3 rounded-lg mr-4">
                    <Circle className="h-8 w-8 text-gray-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 group-hover:text-gray-600">
                      Gestión de Neumáticos
                    </h2>
                    <p className="text-gray-500">Control de rotación y estado</p>
                  </div>
                </div>
                <ArrowRight className="h-6 w-6 text-gray-400 group-hover:text-gray-600 transition-colors" />
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <div className="w-2 h-2 bg-gray-400 rounded-full mr-3"></div>
                  Sistema de rotación inteligente
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <div className="w-2 h-2 bg-gray-400 rounded-full mr-3"></div>
                  Diagrama visual por tipo de vehículo
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <div className="w-2 h-2 bg-gray-400 rounded-full mr-3"></div>
                  Historial completo de cambios
                </div>
              </div>
            </div>
          </Link>

          {/* Análisis de Consumo de Combustible */}
          <Link href="/vehiculos/analisis-combustible" className="group">
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 border-l-4 border-orange-500 group-hover:border-orange-600">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="bg-orange-100 p-3 rounded-lg mr-4">
                    <Fuel className="h-8 w-8 text-orange-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 group-hover:text-orange-600">
                      Análisis de Consumo de Combustible
                    </h2>
                    <p className="text-gray-500">Estadísticas y tendencias de consumo</p>
                  </div>
                </div>
                <ArrowRight className="h-6 w-6 text-gray-400 group-hover:text-orange-600 transition-colors" />
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <div className="w-2 h-2 bg-orange-400 rounded-full mr-3"></div>
                  Consumo km/litro por vehículo
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <div className="w-2 h-2 bg-orange-400 rounded-full mr-3"></div>
                  Gráficas de eficiencia
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <div className="w-2 h-2 bg-orange-400 rounded-full mr-3"></div>
                  Costo por kilómetro
                </div>
              </div>
            </div>
          </Link>

          {/* Revisión Mensual */}
          <Link href="/vehiculos/revision-mensual" className="group">
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 border-l-4 border-purple-500 group-hover:border-purple-600">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="bg-purple-100 p-3 rounded-lg mr-4">
                    <ClipboardCheck className="h-8 w-8 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 group-hover:text-purple-600">
                      Revisión Mensual
                    </h2>
                    <p className="text-gray-500">Control obligatorio de taller</p>
                  </div>
                </div>
                <ArrowRight className="h-6 w-6 text-gray-400 group-hover:text-purple-600 transition-colors" />
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mr-3"></div>
                  Estado general del vehículo
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mr-3"></div>
                  Revisión de accesorios
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mr-3"></div>
                  Control preventivo mensual
                </div>
              </div>
            </div>
          </Link>

          {/* Registro de Servicio */}
          <Link href="/vehiculos/registro-servicio" className="group">
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 border-l-4 border-indigo-500 group-hover:border-indigo-600">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="bg-indigo-100 p-3 rounded-lg mr-4">
                    <FileText className="h-8 w-8 text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 group-hover:text-indigo-600">
                      Registro de Servicio
                    </h2>
                    <p className="text-gray-500">Formulario para técnicos</p>
                  </div>
                </div>
                <ArrowRight className="h-6 w-6 text-gray-400 group-hover:text-indigo-600 transition-colors" />
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <div className="w-2 h-2 bg-indigo-400 rounded-full mr-3"></div>
                  Registro de intervenciones
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <div className="w-2 h-2 bg-indigo-400 rounded-full mr-3"></div>
                  Vinculación con órdenes de compra
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <div className="w-2 h-2 bg-indigo-400 rounded-full mr-3"></div>
                  Documentación de trabajos
                </div>
              </div>
            </div>
          </Link>

          {/* Reportar Problema */}
          <Link href="/vehiculos/reportar-problema" className="group">
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 border-l-4 border-red-500 group-hover:border-red-600">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="bg-red-100 p-3 rounded-lg mr-4">
                    <AlertTriangle className="h-8 w-8 text-red-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 group-hover:text-red-600">
                      Reportar Problema
                    </h2>
                    <p className="text-gray-500">Para choferes y mecánicos</p>
                  </div>
                </div>
                <ArrowRight className="h-6 w-6 text-gray-400 group-hover:text-red-600 transition-colors" />
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <div className="w-2 h-2 bg-red-400 rounded-full mr-3"></div>
                  Reportes de choferes
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <div className="w-2 h-2 bg-red-400 rounded-full mr-3"></div>
                  Diagnósticos de mecánicos
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <div className="w-2 h-2 bg-red-400 rounded-full mr-3"></div>
                  Gestión de prioridades
                </div>
              </div>
            </div>
          </Link>

          {/* Lista de Pendientes */}
          <Link href="/vehiculos/lista-pendientes" className="group">
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 border-l-4 border-orange-500 group-hover:border-orange-600">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="bg-orange-100 p-3 rounded-lg mr-4">
                    <List className="h-8 w-8 text-orange-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 group-hover:text-orange-600">
                      Lista de Pendientes
                    </h2>
                    <p className="text-gray-500">Control de problemas reportados</p>
                  </div>
                </div>
                <ArrowRight className="h-6 w-6 text-gray-400 group-hover:text-orange-600 transition-colors" />
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <div className="w-2 h-2 bg-orange-400 rounded-full mr-3"></div>
                  Vista general de todos los problemas
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <div className="w-2 h-2 bg-orange-400 rounded-full mr-3"></div>
                  Filtros por prioridad y estado
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <div className="w-2 h-2 bg-orange-400 rounded-full mr-3"></div>
                  Información para operaciones
                </div>
              </div>
            </div>
          </Link>

          {/* Registro Manual de Carga de Combustible YPF */}
          <Link href="/vehiculos/carga-combustible-manual" className="group">
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 border-l-4 border-yellow-500 group-hover:border-yellow-600">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="bg-yellow-100 p-3 rounded-lg mr-4">
                    <Droplets className="h-8 w-8 text-yellow-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 group-hover:text-yellow-600">
                      Registro Manual de Carga de Combustible YPF
                    </h2>
                    <p className="text-gray-500">Ingreso manual de cargas de combustible</p>
                  </div>
                </div>
                <ArrowRight className="h-6 w-6 text-gray-400 group-hover:text-yellow-600 transition-colors" />
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full mr-3"></div>
                  Registro manual de cargas YPF
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full mr-3"></div>
                  Control de odómetro y litros cargados
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full mr-3"></div>
                  Integración con análisis de consumo
                </div>
              </div>
            </div>
          </Link>

          {/* Anexar Órdenes de Compra */}
          <Link href="/vehiculos/anexar-ordenes" className="group">
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 border-l-4 border-cyan-500 group-hover:border-cyan-600">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="bg-cyan-100 p-3 rounded-lg mr-4">
                    <Link2 className="h-8 w-8 text-cyan-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 group-hover:text-cyan-600">
                      Anexar Órdenes de Compra
                    </h2>
                    <p className="text-gray-500">Asociar OC a servicios existentes</p>
                  </div>
                </div>
                <ArrowRight className="h-6 w-6 text-gray-400 group-hover:text-cyan-600 transition-colors" />
              </div>

              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full mr-3"></div>
                  Servicios sin orden de compra
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full mr-3"></div>
                  Asociación inteligente por items
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full mr-3"></div>
                  Continuidad en historial
                </div>
              </div>
            </div>
          </Link>
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