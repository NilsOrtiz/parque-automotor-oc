'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase, type Vehiculo } from '@/lib/supabase'
import { ArrowLeft, Search, Save, AlertCircle } from 'lucide-react'

interface OrdenCompra {
  id: number
  codigo_oc: string
  proveedor: string
  items: string
  monto_vehiculo: number
  moneda: string
}

export default function RegistroServicioPage() {
  const [vehiculo, setVehiculo] = useState<Vehiculo | null>(null)
  const [busquedaVehiculo, setBusquedaVehiculo] = useState('')
  const [tipoBusqueda, setTipoBusqueda] = useState<'placa' | 'interno'>('placa')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Campos del formulario
  const [clasificacion, setClasificacion] = useState<'revision' | 'mantenimiento' | 'reparacion'>('mantenimiento')
  const [subclasificacion, setSubclasificacion] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [items, setItems] = useState('')
  const [ordenesSeleccionadas, setOrdenesSeleccionadas] = useState<number[]>([])
  
  // Órdenes de compra disponibles
  const [ordenesDisponibles, setOrdenesDisponibles] = useState<OrdenCompra[]>([])
  const [loadingOrdenes, setLoadingOrdenes] = useState(false)

  const subclasificaciones = [
    'Motor', 'Transmisión', 'Frenos', 'Suspensión', 'Neumáticos', 
    'Eléctrico', 'Electrónico', 'Carrocería', 'Interior', 'Documentación',
    'Climatización', 'Dirección', 'Filtros', 'Fluidos', 'Escape', 
    'Combustible', 'Seguridad'
  ]

  async function buscarVehiculo() {
    if (!busquedaVehiculo.trim()) {
      setError('Por favor ingresa un término de búsqueda')
      return
    }

    setLoading(true)
    setError('')
    setVehiculo(null)

    try {
      const campo = tipoBusqueda === 'placa' ? 'Placa' : 'Nro_Interno'
      const valor = tipoBusqueda === 'placa' ? busquedaVehiculo.trim() : parseInt(busquedaVehiculo)

      const { data, error } = await supabase
        .from('vehiculos')
        .select('*')
        .eq(campo, valor)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          setError('No se encontró ningún vehículo con ese criterio')
        } else {
          throw error
        }
      } else {
        setVehiculo(data)
        await cargarOrdenesDisponibles(data.Placa)
      }
    } catch (error) {
      console.error('Error en búsqueda:', error)
      setError('Error al buscar el vehículo')
    } finally {
      setLoading(false)
    }
  }

  async function cargarOrdenesDisponibles(placa: string) {
    setLoadingOrdenes(true)
    try {
      const { data, error } = await supabase
        .from('ordenes_de_compra_por_vehiculo')
        .select('id, codigo_oc, proveedor, items, monto_vehiculo, moneda')
        .eq('placa', placa)
        .order('fecha', { ascending: false })

      if (error) throw error
      setOrdenesDisponibles(data || [])
    } catch (error) {
      console.error('Error cargando órdenes:', error)
      setOrdenesDisponibles([])
    } finally {
      setLoadingOrdenes(false)
    }
  }

  async function guardarServicio() {
    if (!vehiculo) return

    if (!descripcion.trim()) {
      setError('La descripción es obligatoria')
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const ocsVehiculosJson = ordenesSeleccionadas.length > 0 
        ? JSON.stringify(ordenesSeleccionadas) 
        : null

      const { error } = await supabase
        .from('historial')
        .insert({
          id: vehiculo.id,
          clasificacion,
          subclasificacion: subclasificacion || null,
          descripcion: descripcion.trim(),
          items: items.trim() || null,
          ocs_vehiculos: ocsVehiculosJson,
          fecha_servicio: new Date().toISOString().split('T')[0] // Fecha actual
        })

      if (error) throw error

      setSuccess('Servicio registrado correctamente')
      
      // Limpiar formulario
      setClasificacion('mantenimiento')
      setSubclasificacion('')
      setDescripcion('')
      setItems('')
      setOrdenesSeleccionadas([])
      
    } catch (error) {
      console.error('Error guardando servicio:', error)
      setError('Error al guardar el servicio')
    } finally {
      setSaving(false)
    }
  }

  const toggleOrden = (ordenId: number) => {
    setOrdenesSeleccionadas(prev => 
      prev.includes(ordenId) 
        ? prev.filter(id => id !== ordenId)
        : [...prev, ordenId]
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/vehiculos" 
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Vehículos
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Registro de Servicio</h1>
          <p className="text-gray-600">Documentar trabajos realizados en el taller</p>
        </div>

        {/* Búsqueda de Vehículo */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Buscar Vehículo</h3>
          
          <div className="space-y-4">
            <div className="flex space-x-4">
              <button
                onClick={() => setTipoBusqueda('placa')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  tipoBusqueda === 'placa'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Por Placa
              </button>
              <button
                onClick={() => setTipoBusqueda('interno')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  tipoBusqueda === 'interno'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Por Número Interno
              </button>
            </div>

            <div className="flex gap-4">
              <input
                type={tipoBusqueda === 'placa' ? 'text' : 'number'}
                value={busquedaVehiculo}
                onChange={(e) => setBusquedaVehiculo(e.target.value)}
                placeholder={tipoBusqueda === 'placa' ? 'Ej: ABC123' : 'Ej: 101'}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && buscarVehiculo()}
              />
              <button
                onClick={buscarVehiculo}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Search className="h-4 w-4" />
                {loading ? 'Buscando...' : 'Buscar'}
              </button>
            </div>
          </div>

          {/* Vehículo encontrado */}
          {vehiculo && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-semibold text-green-900">
                {vehiculo.Marca} {vehiculo.Modelo} - {vehiculo.Placa}
              </h4>
              <p className="text-green-700 text-sm">
                Número Interno: {vehiculo.Nro_Interno} | Titular: {vehiculo.Titular}
              </p>
            </div>
          )}

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              {error}
            </div>
          )}

          {success && (
            <div className="mt-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
              {success}
            </div>
          )}
        </div>

        {/* Formulario de Servicio */}
        {vehiculo && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Datos del Servicio</h3>
            
            <div className="space-y-6">
              {/* Clasificación */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Clasificación *
                </label>
                <div className="flex space-x-4">
                  {['revision', 'mantenimiento', 'reparacion'].map((tipo) => (
                    <button
                      key={tipo}
                      onClick={() => setClasificacion(tipo as any)}
                      className={`px-4 py-2 rounded-lg transition-colors capitalize ${
                        clasificacion === tipo
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {tipo}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subclasificación */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subclasificación
                </label>
                <select
                  value={subclasificacion}
                  onChange={(e) => setSubclasificacion(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">Seleccionar sistema...</option>
                  {subclasificaciones.map((sub) => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción del Trabajo *
                </label>
                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Describir detalladamente el trabajo realizado..."
                />
              </div>

              {/* Items */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Items Utilizados
                </label>
                <textarea
                  value={items}
                  onChange={(e) => setItems(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Listar los items y repuestos utilizados..."
                />
              </div>

              {/* Órdenes de Compra */}
              {ordenesDisponibles.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Órdenes de Compra Relacionadas
                  </label>
                  <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-4">
                    {ordenesDisponibles.map((orden) => (
                      <div key={orden.id} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`orden-${orden.id}`}
                          checked={ordenesSeleccionadas.includes(orden.id)}
                          onChange={() => toggleOrden(orden.id)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label htmlFor={`orden-${orden.id}`} className="ml-3 flex-1 cursor-pointer">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-medium text-gray-900">{orden.codigo_oc}</span>
                              <span className="text-gray-500 ml-2">{orden.proveedor}</span>
                            </div>
                            <div className="text-sm text-blue-600 font-medium">
                              ${orden.monto_vehiculo?.toLocaleString()} {orden.moneda}
                            </div>
                          </div>
                          <div className="text-sm text-gray-600 truncate">{orden.items}</div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Botón Guardar */}
              <div className="flex justify-end pt-6 border-t">
                <button
                  onClick={guardarServicio}
                  disabled={saving || !descripcion.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Save className="h-4 w-4" />
                  {saving ? 'Guardando...' : 'Guardar Servicio'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}