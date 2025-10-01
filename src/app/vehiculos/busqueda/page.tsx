'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase, type Vehiculo } from '@/lib/supabase'
import { Search, ArrowLeft, Car, Droplets, Settings, Disc, Zap, Gauge, Circle, Battery, Wrench, Cog, Truck } from 'lucide-react'
import MantenimientoSection from '@/components/MantenimientoSection'
import { obtenerComponentePorId } from '@/lib/componentes-vehiculo'

export default function BusquedaPage() {
  const [tipoBusqueda, setTipoBusqueda] = useState<'placa' | 'interno'>('placa')
  const [termino, setTermino] = useState('')
  const [vehiculo, setVehiculo] = useState<Vehiculo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [editMode, setEditMode] = useState(false)
  const [editedVehiculo, setEditedVehiculo] = useState<Vehiculo | null>(null)
  const [saving, setSaving] = useState(false)
  const [vistaActual, setVistaActual] = useState<'datos' | 'historial' | 'pendientes'>('datos')
  const [historial, setHistorial] = useState<any[]>([])
  const [loadingHistorial, setLoadingHistorial] = useState(false)
  const [pendientes, setPendientes] = useState<any[]>([])
  const [loadingPendientes, setLoadingPendientes] = useState(false)
  const [configuracion, setConfiguracion] = useState<string[]>([]) // IDs de componentes aplicables
  const [perfilesDisponibles, setPerfilesDisponibles] = useState<Array<{id: number, nombre_configuracion: string}>>([])

  useEffect(() => {
    cargarPerfilesDisponibles()
  }, [])

  async function cargarPerfilesDisponibles() {
    try {
      const { data, error } = await supabase
        .from('configuraciones_vehiculo')
        .select('id, nombre_configuracion')
        .eq('activo', true)
        .order('nombre_configuracion', { ascending: true })

      if (error) throw error
      setPerfilesDisponibles(data || [])
    } catch (error) {
      console.error('Error cargando perfiles:', error)
    }
  }

  async function buscarVehiculo() {
    if (!termino.trim()) {
      setError('Por favor ingresa un término de búsqueda')
      return
    }

    setLoading(true)
    setError('')
    setVehiculo(null)

    try {
      const campo = tipoBusqueda === 'placa' ? 'Placa' : 'Nro_Interno'
      const valor = tipoBusqueda === 'placa' ? termino.trim() : parseInt(termino)

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
        setEditedVehiculo(data)
        // Cargar configuración, historial y pendientes automáticamente
        await cargarConfiguracion(data.configuracion_id)
        await cargarHistorial(data.id)
        await cargarPendientes(data.id)
      }
    } catch (error) {
      console.error('Error en búsqueda:', error)
      setError('Error al buscar el vehículo')
    } finally {
      setLoading(false)
    }
  }

  async function cargarConfiguracion(configuracionId: number | null) {
    if (!configuracionId) {
      // Si no tiene configuración, mostrar todos los componentes
      setConfiguracion([])
      return
    }

    try {
      const { data, error } = await supabase
        .from('configuraciones_vehiculo')
        .select('componentes_aplicables')
        .eq('id', configuracionId)
        .single()

      if (error) throw error
      setConfiguracion(data?.componentes_aplicables || [])
    } catch (error) {
      console.error('Error cargando configuración:', error)
      setConfiguracion([])
    }
  }

  async function cargarHistorial(vehiculoId: number) {
    setLoadingHistorial(true)
    try {
      const { data, error } = await supabase
        .from('historial')
        .select('*')
        .eq('id', vehiculoId)
        .order('fecha_servicio', { ascending: false })

      if (error) throw error
      
      // Procesar cada registro para incluir datos de órdenes de compra
      const historialConOrdenes = await Promise.all((data || []).map(async (registro) => {
        let ordenesRelacionadas: any[] = []
        
        if (registro.ocs_vehiculos) {
          try {
            const idsOrdenes = JSON.parse(registro.ocs_vehiculos)
            if (Array.isArray(idsOrdenes) && idsOrdenes.length > 0) {
              const { data: ordenes } = await supabase
                .from('ordenes_de_compra_por_vehiculo')
                .select('id, codigo_oc, proveedor, items, monto_vehiculo, moneda')
                .in('id', idsOrdenes)
              
              ordenesRelacionadas = ordenes || []
            }
          } catch (e) {
            console.error('Error parseando ocs_vehiculos:', e)
          }
        }
        
        return {
          ...registro,
          ordenes_relacionadas: ordenesRelacionadas
        }
      }))
      
      setHistorial(historialConOrdenes)
    } catch (error) {
      console.error('Error cargando historial:', error)
      setHistorial([])
    } finally {
      setLoadingHistorial(false)
    }
  }

  async function cargarPendientes(vehiculoId: number) {
    setLoadingPendientes(true)
    try {
      const { data, error } = await supabase
        .from('pendientes_observaciones')
        .select('*')
        .eq('id', vehiculoId)
        .order('fecha_creacion', { ascending: false })

      if (error) throw error
      setPendientes(data || [])
    } catch (error) {
      console.error('Error cargando pendientes:', error)
      setPendientes([])
    } finally {
      setLoadingPendientes(false)
    }
  }

  async function guardarCambios() {
    if (!editedVehiculo) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('vehiculos')
        .update(editedVehiculo)
        .eq('id', editedVehiculo.id)

      if (error) throw error

      setVehiculo(editedVehiculo)
      setEditMode(false)
      setError('')
    } catch (error) {
      console.error('Error al guardar:', error)
      setError('Error al guardar los cambios')
    } finally {
      setSaving(false)
    }
  }

  function cancelarEdicion() {
    setEditedVehiculo(vehiculo)
    setEditMode(false)
    setError('')
  }

  function updateVehiculo(updates: Partial<Vehiculo>) {
    setEditedVehiculo(prev => prev ? { ...prev, ...updates } : null)
  }

  // Función para filtrar componentes según configuración del vehículo
  function filtrarComponentesAplicables(componenteId: string): boolean {
    // Si no hay configuración, mostrar todos
    if (!configuracion || configuracion.length === 0) return true

    // Si hay configuración, solo mostrar los seleccionados
    return configuracion.includes(componenteId)
  }

  // Función para scroll automático a secciones
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest'
      })
    }
  }

  // Configuración de secciones con iconos
  const secciones = [
    { id: 'aceites-filtros', nombre: 'Aceites y Filtros', icono: Droplets, color: 'blue' },
    { id: 'transmision-liquidos', nombre: 'Transmisión y Líquidos', icono: Settings, color: 'green' },
    { id: 'frenos', nombre: 'Sistema de Frenos', icono: Disc, color: 'red' },
    { id: 'motor-embrague', nombre: 'Motor y Embrague', icono: Cog, color: 'orange' },
    { id: 'suspension', nombre: 'Suspensión', icono: Truck, color: 'purple' },
    { id: 'correas', nombre: 'Correas', icono: Wrench, color: 'yellow' },
    { id: 'electrico', nombre: 'Sistema Eléctrico', icono: Zap, color: 'indigo' },
    { id: 'neumaticos', nombre: 'Neumáticos', icono: Circle, color: 'gray' }
  ]

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Búsqueda de Vehículo</h1>
          <p className="text-gray-600">Busca un vehículo por placa o número interno</p>
        </div>

        {/* Formulario de búsqueda */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="space-y-6">
            {/* Selector de tipo de búsqueda */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Tipo de búsqueda
              </label>
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
            </div>

            {/* Campo de búsqueda */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {tipoBusqueda === 'placa' ? 'Placa del vehículo' : 'Número interno'}
              </label>
              <div className="flex gap-4">
                <input
                  type={tipoBusqueda === 'placa' ? 'text' : 'number'}
                  value={termino}
                  onChange={(e) => setTermino(e.target.value)}
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

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Resultado */}
        {vehiculo && (
          <div className="space-y-6">
            {/* Header del vehículo */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="bg-green-100 p-3 rounded-lg mr-4">
                    <Car className="h-8 w-8 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {vehiculo.Marca} {vehiculo.Modelo} - {vehiculo.Placa}
                    </h2>
                    <p className="text-gray-600">Información completa del vehículo</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {!editMode ? (
                    <button
                      onClick={() => setEditMode(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                    >
                      Editar
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={cancelarEdicion}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={guardarCambios}
                        disabled={saving}
                        className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded-lg"
                      >
                        {saving ? 'Guardando...' : 'Guardar'}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Toggle Vista de 3 estados */}
              <div className="mb-6 border-t pt-6">
                <div className="flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-700 mr-4">Vista:</span>
                  <div className="bg-gray-100 rounded-lg p-1 inline-flex">
                    <button
                      onClick={() => setVistaActual('datos')}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        vistaActual === 'datos'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
                      }`}
                    >
                      Datos del Vehículo
                    </button>
                    <button
                      onClick={() => setVistaActual('historial')}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        vistaActual === 'historial'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
                      }`}
                    >
                      Historial
                    </button>
                    <button
                      onClick={() => setVistaActual('pendientes')}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        vistaActual === 'pendientes'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
                      }`}
                    >
                      Pendientes
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {vistaActual === 'datos' ? (
              /* Vista de Datos del Vehículo */
              <>
              <div className="bg-white rounded-lg shadow-md p-6">
              {/* Información básica */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Número Interno</label>
                  {editMode ? (
                    <input
                      type="number"
                      value={editedVehiculo?.Nro_Interno || ''}
                      onChange={(e) => setEditedVehiculo(prev => prev ? {...prev, Nro_Interno: parseInt(e.target.value)} : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-lg font-semibold text-gray-900">{vehiculo.Nro_Interno}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Placa</label>
                  {editMode ? (
                    <input
                      type="text"
                      value={editedVehiculo?.Placa || ''}
                      onChange={(e) => setEditedVehiculo(prev => prev ? {...prev, Placa: e.target.value} : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-lg font-semibold text-gray-900">{vehiculo.Placa}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Titular</label>
                  {editMode ? (
                    <input
                      type="text"
                      value={editedVehiculo?.Titular || ''}
                      onChange={(e) => setEditedVehiculo(prev => prev ? {...prev, Titular: e.target.value} : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-lg text-gray-900">{vehiculo.Titular}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Kilometraje Actual</label>
                  {editMode ? (
                    <input
                      type="number"
                      value={editedVehiculo?.kilometraje_actual || ''}
                      onChange={(e) => setEditedVehiculo(prev => prev ? {...prev, kilometraje_actual: parseInt(e.target.value)} : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-lg text-gray-900">
                      {vehiculo.kilometraje_actual ? vehiculo.kilometraje_actual.toLocaleString() + ' km' : 'No registrado'}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Horas Actuales</label>
                  {editMode ? (
                    <input
                      type="number"
                      value={editedVehiculo?.hora_actual || ''}
                      onChange={(e) => setEditedVehiculo(prev => prev ? {...prev, hora_actual: parseInt(e.target.value)} : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Horas de motor"
                    />
                  ) : (
                    <p className="text-lg text-gray-900">
                      {vehiculo.hora_actual ? vehiculo.hora_actual.toLocaleString() + ' hrs' : 'No registrado'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Perfil de Configuración */}
            <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-blue-900 mb-1">
                    Perfil de Configuración
                  </label>
                  {editMode ? (
                    <select
                      value={editedVehiculo?.configuracion_id || ''}
                      onChange={async (e) => {
                        const nuevoPerfilId = e.target.value ? parseInt(e.target.value) : null
                        setEditedVehiculo(prev => prev ? {...prev, configuracion_id: nuevoPerfilId} : null)
                        // Recargar configuración al cambiar
                        if (nuevoPerfilId) {
                          await cargarConfiguracion(nuevoPerfilId)
                        } else {
                          setConfiguracion([])
                        }
                      }}
                      className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="">Sin perfil (mostrar todos los componentes)</option>
                      {perfilesDisponibles.map(perfil => (
                        <option key={perfil.id} value={perfil.id}>
                          {perfil.nombre_configuracion}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-blue-900 font-medium">
                      {vehiculo.configuracion_id
                        ? perfilesDisponibles.find(p => p.id === vehiculo.configuracion_id)?.nombre_configuracion || 'Perfil no encontrado'
                        : 'Sin perfil configurado (muestra todos los componentes)'}
                    </p>
                  )}
                </div>
                {!editMode && (
                  <Link
                    href="/vehiculos/perfiles"
                    className="ml-4 text-xs text-blue-700 hover:text-blue-900 underline"
                  >
                    Gestionar Perfiles
                  </Link>
                )}
              </div>
              <p className="text-xs text-blue-700 mt-2">
                El perfil determina qué componentes se muestran para este vehículo
              </p>
            </div>

            {/* Información del vehículo */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Información del Vehículo</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Marca</label>
                  {editMode ? (
                    <input
                      type="text"
                      value={editedVehiculo?.Marca || ''}
                      onChange={(e) => setEditedVehiculo(prev => prev ? {...prev, Marca: e.target.value} : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">{vehiculo.Marca}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Modelo</label>
                  {editMode ? (
                    <input
                      type="text"
                      value={editedVehiculo?.Modelo || ''}
                      onChange={(e) => setEditedVehiculo(prev => prev ? {...prev, Modelo: e.target.value} : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">{vehiculo.Modelo}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Año</label>
                  {editMode ? (
                    <input
                      type="number"
                      value={editedVehiculo?.Año || ''}
                      onChange={(e) => setEditedVehiculo(prev => prev ? {...prev, Año: parseInt(e.target.value)} : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">{vehiculo.Año}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Número de Chasis</label>
                  {editMode ? (
                    <input
                      type="text"
                      value={editedVehiculo?.Nro_Chasis || ''}
                      onChange={(e) => setEditedVehiculo(prev => prev ? {...prev, Nro_Chasis: e.target.value} : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">{vehiculo.Nro_Chasis}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Navegación por Secciones */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Navegación Rápida</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
                {secciones.map((seccion) => {
                  const IconoComponente = seccion.icono
                  return (
                    <button
                      key={seccion.id}
                      onClick={() => scrollToSection(seccion.id)}
                      className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all duration-200 hover:scale-105 hover:shadow-md ${
                        seccion.color === 'blue' ? 'border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700' :
                        seccion.color === 'green' ? 'border-green-200 bg-green-50 hover:bg-green-100 text-green-700' :
                        seccion.color === 'red' ? 'border-red-200 bg-red-50 hover:bg-red-100 text-red-700' :
                        seccion.color === 'orange' ? 'border-orange-200 bg-orange-50 hover:bg-orange-100 text-orange-700' :
                        seccion.color === 'purple' ? 'border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700' :
                        seccion.color === 'yellow' ? 'border-yellow-200 bg-yellow-50 hover:bg-yellow-100 text-yellow-700' :
                        seccion.color === 'indigo' ? 'border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700' :
                        'border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700'
                      }`}
                      title={seccion.nombre}
                    >
                      <IconoComponente className="h-6 w-6 mb-2" />
                      <span className="text-xs font-medium text-center leading-tight">
                        {seccion.nombre.split(' ').map((palabra, i) => (
                          <div key={i}>{palabra}</div>
                        ))}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Aceites y Filtros */}
            <div id="aceites-filtros">
              <MantenimientoSection
                title="Aceites y Filtros"
              fields={[
                {
                  label: "Aceite de Motor",
                  kmField: "aceite_motor_km",
                  dateField: "aceite_motor_fecha",
                  modelField: "aceite_motor_modelo",
                  litersField: "aceite_motor_litros",
                  hrField: "aceite_motor_hr"
                },
                {
                  label: "Filtro Aceite Motor",
                  modelField: "filtro_aceite_motor_modelo"
                },
                {
                  label: "Filtro de Combustible",
                  kmField: "filtro_combustible_km",
                  dateField: "filtro_combustible_fecha",
                  modelField: "filtro_combustible_modelo"
                },
                {
                  label: "Filtro de Aire",
                  kmField: "filtro_aire_km",
                  dateField: "filtro_aire_fecha",
                  modelField: "filtro_aire_modelo"
                },
                {
                  label: "Filtro de Cabina",
                  kmField: "filtro_cabina_km",
                  dateField: "filtro_cabina_fecha",
                  modelField: "filtro_cabina_modelo"
                },
                {
                  label: "Filtro Deshumidificador",
                  kmField: "filtro_deshumidificador_km",
                  dateField: "filtro_deshumidificador_fecha",
                  modelField: "filtro_deshumidificador_modelo"
                },
                {
                  label: "Filtro Secador",
                  kmField: "filtro_secador_km",
                  dateField: "filtro_secador_fecha",
                  modelField: "filtro_secador_modelo"
                },
                {
                  label: "Filtro de Aire Secundario",
                  kmField: "filtro_aire_secundario_km",
                  dateField: "filtro_aire_secundario_fecha",
                  modelField: "filtro_aire_secundario_modelo"
                },
                {
                  label: "Trampa de Agua",
                  kmField: "trampa_agua_km",
                  dateField: "trampa_agua_fecha",
                  modelField: "trampa_agua_modelo"
                }
              ].filter((_, idx) => {
                const ids = ['aceite_motor', 'filtro_aceite_motor', 'filtro_combustible', 'filtro_aire', 'filtro_cabina', 'filtro_deshumidificador', 'filtro_secador', 'filtro_aire_secundario', 'trampa_agua']
                return filtrarComponentesAplicables(ids[idx])
              })}
              vehiculo={vehiculo}
              editedVehiculo={editedVehiculo}
              editMode={editMode}
              onUpdate={updateVehiculo}
              />
            </div>

            {/* Transmisión y Líquidos */}
            <div id="transmision-liquidos">
              <MantenimientoSection
              title="Transmisión y Líquidos"
              fields={[
                {
                  label: "Aceite de Transmisión",
                  kmField: "aceite_transmicion_km",
                  dateField: "aceite_transmicion_fecha",
                  modelField: "aceite_transmicion_modelo"
                },
                {
                  label: "Líquido Refrigerante",
                  kmField: "liquido_refrigerante_km",
                  dateField: "liquido_refrigerante_fecha",
                  modelField: "liquido_refrigerante_modelo"
                },
                {
                  label: "Líquido de Frenos",
                  kmField: "liquido_frenos_km",
                  dateField: "liquido_frenos_fecha",
                  modelField: "liquido_frenos_modelo"
                }
              ]}
              vehiculo={vehiculo}
              editedVehiculo={editedVehiculo}
              editMode={editMode}
              onUpdate={updateVehiculo}
              />
            </div>

            {/* Frenos */}
            <div id="frenos">
              <MantenimientoSection
              title="Sistema de Frenos"
              fields={[
                {
                  label: "Pastillas/Cintas Freno A",
                  kmField: "pastilla_cinta_freno_km_a",
                  dateField: "pastilla_cinta_freno_fecha_a",
                  modelField: "pastilla_cinta_freno_modelo_a"
                },
                {
                  label: "Pastillas/Cintas Freno B",
                  kmField: "pastilla_cinta_freno_km_b",
                  dateField: "pastilla_cinta_freno_fecha_b",
                  modelField: "pastilla_cinta_freno_modelo_b"
                },
                {
                  label: "Pastillas/Cintas Freno C",
                  kmField: "pastilla_cinta_freno_km_c",
                  dateField: "pastilla_cinta_freno_fecha_c",
                  modelField: "pastilla_cinta_freno_modelo_c"
                },
                {
                  label: "Pastillas/Cintas Freno D",
                  kmField: "pastilla_cinta_freno_km_d",
                  dateField: "pastilla_cinta_freno_fecha_d",
                  modelField: "pastilla_cinta_freno_modelo_d"
                }
              ]}
              vehiculo={vehiculo}
              editedVehiculo={editedVehiculo}
              editMode={editMode}
              onUpdate={updateVehiculo}
              />
            </div>

            {/* Motor y Embrague */}
            <div id="motor-embrague">
              <MantenimientoSection
              title="Motor y Embrague"
              fields={[
                {
                  label: "Embrague",
                  kmField: "embrague_km",
                  dateField: "embrague_fecha",
                  modelField: "embrague_modelo"
                }
              ]}
              vehiculo={vehiculo}
              editedVehiculo={editedVehiculo}
              editMode={editMode}
              onUpdate={updateVehiculo}
              />
            </div>

            {/* Suspensión */}
            <div id="suspension">
              <MantenimientoSection
              title="Sistema de Suspensión"
              fields={[
                {
                  label: "Suspensión A",
                  kmField: "suspencion_km_a",
                  dateField: "suspencion_fecha_a",
                  modelField: "suspencion_modelo_a"
                },
                {
                  label: "Suspensión B",
                  kmField: "suspencion_km_b",
                  dateField: "suspencion_fecha_b",
                  modelField: "suspencion_modelo_b"
                },
                {
                  label: "Suspensión C",
                  kmField: "suspencion_km_c",
                  dateField: "suspencion_fecha_c",
                  modelField: "suspencion_modelo_c"
                },
                {
                  label: "Suspensión D",
                  kmField: "suspencion_km_d",
                  dateField: "suspencion_fecha_d",
                  modelField: "suspencion_modelo_d"
                }
              ]}
              vehiculo={vehiculo}
              editedVehiculo={editedVehiculo}
              editMode={editMode}
              onUpdate={updateVehiculo}
              />
            </div>

            {/* Correas */}
            <div id="correas">
              <MantenimientoSection
              title="Sistema de Correas"
              fields={[
                {
                  label: "Correa de Distribución",
                  kmField: "correa_distribucion_km",
                  dateField: "correa_distribucion_fecha",
                  modelField: "correa_distribucion_modelo"
                },
                {
                  label: "Correa de Alternador",
                  kmField: "correa_alternador_km",
                  dateField: "correa_alternador_fecha",
                  modelField: "correa_alternador_modelo"
                },
                {
                  label: "Correa de Dirección",
                  kmField: "correa_direccion_km",
                  dateField: "correa_direccion_fecha",
                  modelField: "correa_direccion_modelo"
                },
                {
                  label: "Correa de Aire Acondicionado",
                  kmField: "correa_aire_acondicionado_km",
                  dateField: "correa_aire_acondicionado_fecha",
                  modelField: "correa_aire_acondicionado_modelo"
                },
                {
                  label: "Correa Poly-V",
                  kmField: "correa_polyv_km",
                  dateField: "correa_polyv_fecha",
                  modelField: "correa_polyv_modelo"
                },
                {
                  label: "Tensor de Correa",
                  kmField: "tensor_correa_km",
                  dateField: "tensor_correa_fecha",
                  modelField: "tensor_correa_modelo"
                },
                {
                  label: "Polea Tensora",
                  kmField: "polea_tensora_correa_km",
                  dateField: "polea_tensora_correa_fecha",
                  modelField: "polea_tensora_correa_modelo"
                }
              ]}
              vehiculo={vehiculo}
              editedVehiculo={editedVehiculo}
              editMode={editMode}
              onUpdate={updateVehiculo}
              />
            </div>

            {/* Sistema Eléctrico */}
            <div id="electrico">
              <MantenimientoSection
              title="Sistema Eléctrico"
              fields={[
                {
                  label: "Batería",
                  kmField: "bateria_km",
                  dateField: "bateria_fecha",
                  modelField: "bateria_modelo"
                },
                {
                  label: "Escobillas",
                  kmField: "escobillas_km",
                  dateField: "escobillas_fecha",
                  modelField: "escobillas_modelo"
                }
              ]}
              vehiculo={vehiculo}
              editedVehiculo={editedVehiculo}
              editMode={editMode}
              onUpdate={updateVehiculo}
              />
            </div>

            {/* Neumáticos */}
            <div id="neumaticos">
              <MantenimientoSection
              title="Neumáticos"
              fields={[
                {
                  label: "Modelo/Marca General",
                  modelField: "neumatico_modelo_marca"
                },
                {
                  label: "Neumático A",
                  kmField: "neumatico_km_a",
                  dateField: "neumatico_fecha_a"
                },
                {
                  label: "Neumático B",
                  kmField: "neumatico_km_b",
                  dateField: "neumatico_fecha_b"
                },
                {
                  label: "Neumático C",
                  kmField: "neumatico_km_c",
                  dateField: "neumatico_fecha_c"
                },
                {
                  label: "Neumático D",
                  kmField: "neumatico_km_d",
                  dateField: "neumatico_fecha_d"
                },
                {
                  label: "Neumático E",
                  kmField: "neumatico_km_e",
                  dateField: "neumatico_fecha_e"
                },
                {
                  label: "Neumático F",
                  kmField: "neumatico_km_f",
                  dateField: "neumatico_fecha_f"
                },
                {
                  label: "Alineación",
                  kmField: "alineacion_neumaticos_km",
                  dateField: "alineacion_neumaticos_fecha"
                },
                {
                  label: "Rotación",
                  kmField: "rotacion_neumaticos_km",
                  dateField: "rotacion_neumaticos_fecha"
                }
              ]}
              vehiculo={vehiculo}
              editedVehiculo={editedVehiculo}
              editMode={editMode}
              onUpdate={updateVehiculo}
              />
            </div>
            </>
            ) : vistaActual === 'historial' ? (
              /* Vista de Historial */
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Historial de Procedimientos</h3>
                  <div className="text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                    {historial.length} registro(s)
                  </div>
                </div>

                {loadingHistorial ? (
                  <div className="text-center py-8">
                    <div className="text-lg text-gray-500">Cargando historial...</div>
                  </div>
                ) : historial.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-lg mb-2">📋</div>
                    <p className="text-gray-500">No hay registros de historial para este vehículo</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Fecha
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Clasificación
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Subclasificación
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Descripción
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Items
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Órdenes Relacionadas
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {historial.map((registro) => (
                          <tr key={registro.id_historial} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {new Date(registro.fecha_servicio).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-blue-100 text-blue-800">
                                {registro.clasificacion}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {registro.subclasificacion || '-'}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                              <div className="truncate" title={registro.descripcion}>
                                {registro.descripcion}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                              <div className="truncate" title={registro.items}>
                                {registro.items || '-'}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {registro.ordenes_relacionadas && registro.ordenes_relacionadas.length > 0 ? (
                                <div className="space-y-1">
                                  {registro.ordenes_relacionadas.map((orden: any) => (
                                    <div key={orden.id} className="flex items-center gap-2">
                                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                                        {orden.codigo_oc}
                                      </span>
                                      <span className="text-xs text-gray-600">
                                        {orden.proveedor}
                                      </span>
                                      {orden.monto_vehiculo && (
                                        <span className="text-xs text-blue-600 font-medium">
                                          ${orden.monto_vehiculo.toLocaleString()} {orden.moneda || 'ARS'}
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-gray-400 text-xs">Sin órdenes</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : (
              /* Vista de Pendientes */
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Problemas y Pendientes</h3>
                  <div className="text-sm text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
                    {pendientes.length} pendiente(s)
                  </div>
                </div>

                {loadingPendientes ? (
                  <div className="text-center py-8">
                    <div className="text-lg text-gray-500">Cargando pendientes...</div>
                  </div>
                ) : pendientes.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-lg mb-2">✅</div>
                    <p className="text-gray-500">No hay problemas pendientes para este vehículo</p>
                    <p className="text-gray-400 text-sm mt-2">El vehículo está en buen estado</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendientes.map((pendiente) => (
                      <div key={pendiente.id_pendiente} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium ${
                              pendiente.prioridad === 'critico' ? 'bg-red-100 text-red-800' :
                              pendiente.prioridad === 'medio' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {pendiente.clasificacion}
                            </span>
                            {pendiente.subclasificacion && (
                              <span className="text-sm text-gray-500">
                                → {pendiente.subclasificacion}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              pendiente.prioridad === 'critico' ? 'bg-red-100 text-red-800' :
                              pendiente.prioridad === 'medio' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {pendiente.prioridad === 'critico' ? '🔴 Crítico' :
                               pendiente.prioridad === 'medio' ? '🟡 Medio' :
                               '🟢 Leve'}
                            </span>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              pendiente.estado === 'completado' ? 'bg-green-100 text-green-800' :
                              pendiente.estado === 'en_progreso' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {pendiente.estado === 'completado' ? 'Completado' :
                               pendiente.estado === 'en_progreso' ? 'En Progreso' :
                               'Pendiente'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="mb-3">
                          <h4 className="font-medium text-gray-900 mb-1">Descripción del problema:</h4>
                          <p className="text-gray-700">{pendiente.descripcion}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Fecha de creación:</span>
                            <div>{new Date(pendiente.fecha_creacion).toLocaleDateString()}</div>
                          </div>
                          {pendiente.fecha_programada && (
                            <div>
                              <span className="font-medium">Fecha programada:</span>
                              <div>{new Date(pendiente.fecha_programada).toLocaleDateString()}</div>
                            </div>
                          )}
                        </div>

                        {/* Ejemplo de acciones que podrías agregar */}
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <div className="flex gap-2">
                            <button className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition-colors">
                              Ver detalles
                            </button>
                            <button className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200 transition-colors">
                              Marcar como resuelto
                            </button>
                            <button className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded hover:bg-yellow-200 transition-colors">
                              Reprogramar
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}