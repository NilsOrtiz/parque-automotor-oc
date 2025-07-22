'use client'

import { useState, useEffect } from 'react'
import { supabase, type Moneda } from '@/lib/supabase'

interface FiltroMonedasProps {
  monedasSeleccionadas: string[]
  onMonedasChange: (monedas: string[]) => void
  className?: string
}

// Mapeo de banderas por código de moneda
const BANDERAS_MONEDAS: Record<string, string> = {
  'ARS': '🇦🇷', // Argentina
  'BRL': '🇧🇷', // Brasil
  'USD': '🇺🇸', // Estados Unidos
  'EUR': '🇪🇺', // Unión Europea
  'UYU': '🇺🇾', // Uruguay
  'CLP': '🇨🇱', // Chile
  'PEN': '🇵🇪', // Perú
  'COP': '🇨🇴', // Colombia
  'BOB': '🇧🇴', // Bolivia
  'PYG': '🇵🇾', // Paraguay
  'GBP': '🇬🇧', // Reino Unido
  'JPY': '🇯🇵', // Japón
  'CAD': '🇨🇦', // Canadá
  'AUD': '🇦🇺', // Australia
  'CHF': '🇨🇭', // Suiza
  'CNY': '🇨🇳', // China
  'MXN': '🇲🇽', // México
}

// Colores por región
const COLORES_MONEDAS: Record<string, string> = {
  'ARS': 'border-blue-300 bg-blue-50 text-blue-700',
  'BRL': 'border-green-300 bg-green-50 text-green-700',
  'USD': 'border-purple-300 bg-purple-50 text-purple-700',
  'EUR': 'border-yellow-300 bg-yellow-50 text-yellow-700',
  'UYU': 'border-cyan-300 bg-cyan-50 text-cyan-700',
  'CLP': 'border-red-300 bg-red-50 text-red-700',
  'PEN': 'border-orange-300 bg-orange-50 text-orange-700',
}

export default function FiltroMonedas({ 
  monedasSeleccionadas, 
  onMonedasChange, 
  className = '' 
}: FiltroMonedasProps) {
  const [monedas, setMonedas] = useState<Moneda[]>([])
  const [loading, setLoading] = useState(true)
  const [expandido, setExpandido] = useState(false)

  useEffect(() => {
    cargarMonedas()
  }, [])

  const cargarMonedas = async () => {
    try {
      const { data, error } = await supabase
        .from('monedas')
        .select('*')
        .eq('activa', true)
        .order('codigo')

      if (error) throw error
      setMonedas(data || [])
    } catch (error) {
      console.error('Error cargando monedas:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleMoneda = (codigo: string) => {
    const nuevasMonedas = monedasSeleccionadas.includes(codigo)
      ? monedasSeleccionadas.filter(m => m !== codigo)
      : [...monedasSeleccionadas, codigo]
    
    onMonedasChange(nuevasMonedas)
  }

  const seleccionarTodas = () => {
    onMonedasChange(monedas.map(m => m.codigo))
  }

  const limpiarTodas = () => {
    onMonedasChange([])
  }

  if (loading) {
    return (
      <div className={`bg-white p-4 rounded-lg shadow-sm ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="w-16 h-8 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Monedas principales para mostrar siempre
  const monedasPrincipales = monedas.filter(m => 
    ['ARS', 'BRL', 'USD', 'EUR'].includes(m.codigo)
  )
  
  // Otras monedas para mostrar al expandir
  const otrasMonedas = monedas.filter(m => 
    !['ARS', 'BRL', 'USD', 'EUR'].includes(m.codigo)
  )

  return (
    <div className={`bg-white p-4 rounded-lg shadow-sm border ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
          💰 Filtrar por Monedas
          <span className="text-xs text-gray-500">
            ({monedasSeleccionadas.length} seleccionadas)
          </span>
        </h3>
        <div className="flex gap-2">
          <button
            onClick={seleccionarTodas}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            Todas
          </button>
          <button
            onClick={limpiarTodas}
            className="text-xs text-red-600 hover:text-red-800"
          >
            Limpiar
          </button>
        </div>
      </div>

      {/* Monedas principales */}
      <div className="flex flex-wrap gap-2 mb-2">
        {monedasPrincipales.map((moneda) => {
          const isSelected = monedasSeleccionadas.includes(moneda.codigo)
          const bandera = BANDERAS_MONEDAS[moneda.codigo] || '💱'
          const colorClass = COLORES_MONEDAS[moneda.codigo] || 'border-gray-300 bg-gray-50 text-gray-700'

          return (
            <label
              key={moneda.codigo}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-sm ${
                isSelected 
                  ? `${colorClass} ring-2 ring-offset-1 ring-blue-400` 
                  : 'border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggleMoneda(moneda.codigo)}
                className="sr-only"
              />
              <span className="text-lg">{bandera}</span>
              <span className="font-medium text-sm">{moneda.codigo}</span>
              <span className="text-xs font-semibold">{moneda.simbolo}</span>
            </label>
          )
        })}
      </div>

      {/* Botón expandir/contraer */}
      {otrasMonedas.length > 0 && (
        <button
          onClick={() => setExpandido(!expandido)}
          className="text-xs text-gray-600 hover:text-gray-800 flex items-center gap-1 mb-2"
        >
          {expandido ? '▲' : '▼'} 
          {expandido ? 'Menos monedas' : `Más monedas (${otrasMonedas.length})`}
        </button>
      )}

      {/* Otras monedas (expandible) */}
      {expandido && (
        <div className="flex flex-wrap gap-1 pt-2 border-t border-gray-200">
          {otrasMonedas.map((moneda) => {
            const isSelected = monedasSeleccionadas.includes(moneda.codigo)
            const bandera = BANDERAS_MONEDAS[moneda.codigo] || '💱'

            return (
              <label
                key={moneda.codigo}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs cursor-pointer transition-all ${
                  isSelected 
                    ? 'bg-blue-100 text-blue-800 border border-blue-300' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleMoneda(moneda.codigo)}
                  className="sr-only"
                />
                <span>{bandera}</span>
                <span className="font-medium">{moneda.codigo}</span>
              </label>
            )
          })}
        </div>
      )}

      {/* Resumen seleccionado */}
      {monedasSeleccionadas.length > 0 && (
        <div className="mt-3 pt-2 border-t border-gray-200">
          <p className="text-xs text-gray-600">
            <strong>Mostrando:</strong> {
              monedasSeleccionadas.map(codigo => {
                const moneda = monedas.find(m => m.codigo === codigo)
                return `${BANDERAS_MONEDAS[codigo] || '💱'} ${codigo}`
              }).join(', ')
            }
          </p>
        </div>
      )}
    </div>
  )
}