'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Save, RefreshCw, AlertTriangle } from 'lucide-react'
import {
  cargarConfiguracionCategorias,
  guardarConfiguracionCategorias,
  obtenerCategoriasPorDefecto,
  obtenerAsignacionesPorDefecto,
  type CategoriaDefinicion,
  type ComponenteCategoria
} from '@/lib/categorias-componentes'
import { obtenerTodasLasColumnas } from '@/lib/exclusiones-mantenimiento'
import { cargarColumnasExcluidas } from '@/lib/exclusiones-mantenimiento'

export default function CategoriasPage() {
  const [categorias, setCategorias] = useState<CategoriaDefinicion[]>([])
  const [asignaciones, setAsignaciones] = useState<ComponenteCategoria[]>([])
  const [componentesDisponibles, setComponentesDisponibles] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    cargarDatos()
  }, [])

  async function cargarDatos() {
    setLoading(true)
    try {
      const [config, todasColumnas, exclusiones] = await Promise.all([
        cargarConfiguracionCategorias(),
        obtenerTodasLasColumnas(),
        cargarColumnasExcluidas()
      ])

      setCategorias(config.categorias)
      setAsignaciones(config.asignaciones)

      // Extraer componentes únicos (sin sufijos _km, _fecha, etc.)
      const componentesSet = new Set<string>()
      todasColumnas.forEach(col => {
        if (exclusiones.includes(col)) return

        // Detectar patrón y extraer componente base
        if (col.endsWith('_km')) componentesSet.add(col.replace('_km', ''))
        else if (col.endsWith('_fecha')) componentesSet.add(col.replace('_fecha', ''))
        else if (col.endsWith('_modelo')) componentesSet.add(col.replace('_modelo', ''))
        else if (col.endsWith('_intervalo')) componentesSet.add(col.replace('_intervalo', ''))
        else if (col.endsWith('_litros')) componentesSet.add(col.replace('_litros', ''))
        else if (col.endsWith('_hr')) componentesSet.add(col.replace('_hr', ''))
      })

      setComponentesDisponibles(Array.from(componentesSet).sort())
    } catch (error) {
      console.error('Error cargando datos:', error)
      alert('Error cargando configuración')
    } finally {
      setLoading(false)
    }
  }

  async function guardar() {
    setGuardando(true)
    try {
      await guardarConfiguracionCategorias({ categorias, asignaciones })
      alert('✅ Configuración guardada exitosamente')
    } catch (error) {
      console.error('Error guardando:', error)
      alert('❌ Error guardando configuración')
    } finally {
      setGuardando(false)
    }
  }

  function cambiarCategoria(componente: string, nuevaCategoriaId: string) {
    setAsignaciones(prev => {
      const existe = prev.find(a => a.componente === componente)
      if (existe) {
        // Actualizar existente
        return prev.map(a =>
          a.componente === componente
            ? { ...a, categoria_id: nuevaCategoriaId }
            : a
        )
      } else {
        // Agregar nuevo
        return [...prev, { componente, categoria_id: nuevaCategoriaId }]
      }
    })
  }

  function obtenerCategoriaActual(componente: string): string {
    const asignacion = asignaciones.find(a => a.componente === componente)
    return asignacion?.categoria_id || 'otros'
  }

  function restaurarDefecto() {
    if (confirm('¿Restaurar categorías por defecto? Esto sobrescribirá tu configuración actual.')) {
      setCategorias(obtenerCategoriasPorDefecto())
      setAsignaciones(obtenerAsignacionesPorDefecto())
    }
  }

  // Agrupar componentes por categoría para visualización
  const componentesPorCategoria = categorias.map(cat => ({
    ...cat,
    componentes: componentesDisponibles.filter(comp =>
      obtenerCategoriaActual(comp) === cat.id
    )
  }))

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin/schema"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Schema
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Configuración de Categorías de Componentes
              </h1>
              <p className="text-gray-600">
                Asigna cada componente a su categoría de agrupación
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={cargarDatos}
                disabled={loading}
                className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Recargar
              </button>
              <button
                onClick={restaurarDefecto}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Restaurar Defecto
              </button>
              <button
                onClick={guardar}
                disabled={guardando}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Save className="h-4 w-4" />
                {guardando ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>

        {/* Explicación */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mb-6">
          <div className="flex items-start">
            <AlertTriangle className="h-6 w-6 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-blue-900 font-medium mb-2">
                ¿Para qué sirven las categorías?
              </p>
              <p className="text-sm text-blue-800 mb-3">
                Las categorías agrupan los componentes en los perfiles de vehículos. Por ejemplo, todos los componentes en "Correas" aparecen juntos en la sección de Correas.
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Cargando componentes...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Vista por categoría */}
            {componentesPorCategoria.map(categoria => (
              <div key={categoria.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="bg-gray-100 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{categoria.icono}</span>
                    <h2 className="text-lg font-semibold text-gray-900">{categoria.nombre}</h2>
                    <span className="text-sm text-gray-600">
                      ({categoria.componentes.length} componentes)
                    </span>
                  </div>
                </div>

                <div className="p-6">
                  {categoria.componentes.length === 0 ? (
                    <p className="text-gray-500 text-sm">No hay componentes asignados a esta categoría</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {categoria.componentes.map(componente => (
                        <div
                          key={componente}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                        >
                          <span className="font-mono text-sm text-gray-700 truncate flex-1">
                            {componente}
                          </span>
                          <select
                            value={obtenerCategoriaActual(componente)}
                            onChange={(e) => cambiarCategoria(componente, e.target.value)}
                            className="ml-3 text-xs border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500"
                          >
                            {categorias.map(cat => (
                              <option key={cat.id} value={cat.id}>
                                {cat.icono} {cat.nombre}
                              </option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Componentes sin asignar */}
            {componentesDisponibles.filter(comp => !asignaciones.find(a => a.componente === comp)).length > 0 && (
              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6">
                <p className="text-sm text-yellow-900 font-medium mb-3">
                  ⚠️ Componentes sin categoría asignada:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {componentesDisponibles
                    .filter(comp => !asignaciones.find(a => a.componente === comp))
                    .map(componente => (
                      <div key={componente} className="flex items-center justify-between p-2 bg-white rounded border border-yellow-300">
                        <span className="font-mono text-sm text-gray-700 truncate flex-1">
                          {componente}
                        </span>
                        <select
                          value="otros"
                          onChange={(e) => cambiarCategoria(componente, e.target.value)}
                          className="ml-3 text-xs border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500"
                        >
                          {categorias.map(cat => (
                            <option key={cat.id} value={cat.id}>
                              {cat.icono} {cat.nombre}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={guardar}
            disabled={guardando}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-8 py-3 rounded-lg flex items-center gap-2 transition-colors text-lg font-medium"
          >
            <Save className="h-5 w-5" />
            {guardando ? 'Guardando Configuración...' : 'Guardar Configuración'}
          </button>
        </div>
      </div>
    </div>
  )
}
