'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Plus, Edit2, Trash2, Save, X, CheckSquare, Square } from 'lucide-react'
import { CATEGORIAS_COMPONENTES, type ComponenteVehiculo } from '@/lib/componentes-vehiculo'

type ConfiguracionVehiculo = {
  id: number
  nombre_configuracion: string
  descripcion: string | null
  componentes_aplicables: string[] // Array de IDs de componentes
  activo: boolean
  created_at: string
  updated_at: string
}

export default function PerfilesVehiculoPage() {
  const [perfiles, setPerfiles] = useState<ConfiguracionVehiculo[]>([])
  const [loading, setLoading] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editando, setEditando] = useState<number | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    nombre_configuracion: '',
    descripcion: '',
    componentes_aplicables: [] as string[]
  })

  useEffect(() => {
    cargarPerfiles()
  }, [])

  async function cargarPerfiles() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('configuraciones_vehiculo')
        .select('*')
        .order('nombre_configuracion', { ascending: true })

      if (error) throw error

      // Asegurar que componentes_aplicables siempre sea un array
      const perfilesNormalizados = (data || []).map(perfil => ({
        ...perfil,
        componentes_aplicables: Array.isArray(perfil.componentes_aplicables)
          ? perfil.componentes_aplicables
          : []
      }))

      setPerfiles(perfilesNormalizados)
    } catch (error) {
      console.error('Error cargando perfiles:', error)
      alert('Error cargando perfiles')
    } finally {
      setLoading(false)
    }
  }

  function nuevoPerfi() {
    setFormData({
      nombre_configuracion: '',
      descripcion: '',
      componentes_aplicables: []
    })
    setEditando(null)
    setMostrarForm(true)
  }

  function editarPerfil(perfil: ConfiguracionVehiculo) {
    setFormData({
      nombre_configuracion: perfil.nombre_configuracion,
      descripcion: perfil.descripcion || '',
      componentes_aplicables: perfil.componentes_aplicables
    })
    setEditando(perfil.id)
    setMostrarForm(true)
  }

  function toggleComponente(componenteId: string) {
    setFormData(prev => {
      const yaSeleccionado = prev.componentes_aplicables.includes(componenteId)
      return {
        ...prev,
        componentes_aplicables: yaSeleccionado
          ? prev.componentes_aplicables.filter(id => id !== componenteId)
          : [...prev.componentes_aplicables, componenteId]
      }
    })
  }

  function toggleCategoria(categoria: typeof CATEGORIAS_COMPONENTES[0]) {
    const idsCategoria = categoria.componentes.map(c => c.id)
    const todosSeleccionados = idsCategoria.every(id =>
      formData.componentes_aplicables.includes(id)
    )

    setFormData(prev => ({
      ...prev,
      componentes_aplicables: todosSeleccionados
        ? prev.componentes_aplicables.filter(id => !idsCategoria.includes(id))
        : [...new Set([...prev.componentes_aplicables, ...idsCategoria])]
    }))
  }

  async function guardarPerfil() {
    if (!formData.nombre_configuracion.trim()) {
      alert('El nombre es requerido')
      return
    }

    try {
      if (editando) {
        // Actualizar
        const { error } = await supabase
          .from('configuraciones_vehiculo')
          .update({
            nombre_configuracion: formData.nombre_configuracion,
            descripcion: formData.descripcion || null,
            componentes_aplicables: formData.componentes_aplicables,
            updated_at: new Date().toISOString()
          })
          .eq('id', editando)

        if (error) throw error
      } else {
        // Crear
        const { error } = await supabase
          .from('configuraciones_vehiculo')
          .insert([{
            nombre_configuracion: formData.nombre_configuracion,
            descripcion: formData.descripcion || null,
            componentes_aplicables: formData.componentes_aplicables
          }])

        if (error) throw error
      }

      await cargarPerfiles()
      setMostrarForm(false)
      setEditando(null)
    } catch (error) {
      console.error('Error guardando perfil:', error)
      alert('Error guardando perfil')
    }
  }

  async function eliminarPerfil(id: number, nombre: string) {
    if (!confirm(`¿Eliminar el perfil "${nombre}"?`)) return

    try {
      const { error } = await supabase
        .from('configuraciones_vehiculo')
        .delete()
        .eq('id', id)

      if (error) throw error
      await cargarPerfiles()
    } catch (error) {
      console.error('Error eliminando perfil:', error)
      alert('Error eliminando perfil')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/vehiculos"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Vehículos
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Perfiles de Vehículos</h1>
              <p className="text-gray-600">Configura qué componentes aplican para cada tipo de vehículo</p>
            </div>
            {!mostrarForm && (
              <button
                onClick={nuevoPerfi}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Plus className="h-5 w-5" />
                Nuevo Perfil
              </button>
            )}
          </div>
        </div>

        {/* Formulario */}
        {mostrarForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {editando ? 'Editar Perfil' : 'Nuevo Perfil'}
              </h2>
              <button
                onClick={() => {
                  setMostrarForm(false)
                  setEditando(null)
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Campos básicos */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Perfil *
                </label>
                <input
                  type="text"
                  value={formData.nombre_configuracion}
                  onChange={(e) => setFormData({...formData, nombre_configuracion: e.target.value})}
                  placeholder="Ej: Chevrolet Corsa, Mercedes Bus, etc."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción (opcional)
                </label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                  placeholder="Descripción del tipo de vehículo y sus características..."
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
            </div>

            {/* Selección de componentes */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Componentes Aplicables
                <span className="ml-2 text-sm font-normal text-gray-600">
                  ({formData.componentes_aplicables.length} seleccionados)
                </span>
              </h3>

              <div className="space-y-6">
                {CATEGORIAS_COMPONENTES.map((categoria) => {
                  const idsCategoria = categoria.componentes.map(c => c.id)
                  const todosSeleccionados = idsCategoria.every(id =>
                    formData.componentes_aplicables.includes(id)
                  )
                  const algunosSeleccionados = idsCategoria.some(id =>
                    formData.componentes_aplicables.includes(id)
                  )

                  return (
                    <div key={categoria.id} className="border border-gray-200 rounded-lg p-4">
                      {/* Header de categoría */}
                      <button
                        onClick={() => toggleCategoria(categoria)}
                        className="flex items-center justify-between w-full mb-3 hover:bg-gray-50 p-2 rounded transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{categoria.icono}</span>
                          <span className="font-semibold text-gray-900">{categoria.nombre}</span>
                          <span className="text-sm text-gray-500">
                            ({categoria.componentes.filter(c =>
                              formData.componentes_aplicables.includes(c.id)
                            ).length}/{categoria.componentes.length})
                          </span>
                        </div>
                        {todosSeleccionados ? (
                          <CheckSquare className="h-5 w-5 text-blue-600" />
                        ) : algunosSeleccionados ? (
                          <div className="h-5 w-5 bg-blue-200 border-2 border-blue-600 rounded" />
                        ) : (
                          <Square className="h-5 w-5 text-gray-400" />
                        )}
                      </button>

                      {/* Componentes de la categoría */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 ml-10">
                        {categoria.componentes.map((componente) => {
                          const seleccionado = formData.componentes_aplicables.includes(componente.id)
                          return (
                            <button
                              key={componente.id}
                              onClick={() => toggleComponente(componente.id)}
                              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                                seleccionado
                                  ? 'bg-blue-100 text-blue-900 hover:bg-blue-200'
                                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                              }`}
                            >
                              {seleccionado ? (
                                <CheckSquare className="h-4 w-4 flex-shrink-0" />
                              ) : (
                                <Square className="h-4 w-4 flex-shrink-0" />
                              )}
                              <span className="truncate">{componente.label}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setMostrarForm(false)
                  setEditando(null)
                }}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={guardarPerfil}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Save className="h-4 w-4" />
                {editando ? 'Guardar Cambios' : 'Crear Perfil'}
              </button>
            </div>
          </div>
        )}

        {/* Lista de perfiles */}
        {!mostrarForm && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-gray-500">
                Cargando perfiles...
              </div>
            ) : perfiles.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-gray-500 mb-4">No hay perfiles configurados</p>
                <button
                  onClick={nuevoPerfi}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Crear el primer perfil
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {perfiles.map((perfil) => (
                  <div key={perfil.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {perfil.nombre_configuracion}
                        </h3>
                        {perfil.descripcion && (
                          <p className="text-gray-600 text-sm mb-3">
                            {perfil.descripcion}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                            {perfil.componentes_aplicables.length} componentes
                          </span>
                          <span>
                            Creado: {new Date(perfil.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => editarPerfil(perfil)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => eliminarPerfil(perfil.id, perfil.nombre_configuracion)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
