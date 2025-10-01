'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Save, RefreshCw, CheckSquare, Square, AlertTriangle } from 'lucide-react'
import {
  cargarColumnasExcluidas,
  guardarColumnasExcluidas,
  obtenerTodasLasColumnas,
  obtenerExclusionesPorDefecto
} from '@/lib/exclusiones-mantenimiento'

export default function ExclusionesPage() {
  const [todasColumnas, setTodasColumnas] = useState<string[]>([])
  const [columnasExcluidas, setColumnasExcluidas] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    cargarDatos()
  }, [])

  async function cargarDatos() {
    setLoading(true)
    try {
      const [columnas, exclusiones] = await Promise.all([
        obtenerTodasLasColumnas(),
        cargarColumnasExcluidas()
      ])

      setTodasColumnas(columnas.sort())
      setColumnasExcluidas(exclusiones)
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
      await guardarColumnasExcluidas(columnasExcluidas)
      alert('✅ Configuración guardada exitosamente')
    } catch (error) {
      console.error('Error guardando:', error)
      alert('❌ Error guardando configuración')
    } finally {
      setGuardando(false)
    }
  }

  function toggleColumna(nombreColumna: string) {
    setColumnasExcluidas(prev => {
      if (prev.includes(nombreColumna)) {
        return prev.filter(c => c !== nombreColumna)
      } else {
        return [...prev, nombreColumna]
      }
    })
  }

  function restaurarDefecto() {
    if (confirm('¿Restaurar exclusiones por defecto? Esto sobrescribirá tu configuración actual.')) {
      setColumnasExcluidas(obtenerExclusionesPorDefecto())
    }
  }

  // Agrupar columnas por tipo
  const columnasMantenimiento = todasColumnas.filter(col => !columnasExcluidas.includes(col))
  const columnasNoMantenimiento = todasColumnas.filter(col => columnasExcluidas.includes(col))

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
                Configuración de Exclusiones
              </h1>
              <p className="text-gray-600">
                Selecciona qué columnas NO son de mantenimiento (datos administrativos, IDs, etc.)
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

        {/* Resumen */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Total de Columnas</div>
            <div className="text-3xl font-bold text-gray-900">{todasColumnas.length}</div>
          </div>
          <div className="bg-green-50 rounded-lg shadow p-6">
            <div className="text-sm text-green-700 mb-1">Columnas de Mantenimiento</div>
            <div className="text-3xl font-bold text-green-700">{columnasMantenimiento.length}</div>
          </div>
          <div className="bg-yellow-50 rounded-lg shadow p-6">
            <div className="text-sm text-yellow-700 mb-1">Columnas Excluidas</div>
            <div className="text-3xl font-bold text-yellow-700">{columnasNoMantenimiento.length}</div>
          </div>
        </div>

        {/* Instrucciones */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
            <div>
              <p className="text-sm text-blue-900 font-medium mb-1">
                ¿Qué columnas debo excluir?
              </p>
              <ul className="text-sm text-blue-800 list-disc list-inside space-y-1">
                <li>IDs y fechas de sistema (id, created_at, updated_at)</li>
                <li>Datos administrativos (Placa, Titular, Marca, Modelo, Año, etc.)</li>
                <li>Campos de control (kilometraje_actual, hora_actual, tipo_vehiculo)</li>
                <li>Cualquier columna que NO tenga variantes _km, _fecha, _modelo, _intervalo</li>
              </ul>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Cargando columnas...</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Todas las Columnas de la Tabla Vehiculos
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {todasColumnas.map(nombreColumna => {
                  const esExcluida = columnasExcluidas.includes(nombreColumna)
                  return (
                    <button
                      key={nombreColumna}
                      onClick={() => toggleColumna(nombreColumna)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all text-left ${
                        esExcluida
                          ? 'border-yellow-300 bg-yellow-50 hover:bg-yellow-100'
                          : 'border-green-300 bg-green-50 hover:bg-green-100'
                      }`}
                    >
                      {esExcluida ? (
                        <CheckSquare className="h-5 w-5 text-yellow-700 flex-shrink-0" />
                      ) : (
                        <Square className="h-5 w-5 text-green-700 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className={`font-mono text-sm font-medium truncate ${
                          esExcluida ? 'text-yellow-900' : 'text-green-900'
                        }`}>
                          {nombreColumna}
                        </div>
                        <div className={`text-xs ${
                          esExcluida ? 'text-yellow-700' : 'text-green-700'
                        }`}>
                          {esExcluida ? '✗ No es mantenimiento' : '✓ Es mantenimiento'}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Footer con botón guardar */}
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
