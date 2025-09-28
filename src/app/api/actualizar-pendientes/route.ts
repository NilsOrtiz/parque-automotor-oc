import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST() {
  try {
    console.log('🔄 Iniciando actualización automática de pendientes_operaciones...')

    // Ejecutar la función SQL que actualiza los pendientes
    const { data, error } = await supabase
      .rpc('ejecutar_actualizacion_pendientes')

    if (error) {
      console.error('❌ Error ejecutando función SQL:', error)
      return NextResponse.json({
        success: false,
        message: 'Error ejecutando función de actualización',
        error: error.message
      }, { status: 500 })
    }

    console.log('✅ Función SQL ejecutada exitosamente:', data)

    // La función devuelve un JSON con el resultado
    const resultado = data

    if (resultado.success) {
      console.log(`✅ Actualización completada: ${resultado.registros_insertados} registros insertados`)

      return NextResponse.json({
        success: true,
        message: resultado.message,
        registros_insertados: resultado.registros_insertados,
        timestamp: resultado.timestamp
      })
    } else {
      console.error('❌ Error en función SQL:', resultado.message)
      return NextResponse.json({
        success: false,
        message: resultado.message,
        timestamp: resultado.timestamp
      }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ Error general en actualización de pendientes:', error)
    return NextResponse.json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}

// También permitir GET para facilitar testing
export async function GET() {
  try {
    console.log('🔍 Consultando estado actual de pendientes_operaciones...')

    // Obtener estadísticas actuales
    const { data: pendientes, error: errorPendientes } = await supabase
      .from('pendientes_operaciones')
      .select('*')
      .order('fecha_creacion', { ascending: false })

    if (errorPendientes) {
      console.error('❌ Error consultando pendientes:', errorPendientes)
      return NextResponse.json({
        success: false,
        message: 'Error consultando pendientes',
        error: errorPendientes.message
      }, { status: 500 })
    }

    const estadisticas = {
      total: pendientes?.length || 0,
      automaticos: pendientes?.filter(p => p.es_automatico).length || 0,
      manuales: pendientes?.filter(p => !p.es_automatico).length || 0,
      criticos: pendientes?.filter(p => p.criticidad === 'critico').length || 0,
      pendientes: pendientes?.filter(p => p.estado === 'pendiente').length || 0,
      programados: pendientes?.filter(p => p.estado === 'programado').length || 0
    }

    return NextResponse.json({
      success: true,
      message: 'Estadísticas obtenidas exitosamente',
      estadisticas,
      pendientes: pendientes?.slice(0, 10) || [], // Solo los primeros 10 para no sobrecargar
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Error consultando estado de pendientes:', error)
    return NextResponse.json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}