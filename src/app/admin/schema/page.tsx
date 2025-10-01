'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Plus, Code, Copy, CheckCircle, AlertTriangle, RefreshCw, Settings } from 'lucide-react'
import { cargarColumnasExcluidas } from '@/lib/exclusiones-mantenimiento'
import { cargarAlias, convertirAliasARecord } from '@/lib/alias-columnas'

type ComponenteSchema = {
  nombre: string // Ej: "filtro_combustible"
  label: string // Ej: "Filtro de Combustible"
  tieneKm: boolean
  tieneFecha: boolean
  tieneModelo: boolean
  tieneIntervalo: boolean
  // Extras opcionales
  tieneHr?: boolean
  tieneLitros?: boolean
  // Nombres reales de columnas (para mostrar alias)
  columnaKm?: string
  columnaFecha?: string
  columnaModelo?: string
  columnaIntervalo?: string
  columnaHr?: string
  columnaLitros?: string
}

export default function AdminSchemaPage() {
  const [componentesReales, setComponentesReales] = useState<ComponenteSchema[]>([])
  const [loading, setLoading] = useState(true)
  const [nuevoComponente, setNuevoComponente] = useState({
    nombre: '',
    label: '',
    tieneKm: true,
    tieneFecha: true,
    tieneModelo: true,
    tieneIntervalo: true
  })
  const [sqlGenerado, setSqlGenerado] = useState('')
  const [copiado, setCopiado] = useState(false)
  const [mostrarFormNuevo, setMostrarFormNuevo] = useState(false)

  useEffect(() => {
    cargarSchemaReal()
  }, [])

  async function cargarSchemaReal() {
    setLoading(true)
    try {
      // Cargar exclusiones y alias dinámicamente
      const [exclusiones, aliasArray] = await Promise.all([
        cargarColumnasExcluidas(),
        cargarAlias()
      ])

      // Convertir alias a Record para búsqueda rápida
      const COLUMNAS_ALIAS = convertirAliasARecord(aliasArray)

      // Obtener las columnas de la tabla vehiculos
      const { data, error } = await supabase
        .from('vehiculos')
        .select('*')
        .limit(1)
        .single()

      if (error) throw error

      // Extraer componentes del schema
      const columnas = Object.keys(data || {})
      const componentesMap = new Map<string, ComponenteSchema>()

      // Procesar columnas y agrupar por componente
      columnas.forEach(col => {
        // Ignorar columnas excluidas dinámicamente
        if (exclusiones.includes(col)) {
          return
        }

        // Detectar patrón: {componente}_{tipo}
        let nombreComponente = ''
        let tipoColumna = ''

        // Primero verificar si es un alias
        if (COLUMNAS_ALIAS[col]) {
          const alias = COLUMNAS_ALIAS[col]
          nombreComponente = alias.componente
          tipoColumna = alias.tipo
          console.log('🔍 Alias detectado:', col, '→', nombreComponente, tipoColumna)
        } else if (col.endsWith('_km')) {
          nombreComponente = col.replace('_km', '')
          tipoColumna = 'km'
        } else if (col.endsWith('_fecha')) {
          nombreComponente = col.replace('_fecha', '')
          tipoColumna = 'fecha'
        } else if (col.endsWith('_modelo')) {
          nombreComponente = col.replace('_modelo', '')
          tipoColumna = 'modelo'
        } else if (col.endsWith('_intervalo')) {
          nombreComponente = col.replace('_intervalo', '')
          tipoColumna = 'intervalo'
        } else if (col.endsWith('_litros')) {
          nombreComponente = col.replace('_litros', '')
          tipoColumna = 'litros'
        } else if (col.endsWith('_hr')) {
          nombreComponente = col.replace('_hr', '')
          tipoColumna = 'hr'
        } else if (col === 'intervalo_cambio_aceite' || col === 'intervalo_cambio_aceite_hr' || col === 'intervalo_rotacion_neumaticos') {
          // Casos especiales
          return
        } else {
          // Columna que no sigue el patrón estándar
          return
        }

        // Crear o actualizar componente en el map
        if (!componentesMap.has(nombreComponente)) {
          componentesMap.set(nombreComponente, {
            nombre: nombreComponente,
            label: nombreComponente.split('_').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' '),
            tieneKm: false,
            tieneFecha: false,
            tieneModelo: false,
            tieneIntervalo: false
          })
        }

        const comp = componentesMap.get(nombreComponente)!
        if (tipoColumna === 'km') {
          comp.tieneKm = true
          comp.columnaKm = col
          console.log('  ✅ Guardado km:', comp.nombre, '→', col)
        }
        if (tipoColumna === 'fecha') {
          comp.tieneFecha = true
          comp.columnaFecha = col
          console.log('  ✅ Guardado fecha:', comp.nombre, '→', col)
        }
        if (tipoColumna === 'modelo') {
          comp.tieneModelo = true
          comp.columnaModelo = col
          console.log('  ✅ Guardado modelo:', comp.nombre, '→', col)
        }
        if (tipoColumna === 'intervalo') {
          comp.tieneIntervalo = true
          comp.columnaIntervalo = col
          console.log('  ✅ Guardado intervalo:', comp.nombre, '→', col)
        }
        if (tipoColumna === 'litros') {
          comp.tieneLitros = true
          comp.columnaLitros = col
          console.log('  ✅ Guardado litros:', comp.nombre, '→', col)
        }
        if (tipoColumna === 'hr') {
          comp.tieneHr = true
          comp.columnaHr = col
          console.log('  ✅ Guardado hr:', comp.nombre, '→', col)
        }
      })

      // Convertir a array y ordenar
      const componentesArray = Array.from(componentesMap.values())
        .sort((a, b) => a.nombre.localeCompare(b.nombre))

      setComponentesReales(componentesArray)
    } catch (error) {
      console.error('Error cargando schema:', error)
      alert('Error cargando el schema de la base de datos')
    } finally {
      setLoading(false)
    }
  }

  function generarSQLCompletarExistentes() {
    let sql = `-- SQL para completar componentes existentes con columnas faltantes\n`
    sql += `-- Ejecutar en Supabase SQL Editor\n\n`

    const columnasFaltantes: string[] = []

    componentesReales.forEach(comp => {
      // Verificar columnas faltantes
      if (!comp.tieneKm) {
        columnasFaltantes.push(`ALTER TABLE public.vehiculos ADD COLUMN IF NOT EXISTS ${comp.nombre}_km integer;`)
      }
      if (!comp.tieneFecha) {
        columnasFaltantes.push(`ALTER TABLE public.vehiculos ADD COLUMN IF NOT EXISTS ${comp.nombre}_fecha date;`)
      }
      if (!comp.tieneModelo) {
        columnasFaltantes.push(`ALTER TABLE public.vehiculos ADD COLUMN IF NOT EXISTS ${comp.nombre}_modelo text;`)
      }
      if (!comp.tieneIntervalo) {
        columnasFaltantes.push(`ALTER TABLE public.vehiculos ADD COLUMN IF NOT EXISTS ${comp.nombre}_intervalo integer;`)
      }
    })

    sql += columnasFaltantes.join('\n')
    sql += `\n\n-- Total de columnas a agregar: ${columnasFaltantes.length}\n`

    return sql
  }

  function generarSQLNuevoComponente() {
    if (!nuevoComponente.nombre || !nuevoComponente.label) {
      alert('Complete nombre y label')
      return
    }

    let sql = `-- Agregar nuevo componente: ${nuevoComponente.label}\n\n`

    if (nuevoComponente.tieneKm) {
      sql += `ALTER TABLE public.vehiculos ADD COLUMN IF NOT EXISTS ${nuevoComponente.nombre}_km integer;\n`
    }
    if (nuevoComponente.tieneFecha) {
      sql += `ALTER TABLE public.vehiculos ADD COLUMN IF NOT EXISTS ${nuevoComponente.nombre}_fecha date;\n`
    }
    if (nuevoComponente.tieneModelo) {
      sql += `ALTER TABLE public.vehiculos ADD COLUMN IF NOT EXISTS ${nuevoComponente.nombre}_modelo text;\n`
    }
    if (nuevoComponente.tieneIntervalo) {
      sql += `ALTER TABLE public.vehiculos ADD COLUMN IF NOT EXISTS ${nuevoComponente.nombre}_intervalo integer;\n`
    }

    sql += `\n-- Comentario descriptivo\n`
    sql += `COMMENT ON COLUMN public.vehiculos.${nuevoComponente.nombre}_km IS 'Kilometraje al último cambio de ${nuevoComponente.label}';\n`

    setSqlGenerado(sql)
  }

  async function copiarSQL(sql: string) {
    await navigator.clipboard.writeText(sql)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  const sqlCompleto = generarSQLCompletarExistentes()
  const componentesIncompletos = componentesReales.filter(c =>
    !c.tieneKm || !c.tieneFecha || !c.tieneModelo || !c.tieneIntervalo
  )

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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Administración de Schema - Tabla Vehiculos
              </h1>
              <p className="text-gray-600">
                Gestiona las columnas de la tabla vehiculos y genera SQL para modificaciones
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/admin/exclusiones"
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Settings className="h-4 w-4" />
                Configurar Exclusiones
              </Link>
              <Link
                href="/admin/alias"
                className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                <Settings className="h-4 w-4" />
                Configurar Alias
              </Link>
              <button
                onClick={cargarSchemaReal}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Cargando...' : 'Recargar Schema'}
              </button>
            </div>
          </div>
        </div>

        {/* Alert de componentes incompletos */}
        {componentesIncompletos.length > 0 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  {componentesIncompletos.length} componentes incompletos
                </h3>
                <p className="text-sm text-yellow-700 mt-1">
                  Hay componentes que no tienen todas las columnas estándar (km, fecha, modelo, intervalo)
                </p>
              </div>
            </div>
          </div>
        )}

        {/* SQL para completar existentes */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              SQL para Completar Componentes Existentes
            </h2>
            <button
              onClick={() => copiarSQL(sqlCompleto)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {copiado ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copiado ? 'Copiado!' : 'Copiar SQL'}
            </button>
          </div>

          <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm font-mono">
            {sqlCompleto}
          </pre>

          <p className="text-sm text-gray-600 mt-4">
            Este SQL agrega las columnas faltantes a los componentes existentes para completar el patrón estándar.
          </p>
        </div>

        {/* Lista de componentes actuales */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Componentes Actuales ({componentesReales.length})
          </h2>

          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
              <p className="text-gray-600">Cargando schema desde la base de datos...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Componente
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      KM
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Fecha
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Modelo
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Intervalo
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {componentesReales.map((comp, idx) => {
                  const completo = comp.tieneKm && comp.tieneFecha && comp.tieneModelo && comp.tieneIntervalo
                  return (
                    <tr key={idx} className={completo ? '' : 'bg-yellow-50'}>
                      <td className="px-4 py-3 text-sm">
                        <div className="font-medium text-gray-900">{comp.label}</div>
                        <div className="text-xs text-gray-500 font-mono">{comp.nombre}</div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {comp.tieneKm ? (
                          <div className="flex flex-col items-center gap-1">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <span className="text-xs font-mono text-green-700">{comp.columnaKm || `${comp.nombre}_km`}</span>
                            {comp.columnaKm && comp.columnaKm !== `${comp.nombre}_km` && (
                              <span className="text-xs text-blue-600 font-semibold">📌 Alias</span>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-red-500 text-lg">✗</span>
                            <span className="text-xs font-mono text-gray-400">{comp.nombre}_km</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {comp.tieneFecha ? (
                          <div className="flex flex-col items-center gap-1">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <span className="text-xs font-mono text-green-700">{comp.columnaFecha || `${comp.nombre}_fecha`}</span>
                            {comp.columnaFecha && comp.columnaFecha !== `${comp.nombre}_fecha` && (
                              <span className="text-xs text-blue-600 font-semibold">📌 Alias</span>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-red-500 text-lg">✗</span>
                            <span className="text-xs font-mono text-gray-400">{comp.nombre}_fecha</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {comp.tieneModelo ? (
                          <div className="flex flex-col items-center gap-1">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <span className="text-xs font-mono text-green-700">{comp.columnaModelo || `${comp.nombre}_modelo`}</span>
                            {comp.columnaModelo && comp.columnaModelo !== `${comp.nombre}_modelo` && (
                              <span className="text-xs text-blue-600 font-semibold">📌 Alias</span>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-red-500 text-lg">✗</span>
                            <span className="text-xs font-mono text-gray-400">{comp.nombre}_modelo</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {comp.tieneIntervalo ? (
                          <div className="flex flex-col items-center gap-1">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <span className="text-xs font-mono text-green-700">{comp.columnaIntervalo || `${comp.nombre}_intervalo`}</span>
                            {comp.columnaIntervalo && comp.columnaIntervalo !== `${comp.nombre}_intervalo` && (
                              <span className="text-xs text-blue-600 font-semibold">📌 Alias</span>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-red-500 text-lg">✗</span>
                            <span className="text-xs font-mono text-gray-400">{comp.nombre}_intervalo</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {completo ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Completo
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Incompleto
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Agregar nuevo componente */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Agregar Nuevo Componente
            </h2>
            {!mostrarFormNuevo && (
              <button
                onClick={() => setMostrarFormNuevo(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Nuevo Componente
              </button>
            )}
          </div>

          {mostrarFormNuevo && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre (snake_case) *
                  </label>
                  <input
                    type="text"
                    value={nuevoComponente.nombre}
                    onChange={(e) => setNuevoComponente({...nuevoComponente, nombre: e.target.value.toLowerCase().replace(/\s+/g, '_')})}
                    placeholder="Ej: polea_loca"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Label (legible) *
                  </label>
                  <input
                    type="text"
                    value={nuevoComponente.label}
                    onChange={(e) => setNuevoComponente({...nuevoComponente, label: e.target.value})}
                    placeholder="Ej: Polea Loca"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={nuevoComponente.tieneKm}
                    onChange={(e) => setNuevoComponente({...nuevoComponente, tieneKm: e.target.checked})}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Kilometraje</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={nuevoComponente.tieneFecha}
                    onChange={(e) => setNuevoComponente({...nuevoComponente, tieneFecha: e.target.checked})}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Fecha</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={nuevoComponente.tieneModelo}
                    onChange={(e) => setNuevoComponente({...nuevoComponente, tieneModelo: e.target.checked})}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Modelo</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={nuevoComponente.tieneIntervalo}
                    onChange={(e) => setNuevoComponente({...nuevoComponente, tieneIntervalo: e.target.checked})}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Intervalo</span>
                </label>
              </div>

              <button
                onClick={generarSQLNuevoComponente}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <Code className="h-4 w-4" />
                Generar SQL
              </button>

              {sqlGenerado && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">
                      SQL Generado
                    </label>
                    <button
                      onClick={() => copiarSQL(sqlGenerado)}
                      className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      <Copy className="h-4 w-4" />
                      Copiar
                    </button>
                  </div>
                  <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm font-mono">
                    {sqlGenerado}
                  </pre>
                  <p className="text-sm text-gray-600 mt-2">
                    Copia este SQL y ejecútalo en Supabase SQL Editor. Luego actualiza el catálogo de componentes.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
