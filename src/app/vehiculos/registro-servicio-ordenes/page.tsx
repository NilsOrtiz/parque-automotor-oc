'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase, type Vehiculo } from '@/lib/supabase'
import { ArrowLeft, Search, Save, AlertCircle, Package, Truck, Clock, CheckCircle2, ArrowRight } from 'lucide-react'

interface OrdenPendiente {
  id: number
  codigo_oc: string
  fecha: string
  placa: string
  interno?: number
  modelo?: string
  titular?: string
  proveedor?: string
  items?: string
  monto_vehiculo?: number
  moneda?: string
  es_emergencia?: boolean
  vehiculo?: Vehiculo
}

export default function RegistroServicioOrdenesPage() {
  const [ordenesPendientes, setOrdenesPendientes] = useState<OrdenPendiente[]>([])
  const [loading, setLoading] = useState(true)
  const [ordenSeleccionada, setOrdenSeleccionada] = useState<OrdenPendiente | null>(null)
  const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState<Vehiculo | null>(null)
  const [filtroTexto, setFiltroTexto] = useState('')
  const [filtroEmergencia, setFiltroEmergencia] = useState<'todas' | 'emergencia' | 'normal'>('todas')

  // Formulario de servicio
  const [clasificacion, setClasificacion] = useState<'revision' | 'mantenimiento' | 'reparacion'>('mantenimiento')
  const [subclasificacion, setSubclasificacion] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [items, setItems] = useState('')
  const [kilometrajeServicio, setKilometrajeServicio] = useState<number | ''>('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    cargarOrdenesPendientes()
  }, [])

  async function cargarOrdenesPendientes() {
    setLoading(true)
    try {
      // Obtener todas las órdenes por vehículo
      const { data: todasLasOrdenes, error: errorOrdenes } = await supabase
        .from('ordenes_de_compra_por_vehiculo')
        .select('*')
        .order('fecha', { ascending: false })

      if (errorOrdenes) throw errorOrdenes

      // Obtener órdenes ya utilizadas en el historial
      const { data: historialConOrdenes, error: errorHistorial } = await supabase
        .from('historial')
        .select('ocs_vehiculos')
        .not('ocs_vehiculos', 'is', null)

      if (errorHistorial) throw errorHistorial

      // Extraer IDs de órdenes ya utilizadas
      const ordenesUtilizadas = new Set<number>()
      historialConOrdenes?.forEach(registro => {
        if (registro.ocs_vehiculos) {
          try {
            const ids = JSON.parse(registro.ocs_vehiculos)
            if (Array.isArray(ids)) {
              ids.forEach(id => ordenesUtilizadas.add(id))
            }
          } catch (e) {
            console.error('Error parseando ocs_vehiculos:', e)
          }
        }
      })

      // Filtrar órdenes pendientes
      const pendientes = (todasLasOrdenes || []).filter(orden =>
        !ordenesUtilizadas.has(orden.id)
      )

      // Cargar datos de vehículos para cada orden
      const ordenesConVehiculos = await Promise.all(
        pendientes.map(async (orden) => {
          try {
            const { data: vehiculo } = await supabase
              .from('vehiculos')
              .select('*')
              .eq('Placa', orden.placa)
              .single()

            return {
              ...orden,
              vehiculo: vehiculo || undefined
            }
          } catch (error) {
            console.error(`Error cargando vehículo para placa ${orden.placa}:`, error)
            return orden
          }
        })
      )

      setOrdenesPendientes(ordenesConVehiculos)
    } catch (error) {
      console.error('Error cargando órdenes pendientes:', error)
      setError('Error al cargar las órdenes pendientes')
    } finally {
      setLoading(false)
    }
  }

  function seleccionarOrden(orden: OrdenPendiente) {
    setOrdenSeleccionada(orden)
    setVehiculoSeleccionado(orden.vehiculo || null)

    // Llenar automáticamente el formulario
    setSubclasificacion('Documentación') // Porque tiene OC
    setDescripcion(`Servicio realizado según OC ${orden.codigo_oc} - ${orden.proveedor}${orden.items ? ` - Items: ${orden.items}` : ''}`)
    setItems(orden.items || '')
    setKilometrajeServicio(orden.vehiculo?.kilometraje_actual || '')

    // Limpiar mensajes
    setError('')
    setSuccess('')
  }

  async function guardarServicio() {
    if (!ordenSeleccionada || !vehiculoSeleccionado) return

    if (!descripcion.trim()) {
      setError('La descripción es obligatoria')
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      // Registrar en historial
      const { error: errorHistorial } = await supabase
        .from('historial')
        .insert({
          id: vehiculoSeleccionado.id,
          clasificacion,
          subclasificacion: subclasificacion || null,
          descripcion: descripcion.trim(),
          items: items.trim() || null,
          kilometraje_al_servicio: kilometrajeServicio || null,
          problema_reportado_por: 'mecanico',
          ocs_vehiculos: JSON.stringify([ordenSeleccionada.id]),
          fecha_servicio: new Date().toISOString().split('T')[0]
        })

      if (errorHistorial) throw errorHistorial

      setSuccess(`Servicio registrado correctamente para OC ${ordenSeleccionada.codigo_oc}`)

      // Limpiar formulario y recargar órdenes
      limpiarFormulario()
      await cargarOrdenesPendientes()

    } catch (error) {
      console.error('Error guardando servicio:', error)
      setError('Error al guardar el servicio')
    } finally {
      setSaving(false)
    }
  }

  function limpiarFormulario() {
    setOrdenSeleccionada(null)
    setVehiculoSeleccionado(null)
    setClasificacion('mantenimiento')
    setSubclasificacion('')
    setDescripcion('')
    setItems('')
    setKilometrajeServicio('')
  }

  const ordenesFiltradas = ordenesPendientes.filter(orden => {
    const coincideTexto = !filtroTexto ||
      orden.codigo_oc.toLowerCase().includes(filtroTexto.toLowerCase()) ||
      orden.placa.toLowerCase().includes(filtroTexto.toLowerCase()) ||
      orden.proveedor?.toLowerCase().includes(filtroTexto.toLowerCase()) ||
      orden.items?.toLowerCase().includes(filtroTexto.toLowerCase())

    const coincideEmergencia = filtroEmergencia === 'todas' ||
      (filtroEmergencia === 'emergencia' && orden.es_emergencia) ||
      (filtroEmergencia === 'normal' && !orden.es_emergencia)

    return coincideTexto && coincideEmergencia
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Cargando órdenes pendientes...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <Link
            href="/vehiculos/registro-servicio"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Registro Normal
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Registro por Órdenes Pendientes</h1>
              <p className="text-gray-600">Registrar servicios para órdenes de compra no utilizadas</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">{ordenesFiltradas.length}</div>
              <div className="text-sm text-gray-500">órdenes pendientes</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-200px)]">

          {/* Panel Izquierdo - Lista de Órdenes */}
          <div className="bg-white rounded-lg shadow-md flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Package className="h-5 w-5 mr-2 text-blue-600" />
                  Órdenes Sin Registrar
                </h2>
                <div className="flex items-center gap-2">
                  <select
                    value={filtroEmergencia}
                    onChange={(e) => setFiltroEmergencia(e.target.value as any)}
                    className="text-sm border border-gray-300 rounded px-2 py-1"
                  >
                    <option value="todas">Todas</option>
                    <option value="emergencia">🚨 Emergencias</option>
                    <option value="normal">📋 Normales</option>
                  </select>
                </div>
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={filtroTexto}
                  onChange={(e) => setFiltroTexto(e.target.value)}
                  placeholder="Buscar por código, placa, proveedor..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Search className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {ordenesFiltradas.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {ordenesFiltradas.map((orden) => (
                    <div
                      key={orden.id}
                      onClick={() => seleccionarOrden(orden)}
                      className={`p-4 cursor-pointer transition-colors hover:bg-blue-50 ${
                        ordenSeleccionada?.id === orden.id ? 'bg-blue-100 border-r-4 border-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-gray-900">{orden.codigo_oc}</span>
                            {orden.es_emergencia && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                🚨 Emergencia
                              </span>
                            )}
                            <span className="text-xs text-gray-500">
                              {new Date(orden.fecha).toLocaleDateString()}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 mb-2">
                            <div className="flex items-center text-sm text-gray-600">
                              <Truck className="h-4 w-4 mr-1" />
                              {orden.placa}
                              {orden.interno && <span className="ml-1">#{orden.interno}</span>}
                            </div>
                            {orden.vehiculo && (
                              <div className="text-sm text-gray-500">
                                {orden.vehiculo.Marca} {orden.vehiculo.Modelo}
                              </div>
                            )}
                          </div>

                          <div className="text-sm text-gray-700 mb-1">
                            <strong>Proveedor:</strong> {orden.proveedor}
                          </div>

                          {orden.items && (
                            <div className="text-sm text-gray-600 truncate">
                              <strong>Items:</strong> {orden.items}
                            </div>
                          )}

                          {orden.monto_vehiculo && (
                            <div className="text-sm font-medium text-green-600 mt-2">
                              ${orden.monto_vehiculo.toLocaleString()} {orden.moneda || 'ARS'}
                            </div>
                          )}
                        </div>

                        {ordenSeleccionada?.id === orden.id && (
                          <ArrowRight className="h-5 w-5 text-blue-500 mt-1" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
                    <p className="text-lg font-medium">¡Excelente trabajo!</p>
                    <p className="text-sm">Todas las órdenes tienen su servicio registrado</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Panel Derecho - Formulario de Registro */}
          <div className="bg-white rounded-lg shadow-md">
            {ordenSeleccionada ? (
              <div className="p-6 h-full flex flex-col">
                <div className="border-b border-gray-200 pb-4 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Registrar Servicio
                  </h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium text-blue-900">{ordenSeleccionada.codigo_oc}</span>
                        <span className="text-blue-700 ml-2">{ordenSeleccionada.placa}</span>
                      </div>
                      <div className="text-sm text-blue-600">
                        ${ordenSeleccionada.monto_vehiculo?.toLocaleString()} {ordenSeleccionada.moneda}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-4">
                  {/* Clasificación */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Clasificación *
                    </label>
                    <div className="flex space-x-3">
                      {['revision', 'mantenimiento', 'reparacion'].map((tipo) => (
                        <button
                          key={tipo}
                          onClick={() => setClasificacion(tipo as any)}
                          className={`px-3 py-2 rounded-lg text-sm transition-colors capitalize ${
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
                    <input
                      type="text"
                      value={subclasificacion}
                      onChange={(e) => setSubclasificacion(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Ej: Motor, Frenos, Documentación..."
                    />
                  </div>

                  {/* Kilometraje */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Kilometraje al Servicio
                    </label>
                    <input
                      type="number"
                      value={kilometrajeServicio}
                      onChange={(e) => setKilometrajeServicio(e.target.value ? parseInt(e.target.value) : '')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder={`Actual: ${vehiculoSeleccionado?.kilometraje_actual?.toLocaleString() || 'No registrado'} km`}
                    />
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Descripción detallada del trabajo realizado..."
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Repuestos y materiales utilizados..."
                    />
                  </div>
                </div>

                {/* Botones */}
                <div className="flex justify-between pt-4 border-t border-gray-200 mt-6">
                  <button
                    onClick={limpiarFormulario}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={guardarServicio}
                    disabled={saving || !descripcion.trim()}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <Save className="h-4 w-4" />
                    {saving ? 'Guardando...' : 'Guardar Servicio'}
                  </button>
                </div>

                {/* Mensajes */}
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
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Clock className="h-12 w-12 mx-auto mb-4" />
                  <p className="text-lg font-medium">Selecciona una orden</p>
                  <p className="text-sm">Elige una orden de compra de la lista para registrar su servicio</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}