import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('🔄 Migrando pendiente(s) a operaciones:', body)

    const {
      id_pendiente,
      ids_pendientes,
      trasladar_a = 'Taller',
      tipo = 'individual', // 'individual' o 'masivo'
      tiempo_estimado_custom // Nuevo: tiempo personalizado
    } = body

    // Validar parámetros
    if (tipo === 'individual' && !id_pendiente) {
      return NextResponse.json({
        success: false,
        message: 'Se requiere id_pendiente para migración individual'
      }, { status: 400 })
    }

    if (tipo === 'masivo' && (!ids_pendientes || !Array.isArray(ids_pendientes))) {
      return NextResponse.json({
        success: false,
        message: 'Se requiere array de ids_pendientes para migración masiva'
      }, { status: 400 })
    }

    // Validar destino
    const destinosValidos = ['Taller', 'IDISA', 'Taller Externo']
    if (!destinosValidos.includes(trasladar_a)) {
      return NextResponse.json({
        success: false,
        message: `Destino inválido. Debe ser uno de: ${destinosValidos.join(', ')}`
      }, { status: 400 })
    }

    let resultado

    if (tipo === 'individual') {
      // Migración individual
      console.log(`🔄 Ejecutando migración individual: pendiente ${id_pendiente} → ${trasladar_a}`)

      const { data, error } = await supabase
        .rpc('migrar_pendiente_a_operaciones', {
          p_id_pendiente: id_pendiente,
          p_trasladar_a: trasladar_a,
          p_tiempo_estimado_custom: tiempo_estimado_custom || null
        })

      if (error) {
        console.error('❌ Error en migración individual:', error)
        return NextResponse.json({
          success: false,
          message: 'Error ejecutando migración',
          error: error.message,
          id_pendiente
        }, { status: 500 })
      }

      resultado = data

    } else if (tipo === 'masivo') {
      // Migración masiva
      console.log(`🔄 Ejecutando migración masiva: ${ids_pendientes.length} pendientes → ${trasladar_a}`)

      const { data, error } = await supabase
        .rpc('migrar_pendientes_masivos', {
          p_ids_pendientes: ids_pendientes,
          p_trasladar_a: trasladar_a
        })

      if (error) {
        console.error('❌ Error en migración masiva:', error)
        return NextResponse.json({
          success: false,
          message: 'Error ejecutando migración masiva',
          error: error.message,
          ids_pendientes
        }, { status: 500 })
      }

      resultado = data
    }

    console.log('✅ Migración completada:', resultado)

    // Si la migración fue exitosa, devolver resultado
    if (resultado.success) {
      return NextResponse.json({
        success: true,
        message: resultado.message,
        resultado,
        trasladar_a,
        timestamp: new Date().toISOString()
      })
    } else {
      // Si la función SQL reportó error
      return NextResponse.json({
        success: false,
        message: resultado.message,
        resultado
      }, { status: 400 })
    }

  } catch (error) {
    console.error('❌ Error general en migración de pendientes:', error)
    return NextResponse.json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}

// GET para obtener estadísticas de coordinación
export async function GET() {
  try {
    console.log('📊 Obteniendo estadísticas de coordinación...')

    const { data, error } = await supabase
      .rpc('estadisticas_coordinacion_pendientes')

    if (error) {
      console.error('❌ Error obteniendo estadísticas:', error)
      return NextResponse.json({
        success: false,
        message: 'Error obteniendo estadísticas',
        error: error.message
      }, { status: 500 })
    }

    console.log('✅ Estadísticas obtenidas:', data)

    return NextResponse.json({
      success: true,
      message: 'Estadísticas obtenidas exitosamente',
      estadisticas: data,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Error general obteniendo estadísticas:', error)
    return NextResponse.json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}