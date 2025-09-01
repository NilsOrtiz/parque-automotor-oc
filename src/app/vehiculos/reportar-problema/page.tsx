'use client'

import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, AlertTriangle, Search, Clock, User } from 'lucide-react'

export default function ReportarProblemaPage() {
  const [tipoBusqueda, setTipoBusqueda] = useState<'placa' | 'interno'>('placa')
  const [termino, setTermino] = useState('')
  const [vehiculoEncontrado, setVehiculoEncontrado] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')
  
  // Datos del formulario
  const [clasificacion, setClasificacion] = useState('')
  const [subclasificacion, setSubclasificacion] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [prioridad, setPrioridad] = useState<'leve' | 'medio' | 'critico'>('medio')
  const [tiempoEstimado, setTiempoEstimado] = useState<number | ''>('')
  const [reportadoPor, setReportadoPor] = useState('')
  const [tipoReportador, setTipoReportador] = useState<'chofer' | 'mecanico'>('chofer')

  const clasificaciones = [
    'Motor',
    'Suspensión', 
    'Frenos',
    'Transmisión',
    'Sistema Eléctrico',
    'Carrocería',
    'Neumáticos',
    'Aire Acondicionado',
    'Dirección',
    'Combustible',
    'Otros'
  ]

  const subclasificaciones: Record<string, string[]> = {
    'Motor': ['Ruidos extraños', 'Pérdida de potencia', 'Sobrecalentamiento', 'Humo', 'Consumo excesivo'],
    'Suspensión': ['Ruidos al pasar badenes', 'Vibración', 'Vehículo se inclina', 'Amortiguadores'],
    'Frenos': ['Ruido al frenar', 'Pedal duro', 'Pedal blando', 'Vibración al frenar', 'Desgaste'],
    'Transmisión': ['No cambia marcha', 'Ruidos', 'Vibración', 'Pérdida de fluido'],
    'Sistema Eléctrico': ['Luces', 'Batería', 'Alternador', 'Arranque', 'Tablero'],
    'Carrocería': ['Puerta', 'Ventana', 'Asiento', 'Oxidación', 'Golpes'],
    'Neumáticos': ['Desgaste irregular', 'Baja presión', 'Pinchazo', 'Vibración'],
    'Aire Acondicionado': ['No enfría', 'Ruido', 'Mal olor', 'Fuga'],
    'Dirección': ['Dura', 'Vibración', 'Ruido', 'Desalineación'],
    'Combustible': ['Consumo excesivo', 'Pérdida', 'Filtro'],
    'Otros': ['Diagnóstico necesario', 'Revisión general', 'Mantenimiento preventivo']
  }

  async function buscarVehiculo() {
    if (!termino.trim()) {
      setError('Por favor ingresa un término de búsqueda')
      return
    }

    setLoading(true)
    setError('')
    setVehiculoEncontrado(null)

    try {
      const campo = tipoBusqueda === 'placa' ? 'Placa' : 'Nro_Interno'
      const valor = tipoBusqueda === 'placa' ? termino.trim() : parseInt(termino)

      const { data, error } = await supabase
        .from('vehiculos')
        .select('id, Placa, Nro_Interno, Marca, Modelo, Año')
        .eq(campo, valor)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          setError('No se encontró ningún vehículo con ese criterio')
        } else {
          throw error
        }
      } else {
        setVehiculoEncontrado(data)
        setError('')
        setExito('')
      }
    } catch (error) {
      console.error('Error en búsqueda:', error)
      setError('Error al buscar el vehículo')
    } finally {
      setLoading(false)
    }
  }

  async function enviarReporte() {
    if (!vehiculoEncontrado) {
      setError('Primero debes buscar un vehículo')
      return
    }

    if (!clasificacion || !descripcion || !reportadoPor) {
      setError('Por favor completa todos los campos obligatorios')
      return
    }

    setEnviando(true)
    setError('')

    try {
      const { error } = await supabase
        .from('pendientes_observaciones')
        .insert({
          id: vehiculoEncontrado.id,
          clasificacion,
          subclasificacion: subclasificacion || null,
          descripcion,
          criticidad: prioridad, // Campo legacy - mapear prioridad a criticidad
          prioridad,
          tiempo_estimado: tiempoEstimado || null,
          estado: 'pendiente',
          fecha_creacion: new Date().toISOString().split('T')[0], // Solo fecha, no timestamp
          created_at: new Date().toISOString()
        })

      if (error) throw error

      setExito(`Problema reportado exitosamente para ${vehiculoEncontrado.Placa}`)
      
      // Limpiar formulario completo para nuevo reporte
      setClasificacion('')
      setSubclasificacion('')
      setDescripcion('')
      setPrioridad('medio')
      setTiempoEstimado('')
      setReportadoPor('')
      setTipoReportador('chofer')
      setVehiculoEncontrado(null)
      setTermino('')
      
    } catch (error) {
      console.error('Error al enviar reporte:', error)
      setError('Error al enviar el reporte. Intenta nuevamente.')
    } finally {
      setEnviando(false)
    }
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Reportar Problema</h1>
          <p className="text-gray-600">Formulario para choferes y mecánicos</p>
        </div>

        {/* Tipo de reportador */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              ¿Quién reporta el problema?
            </label>
            <div className="flex space-x-4">
              <button
                onClick={() => setTipoReportador('chofer')}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  tipoReportador === 'chofer'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <User className="h-4 w-4" />
                Chofer
              </button>
              <button
                onClick={() => setTipoReportador('mecanico')}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  tipoReportador === 'mecanico'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <User className="h-4 w-4" />
                Mecánico
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre completo *
            </label>
            <input
              type="text"
              value={reportadoPor}
              onChange={(e) => setReportadoPor(e.target.value)}
              placeholder="Ej: Juan Pérez"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Búsqueda de vehículo */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">1. Buscar Vehículo</h2>
          
          <div className="space-y-4">
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
          </div>

          {/* Vehículo encontrado */}
          {vehiculoEncontrado && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-lg">
                  <Search className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-green-900">Vehículo encontrado</p>
                  <p className="text-green-700">
                    {vehiculoEncontrado.Marca} {vehiculoEncontrado.Modelo} - {vehiculoEncontrado.Placa}
                    {vehiculoEncontrado.Nro_Interno && ` (Interno: ${vehiculoEncontrado.Nro_Interno})`}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Formulario de problema */}
        {vehiculoEncontrado && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">2. Detalles del Problema</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Clasificación */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Clasificación *
                </label>
                <select
                  value={clasificacion}
                  onChange={(e) => {
                    setClasificacion(e.target.value)
                    setSubclasificacion('')
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Selecciona una clasificación</option>
                  {clasificaciones.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Subclasificación */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subclasificación
                </label>
                <select
                  value={subclasificacion}
                  onChange={(e) => setSubclasificacion(e.target.value)}
                  disabled={!clasificacion}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                >
                  <option value="">Selecciona (opcional)</option>
                  {clasificacion && subclasificaciones[clasificacion]?.map((sub) => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>

              {/* Prioridad */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prioridad *
                </label>
                <div className="flex space-x-2">
                  {(['leve', 'medio', 'critico'] as const).map((nivel) => (
                    <button
                      key={nivel}
                      onClick={() => setPrioridad(nivel)}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        prioridad === nivel
                          ? nivel === 'critico' ? 'bg-red-600 text-white' :
                            nivel === 'medio' ? 'bg-yellow-600 text-white' :
                            'bg-green-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {nivel === 'critico' ? '🔴 Crítico' :
                       nivel === 'medio' ? '🟡 Medio' :
                       '🟢 Leve'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tiempo estimado (solo para mecánicos) */}
              {tipoReportador === 'mecanico' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="h-4 w-4 inline mr-1" />
                    Tiempo estimado (horas)
                  </label>
                  <input
                    type="number"
                    value={tiempoEstimado}
                    onChange={(e) => setTiempoEstimado(e.target.value ? parseInt(e.target.value) : '')}
                    placeholder="Ej: 2"
                    min="1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}
            </div>

            {/* Descripción */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción del problema *
              </label>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Describe detalladamente el problema encontrado..."
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        )}

        {/* Mensajes */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {exito && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
            {exito}
          </div>
        )}

        {/* Botón enviar */}
        {vehiculoEncontrado && (
          <div className="flex justify-end">
            <button
              onClick={enviarReporte}
              disabled={enviando}
              className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
            >
              <AlertTriangle className="h-5 w-5" />
              {enviando ? 'Enviando...' : 'Reportar Problema'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}