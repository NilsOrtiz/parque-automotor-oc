'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Search, Droplets, Calendar, Gauge, DollarSign, FileText, Save, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Vehiculo {
  id: number
  Nro_Interno: number
  Placa: string
  Titular: string
  Marca: string
  Modelo: string
  Año: number
  kilometraje_actual: number
}

export default function CargaCombustibleManualPage() {
  // Estados de búsqueda (igual que en /busqueda)
  const [tipoBusqueda, setTipoBusqueda] = useState<'placa' | 'interno'>('placa')
  const [termino, setTermino] = useState('')
  const [vehiculo, setVehiculo] = useState<Vehiculo | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Datos del formulario de carga
  const [fechaCarga, setFechaCarga] = useState(new Date().toISOString().split('T')[0])
  const [odometro, setOdometro] = useState('')
  const [litrosCargados, setLitrosCargados] = useState('')
  const [tipoCombustible, setTipoCombustible] = useState('Diesel')
  const [montoTotal, setMontoTotal] = useState('')
  const [observaciones, setObservaciones] = useState('')

  async function buscarVehiculo() {
    if (!termino.trim()) {
      setError('Por favor ingresa un término de búsqueda')
      return
    }

    setLoading(true)
    setError('')
    setVehiculo(null)

    try {
      // Sistema de búsqueda exacto como en /busqueda
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
        // Pre-llenar odómetro con kilometraje actual si está disponible
        if (data.kilometraje_actual) {
          setOdometro(data.kilometraje_actual.toString())
        }
      }
    } catch (error) {
      console.error('Error en búsqueda:', error)
      setError('Error al buscar el vehículo')
    } finally {
      setLoading(false)
    }
  }

  function limpiarBusqueda() {
    setVehiculo(null)
    setTermino('')
    setOdometro('')
    setLitrosCargados('')
    setMontoTotal('')
    setError('')
    setSuccess('')
  }

  async function guardarCarga() {
    if (!vehiculo) return

    // Validaciones
    if (!fechaCarga || !odometro || !litrosCargados) {
      setError('Fecha, odómetro y litros son obligatorios')
      return
    }

    if (parseFloat(litrosCargados) <= 0) {
      setError('Los litros deben ser un número positivo')
      return
    }

    if (parseInt(odometro) <= 0) {
      setError('El odómetro debe ser un número positivo')
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      // Normalizar patente como lo hace el extractor automático (quitar espacios, mayúsculas)
      const placaNormalizada = vehiculo.Placa.trim().replace(' ', '').toUpperCase()
      
      // Generar timestamp completo como lo hace el extractor automático
      const fechaCargarTimestamp = `${fechaCarga} ${new Date().toTimeString().split(' ')[0]}`
      
      // Insertar registro de carga de combustible (compatible con extractor automático)
      const { error } = await supabase
        .from('cargas_combustible_ypf')
        .insert({
          fecha_carga: fechaCargarTimestamp,              // Timestamp completo como extractor
          placa: placaNormalizada,                        // Patente normalizada como extractor  
          odometro: parseInt(odometro),
          litros_cargados: parseFloat(litrosCargados),
          tipo_combustible: tipoCombustible,
          monto_total: montoTotal ? parseFloat(montoTotal) : null,
          fecha_extraccion: new Date().toISOString().replace('T', ' ').slice(0, -5) // Sin Z, formato timestamp
        })

      if (error) throw error

      // Actualizar kilometraje actual del vehículo si es mayor
      if (parseInt(odometro) > (vehiculo.kilometraje_actual || 0)) {
        const { error: errorVehiculo } = await supabase
          .from('vehiculos')
          .update({ kilometraje_actual: parseInt(odometro) })
          .eq('id', vehiculo.id)

        if (errorVehiculo) {
          console.error('Error actualizando kilometraje:', errorVehiculo)
          // No fallar por esto, solo notificar
        }
      }

      setSuccess('Carga de combustible registrada correctamente')
      
      // Limpiar formulario
      setFechaCarga(new Date().toISOString().split('T')[0])
      setOdometro('')
      setLitrosCargados('')
      setMontoTotal('')
      setObservaciones('')
      setTipoCombustible('Diesel')
      
    } catch (error) {
      console.error('Error guardando carga:', error)
      setError('Error al guardar la carga de combustible')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link 
              href="/vehiculos" 
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Volver a Vehículos
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-yellow-100 p-3 rounded-lg">
              <Droplets className="h-8 w-8 text-yellow-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Registro Manual de Carga de Combustible YPF</h1>
              <p className="text-gray-600">Ingresa los datos de carga de combustible manualmente</p>
            </div>
          </div>
        </div>

        {/* Mensajes */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <span className="text-green-700">{success}</span>
          </div>
        )}

        {!vehiculo ? (
          // FASE 1: Búsqueda de Vehículo (igual que en /busqueda)
          <div className="bg-white p-8 rounded-lg shadow-md max-w-2xl mx-auto">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
              <Search className="h-6 w-6 mr-3 text-blue-600" />
              Buscar Vehículo
            </h2>
            
            <div className="space-y-6">
              {/* Selector de tipo de búsqueda */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Tipo de búsqueda
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="placa"
                      checked={tipoBusqueda === 'placa'}
                      onChange={(e) => setTipoBusqueda(e.target.value as 'placa' | 'interno')}
                      className="mr-2 text-blue-600"
                    />
                    Por Placa
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="interno"
                      checked={tipoBusqueda === 'interno'}
                      onChange={(e) => setTipoBusqueda(e.target.value as 'placa' | 'interno')}
                      className="mr-2 text-blue-600"
                    />
                    Por Número Interno
                  </label>
                </div>
              </div>

              {/* Campo de búsqueda */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {tipoBusqueda === 'placa' ? 'Placa del vehículo' : 'Número interno'}
                </label>
                <div className="flex gap-2">
                  <input
                    type={tipoBusqueda === 'placa' ? 'text' : 'number'}
                    value={termino}
                    onChange={(e) => setTermino(e.target.value)}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                    placeholder={tipoBusqueda === 'placa' ? 'Ej: ABC123' : 'Ej: 15'}
                    onKeyPress={(e) => e.key === 'Enter' && buscarVehiculo()}
                  />
                  <button
                    onClick={buscarVehiculo}
                    disabled={loading}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 flex items-center gap-2 font-medium"
                  >
                    <Search className="h-5 w-5" />
                    {loading ? 'Buscando...' : 'Buscar'}
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  {tipoBusqueda === 'placa' 
                    ? 'Ingresa la placa exacta del vehículo' 
                    : 'Ingresa el número interno exacto'}
                </p>
              </div>
            </div>
          </div>
        ) : (
          // FASE 2: Información del Vehículo + Formulario de Carga
          <div className="space-y-8">
            {/* Información del vehículo encontrado */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-green-900">✅ Vehículo Encontrado</h3>
                <button
                  onClick={limpiarBusqueda}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm"
                >
                  Buscar Otro
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div><strong>Placa:</strong> {vehiculo.Placa}</div>
                <div><strong>Interno:</strong> {vehiculo.Nro_Interno}</div>
                <div><strong>Titular:</strong> {vehiculo.Titular}</div>
                <div><strong>Marca:</strong> {vehiculo.Marca}</div>
                <div><strong>Modelo:</strong> {vehiculo.Modelo}</div>
                <div><strong>Año:</strong> {vehiculo.Año}</div>
                <div className="col-span-2 md:col-span-3">
                  <strong>Kilometraje Actual:</strong> {vehiculo.kilometraje_actual?.toLocaleString() || 'No registrado'} km
                </div>
              </div>
            </div>

            {/* Formulario de Carga */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="h-5 w-5 mr-2 text-yellow-600" />
                Datos de la Carga
              </h2>

              <div className="space-y-4">
                {/* Fecha */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    Fecha de Carga *
                  </label>
                  <input
                    type="date"
                    value={fechaCarga}
                    onChange={(e) => setFechaCarga(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  />
                </div>

                {/* Odómetro */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Gauge className="h-4 w-4 inline mr-1" />
                    Odómetro (km) *
                  </label>
                  <input
                    type="number"
                    value={odometro}
                    onChange={(e) => setOdometro(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    placeholder="Ej: 85420"
                  />
                </div>

                {/* Litros */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Droplets className="h-4 w-4 inline mr-1" />
                    Litros Cargados *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={litrosCargados}
                    onChange={(e) => setLitrosCargados(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    placeholder="Ej: 45.5"
                  />
                </div>

                {/* Tipo de Combustible */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Combustible
                  </label>
                  <select
                    value={tipoCombustible}
                    onChange={(e) => setTipoCombustible(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  >
                    <option value="Diesel">Diesel</option>
                    <option value="Nafta">Nafta</option>
                    <option value="GNC">GNC</option>
                  </select>
                </div>

                {/* Monto Total */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <DollarSign className="h-4 w-4 inline mr-1" />
                    Monto Total (opcional)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={montoTotal}
                    onChange={(e) => setMontoTotal(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    placeholder="Ej: 15420.50"
                  />
                </div>

                {/* Botón de Guardar */}
                <button
                  onClick={guardarCarga}
                  disabled={!vehiculo || saving || !fechaCarga || !odometro || !litrosCargados}
                  className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-300 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <Save className="h-4 w-4" />
                  {saving ? 'Guardando...' : 'Guardar Carga de Combustible'}
                </button>

                <p className="text-xs text-gray-500 text-center">
                  * Campos obligatorios
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Información adicional */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">💡 Información Importante</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Los datos se guardarán en la tabla cargas_combustible_ypf para análisis posteriores</li>
            <li>• Si el odómetro es mayor al actual del vehículo, se actualizará automáticamente</li>
            <li>• Esta información se integrará con el sistema de análisis de consumo</li>
            <li>• Asegúrate de ingresar los datos correctamente antes de guardar</li>
          </ul>
        </div>
      </div>
    </div>
  )
}