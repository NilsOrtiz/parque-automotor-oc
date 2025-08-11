'use client'

import { useState, useEffect } from 'react'
import { supabase, type Vehiculo, type CargaCombustibleYPF } from '@/lib/supabase'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function DebugAF949YSPage() {
  const [results, setResults] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    debugVehicle()
  }, [])

  const debugVehicle = async () => {
    try {
      setLoading(true)
      const debugResults: any = {}

      // 1. Check vehiculos table for AF949YS
      debugResults.step1 = "Checking vehiculos table for AF949YS..."
      const { data: vehiculos, error: vehiculosError } = await supabase
        .from('vehiculos')
        .select('*')
        .or('placa.ilike.%AF949YS%,placa.ilike.%af949ys%')

      if (vehiculosError) {
        debugResults.step1_error = vehiculosError.message
      } else {
        debugResults.step1_result = {
          count: vehiculos.length,
          vehicles: vehiculos.map(v => ({
            id: v.id,
            placa: v.Placa,
            placaLength: v.Placa.length,
            placaChars: v.Placa.split(''),
            marca: v.Marca,
            modelo: v.Modelo,
            nroInterno: v.Nro_Interno
          }))
        }
      }

      // 2. Check cargas_combustible_ypf table
      debugResults.step2 = "Checking cargas_combustible_ypf table for AF949YS..."
      const { data: cargas, error: cargasError } = await supabase
        .from('cargas_combustible_ypf')
        .select('*')
        .or('placa.ilike.%AF949YS%,placa.ilike.%af949ys%')

      if (cargasError) {
        debugResults.step2_error = cargasError.message
      } else {
        debugResults.step2_result = {
          count: cargas.length,
          charges: cargas.slice(0, 10).map(c => ({
            id: c.id,
            placa: c.placa,
            placaLength: c.placa.length,
            placaChars: c.placa.split(''),
            fecha_carga: c.fecha_carga,
            litros_cargados: c.litros_cargados
          })),
          uniquePlacas: [...new Set(cargas.map(c => c.placa))]
        }
      }

      // 3. Test exact matching logic from analysis page
      debugResults.step3 = "Testing exact matching logic..."
      
      if (vehiculos && vehiculos.length > 0 && cargas && cargas.length > 0) {
        const testResults: any[] = []
        
        vehiculos.forEach(vehiculo => {
          // Apply the same filter as line 81 in the analysis page
          const cargasVehiculo = cargas.filter(carga => carga.placa === vehiculo.Placa)
          
          testResults.push({
            vehiculoPlaca: vehiculo.Placa,
            vehiculoId: vehiculo.id,
            matchingCharges: cargasVehiculo.length,
            sampleCharges: cargasVehiculo.slice(0, 3).map(c => ({
              id: c.id,
              placa: c.placa,
              fecha: c.fecha_carga,
              litros: c.litros_cargados
            }))
          })
        })
        
        debugResults.step3_result = testResults
      }

      // 4. Check for case sensitivity issues
      debugResults.step4 = "Checking for case sensitivity issues..."
      if (cargas && cargas.length > 0) {
        const placaVariations = [...new Set(cargas.map(c => c.placa))]
        debugResults.step4_result = {
          allPlacaVariations: placaVariations,
          caseComparison: placaVariations.map(placa => ({
            original: placa,
            lowercase: placa.toLowerCase(),
            uppercase: placa.toUpperCase(),
            matchesAF949YS: placa.toLowerCase() === 'af949ys'
          }))
        }
      }

      // 5. Check for whitespace issues
      debugResults.step5 = "Checking for whitespace issues..."
      if (vehiculos && vehiculos.length > 0) {
        debugResults.step5_result = vehiculos.map(v => ({
          id: v.id,
          placa: v.Placa,
          placaTrimmed: v.Placa.trim(),
          placaLength: v.Placa.length,
          placaTrimmedLength: v.Placa.trim().length,
          hasWhitespace: v.Placa !== v.Placa.trim(),
          placaBytes: Array.from(v.Placa).map(char => char.charCodeAt(0))
        }))
      }

      setResults(debugResults)
    } catch (error: any) {
      console.error('Debug error:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-8"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-red-800 font-semibold mb-2">Error</h2>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link 
            href="/vehiculos/analisis-combustible" 
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Analysis
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Debug AF949YS Vehicle</h1>
          <p className="text-gray-600">Investigating data matching issues</p>
        </div>

        <div className="space-y-6">
          {Object.entries(results).map(([key, value], index) => (
            <div key={key} className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Step {index + 1}: {typeof value === 'string' && value.startsWith('Checking') ? value : key}
              </h2>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                  {JSON.stringify(value, null, 2)}
                </pre>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-yellow-800 font-semibold mb-2">Analysis Summary</h3>
          <p className="text-yellow-700">
            This debug page helps identify issues with vehicle AF949YS data matching between 
            the vehiculos and cargas_combustible_ypf tables. Common issues include:
          </p>
          <ul className="list-disc list-inside text-yellow-700 mt-2 space-y-1">
            <li>Case sensitivity differences (AF949YS vs af949ys)</li>
            <li>Extra whitespace or invisible characters</li>
            <li>Different character encodings</li>
            <li>Missing records in one of the tables</li>
          </ul>
        </div>
      </div>
    </div>
  )
}