'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Search, FileX, Calendar, Truck, Package, AlertCircle, CheckCircle, Eye, Link2 } from 'lucide-react'

interface ServicioSinOC {
  id: number
  vehiculo_id: number
  vehiculo_placa: string
  vehiculo_interno: number | null
  vehiculo_marca: string
  vehiculo_modelo: string
  fecha: string
  clasificacion: string
  subclasificacion: string
  descripcion: string
  items: string
  kilometraje_servicio: number | null
  ocs_vehiculos: string | null
  created_at: string
}

interface OrdenCompra {
  id: number
  codigo_oc: string
  proveedor: string
  items: string
  monto_vehiculo: number
  moneda: string
  placa: string
  interno: number | null
}

export default function AnexarOrdenesPage() {
  const [serviciosSinOC, setServiciosSinOC] = useState<ServicioSinOC[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroVehiculo, setFiltroVehiculo] = useState('')
  const [filtroFecha, setFiltroFecha] = useState('')
  const [servicioSeleccionado, setServicioSeleccionado] = useState<ServicioSinOC | null>(null)
  const [ordenesDisponibles, setOrdenesDisponibles] = useState<OrdenCompra[]>([])
  const [ordenesSeleccionadas, setOrdenesSeleccionadas] = useState<Set<string>>(new Set())
  const [loadingOrdenes, setLoadingOrdenes] = useState(false)
  const [anexando, setAnexando] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    cargarServiciosSinOC()
  }, [])

  async function cargarServiciosSinOC() {
    setLoading(true)
    try {
      // Consultar tabla historial en lugar de servicios
      const { data, error } = await supabase
        .from('historial')
        .select(`
          id_historial,
          id,
          clasificacion,
          subclasificacion,
          descripcion,
          items,
          fecha_servicio,
          ocs_vehiculos,
          kilometraje_al_servicio,
          created_at,
          vehiculos (
            Placa,
            Nro_Interno,
            Marca,
            Modelo
          )
        `)
        .eq('clasificacion', 'mantenimiento')
        .or('ocs_vehiculos.is.null,ocs_vehiculos.eq.') // Sin OC o vacío
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        console.error('Error en query de historial:', error)
        throw error
      }

      console.log('Datos recibidos del historial:', data?.length)
      if (data?.[0]) {
        console.log('Estructura del primer registro:', data[0])
      }

      const serviciosFormateados: ServicioSinOC[] = (data || []).map(servicio => ({
        id: servicio.id_historial,
        vehiculo_id: servicio.id,
        vehiculo_placa: servicio.vehiculos?.Placa || 'N/A',
        vehiculo_interno: servicio.vehiculos?.Nro_Interno || null,
        vehiculo_marca: servicio.vehiculos?.Marca || 'N/A',
        vehiculo_modelo: servicio.vehiculos?.Modelo || 'N/A',
        fecha: servicio.fecha_servicio,
        clasificacion: servicio.clasificacion,
        subclasificacion: servicio.subclasificacion || '',
        descripcion: servicio.descripcion,
        items: servicio.items || '',
        kilometraje_servicio: servicio.kilometraje_al_servicio,
        ocs_vehiculos: servicio.ocs_vehiculos,
        created_at: servicio.created_at
      }))

      setServiciosSinOC(serviciosFormateados)
    } catch (error) {
      console.error('Error cargando servicios sin OC:', error)
      setError(`Error cargando servicios sin orden de compra: ${error.message || error}`)
    } finally {
      setLoading(false)
    }
  }

  async function cargarOrdenesDisponibles(vehiculoId: number, items: string, placa: string) {
    setLoadingOrdenes(true)
    try {
      const { data, error } = await supabase
        .from('ordenes_de_compra_por_vehiculo')
        .select('*')
        .eq('placa', placa)
        .order('created_at', { ascending: false })

      if (error) throw error

      console.log('Órdenes encontradas para placa', placa, ':', data?.length)

      // Filtrar órdenes que podrían coincidir con los items del servicio
      const ordenesFiltradas = (data || []).filter(orden => {
        if (!items || !orden.items) return true // Mostrar todas si no hay items para comparar

        // Buscar coincidencias de palabras clave
        const itemsServicio = items.toLowerCase()
        const itemsOrden = orden.items.toLowerCase()

        const palabrasClave = ['aceite', 'filtro', 'motor', 'transmision', 'frenos', 'refrigerante', 'combustible']
        return palabrasClave.some(palabra =>
          itemsServicio.includes(palabra) && itemsOrden.includes(palabra)
        )
      })

      setOrdenesDisponibles(ordenesFiltradas)
    } catch (error) {
      console.error('Error cargando órdenes:', error)
      setError('Error cargando órdenes de compra disponibles')
    } finally {
      setLoadingOrdenes(false)
    }
  }

  async function anexarOrdenesCompra(servicioId: number) {
    if (ordenesSeleccionadas.size === 0) {
      setError('Debe seleccionar al menos una orden de compra')
      return
    }

    setAnexando(true)
    setError('')
    setSuccess('')

    try {
      // Combinar todos los códigos OC seleccionados separados por comas
      const codigosOC = Array.from(ordenesSeleccionadas).join(', ')

      // Actualizar el registro en historial agregando los códigos OC
      const { error: updateError } = await supabase
        .from('historial')
        .update({ ocs_vehiculos: codigosOC })
        .eq('id_historial', servicioId)

      if (updateError) throw updateError

      const cantidadOrdenes = ordenesSeleccionadas.size
      setSuccess(`${cantidadOrdenes} orden${cantidadOrdenes > 1 ? 'es' : ''} de compra anexada${cantidadOrdenes > 1 ? 's' : ''} exitosamente`)
      setServicioSeleccionado(null)
      setOrdenesDisponibles([])
      setOrdenesSeleccionadas(new Set())

      // Recargar la lista
      await cargarServiciosSinOC()

    } catch (error) {
      console.error('Error anexando órdenes:', error)
      setError(`Error al anexar las órdenes de compra: ${error.message || error}`)
    } finally {
      setAnexando(false)
    }
  }

  function handleSeleccionarServicio(servicio: ServicioSinOC) {
    setServicioSeleccionado(servicio)
    setOrdenesDisponibles([])
    setOrdenesSeleccionadas(new Set())
    setError('')
    setSuccess('')
    cargarOrdenesDisponibles(servicio.vehiculo_id, servicio.items, servicio.vehiculo_placa)
  }

  function toggleOrdenSeleccionada(codigoOC: string) {
    setOrdenesSeleccionadas(prev => {
      const nueva = new Set(prev)
      if (nueva.has(codigoOC)) {
        nueva.delete(codigoOC)
      } else {
        nueva.add(codigoOC)
      }
      return nueva
    })
  }

  function formatearFecha(fecha: string) {
    return new Date(fecha).toLocaleDateString('es-UY', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const serviciosFiltrados = serviciosSinOC.filter(servicio => {
    const matchVehiculo = !filtroVehiculo ||
      servicio.vehiculo_placa.toLowerCase().includes(filtroVehiculo.toLowerCase()) ||
      (servicio.vehiculo_interno && servicio.vehiculo_interno.toString().includes(filtroVehiculo))

    const matchFecha = !filtroFecha || servicio.fecha.includes(filtroFecha)

    return matchVehiculo && matchFecha
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Cargando servicios sin orden de compra...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Link
              href="/vehiculos"
              className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Vehículos
            </Link>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">Anexar Órdenes de Compra</h1>
          <p className="text-gray-600">
            Servicios de mantenimiento sin orden de compra anexada - {serviciosFiltrados.length} encontrados
          </p>
        </div>

        {/* Mensajes */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
            <span className="text-green-800">{success}</span>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
            <span className="text-red-800">{error}</span>
          </div>
        )}

        {/* Filtros */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Filtros</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vehículo (Placa o Interno)
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  value={filtroVehiculo}
                  onChange={(e) => setFiltroVehiculo(e.target.value)}
                  placeholder="Buscar por placa o número interno..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha
              </label>
              <input
                type="date"
                value={filtroFecha}
                onChange={(e) => setFiltroFecha(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Lista de servicios sin OC */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <FileX className="h-5 w-5 mr-2" />
              Servicios sin Orden de Compra
            </h2>

            {serviciosFiltrados.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                <FileX className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  ¡Excelente!
                </h3>
                <p className="text-gray-600">
                  Todos los servicios de mantenimiento tienen su orden de compra anexada
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {serviciosFiltrados.map((servicio) => (
                  <div
                    key={servicio.id}
                    className={`bg-white rounded-lg shadow-sm border-l-4 p-6 cursor-pointer transition-all ${
                      servicioSeleccionado?.id === servicio.id
                        ? 'border-l-blue-500 bg-blue-50 shadow-md'
                        : 'border-l-red-400 hover:shadow-md'
                    }`}
                    onClick={() => handleSeleccionarServicio(servicio)}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center mb-2">
                          <Calendar className="h-4 w-4 text-gray-500 mr-2" />
                          <span className="text-sm text-gray-600">{formatearFecha(servicio.fecha)}</span>
                          <span className="mx-2 text-gray-300">•</span>
                          <Truck className="h-4 w-4 text-gray-500 mr-1" />
                          <span className="text-sm text-gray-600">
                            {servicio.vehiculo_interno ? `#${servicio.vehiculo_interno} - ` : ''}{servicio.vehiculo_placa}
                          </span>
                        </div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-1">
                          {servicio.subclasificacion}
                        </h4>
                        <p className="text-sm text-gray-600 mb-2">
                          {servicio.vehiculo_marca} {servicio.vehiculo_modelo}
                        </p>
                        <p className="text-gray-700 text-sm mb-2">
                          {servicio.descripcion}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                          Sin OC
                        </span>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex items-start">
                        <Package className="h-4 w-4 text-gray-500 mr-2 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-700 mb-1">Items utilizados:</p>
                          <p className="text-sm text-gray-600">{servicio.items || 'No especificado'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex justify-between items-center">
                      <div className="text-xs text-gray-500">
                        {servicio.kilometraje_servicio && (
                          <span>{servicio.kilometraje_servicio.toLocaleString()} km</span>
                        )}
                      </div>
                      <button
                        className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                          servicioSeleccionado?.id === servicio.id
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        {servicioSeleccionado?.id === servicio.id ? 'Seleccionado' : 'Seleccionar'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Panel de órdenes disponibles */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <Link2 className="h-5 w-5 mr-2" />
              Órdenes Disponibles
            </h2>

            {!servicioSeleccionado ? (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  Selecciona un servicio para ver las órdenes de compra compatibles
                </p>
              </div>
            ) : loadingOrdenes ? (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Cargando órdenes compatibles...</p>
              </div>
            ) : ordenesDisponibles.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <AlertCircle className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Sin órdenes compatibles
                </h3>
                <p className="text-gray-600">
                  No se encontraron órdenes de compra que coincidan con los items de este servicio
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Resumen de selección */}
                {ordenesSeleccionadas.size > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-blue-900">
                          {ordenesSeleccionadas.size} orden{ordenesSeleccionadas.size > 1 ? 'es' : ''} seleccionada{ordenesSeleccionadas.size > 1 ? 's' : ''}
                        </h4>
                        <p className="text-xs text-blue-700 mt-1">
                          {Array.from(ordenesSeleccionadas).join(', ')}
                        </p>
                      </div>
                      <button
                        onClick={() => setOrdenesSeleccionadas(new Set())}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Limpiar
                      </button>
                    </div>
                  </div>
                )}

                {ordenesDisponibles.map((orden) => (
                  <div
                    key={orden.id}
                    className={`bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-all ${
                      ordenesSeleccionadas.has(orden.codigo_oc) ? 'border-blue-300 bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-start space-x-3">
                        <div className="flex items-center h-5">
                          <input
                            type="checkbox"
                            checked={ordenesSeleccionadas.has(orden.codigo_oc)}
                            onChange={() => toggleOrdenSeleccionada(orden.codigo_oc)}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                          />
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 mb-1">
                            {orden.codigo_oc}
                          </h4>
                          <p className="text-sm text-gray-600 mb-2">
                            {orden.proveedor}
                          </p>
                          <div className="flex items-center text-sm text-gray-600">
                            <span className="font-medium">
                              {orden.moneda} {orden.monto_vehiculo.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                        ordenesSeleccionadas.has(orden.codigo_oc)
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {ordenesSeleccionadas.has(orden.codigo_oc) ? 'Seleccionada' : 'Disponible'}
                      </span>
                    </div>

                    <div className="border-t pt-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Items de la orden:</p>
                      <p className="text-sm text-gray-600">{orden.items}</p>
                    </div>
                  </div>
                ))}

                {/* Botón de anexar múltiples órdenes */}
                <div className="sticky bottom-4 bg-white border border-gray-200 rounded-lg p-4 shadow-lg">
                  <button
                    onClick={() => anexarOrdenesCompra(servicioSeleccionado.id)}
                    disabled={anexando || ordenesSeleccionadas.size === 0}
                    className="w-full inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {anexando ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Anexando...
                      </>
                    ) : (
                      <>
                        <Link2 className="h-4 w-4 mr-2" />
                        Anexar {ordenesSeleccionadas.size > 0 ? `${ordenesSeleccionadas.size} ` : ''}Orden{ordenesSeleccionadas.size > 1 ? 'es' : ''}
                        {ordenesSeleccionadas.size === 0 && ' (Selecciona primero)'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}