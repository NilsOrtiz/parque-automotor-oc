import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('🕒 Ejecutando actualización periódica de pendientes_operaciones...')

    // Llamar a nuestro endpoint de actualización
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

    const response = await fetch(`${baseUrl}/api/actualizar-pendientes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'CronJob/1.0'
      }
    })

    const result = await response.json()

    if (result.success) {
      console.log(`✅ Cron: Actualización exitosa - ${result.registros_insertados} registros procesados`)

      return NextResponse.json({
        success: true,
        message: 'Actualización periódica ejecutada exitosamente',
        registros_insertados: result.registros_insertados,
        timestamp: new Date().toISOString(),
        source: 'cron-job'
      })
    } else {
      console.error('❌ Cron: Error en actualización:', result.message)

      return NextResponse.json({
        success: false,
        message: `Error en actualización periódica: ${result.message}`,
        timestamp: new Date().toISOString(),
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

    // Reutilizar la lógica del GET
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