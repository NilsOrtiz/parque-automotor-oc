'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Save, RefreshCw, Plus, Trash2, AlertTriangle } from 'lucide-react'
import { cargarAlias, guardarAlias, obtenerAliasPorDefecto, type AliasColumna } from '@/lib/alias-columnas'
import { obtenerTodasLasColumnas } from '@/lib/exclusiones-mantenimiento'

export default function AliasPage() {
  const [todasColumnas, setTodasColumnas] = useState<string[]>([])
  const [alias, setAlias] = useState<AliasColumna[]>([])
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    cargarDatos()
  }, [])

  async function cargarDatos() {
    setLoading(true)
    try {
      const [columnas, aliasData] = await Promise.all([
        obtenerTodasLasColumnas(),
        cargarAlias()
      ])

      setTodasColumnas(columnas.sort())
      setAlias(aliasData)
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
      await guardarAlias(alias)
      alert('✅ Alias guardados exitosamente')
    } catch (error) {
      console.error('Error guardando:', error)
      alert('❌ Error guardando alias')
    } finally {
      setGuardando(false)
    }
  }

  function agregarAlias() {
    setAlias([...alias, {
      nombre_real: '',
      componente: '',
      tipo: 'intervalo'
    }])
  }

  function eliminarAlias(index: number) {
    setAlias(alias.filter((_, i) => i !== index))
  }

  function actualizarAlias(index: number, campo: keyof AliasColumna, valor: string) {
    const nuevosAlias = [...alias]
    nuevosAlias[index] = {
      ...nuevosAlias[index],
      [campo]: valor
    }
    setAlias(nuevosAlias)
  }

  function restaurarDefecto() {
    if (confirm('¿Restaurar alias por defecto? Esto sobrescribirá tu configuración actual.')) {
      setAlias(obtenerAliasPorDefecto())
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
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
                Configuración de Alias de Columnas
              </h1>
              <p className="text-gray-600">
                Mapea columnas con nombres no estándar a componentes del sistema
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
                ¿Qué son los alias?
              </p>
              <p className="text-sm text-blue-800 mb-3">
                Los alias permiten mapear columnas con nombres antiguos o no estándar a componentes del sistema.
              </p>
              <div className="bg-blue-100 rounded-lg p-4 font-mono text-sm">
                <p className="text-blue-900 mb-2"><strong>Ejemplo:</strong></p>
                <p className="text-blue-800 mb-1">Columna real en BD: <code className="bg-blue-200 px-2 py-1 rounded">intervalo_cambio_aceite</code></p>
                <p className="text-blue-800 mb-1">Componente: <code className="bg-blue-200 px-2 py-1 rounded">aceite_motor</code></p>
                <p className="text-blue-800 mb-1">Tipo: <code className="bg-blue-200 px-2 py-1 rounded">intervalo</code></p>
                <p className="text-blue-700 mt-2">→ El sistema tratará "intervalo_cambio_aceite" como "aceite_motor_intervalo"</p>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de alias */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Alias Configurados ({alias.length})
              </h2>
              <button
                onClick={agregarAlias}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Agregar Alias
              </button>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-gray-600">Cargando alias...</p>
              </div>
            ) : alias.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-500 mb-4">No hay alias configurados</p>
                <button
                  onClick={agregarAlias}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Agregar el primer alias
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {alias.map((item, index) => (
                  <div key={index} className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {/* Nombre Real */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nombre Real de la Columna *
                        </label>
                        <select
                          value={item.nombre_real}
                          onChange={(e) => actualizarAlias(index, 'nombre_real', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                        >
                          <option value="">Seleccionar...</option>
                          {todasColumnas.map(col => (
                            <option key={col} value={col}>{col}</option>
                          ))}
                        </select>
                      </div>

                      {/* Componente */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Componente *
                        </label>
                        <input
                          type="text"
                          value={item.componente}
                          onChange={(e) => actualizarAlias(index, 'componente', e.target.value)}
                          placeholder="Ej: aceite_motor"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Nombre base del componente
                        </p>
                      </div>

                      {/* Tipo */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tipo de Campo *
                        </label>
                        <select
                          value={item.tipo}
                          onChange={(e) => actualizarAlias(index, 'tipo', e.target.value as any)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="km">KM (kilometraje)</option>
                          <option value="fecha">Fecha</option>
                          <option value="modelo">Modelo</option>
                          <option value="intervalo">Intervalo</option>
                          <option value="litros">Litros</option>
                          <option value="hr">Horas</option>
                        </select>
                      </div>

                      {/* Botón eliminar */}
                      <div className="flex items-end">
                        <button
                          onClick={() => eliminarAlias(index)}
                          className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                          Eliminar
                        </button>
                      </div>
                    </div>

                    {/* Vista previa */}
                    {item.nombre_real && item.componente && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs text-gray-600 mb-1">Vista previa del mapeo:</p>
                        <div className="bg-green-50 border border-green-200 rounded px-3 py-2 font-mono text-sm">
                          <span className="text-green-800">{item.nombre_real}</span>
                          <span className="text-gray-600 mx-2">→</span>
                          <span className="text-green-800">{item.componente}_{item.tipo}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end">
          <button
            onClick={guardar}
            disabled={guardando}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-8 py-3 rounded-lg flex items-center gap-2 transition-colors text-lg font-medium"
          >
            <Save className="h-5 w-5" />
            {guardando ? 'Guardando Alias...' : 'Guardar Configuración'}
          </button>
        </div>
      </div>
    </div>
  )
}
