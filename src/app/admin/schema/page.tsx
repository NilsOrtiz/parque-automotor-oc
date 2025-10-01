'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Code, Copy, CheckCircle, AlertTriangle } from 'lucide-react'

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
}

// Componentes actuales según análisis
const COMPONENTES_ACTUALES: ComponenteSchema[] = [
  { nombre: 'aceite_motor', label: 'Aceite de Motor', tieneKm: true, tieneFecha: true, tieneModelo: true, tieneIntervalo: true, tieneHr: true, tieneLitros: true },
  { nombre: 'filtro_aceite_motor', label: 'Filtro Aceite Motor', tieneKm: false, tieneFecha: false, tieneModelo: true, tieneIntervalo: false },
  { nombre: 'filtro_combustible', label: 'Filtro de Combustible', tieneKm: true, tieneFecha: true, tieneModelo: true, tieneIntervalo: false },
  { nombre: 'filtro_aire', label: 'Filtro de Aire', tieneKm: true, tieneFecha: true, tieneModelo: true, tieneIntervalo: false },
  { nombre: 'filtro_cabina', label: 'Filtro de Cabina', tieneKm: true, tieneFecha: true, tieneModelo: true, tieneIntervalo: false },
  { nombre: 'aceite_transmicion', label: 'Aceite de Transmisión', tieneKm: true, tieneFecha: true, tieneModelo: true, tieneIntervalo: false },
  { nombre: 'filtro_deshumidificador', label: 'Filtro Deshumidificador', tieneKm: true, tieneFecha: true, tieneModelo: true, tieneIntervalo: false },
  { nombre: 'liquido_refrigerante', label: 'Líquido Refrigerante', tieneKm: true, tieneFecha: true, tieneModelo: true, tieneIntervalo: false },
  { nombre: 'liquido_frenos', label: 'Líquido de Frenos', tieneKm: true, tieneFecha: true, tieneModelo: true, tieneIntervalo: false },
  { nombre: 'embrague', label: 'Embrague', tieneKm: true, tieneFecha: true, tieneModelo: true, tieneIntervalo: false },
  { nombre: 'correa_distribucion', label: 'Correa de Distribución', tieneKm: true, tieneFecha: true, tieneModelo: true, tieneIntervalo: false },
  { nombre: 'correa_alternador', label: 'Correa de Alternador', tieneKm: true, tieneFecha: true, tieneModelo: true, tieneIntervalo: false },
  { nombre: 'correa_direccion', label: 'Correa de Dirección', tieneKm: true, tieneFecha: true, tieneModelo: true, tieneIntervalo: false },
  { nombre: 'correa_aire_acondicionado', label: 'Correa de Aire Acondicionado', tieneKm: true, tieneFecha: true, tieneModelo: true, tieneIntervalo: false },
  { nombre: 'correa_polyv', label: 'Correa Poly-V', tieneKm: true, tieneFecha: true, tieneModelo: true, tieneIntervalo: false },
  { nombre: 'tensor_correa', label: 'Tensor de Correa', tieneKm: true, tieneFecha: true, tieneModelo: true, tieneIntervalo: false },
  { nombre: 'polea_tensora_correa', label: 'Polea Tensora', tieneKm: true, tieneFecha: true, tieneModelo: true, tieneIntervalo: false },
  { nombre: 'bateria', label: 'Batería', tieneKm: true, tieneFecha: true, tieneModelo: true, tieneIntervalo: false },
  { nombre: 'escobillas', label: 'Escobillas', tieneKm: true, tieneFecha: true, tieneModelo: true, tieneIntervalo: false },
  { nombre: 'filtro_secador', label: 'Filtro Secador', tieneKm: true, tieneFecha: true, tieneModelo: true, tieneIntervalo: false },
  { nombre: 'filtro_aire_secundario', label: 'Filtro de Aire Secundario', tieneKm: true, tieneFecha: true, tieneModelo: true, tieneIntervalo: false },
  { nombre: 'trampa_agua', label: 'Trampa de Agua', tieneKm: true, tieneFecha: true, tieneModelo: true, tieneIntervalo: false },
  { nombre: 'alineacion_neumaticos', label: 'Alineación de Neumáticos', tieneKm: true, tieneFecha: true, tieneModelo: false, tieneIntervalo: false },
  { nombre: 'rotacion_neumaticos', label: 'Rotación de Neumáticos', tieneKm: true, tieneFecha: true, tieneModelo: false, tieneIntervalo: true },
]

export default function AdminSchemaPage() {
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

  function generarSQLCompletarExistentes() {
    let sql = `-- SQL para completar componentes existentes con columnas faltantes\n`
    sql += `-- Ejecutar en Supabase SQL Editor\n\n`

    const columnasFaltantes: string[] = []

    COMPONENTES_ACTUALES.forEach(comp => {
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
  const componentesIncompletos = COMPONENTES_ACTUALES.filter(c =>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Administración de Schema - Tabla Vehiculos
          </h1>
          <p className="text-gray-600">
            Gestiona las columnas de la tabla vehiculos y genera SQL para modificaciones
          </p>
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
            Componentes Actuales ({COMPONENTES_ACTUALES.length})
          </h2>

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
                {COMPONENTES_ACTUALES.map((comp, idx) => {
                  const completo = comp.tieneKm && comp.tieneFecha && comp.tieneModelo && comp.tieneIntervalo
                  return (
                    <tr key={idx} className={completo ? '' : 'bg-yellow-50'}>
                      <td className="px-4 py-3 text-sm">
                        <div className="font-medium text-gray-900">{comp.label}</div>
                        <div className="text-xs text-gray-500 font-mono">{comp.nombre}</div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {comp.tieneKm ? (
                          <CheckCircle className="h-4 w-4 text-green-600 mx-auto" />
                        ) : (
                          <span className="text-red-500">✗</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {comp.tieneFecha ? (
                          <CheckCircle className="h-4 w-4 text-green-600 mx-auto" />
                        ) : (
                          <span className="text-red-500">✗</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {comp.tieneModelo ? (
                          <CheckCircle className="h-4 w-4 text-green-600 mx-auto" />
                        ) : (
                          <span className="text-red-500">✗</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {comp.tieneIntervalo ? (
                          <CheckCircle className="h-4 w-4 text-green-600 mx-auto" />
                        ) : (
                          <span className="text-red-500">✗</span>
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
