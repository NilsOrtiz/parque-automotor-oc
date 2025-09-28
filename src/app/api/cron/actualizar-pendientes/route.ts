import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('🕒 Ejecutando actualización periódica de pendientes_operaciones desde cron...')

    // Ejecutar directamente la función SQL desde aquí (evitar recursión)
    const { supabase } = await import('@/lib/supabase')

    const { data, error } = await supabase
      .rpc('ejecutar_actualizacion_pendientes')

    if (error) {
      console.error('❌ Cron: Error ejecutando función SQL:', error)
      return NextResponse.json({
        success: false,
        message: 'Error ejecutando función de actualización desde cron',
        error: error.message,
        timestamp: new Date().toISOString(),
        source: 'cron-job'
      }, { status: 500 })
    }

    console.log('✅ Cron: Función SQL ejecutada exitosamente:', data)

    // La función devuelve un JSON con el resultado
    const resultado = data

    if (resultado.success) {
      console.log(`✅ Cron: Actualización exitosa - ${resultado.registros_insertados} registros procesados`)

      return NextResponse.json({
        success: true,
        message: 'Actualización periódica ejecutada exitosamente',
        registros_insertados: resultado.registros_insertados,
        timestamp: resultado.timestamp,
        source: 'cron-job'
      })
    } else {
      console.error('❌ Cron: Error en función SQL:', resultado.message)
      return NextResponse.json({
        success: false,
        message: `Error en actualización periódica: ${resultado.message}`,
        timestamp: resultado.timestamp,
        source: 'cron-job'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ Cron: Error ejecutando actualización periódica:', error)

    return NextResponse.json({
      success: false,
      message: 'Error interno en actualización periódica',
      error: error instanceof Error ? error.message : 'Error desconocido',
      timestamp: new Date().toISOString(),
      source: 'cron-job'
    }, { status: 500 })
  }
}

// Proteger el endpoint para que solo se ejecute desde cron jobs
export async function POST(request: Request) {
  try {
    console.log('🕒 POST request recibido en cron endpoint...')

    // Verificar que venga de un cron job autorizado
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.CRON_SECRET_TOKEN

    if (!expectedToken) {
      console.warn('⚠️ Cron: No se ha configurado CRON_SECRET_TOKEN')
    } else if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
      console.warn('⚠️ Cron: Token de autorización inválido')
      return NextResponse.json({
        success: false,
        message: 'No autorizado'
      }, { status: 401 })
    }

    // Reutilizar la lógica del GET (que ahora ejecuta directamente la función SQL)
    return GET()

  } catch (error) {
    console.error('❌ Cron POST: Error:', error)
    return NextResponse.json({
      success: false,
      message: 'Error interno',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}