'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Save, RefreshCw, AlertTriangle, Plus, Trash2, Edit2, X } from 'lucide-react'
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
  const [mostrarFormCategoria, setMostrarFormCategoria] = useState(false)
  const [categoriaEditando, setCategoriaEditando] = useState<string | null>(null)
  const [formCategoria, setFormCategoria] = useState({
    id: '',
    nombre: '',
    icono: ''
  })

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

  function abrirFormNuevaCategoria() {
    setFormCategoria({ id: '', nombre: '', icono: '📦' })
    setCategoriaEditando(null)
    setMostrarFormCategoria(true)
  }

  function abrirFormEditarCategoria(categoria: CategoriaDefinicion) {
    setFormCategoria({ ...categoria })
    setCategoriaEditando(categoria.id)
    setMostrarFormCategoria(true)
  }

  function cerrarFormCategoria() {
    setMostrarFormCategoria(false)
    setCategoriaEditando(null)
    setFormCategoria({ id: '', nombre: '', icono: '' })
  }

  function guardarCategoria() {
    if (!formCategoria.nombre.trim()) {
      alert('El nombre es requerido')
      return
    }

    if (!formCategoria.icono.trim()) {
      alert('El icono es requerido')
      return
    }

    if (categoriaEditando) {
      // Editar existente
      setCategorias(prev => prev.map(cat =>
        cat.id === categoriaEditando
          ? { ...cat, nombre: formCategoria.nombre, icono: formCategoria.icono }
          : cat
      ))
    } else {
      // Crear nueva
      const nuevoId = formCategoria.nombre.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

      if (categorias.find(c => c.id === nuevoId)) {
        alert('Ya existe una categoría con ese nombre')
        return
      }

      setCategorias(prev => [...prev, {
        id: nuevoId,
        nombre: formCategoria.nombre,
        icono: formCategoria.icono
      }])
    }

    cerrarFormCategoria()
  }

  function eliminarCategoria(categoriaId: string) {
    const categoria = categorias.find(c => c.id === categoriaId)
    if (!categoria) return

    const componentesEnCategoria = asignaciones.filter(a => a.categoria_id === categoriaId).length

    if (componentesEnCategoria > 0) {
      if (!confirm(`La categoría "${categoria.nombre}" tiene ${componentesEnCategoria} componentes asignados. ¿Deseas eliminarla? Los componentes se moverán a "Otros".`)) {
        return
      }

      // Mover componentes a "otros"
      setAsignaciones(prev => prev.map(a =>
        a.categoria_id === categoriaId
          ? { ...a, categoria_id: 'otros' }
          : a
      ))
    } else {
      if (!confirm(`¿Eliminar la categoría "${categoria.nombre}"?`)) {
        return
      }
    }

    setCategorias(prev => prev.filter(c => c.id !== categoriaId))
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
                onClick={abrirFormNuevaCategoria}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Nueva Categoría
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

        {/* Modal de formulario de categoría */}
        {mostrarFormCategoria && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {categoriaEditando ? 'Editar Categoría' : 'Nueva Categoría'}
                </h3>
                <button onClick={cerrarFormCategoria} className="text-gray-500 hover:text-gray-700">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre de la Categoría *
                  </label>
                  <input
                    type="text"
                    value={formCategoria.nombre}
                    onChange={(e) => setFormCategoria({ ...formCategoria, nombre: e.target.value })}
                    placeholder="Ej: Sistema Hidráulico"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Icono (Emoji) *
                  </label>
                  <input
                    type="text"
                    value={formCategoria.icono}
                    onChange={(e) => setFormCategoria({ ...formCategoria, icono: e.target.value })}
                    placeholder="Ej: 💧"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    maxLength={2}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Usa un emoji como icono (Windows: Win + . | Mac: Cmd + Ctrl + Space)
                  </p>
                </div>

                {!categoriaEditando && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-600">
                      El ID se generará automáticamente: <span className="font-mono font-semibold">
                        {formCategoria.nombre.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || 'ejemplo-categoria'}
                      </span>
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={cerrarFormCategoria}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={guardarCategoria}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {categoriaEditando ? 'Actualizar' : 'Crear Categoría'}
                </button>
              </div>
            </div>
          </div>
        )}

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
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{categoria.icono}</span>
                      <h2 className="text-lg font-semibold text-gray-900">{categoria.nombre}</h2>
                      <span className="text-sm text-gray-600">
                        ({categoria.componentes.length} componentes)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => abrirFormEditarCategoria(categoria)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar categoría"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => eliminarCategoria(categoria.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar categoría"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
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
