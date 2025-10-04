'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { obtenerComponentesAgrupados, type CategoriaComponentes } from '@/lib/componentes-dinamicos'
import { Eye, Download, Filter, RefreshCw, Check, X, ChevronDown, ChevronUp } from 'lucide-react'

interface VehiculoCompleto {
  id: number
  Placa: string
  Nro_Interno: number
  Marca: string
  Modelo: string
  Año: number
  kilometraje_actual: number
  [key: string]: any
}

interface CeldaExpandida {
  vehiculoId: number
  componenteId: string
}

interface CeldaEditando {
  vehiculoId: number
  columna: string
  campo: 'km' | 'fecha' | 'modelo' | 'intervalo'
}

export default function OjoDeDios() {
  const [vehiculos, setVehiculos] = useState<VehiculoCompleto[]>([])
  const [categorias, setCategorias] = useState<CategoriaComponentes[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroTexto, setFiltroTexto] = useState('')
  const [celdasExpandidas, setCeldasExpandidas] = useState<Set<string>>(new Set())
  const [celdaEditando, setCeldaEditando] = useState<CeldaEditando | null>(null)
  const [valorEditando, setValorEditando] = useState<string>('')
  const [guardando, setGuardando] = useState<string | null>(null)

  useEffect(() => {
    cargarTodo()
  }, [])

  async function cargarTodo() {
    setLoading(true)
    try {
      const [cats, { data: vehs }] = await Promise.all([
        obtenerComponentesAgrupados(),
        supabase.from('vehiculos').select('*').order('Nro_Interno', { ascending: true })
      ])

      setCategorias(cats)
      setVehiculos(vehs || [])
    } catch (error) {
      console.error('Error cargando datos:', error)
    } finally {
      setLoading(false)
    }
  }

  const vehiculosFiltrados = vehiculos.filter(v => {
    if (!filtroTexto) return true
    const texto = filtroTexto.toLowerCase()
    return (
      v.Placa?.toLowerCase().includes(texto) ||
      v.Nro_Interno?.toString().includes(texto) ||
      v.Marca?.toLowerCase().includes(texto) ||
      v.Modelo?.toLowerCase().includes(texto)
    )
  })

  function calcularPorcentajeVida(
    kmActual: number | null | undefined,
    kmUltimoCambio: number | null | undefined,
    intervalo: number | null | undefined
  ): number | null {
    if (!kmActual || kmUltimoCambio === null || kmUltimoCambio === undefined || kmUltimoCambio === -1) return null
    if (!intervalo || intervalo === -1) return null

    const kmRecorridos = kmActual - kmUltimoCambio
    const kmFaltantes = intervalo - kmRecorridos
    const porcentaje = (kmFaltantes / intervalo) * 100

    return Math.max(0, Math.min(100, porcentaje))
  }

  function obtenerColorPorcentaje(porcentaje: number | null): string {
    if (porcentaje === null) return 'bg-gray-200 text-gray-500' // Sin datos
    if (porcentaje >= 15) return 'bg-green-500 text-white' // OK
    if (porcentaje >= 5) return 'bg-yellow-500 text-black' // Atención
    return 'bg-red-500 text-white' // Crítico
  }

  function toggleCelda(vehiculoId: number, componenteId: string) {
    const key = `${vehiculoId}-${componenteId}`
    setCeldasExpandidas(prev => {
      const newSet = new Set(prev)
      if (newSet.has(key)) {
        newSet.delete(key)
      } else {
        newSet.add(key)
      }
      return newSet
    })
  }

  function iniciarEdicion(
    vehiculoId: number,
    columna: string,
    campo: 'km' | 'fecha' | 'modelo' | 'intervalo',
    valorActual: any
  ) {
    setCeldaEditando({ vehiculoId, columna, campo })
    setValorEditando(obtenerValorRaw(valorActual, campo))
  }

  function obtenerValorRaw(valor: any, tipo: 'km' | 'fecha' | 'modelo' | 'intervalo'): string {
    if (valor === null || valor === undefined) return ''

    switch (tipo) {
      case 'km':
      case 'intervalo':
        if (valor === -1) return ''
        return valor.toString()
      case 'fecha':
        if (valor === '1900-01-01') return ''
        return valor
      case 'modelo':
        if (valor?.toUpperCase() === 'N/A' || valor?.toUpperCase() === 'NO APLICA') return ''
        return valor
      default:
        return valor.toString()
    }
  }

  function cancelarEdicion() {
    setCeldaEditando(null)
    setValorEditando('')
  }

  async function guardarCelda(vehiculoId: number, columna: string, tipo: 'km' | 'fecha' | 'modelo' | 'intervalo') {
    const celdaId = `${vehiculoId}-${columna}`
    setGuardando(celdaId)

    try {
      let valorParaGuardar: any = valorEditando.trim()

      if (!valorParaGuardar) {
        if (tipo === 'km' || tipo === 'intervalo') {
          valorParaGuardar = -1
        } else if (tipo === 'fecha') {
          valorParaGuardar = '1900-01-01'
        } else if (tipo === 'modelo') {
          valorParaGuardar = 'N/A'
        } else {
          valorParaGuardar = null
        }
      } else {
        if (tipo === 'km' || tipo === 'intervalo') {
          valorParaGuardar = parseInt(valorParaGuardar)
          if (isNaN(valorParaGuardar)) {
            alert('Debe ingresar un número válido')
            setGuardando(null)
            return
          }
        }
      }

      const { error } = await supabase
        .from('vehiculos')
        .update({ [columna]: valorParaGuardar })
        .eq('id', vehiculoId)

      if (error) throw error

      setVehiculos(prev => prev.map(v =>
        v.id === vehiculoId ? { ...v, [columna]: valorParaGuardar } : v
      ))

      setCeldaEditando(null)
      setValorEditando('')
    } catch (error) {
      console.error('Error guardando:', error)
      alert('Error al guardar. Intenta nuevamente.')
    } finally {
      setGuardando(null)
    }
  }

  function exportarExcel() {
    const headers = ['Placa', 'Interno', 'Marca', 'Modelo', 'Año', 'KM Actual']
    const componentesHeaders: string[] = []

    categorias.forEach(cat => {
      cat.componentes.forEach(comp => {
        componentesHeaders.push(`${comp.label}_%Vida`)
        if (comp.columnaKm) componentesHeaders.push(`${comp.label}_KM`)
        if (comp.columnaFecha) componentesHeaders.push(`${comp.label}_Fecha`)
        if (comp.columnaModelo) componentesHeaders.push(`${comp.label}_Modelo`)
        if (comp.columnaIntervalo) componentesHeaders.push(`${comp.label}_Intervalo`)
      })
    })

    const allHeaders = [...headers, ...componentesHeaders].join(',')
    const rows = vehiculosFiltrados.map(v => {
      const baseData = [
        v.Placa || '',
        v.Nro_Interno || '',
        v.Marca || '',
        v.Modelo || '',
        v.Año || '',
        v.kilometraje_actual || ''
      ]

      const componentesData: string[] = []
      categorias.forEach(cat => {
        cat.componentes.forEach(comp => {
          const porcentaje = calcularPorcentajeVida(
            v.kilometraje_actual,
            comp.columnaKm ? v[comp.columnaKm] : null,
            comp.columnaIntervalo ? v[comp.columnaIntervalo] : null
          )
          componentesData.push(porcentaje !== null ? `${porcentaje.toFixed(1)}%` : 'N/A')
          if (comp.columnaKm) componentesData.push(v[comp.columnaKm] || '')
          if (comp.columnaFecha) componentesData.push(v[comp.columnaFecha] || '')
          if (comp.columnaModelo) componentesData.push(v[comp.columnaModelo] || '')
          if (comp.columnaIntervalo) componentesData.push(v[comp.columnaIntervalo] || '')
        })
      })

      return [...baseData, ...componentesData].join(',')
    })

    const csv = [allHeaders, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `ojo-de-dios-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-blue-600" />
          <p className="text-gray-600">Cargando vista completa...</p>
        </div>
      </div>
    )
  }

  const CeldaComponenteAgrupada = ({
    vehiculo,
    componente
  }: {
    vehiculo: VehiculoCompleto
    componente: any
  }) => {
    const key = `${vehiculo.id}-${componente.id}`
    const estaExpandida = celdasExpandidas.has(key)

    const kmActual = vehiculo.kilometraje_actual
    const kmUltimoCambio = componente.columnaKm ? vehiculo[componente.columnaKm] : null
    const intervalo = componente.columnaIntervalo ? vehiculo[componente.columnaIntervalo] : null
    const fecha = componente.columnaFecha ? vehiculo[componente.columnaFecha] : null
    const modelo = componente.columnaModelo ? vehiculo[componente.columnaModelo] : null

    const porcentaje = calcularPorcentajeVida(kmActual, kmUltimoCambio, intervalo)
    const colorClass = obtenerColorPorcentaje(porcentaje)

    if (estaExpandida) {
      return (
        <td className="border border-gray-300 p-1">
          <div className="space-y-1">
            {/* Header con porcentaje y botón colapsar */}
            <div className={`flex items-center justify-between px-2 py-1 rounded ${colorClass}`}>
              <span className="font-bold text-sm">
                {porcentaje !== null ? `${porcentaje.toFixed(1)}%` : 'S/D'}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  toggleCelda(vehiculo.id, componente.id)
                }}
                className="text-xs opacity-75 hover:opacity-100"
              >
                <ChevronUp className="w-3 h-3" />
              </button>
            </div>

            {/* Campos editables */}
            <div className="space-y-0.5 bg-gray-50 p-1 rounded text-xs">
              {/* KM */}
              {componente.columnaKm && (
                <div className="flex items-center gap-1">
                  <span className="text-gray-600 w-12 text-[10px]">KM:</span>
                  {celdaEditando?.vehiculoId === vehiculo.id &&
                   celdaEditando?.columna === componente.columnaKm &&
                   celdaEditando?.campo === 'km' ? (
                    <div className="flex items-center gap-1 flex-1">
                      <input
                        type="number"
                        value={valorEditando}
                        onChange={(e) => setValorEditando(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') guardarCelda(vehiculo.id, componente.columnaKm, 'km')
                          if (e.key === 'Escape') cancelarEdicion()
                        }}
                        className="w-full px-1 py-0.5 text-xs border rounded"
                        autoFocus
                      />
                      <button
                        onClick={() => guardarCelda(vehiculo.id, componente.columnaKm, 'km')}
                        className="p-0.5 bg-green-500 text-white rounded"
                      >
                        <Check className="w-2.5 h-2.5" />
                      </button>
                      <button onClick={cancelarEdicion} className="p-0.5 bg-red-500 text-white rounded">
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ) : (
                    <span
                      className="flex-1 cursor-pointer hover:bg-blue-100 px-1 rounded"
                      onClick={() => iniciarEdicion(vehiculo.id, componente.columnaKm, 'km', kmUltimoCambio)}
                    >
                      {kmUltimoCambio && kmUltimoCambio !== -1 ? kmUltimoCambio.toLocaleString() : '-'}
                    </span>
                  )}
                </div>
              )}

              {/* Fecha */}
              {componente.columnaFecha && (
                <div className="flex items-center gap-1">
                  <span className="text-gray-600 w-12 text-[10px]">Fecha:</span>
                  {celdaEditando?.vehiculoId === vehiculo.id &&
                   celdaEditando?.columna === componente.columnaFecha &&
                   celdaEditando?.campo === 'fecha' ? (
                    <div className="flex items-center gap-1 flex-1">
                      <input
                        type="date"
                        value={valorEditando}
                        onChange={(e) => setValorEditando(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') guardarCelda(vehiculo.id, componente.columnaFecha, 'fecha')
                          if (e.key === 'Escape') cancelarEdicion()
                        }}
                        className="w-full px-1 py-0.5 text-xs border rounded"
                        autoFocus
                      />
                      <button
                        onClick={() => guardarCelda(vehiculo.id, componente.columnaFecha, 'fecha')}
                        className="p-0.5 bg-green-500 text-white rounded"
                      >
                        <Check className="w-2.5 h-2.5" />
                      </button>
                      <button onClick={cancelarEdicion} className="p-0.5 bg-red-500 text-white rounded">
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ) : (
                    <span
                      className="flex-1 cursor-pointer hover:bg-blue-100 px-1 rounded"
                      onClick={() => iniciarEdicion(vehiculo.id, componente.columnaFecha, 'fecha', fecha)}
                    >
                      {fecha && fecha !== '1900-01-01'
                        ? new Date(fecha).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' })
                        : '-'
                      }
                    </span>
                  )}
                </div>
              )}

              {/* Modelo */}
              {componente.columnaModelo && (
                <div className="flex items-center gap-1">
                  <span className="text-gray-600 w-12 text-[10px]">Modelo:</span>
                  {celdaEditando?.vehiculoId === vehiculo.id &&
                   celdaEditando?.columna === componente.columnaModelo &&
                   celdaEditando?.campo === 'modelo' ? (
                    <div className="flex items-center gap-1 flex-1">
                      <input
                        type="text"
                        value={valorEditando}
                        onChange={(e) => setValorEditando(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') guardarCelda(vehiculo.id, componente.columnaModelo, 'modelo')
                          if (e.key === 'Escape') cancelarEdicion()
                        }}
                        className="w-full px-1 py-0.5 text-xs border rounded"
                        autoFocus
                      />
                      <button
                        onClick={() => guardarCelda(vehiculo.id, componente.columnaModelo, 'modelo')}
                        className="p-0.5 bg-green-500 text-white rounded"
                      >
                        <Check className="w-2.5 h-2.5" />
                      </button>
                      <button onClick={cancelarEdicion} className="p-0.5 bg-red-500 text-white rounded">
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ) : (
                    <span
                      className="flex-1 cursor-pointer hover:bg-blue-100 px-1 rounded text-[10px]"
                      onClick={() => iniciarEdicion(vehiculo.id, componente.columnaModelo, 'modelo', modelo)}
                    >
                      {modelo && modelo.toUpperCase() !== 'N/A' ? modelo : '-'}
                    </span>
                  )}
                </div>
              )}

              {/* Intervalo */}
              {componente.columnaIntervalo && (
                <div className="flex items-center gap-1">
                  <span className="text-gray-600 w-12 text-[10px]">Int:</span>
                  {celdaEditando?.vehiculoId === vehiculo.id &&
                   celdaEditando?.columna === componente.columnaIntervalo &&
                   celdaEditando?.campo === 'intervalo' ? (
                    <div className="flex items-center gap-1 flex-1">
                      <input
                        type="number"
                        value={valorEditando}
                        onChange={(e) => setValorEditando(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') guardarCelda(vehiculo.id, componente.columnaIntervalo, 'intervalo')
                          if (e.key === 'Escape') cancelarEdicion()
                        }}
                        className="w-full px-1 py-0.5 text-xs border rounded"
                        autoFocus
                      />
                      <button
                        onClick={() => guardarCelda(vehiculo.id, componente.columnaIntervalo, 'intervalo')}
                        className="p-0.5 bg-green-500 text-white rounded"
                      >
                        <Check className="w-2.5 h-2.5" />
                      </button>
                      <button onClick={cancelarEdicion} className="p-0.5 bg-red-500 text-white rounded">
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ) : (
                    <span
                      className="flex-1 cursor-pointer hover:bg-blue-100 px-1 rounded"
                      onClick={() => iniciarEdicion(vehiculo.id, componente.columnaIntervalo, 'intervalo', intervalo)}
                    >
                      {intervalo && intervalo !== -1 ? intervalo.toLocaleString() : '-'}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </td>
      )
    }

    // Vista colapsada - solo el cuadrado con porcentaje
    return (
      <td
        className={`border border-gray-300 p-2 cursor-pointer hover:opacity-80 transition-opacity ${colorClass}`}
        onClick={() => toggleCelda(vehiculo.id, componente.id)}
        title="Click para expandir"
      >
        <div className="flex items-center justify-center">
          <span className="font-bold text-sm">
            {porcentaje !== null ? `${porcentaje.toFixed(1)}%` : 'S/D'}
          </span>
        </div>
      </td>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-2">
      {/* Header compacto */}
      <div className="bg-white rounded-lg shadow-sm mb-2 p-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Eye className="w-6 h-6 text-blue-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">Ojo de Dios</h1>
              <p className="text-xs text-gray-500">{vehiculosFiltrados.length} vehículos · Click para expandir celdas</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Filtrar placa, interno, marca..."
                value={filtroTexto}
                onChange={(e) => setFiltroTexto(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={cargarTodo}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Recargar
            </button>

            <button
              onClick={exportarExcel}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
            >
              <Download className="w-4 h-4" />
              Exportar CSV
            </button>
          </div>
        </div>

        {/* Leyenda de colores */}
        <div className="flex items-center gap-4 mt-3 text-xs">
          <span className="font-semibold text-gray-700">Leyenda:</span>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span>100%-15% (OK)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500 rounded"></div>
            <span>15%-5% (Atención)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span>5%-0% (Crítico)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-200 rounded"></div>
            <span>Sin datos</span>
          </div>
        </div>
      </div>

      {/* Tabla con scroll horizontal */}
      <div className="bg-white rounded-lg shadow-sm overflow-auto" style={{ maxHeight: 'calc(100vh - 180px)' }}>
        <table className="w-full text-xs border-collapse">
          <thead className="sticky top-0 bg-gray-100 z-10">
            <tr>
              {/* Columnas fijas de vehículo */}
              <th className="border border-gray-300 px-2 py-1 font-semibold text-left bg-blue-50 sticky left-0 z-20">Placa</th>
              <th className="border border-gray-300 px-2 py-1 font-semibold text-left bg-blue-50">Int.</th>
              <th className="border border-gray-300 px-2 py-1 font-semibold text-left bg-blue-50">Marca</th>
              <th className="border border-gray-300 px-2 py-1 font-semibold text-left bg-blue-50">Modelo</th>
              <th className="border border-gray-300 px-2 py-1 font-semibold text-left bg-blue-50">Año</th>
              <th className="border border-gray-300 px-2 py-1 font-semibold text-left bg-blue-50">KM Actual</th>

              {/* Columnas dinámicas de componentes */}
              {categorias.map(categoria => (
                categoria.componentes.map(componente => (
                  <th
                    key={`${categoria.id}-${componente.id}`}
                    className="border border-gray-300 px-2 py-1 font-semibold text-center whitespace-nowrap"
                    title={componente.label}
                  >
                    {componente.label}
                  </th>
                ))
              ))}
            </tr>
          </thead>

          <tbody>
            {vehiculosFiltrados.map((vehiculo) => (
              <tr key={vehiculo.id} className="hover:bg-blue-50 transition-colors">
                {/* Datos básicos del vehículo */}
                <td className="border border-gray-300 px-2 py-1 font-medium bg-white sticky left-0">{vehiculo.Placa}</td>
                <td className="border border-gray-300 px-2 py-1">{vehiculo.Nro_Interno}</td>
                <td className="border border-gray-300 px-2 py-1">{vehiculo.Marca}</td>
                <td className="border border-gray-300 px-2 py-1">{vehiculo.Modelo}</td>
                <td className="border border-gray-300 px-2 py-1">{vehiculo.Año}</td>
                <td className="border border-gray-300 px-2 py-1 text-right">{vehiculo.kilometraje_actual?.toLocaleString()}</td>

                {/* Componentes agrupados */}
                {categorias.map(categoria => (
                  categoria.componentes.map(componente => (
                    <CeldaComponenteAgrupada
                      key={`${vehiculo.id}-${categoria.id}-${componente.id}`}
                      vehiculo={vehiculo}
                      componente={componente}
                    />
                  ))
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
