'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { ArrowLeft, Fuel, Car, TrendingUp, DollarSign, BarChart3, Activity } from 'lucide-react'
import { supabase, type Vehiculo, type CargaCombustibleYPF } from '@/lib/supabase'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

interface VehiculoConCombustible extends Vehiculo {
  ultimaCarga?: CargaCombustibleYPF
  totalCargas: number
  consumoPromedio?: number
  costoPorKm?: number
  litrosTotales: number
}

interface DatosGrafica {
  fecha: string
  consumo: number
  odometro: number
  litros: number
  costo: number
}

export default function AnalisisCombustiblePage() {
  const [vehiculos, setVehiculos] = useState<VehiculoConCombustible[]>([])
  const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState<VehiculoConCombustible | null>(null)
  const [cargasCombustible, setCargasCombustible] = useState<CargaCombustibleYPF[]>([])
  const [datosGrafica, setDatosGrafica] = useState<DatosGrafica[]>([])
  const [anomalias, setAnomalias] = useState<Array<{
    id: number
    tipo: 'salto_adelante' | 'salto_atras' | 'digito_extra' | 'digito_faltante'
    valorOriginal: number
    valorSugerido: number
    confianza: number
  }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      setLoading(true)
      
      // Cargar vehículos
      const { data: vehiculosData, error: vehiculosError } = await supabase
        .from('vehiculos')
        .select('*')
        .order('Nro_Interno')

      if (vehiculosError) throw vehiculosError

      // Cargar TODOS los registros con paginación
      let allCargasData: any[] = []
      let page = 0
      const pageSize = 1000
      
      while (true) {
        const { data: pageData, error: cargasError } = await supabase
          .from('cargas_combustible_ypf')
          .select('*')
          .order('fecha_carga', { ascending: true })
          .range(page * pageSize, (page + 1) * pageSize - 1)

        if (cargasError) throw cargasError
        
        if (!pageData || pageData.length === 0) break
        
        allCargasData = [...allCargasData, ...pageData]
        
        if (pageData.length < pageSize) break // Última página
        page++
      }
      
      const cargasData = allCargasData

      // DEBUG: Ver AF949YS específicamente
      const af949ysRecords = cargasData?.filter(r => r.placa === 'AF949YS') || []
      console.log('🔍 DEBUG AF949YS total records in Supabase:', af949ysRecords.length)
      console.log('🔍 DEBUG AF949YS first 3 records:', af949ysRecords.slice(0, 3))
      console.log('🔍 DEBUG AF949YS last 3 records:', af949ysRecords.slice(-3))
      console.log('🔍 DEBUG total records from Supabase:', cargasData?.length || 0)

      // Procesar datos por vehículo
      const vehiculosConCombustible = await Promise.all(
        vehiculosData.map(async (vehiculo) => {
          // Try multiple matching strategies to handle data inconsistencies
          let cargasVehiculo = cargasData.filter(carga => carga.placa === vehiculo.Placa)
          
          // If no exact matches, try case-insensitive
          if (cargasVehiculo.length === 0) {
            cargasVehiculo = cargasData.filter(carga => 
              carga.placa && carga.placa.toLowerCase() === vehiculo.Placa.toLowerCase()
            )
          }
          
          // If still no matches, try trimmed comparison
          if (cargasVehiculo.length === 0) {
            cargasVehiculo = cargasData.filter(carga => 
              carga.placa && carga.placa.trim() === vehiculo.Placa.trim()
            )
          }
          
          // If still no matches, try both case-insensitive and trimmed
          if (cargasVehiculo.length === 0) {
            cargasVehiculo = cargasData.filter(carga => 
              carga.placa && 
              carga.placa.toLowerCase().trim() === vehiculo.Placa.toLowerCase().trim()
            )
          }
          
          let consumoPromedio = undefined
          let costoPorKm = undefined
          
          if (cargasVehiculo.length >= 2) {
            // Calcular consumo promedio entre cargas consecutivas
            let totalConsumo = 0
            let totalCosto = 0
            let contadorCalculos = 0
            
            for (let i = 1; i < cargasVehiculo.length; i++) {
              const cargaActual = cargasVehiculo[i]
              const cargaAnterior = cargasVehiculo[i - 1]
              
              if (cargaActual.odometro && cargaAnterior.odometro) {
                const distancia = Math.abs(cargaActual.odometro - cargaAnterior.odometro)
                if (distancia > 0) {
                  const consumo = distancia / cargaActual.litros_cargados // km/litro
                  
                  // Filtrar valores extremos para promedios más realistas
                  if (consumo > 0 && consumo < 100) {
                    totalConsumo += consumo
                    if (cargaActual.monto_total) {
                      totalCosto += cargaActual.monto_total / distancia
                    }
                    contadorCalculos++
                  }
                }
              }
            }
            
            if (contadorCalculos > 0) {
              consumoPromedio = totalConsumo / contadorCalculos
              costoPorKm = totalCosto / contadorCalculos
            }
          }

          return {
            ...vehiculo,
            ultimaCarga: cargasVehiculo[cargasVehiculo.length - 1],
            totalCargas: cargasVehiculo.length,
            consumoPromedio,
            costoPorKm,
            litrosTotales: cargasVehiculo.reduce((sum, carga) => sum + carga.litros_cargados, 0)
          }
        })
      )

      setVehiculos(vehiculosConCombustible)
      setCargasCombustible(cargasData)
      
      // Seleccionar primer vehículo con datos
      const primerVehiculoConDatos = vehiculosConCombustible.find(v => v.totalCargas > 0)
      if (primerVehiculoConDatos) {
        setVehiculoSeleccionado(primerVehiculoConDatos)
        cargarDatosGrafica(primerVehiculoConDatos.Placa, cargasData)
      }

    } catch (error: any) {
      console.error('Error cargando datos:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  // Función para detectar odómetros anómalos
  const detectarAnomalias = (cargas: CargaCombustibleYPF[]) => {
    const cargasConOdometro = cargas.filter(c => c.odometro && c.odometro > 0)
    if (cargasConOdometro.length < 3) return []

    const anomalias: Array<{
      id: number
      tipo: 'salto_adelante' | 'salto_atras' | 'digito_extra' | 'digito_faltante'
      valorOriginal: number
      valorSugerido: number
      confianza: number
    }> = []

    for (let i = 1; i < cargasConOdometro.length - 1; i++) {
      const anterior = cargasConOdometro[i - 1]
      const actual = cargasConOdometro[i]
      const siguiente = cargasConOdometro[i + 1]

      if (!anterior.odometro || !actual.odometro || !siguiente.odometro) continue

      // Calcular incrementos esperados
      const incrementoAnterior = Math.abs(actual.odometro - anterior.odometro)
      const incrementoSiguiente = Math.abs(siguiente.odometro - actual.odometro)
      const incrementoPromedio = (incrementoAnterior + incrementoSiguiente) / 2

      // Detectar dígito extra (866941 en lugar de 86694)
      if (incrementoAnterior > incrementoPromedio * 10) {
        const valorSinDigitoExtra = Math.floor(actual.odometro / 10)
        if (valorSinDigitoExtra > anterior.odometro && valorSinDigitoExtra < siguiente.odometro) {
          anomalias.push({
            id: actual.id,
            tipo: 'digito_extra',
            valorOriginal: actual.odometro,
            valorSugerido: valorSinDigitoExtra,
            confianza: 0.9
          })
        }
      }

      // Detectar dígito faltante
      if (incrementoAnterior < incrementoPromedio / 10 && incrementoAnterior > 0) {
        const valorConDigitoExtra = actual.odometro * 10
        if (valorConDigitoExtra > anterior.odometro && valorConDigitoExtra < siguiente.odometro * 2) {
          anomalias.push({
            id: actual.id,
            tipo: 'digito_faltante',
            valorOriginal: actual.odometro,
            valorSugerido: valorConDigitoExtra,
            confianza: 0.8
          })
        }
      }

      // Detectar saltos grandes hacia atrás (63840 después de 87798)
      if (actual.odometro < anterior.odometro * 0.8) {
        // Predecir valor basado en tendencia
        const diasEntreFechas = (new Date(actual.fecha_carga).getTime() - new Date(anterior.fecha_carga).getTime()) / (1000 * 60 * 60 * 24)
        const kmPorDiaPromedio = incrementoAnterior / Math.max(1, diasEntreFechas)
        const valorSugerido = Math.round(anterior.odometro + (kmPorDiaPromedio * diasEntreFechas))

        anomalias.push({
          id: actual.id,
          tipo: 'salto_atras',
          valorOriginal: actual.odometro,
          valorSugerido: valorSugerido,
          confianza: 0.7
        })
      }
    }

    return anomalias
  }

  const cargarDatosGrafica = (placa: string, todasLasCargas: CargaCombustibleYPF[]) => {
    // Use the same robust matching logic as in the main data processing
    let cargasVehiculo = todasLasCargas.filter(carga => carga.placa === placa)
    
    // If no exact matches, try case-insensitive
    if (cargasVehiculo.length === 0) {
      cargasVehiculo = todasLasCargas.filter(carga => 
        carga.placa && carga.placa.toLowerCase() === placa.toLowerCase()
      )
    }
    
    // If still no matches, try trimmed comparison
    if (cargasVehiculo.length === 0) {
      cargasVehiculo = todasLasCargas.filter(carga => 
        carga.placa && carga.placa.trim() === placa.trim()
      )
    }
    
    // If still no matches, try both case-insensitive and trimmed
    if (cargasVehiculo.length === 0) {
      cargasVehiculo = todasLasCargas.filter(carga => 
        carga.placa && 
        carga.placa.toLowerCase().trim() === placa.toLowerCase().trim()
      )
    }
    
    cargasVehiculo = cargasVehiculo
      .sort((a, b) => new Date(a.fecha_carga).getTime() - new Date(b.fecha_carga).getTime())

    const datos: DatosGrafica[] = []

    // Calcular consumo para cada carga consecutiva
    for (let i = 1; i < cargasVehiculo.length; i++) {
      const cargaActual = cargasVehiculo[i]
      const cargaAnterior = cargasVehiculo[i - 1]

      if (cargaActual.odometro && cargaAnterior.odometro) {
        const distancia = Math.abs(cargaActual.odometro - cargaAnterior.odometro)
        if (distancia > 0) {
          const consumo = distancia / cargaActual.litros_cargados // km/litro
          
          // Incluir todos los datos, incluso valores extremos para análisis completo
          datos.push({
            fecha: cargaActual.fecha_carga,
            consumo,
            odometro: cargaActual.odometro,
            litros: cargaActual.litros_cargados,
            costo: cargaActual.monto_total || 0
          })
        }
      }
    }

    setDatosGrafica(datos)
  }

  const seleccionarVehiculo = (vehiculo: VehiculoConCombustible) => {
    setVehiculoSeleccionado(vehiculo)
    cargarDatosGrafica(vehiculo.Placa, cargasCombustible)
    
    // Detectar anomalías para este vehículo
    const cargasVehiculo = cargasCombustible.filter(carga => carga.placa === vehiculo.Placa)
    const anomaliasDetectadas = detectarAnomalias(cargasVehiculo.sort((a, b) => new Date(a.fecha_carga).getTime() - new Date(b.fecha_carga).getTime()))
    setAnomalias(anomaliasDetectadas)
    
    if (anomaliasDetectadas.length > 0) {
      console.log(`🚨 Detectadas ${anomaliasDetectadas.length} anomalías en ${vehiculo.Placa}:`, anomaliasDetectadas)
    }
  }

  const chartData = {
    labels: datosGrafica.map(d => new Date(d.fecha).toLocaleDateString()),
    datasets: [
      {
        label: 'Consumo (km/litro)',
        data: datosGrafica.map(d => d.consumo),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.1,
        pointRadius: 4,
        pointHoverRadius: 6
      }
    ]
  }

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `Eficiencia de Combustible - ${vehiculoSeleccionado?.Marca} ${vehiculoSeleccionado?.Modelo} (${vehiculoSeleccionado?.Placa})`
      },
      tooltip: {
        callbacks: {
          afterLabel: (context) => {
            const punto = datosGrafica[context.dataIndex]
            return [
              `Odómetro: ${punto.odometro?.toLocaleString()} km`,
              `Litros cargados: ${punto.litros} L`,
              `Costo: $${punto.costo?.toLocaleString()}`
            ]
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        title: {
          display: true,
          text: 'Consumo (km/litro)'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Fecha de carga'
        }
      }
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-8"></div>
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-4 space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="col-span-8">
              <div className="h-96 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-red-800 font-semibold mb-2">Error cargando datos</h2>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/vehiculos" 
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Vehículos
          </Link>
          <div className="flex items-center gap-3">
            <Fuel className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Análisis de Combustible</h1>
              <p className="text-gray-600">Consumo y eficiencia por vehículo</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Lista de vehículos */}
          <div className="col-span-4">
            <div className="bg-white rounded-lg shadow-md">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <Car className="h-5 w-5" />
                  Vehículos ({vehiculos.length})
                </h2>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {vehiculos.map((vehiculo) => (
                  <div
                    key={vehiculo.id}
                    onClick={() => seleccionarVehiculo(vehiculo)}
                    className={`p-4 border-b border-gray-100 cursor-pointer transition-colors ${
                      vehiculoSeleccionado?.id === vehiculo.id
                        ? 'bg-blue-50 border-l-4 border-l-blue-500'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {vehiculo.Marca} {vehiculo.Modelo}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {vehiculo.Placa} • #{vehiculo.Nro_Interno}
                        </p>
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center gap-2 text-xs">
                            <Activity className="h-3 w-3 text-green-600" />
                            <span className="text-gray-600">
                              {vehiculo.totalCargas} cargas • {vehiculo.litrosTotales.toFixed(0)}L total
                            </span>
                          </div>
                          {vehiculo.consumoPromedio && (
                            <div className="flex items-center gap-2 text-xs">
                              <TrendingUp className="h-3 w-3 text-blue-600" />
                              <span className="text-gray-600">
                                {vehiculo.consumoPromedio.toFixed(1)} km/L promedio
                              </span>
                            </div>
                          )}
                          {vehiculo.costoPorKm && (
                            <div className="flex items-center gap-2 text-xs">
                              <DollarSign className="h-3 w-3 text-orange-600" />
                              <span className="text-gray-600">
                                ${vehiculo.costoPorKm.toFixed(2)}/km
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        {vehiculo.ultimaCarga ? (
                          <div className="text-xs text-gray-500">
                            Última: {new Date(vehiculo.ultimaCarga.fecha_carga).toLocaleDateString()}
                          </div>
                        ) : (
                          <div className="text-xs text-gray-400">Sin datos</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Gráfica y detalles */}
          <div className="col-span-8">
            {vehiculoSeleccionado ? (
              <div className="space-y-6">
                {/* Métricas resumidas */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Cargas</p>
                        <p className="text-2xl font-bold text-gray-900">{vehiculoSeleccionado.totalCargas}</p>
                      </div>
                      <Activity className="h-8 w-8 text-green-600" />
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Litros Totales</p>
                        <p className="text-2xl font-bold text-gray-900">{vehiculoSeleccionado.litrosTotales.toFixed(0)}L</p>
                      </div>
                      <Fuel className="h-8 w-8 text-blue-600" />
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Consumo Promedio</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {vehiculoSeleccionado.consumoPromedio?.toFixed(1) || 'N/A'} km/L
                        </p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-purple-600" />
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Costo por km</p>
                        <p className="text-2xl font-bold text-gray-900">
                          ${vehiculoSeleccionado.costoPorKm?.toFixed(2) || 'N/A'}
                        </p>
                      </div>
                      <DollarSign className="h-8 w-8 text-orange-600" />
                    </div>
                  </div>
                </div>

                {/* Gráfica */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="h-96">
                    {datosGrafica.length > 0 ? (
                      <Line data={chartData} options={chartOptions} />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500">No hay suficientes datos para mostrar la gráfica</p>
                          <p className="text-sm text-gray-400 mt-2">
                            Se necesitan al menos 2 cargas con odómetro para calcular el consumo
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Resumen de anomalías */}
                {anomalias.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-red-500">⚠️</span>
                      <h4 className="text-red-800 font-semibold">
                        {anomalias.length} Anomalía{anomalias.length > 1 ? 's' : ''} Detectada{anomalias.length > 1 ? 's' : ''}
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-red-700">
                      {anomalias.map((anomalia, i) => (
                        <div key={i} className="flex justify-between">
                          <span>
                            {anomalia.tipo === 'digito_extra' && '📊 Dígito extra'}
                            {anomalia.tipo === 'digito_faltante' && '🔢 Dígito faltante'}
                            {anomalia.tipo === 'salto_atras' && '⬅️ Retroceso'}
                            {anomalia.tipo === 'salto_adelante' && '➡️ Salto adelante'}
                          </span>
                          <span className="font-mono">
                            {anomalia.valorOriginal.toLocaleString()} → {anomalia.valorSugerido.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tabla de cargas recientes */}
                <div className="bg-white rounded-lg shadow-md">
                  <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Todas las Cargas ({cargasCombustible.filter(c => c.placa === vehiculoSeleccionado.Placa).length})
                      {anomalias.length > 0 && (
                        <span className="ml-2 text-red-500 text-sm">
                          • {anomalias.length} con anomalías
                        </span>
                      )}
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Fecha
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Odómetro
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Litros
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tipo
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Monto
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Consumo
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {(() => {
                          const cargasOrdenadas = cargasCombustible
                            .filter(carga => carga.placa === vehiculoSeleccionado.Placa)
                            .sort((a, b) => new Date(a.fecha_carga).getTime() - new Date(b.fecha_carga).getTime())
                          
                          return cargasOrdenadas
                            .sort((a, b) => new Date(b.fecha_carga).getTime() - new Date(a.fecha_carga).getTime())
                            .map((carga, index) => {
                              // Encontrar la carga anterior para calcular consumo
                              const indexOriginal = cargasOrdenadas.findIndex(c => c.id === carga.id)
                              const cargaAnterior = indexOriginal > 0 ? cargasOrdenadas[indexOriginal - 1] : null
                              
                              // Buscar si esta carga tiene anomalías
                              const anomalia = anomalias.find(a => a.id === carga.id)
                              
                              let consumo = 'N/A'
                              if (cargaAnterior && carga.odometro && cargaAnterior.odometro) {
                                const distancia = Math.abs(carga.odometro - cargaAnterior.odometro)
                                if (distancia > 0) {
                                  const kmPorLitro = distancia / carga.litros_cargados
                                  consumo = `${kmPorLitro.toFixed(1)} km/L`
                                }
                              }
                              
                              const esAnomalo = !!anomalia
                              const tipoAnomalia = anomalia?.tipo || ''
                              
                              return (
                                <tr key={carga.id} className={`hover:bg-gray-50 ${esAnomalo ? 'bg-red-50 border-l-4 border-l-red-500' : ''}`}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {new Date(carga.fecha_carga).toLocaleDateString()}
                                    {esAnomalo && <span className="ml-2 text-red-500">⚠️</span>}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <div className={esAnomalo ? 'text-red-600 font-medium' : 'text-gray-900'}>
                                      {carga.odometro?.toLocaleString() || 'N/A'} km
                                      {anomalia && (
                                        <div className="text-xs text-red-500 mt-1">
                                          💡 Sugerido: {anomalia.valorSugerido.toLocaleString()} km
                                          <br />
                                          <span className="text-red-400">
                                            {tipoAnomalia === 'digito_extra' && '(Dígito extra)'}
                                            {tipoAnomalia === 'digito_faltante' && '(Dígito faltante)'}
                                            {tipoAnomalia === 'salto_atras' && '(Retroceso)'}
                                            {tipoAnomalia === 'salto_adelante' && '(Salto adelante)'}
                                            {` - ${Math.round(anomalia.confianza * 100)}% confianza`}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {carga.litros_cargados} L
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {carga.tipo_combustible || 'N/A'}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    ${carga.monto_total?.toLocaleString() || 'N/A'}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                                    {consumo}
                                  </td>
                                </tr>
                              )
                            })
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-12">
                <div className="text-center">
                  <Fuel className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Selecciona un vehículo para ver su análisis de combustible</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}