'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, ChevronDown } from 'lucide-react'

interface FiltroFechasProps {
  fechaInicio: string | null
  fechaFin: string | null
  onFechasChange: (inicio: string | null, fin: string | null) => void
  className?: string
}

type PresetFecha = 'actual' | 'anterior' | 'ultimos3' | 'personalizado'

export default function FiltroFechas({
  fechaInicio,
  fechaFin,
  onFechasChange,
  className = ''
}: FiltroFechasProps) {
  const [preset, setPreset] = useState<PresetFecha>('actual')
  const [mostrarPersonalizado, setMostrarPersonalizado] = useState(false)

  useEffect(() => {
    // Aplicar preset por defecto al cargar solo si no hay fechas
    if (!fechaInicio && !fechaFin) {
      aplicarPreset('actual')
    }
  }, [])

  const aplicarPreset = (tipoPreset: PresetFecha) => {
    const hoy = new Date()
    let inicio: string | null = null
    let fin: string | null = null

    switch (tipoPreset) {
      case 'actual':
        // Mes actual: primer día al último día
        inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0]
        fin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).toISOString().split('T')[0]
        break

      case 'anterior':
        // Mes anterior completo
        inicio = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1).toISOString().split('T')[0]
        fin = new Date(hoy.getFullYear(), hoy.getMonth(), 0).toISOString().split('T')[0]
        break

      case 'ultimos3':
        // Últimos 3 meses
        inicio = new Date(hoy.getFullYear(), hoy.getMonth() - 2, 1).toISOString().split('T')[0]
        fin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).toISOString().split('T')[0]
        break

      case 'personalizado':
        // No cambiar fechas, solo mostrar el panel personalizado
        setPreset(tipoPreset)
        setMostrarPersonalizado(true)
        return // No aplicar fechas automáticamente
    }

    setPreset(tipoPreset)
    setMostrarPersonalizado(false) // Solo personalizado muestra el panel
    onFechasChange(inicio, fin)
  }

  const handleFechaPersonalizadaChange = (campo: 'inicio' | 'fin', valor: string) => {
    if (campo === 'inicio') {
      onFechasChange(valor, fechaFin)
    } else {
      onFechasChange(fechaInicio, valor)
    }
    setPreset('personalizado')
  }

  const limpiarFiltro = () => {
    onFechasChange(null, null)
    setPreset('actual')
    setMostrarPersonalizado(false)
    // Reaplica el mes actual después de limpiar
    setTimeout(() => aplicarPreset('actual'), 100)
  }

  const obtenerTextoPreset = (tipo: PresetFecha) => {
    const hoy = new Date()
    switch (tipo) {
      case 'actual':
        return `${hoy.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`
      case 'anterior':
        const anterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1)
        return `${anterior.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`
      case 'ultimos3':
        return 'Últimos 3 meses'
      case 'personalizado':
        return 'Rango personalizado'
      default:
        return ''
    }
  }

  const formatearRangoActual = () => {
    if (!fechaInicio || !fechaFin) return 'Sin filtro de fecha'
    
    const inicio = new Date(fechaInicio)
    const fin = new Date(fechaFin)
    
    if (inicio.getMonth() === fin.getMonth() && inicio.getFullYear() === fin.getFullYear()) {
      // Mismo mes
      return `${inicio.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`
    } else {
      // Rango diferente
      return `${inicio.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} - ${fin.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}`
    }
  }

  return (
    <div className={`bg-white p-4 rounded-lg shadow-sm border ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
          📅 Filtrar por Fecha
        </h3>
        <button
          onClick={limpiarFiltro}
          className="text-xs text-red-600 hover:text-red-800"
        >
          Limpiar
        </button>
      </div>

      {/* Botones de presets rápidos */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
        <button
          onClick={() => aplicarPreset('actual')}
          className={`p-2 rounded-lg text-xs font-medium transition-all ${
            preset === 'actual' 
              ? 'bg-blue-100 text-blue-700 border-2 border-blue-300' 
              : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
          }`}
        >
          <Calendar className="h-3 w-3 mx-auto mb-1" />
          Mes Actual
        </button>

        <button
          onClick={() => aplicarPreset('anterior')}
          className={`p-2 rounded-lg text-xs font-medium transition-all ${
            preset === 'anterior' 
              ? 'bg-green-100 text-green-700 border-2 border-green-300' 
              : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
          }`}
        >
          <Clock className="h-3 w-3 mx-auto mb-1" />
          Mes Anterior
        </button>

        <button
          onClick={() => aplicarPreset('ultimos3')}
          className={`p-2 rounded-lg text-xs font-medium transition-all ${
            preset === 'ultimos3' 
              ? 'bg-purple-100 text-purple-700 border-2 border-purple-300' 
              : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
          }`}
        >
          📊
          Últimos 3M
        </button>

        <button
          onClick={() => aplicarPreset('personalizado')}
          className={`p-2 rounded-lg text-xs font-medium transition-all ${
            preset === 'personalizado' 
              ? 'bg-orange-100 text-orange-700 border-2 border-orange-300' 
              : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
          }`}
        >
          ⚙️
          Personalizado
        </button>
      </div>

      {/* Rango personalizado */}
      {mostrarPersonalizado && (
        <div className="p-3 bg-gray-50 rounded-lg border">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Fecha Inicio:
              </label>
              <input
                type="date"
                value={fechaInicio || ''}
                onChange={(e) => handleFechaPersonalizadaChange('inicio', e.target.value)}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Fecha Fin:
              </label>
              <input
                type="date"
                value={fechaFin || ''}
                onChange={(e) => handleFechaPersonalizadaChange('fin', e.target.value)}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* Mostrar rango actual */}
      <div className="mt-3 pt-2 border-t border-gray-200">
        <p className="text-xs text-gray-600">
          <strong>Mostrando:</strong> {formatearRangoActual()}
        </p>
        {fechaInicio && fechaFin && (
          <p className="text-xs text-gray-500 mt-1">
            Del {new Date(fechaInicio).toLocaleDateString('es-ES')} al {new Date(fechaFin).toLocaleDateString('es-ES')}
          </p>
        )}
      </div>
    </div>
  )
}