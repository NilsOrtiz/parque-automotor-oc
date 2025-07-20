'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function TestConnectionPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function testConnection() {
    setLoading(true)
    setError('')
    setResult(null)

    try {
      console.log('Probando conexión a Supabase...')
      console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
      
      // Probar conexión básica
      const { data, error } = await supabase
        .from('vehiculos')
        .select('count', { count: 'exact' })

      if (error) {
        console.error('Error de Supabase:', error)
        setError(`Error: ${error.message}`)
      } else {
        console.log('Conexión exitosa:', data)
        setResult(data)
      }
    } catch (err) {
      console.error('Error general:', err)
      setError(`Error general: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  async function testTablesAccess() {
    setLoading(true)
    setError('')
    setResult(null)

    const tables = ['vehiculos', 'ordenes_de_compra', 'historial', 'pendientes_observaciones']
    const results: any = {}

    try {
      for (const table of tables) {
        console.log(`Probando acceso a tabla: ${table}`)
        const { data, error, count } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })

        if (error) {
          console.error(`Error en tabla ${table}:`, error)
          results[table] = { error: error.message }
        } else {
          console.log(`Tabla ${table} - Registros:`, count)
          results[table] = { count, success: true }
        }
      }
      setResult(results)
    } catch (err) {
      console.error('Error general:', err)
      setError(`Error general: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Test de Conexión Supabase</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Configuración</h2>
          <div className="space-y-2 text-sm">
            <p><strong>URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL}</p>
            <p><strong>Key:</strong> {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 50)}...</p>
          </div>
        </div>

        <div className="space-y-4">
          <button
            onClick={testConnection}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg mr-4"
          >
            {loading ? 'Probando...' : 'Probar Conexión Básica'}
          </button>
          
          <button
            onClick={testTablesAccess}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-6 py-2 rounded-lg"
          >
            {loading ? 'Probando...' : 'Probar Acceso a Todas las Tablas'}
          </button>
        </div>

        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <strong>Error:</strong> {error}
          </div>
        )}

        {result && (
          <div className="mt-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            <strong>Resultado:</strong>
            <pre className="mt-2 text-sm">{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}

        <div className="mt-8">
          <a href="/vehiculos" className="text-blue-600 hover:text-blue-800">
            ← Volver a Vehículos
          </a>
        </div>
      </div>
    </div>
  )
}