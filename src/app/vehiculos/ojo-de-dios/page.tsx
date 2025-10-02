'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { obtenerComponentesAgrupados, type CategoriaComponentes } from '@/lib/componentes-dinamicos'
import { Eye, Download, Filter, RefreshCw, Check, X } from 'lucide-react'

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

interface CeldaEditando {
  vehiculoId: number
  columna: string
}

export default function OjoDeDios() {
  const [vehiculos, setVehiculos] = useState<VehiculoCompleto[]>([])
  const [categorias, setCategorias] = useState<CategoriaComponentes[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroTexto, setFiltroTexto] = useState('')
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

  function formatearValor(valor: any, tipo: 'km' | 'fecha' | 'modelo' | 'intervalo' | 'litros' | 'hr'): string {
    if (valor === null || valor === undefined) return '-'

    switch (tipo) {
      case 'km':
      case 'intervalo':
        if (valor === -1) return 'N/A'
        return valor.toLocaleString()
      case 'fecha':
        if (valor === '1900-01-01') return 'N/A'
        return new Date(valor).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' })
      case 'modelo':
        if (valor?.toUpperCase() === 'N/A' || valor?.toUpperCase() === 'NO APLICA') return 'N/A'
        return valor
      case 'litros':
        return valor.toString()
      case 'hr':
        if (valor === -1) return 'N/A'
        return valor.toLocaleString()
      default:
        return valor.toString()
    }
  }

  function obtenerValorRaw(valor: any, tipo: 'km' | 'fecha' | 'modelo' | 'intervalo' | 'litros' | 'hr'): string {
    if (valor === null || valor === undefined) return ''

    switch (tipo) {
      case 'km':
      case 'intervalo':
      case 'litros':
      case 'hr':
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

  function iniciarEdicion(vehiculoId: number, columna: string, valorActual: any, tipo: 'km' | 'fecha' | 'modelo' | 'intervalo' | 'litros' | 'hr') {
    setCeldaEditando({ vehiculoId, columna })
    setValorEditando(obtenerValorRaw(valorActual, tipo))
  }

  function cancelarEdicion() {
    setCeldaEditando(null)
    setValorEditando('')
  }

  async function guardarCelda(vehiculoId: number, columna: string, tipo: 'km' | 'fecha' | 'modelo' | 'intervalo' | 'litros' | 'hr') {
    const celdaId = `${vehiculoId}-${columna}`
    setGuardando(celdaId)

    try {
      let valorParaGuardar: any = valorEditando.trim()

      // Convertir según tipo
      if (!valorParaGuardar) {
        // Si está vacío, guardar como null o -1 según el tipo
        if (tipo === 'km' || tipo === 'intervalo' || tipo === 'hr') {
          valorParaGuardar = -1
        } else if (tipo === 'fecha') {
          valorParaGuardar = '1900-01-01'
        } else if (tipo === 'modelo') {
          valorParaGuardar = 'N/A'
        } else {
          valorParaGuardar = null
        }
      } else {
        // Parsear según tipo
        if (tipo === 'km' || tipo === 'intervalo' || tipo === 'hr') {
          valorParaGuardar = parseInt(valorParaGuardar)
          if (isNaN(valorParaGuardar)) {
            alert('Debe ingresar un número válido')
            setGuardando(null)
            return
          }
        } else if (tipo === 'litros') {
          valorParaGuardar = parseFloat(valorParaGuardar)
          if (isNaN(valorParaGuardar)) {
            alert('Debe ingresar un número válido')
            setGuardando(null)
            return
          }
        }
        // fecha y modelo se guardan como string tal cual
      }

      // Actualizar en Supabase
      const { error } = await supabase
        .from('vehiculos')
        .update({ [columna]: valorParaGuardar })
        .eq('id', vehiculoId)

      if (error) throw error

      // Actualizar estado local
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
        if (comp.columnaKm) componentesHeaders.push(`${comp.label}_KM`)
        if (comp.columnaFecha) componentesHeaders.push(`${comp.label}_Fecha`)
        if (comp.columnaModelo) componentesHeaders.push(`${comp.label}_Modelo`)
        if (comp.columnaIntervalo) componentesHeaders.push(`${comp.label}_Intervalo`)
        if (comp.columnaLitros) componentesHeaders.push(`${comp.label}_Litros`)
        if (comp.columnaHr) componentesHeaders.push(`${comp.label}_HR`)
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
          if (comp.columnaKm) componentesData.push(formatearValor(v[comp.columnaKm], 'km'))
          if (comp.columnaFecha) componentesData.push(formatearValor(v[comp.columnaFecha], 'fecha'))
          if (comp.columnaModelo) componentesData.push(formatearValor(v[comp.columnaModelo], 'modelo'))
          if (comp.columnaIntervalo) componentesData.push(formatearValor(v[comp.columnaIntervalo], 'intervalo'))
          if (comp.columnaLitros) componentesData.push(formatearValor(v[comp.columnaLitros], 'litros'))
          if (comp.columnaHr) componentesData.push(formatearValor(v[comp.columnaHr], 'hr'))
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

  const CeldaEditable = ({
    vehiculo,
    columna,
    tipo,
    align = 'left'
  }: {
    vehiculo: VehiculoCompleto
    columna: string
    tipo: 'km' | 'fecha' | 'modelo' | 'intervalo' | 'litros' | 'hr'
    align?: 'left' | 'right'
  }) => {
    const estaEditando = celdaEditando?.vehiculoId === vehiculo.id && celdaEditando?.columna === columna
    const estaGuardando = guardando === `${vehiculo.id}-${columna}`
    const valor = vehiculo[columna]

    if (estaEditando) {
      return (
        <td className="border border-gray-300 px-1 py-1 bg-yellow-50">
          <div className="flex items-center gap-1">
            <input
              type={tipo === 'fecha' ? 'date' : tipo === 'modelo' ? 'text' : 'number'}
              value={valorEditando}
              onChange={(e) => setValorEditando(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  guardarCelda(vehiculo.id, columna, tipo)
                } else if (e.key === 'Escape') {
                  cancelarEdicion()
                }
              }}
              className="w-full px-1 py-0.5 text-xs border border-blue-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              autoFocus
              step={tipo === 'litros' ? '0.1' : '1'}
            />
            <button
              onClick={() => guardarCelda(vehiculo.id, columna, tipo)}
              className="p-0.5 bg-green-500 text-white rounded hover:bg-green-600"
              disabled={estaGuardando}
            >
              <Check className="w-3 h-3" />
            </button>
            <button
              onClick={cancelarEdicion}
              className="p-0.5 bg-red-500 text-white rounded hover:bg-red-600"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </td>
      )
    }

    return (
      <td
        className={`border border-gray-300 px-2 py-1 ${align === 'right' ? 'text-right' : ''} cursor-pointer hover:bg-blue-50 ${estaGuardando ? 'bg-green-100' : ''}`}
        onDoubleClick={() => iniciarEdicion(vehiculo.id, columna, valor, tipo)}
        title="Doble clic para editar"
      >
        {estaGuardando ? '💾' : formatearValor(valor, tipo)}
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
              <p className="text-xs text-gray-500">{vehiculosFiltrados.length} vehículos · Doble clic para editar</p>
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
      </div>

      {/* Tabla con scroll horizontal */}
      <div className="bg-white rounded-lg shadow-sm overflow-auto" style={{ maxHeight: 'calc(100vh - 120px)' }}>
        <table className="w-full text-xs border-collapse">
          <thead className="sticky top-0 bg-gray-100 z-10">
            <tr>
              {/* Columnas fijas de vehículo */}
              <th className="border border-gray-300 px-2 py-1 font-semibold text-left bg-blue-50 sticky left-0 z-20">Placa</th>
              <th className="border border-gray-300 px-2 py-1 font-semibold text-left bg-blue-50">Int.</th>
              <th className="border border-gray-300 px-2 py-1 font-semibold text-left bg-blue-50">Marca</th>
              <th className="border border-gray-300 px-2 py-1 font-semibold text-left bg-blue-50">Modelo</th>
              <th className="border border-gray-300 px-2 py-1 font-semibold text-left bg-blue-50">Año</th>
              <th className="border border-gray-300 px-2 py-1 font-semibold text-left bg-blue-50">KM</th>

              {/* Columnas dinámicas de componentes */}
              {categorias.map(categoria => (
                categoria.componentes.map(componente => (
                  <>
                    {componente.columnaKm && (
                      <th key={`${componente.id}-km`} className="border border-gray-300 px-2 py-1 font-semibold text-left whitespace-nowrap" title={`${componente.label} - Kilometraje`}>
                        {componente.label} KM
                      </th>
                    )}
                    {componente.columnaFecha && (
                      <th key={`${componente.id}-fecha`} className="border border-gray-300 px-2 py-1 font-semibold text-left whitespace-nowrap" title={`${componente.label} - Fecha`}>
                        {componente.label} Fch
                      </th>
                    )}
                    {componente.columnaModelo && (
                      <th key={`${componente.id}-modelo`} className="border border-gray-300 px-2 py-1 font-semibold text-left whitespace-nowrap" title={`${componente.label} - Modelo`}>
                        {componente.label} Mod
                      </th>
                    )}
                    {componente.columnaIntervalo && (
                      <th key={`${componente.id}-intervalo`} className="border border-gray-300 px-2 py-1 font-semibold text-left whitespace-nowrap" title={`${componente.label} - Intervalo`}>
                        {componente.label} Int
                      </th>
                    )}
                    {componente.columnaLitros && (
                      <th key={`${componente.id}-litros`} className="border border-gray-300 px-2 py-1 font-semibold text-left whitespace-nowrap" title={`${componente.label} - Litros`}>
                        {componente.label} L
                      </th>
                    )}
                    {componente.columnaHr && (
                      <th key={`${componente.id}-hr`} className="border border-gray-300 px-2 py-1 font-semibold text-left whitespace-nowrap" title={`${componente.label} - Horas`}>
                        {componente.label} HR
                      </th>
                    )}
                  </>
                ))
              ))}
            </tr>
          </thead>

          <tbody>
            {vehiculosFiltrados.map((vehiculo) => (
              <tr key={vehiculo.id} className="hover:bg-blue-50 transition-colors">
                {/* Datos básicos del vehículo - NO editables */}
                <td className="border border-gray-300 px-2 py-1 font-medium bg-white sticky left-0">{vehiculo.Placa}</td>
                <td className="border border-gray-300 px-2 py-1">{vehiculo.Nro_Interno}</td>
                <td className="border border-gray-300 px-2 py-1">{vehiculo.Marca}</td>
                <td className="border border-gray-300 px-2 py-1">{vehiculo.Modelo}</td>
                <td className="border border-gray-300 px-2 py-1">{vehiculo.Año}</td>
                <td className="border border-gray-300 px-2 py-1">{vehiculo.kilometraje_actual?.toLocaleString()}</td>

                {/* Datos de componentes dinámicos - EDITABLES */}
                {categorias.map(categoria => (
                  categoria.componentes.map(componente => (
                    <>
                      {componente.columnaKm && (
                        <CeldaEditable
                          key={`${vehiculo.id}-${componente.columnaKm}`}
                          vehiculo={vehiculo}
                          columna={componente.columnaKm}
                          tipo="km"
                          align="right"
                        />
                      )}
                      {componente.columnaFecha && (
                        <CeldaEditable
                          key={`${vehiculo.id}-${componente.columnaFecha}`}
                          vehiculo={vehiculo}
                          columna={componente.columnaFecha}
                          tipo="fecha"
                        />
                      )}
                      {componente.columnaModelo && (
                        <CeldaEditable
                          key={`${vehiculo.id}-${componente.columnaModelo}`}
                          vehiculo={vehiculo}
                          columna={componente.columnaModelo}
                          tipo="modelo"
                        />
                      )}
                      {componente.columnaIntervalo && (
                        <CeldaEditable
                          key={`${vehiculo.id}-${componente.columnaIntervalo}`}
                          vehiculo={vehiculo}
                          columna={componente.columnaIntervalo}
                          tipo="intervalo"
                          align="right"
                        />
                      )}
                      {componente.columnaLitros && (
                        <CeldaEditable
                          key={`${vehiculo.id}-${componente.columnaLitros}`}
                          vehiculo={vehiculo}
                          columna={componente.columnaLitros}
                          tipo="litros"
                          align="right"
                        />
                      )}
                      {componente.columnaHr && (
                        <CeldaEditable
                          key={`${vehiculo.id}-${componente.columnaHr}`}
                          vehiculo={vehiculo}
                          columna={componente.columnaHr}
                          tipo="hr"
                          align="right"
                        />
                      )}
                    </>
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
