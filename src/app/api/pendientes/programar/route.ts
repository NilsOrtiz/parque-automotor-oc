import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// POST - Programar pendiente en fecha y turno específico
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('📅 Programando pendiente:', body)

    const {
      pendiente_id,
      fecha_programada,
      turno_programado,
      programado_por = 'Operaciones',
      notas_programacion
    } = body

    // Validar datos requeridos
    if (!pendiente_id || !fecha_programada || !turno_programado) {
      return NextResponse.json({
        success: false,
        message: 'El ID del pendiente, fecha y turno son requeridos'
      }, { status: 400 })
    }

    // Validar turno
    if (!['mañana', 'tarde'].includes(turno_programado)) {
      return NextResponse.json({
        success: false,
        message: 'El turno debe ser "mañana" o "tarde"'
      }, { status: 400 })
    }

    // Actualizar el pendiente con información de programación
    const { data, error } = await supabase
      .from('pendientes_operaciones')
      .update({
        estado: 'programado',
        fecha_programada: fecha_programada,
        turno_programado: turno_programado,
        programado_por: programado_por,
        fecha_programacion: new Date().toISOString(),
        notas_programacion: notas_programacion || null,
        fecha_actualizacion: new Date().toISOString()
      })
      .eq('id', pendiente_id)
      .select('*')
      .single()

    if (error) {
      console.error('❌ Error programando pendiente:', error)
      return NextResponse.json({
        success: false,
        message: 'Error programando pendiente',
        error: error.message
      }, { status: 500 })
    }

    console.log('✅ Pendiente programado exitosamente:', data)

    return NextResponse.json({
      success: true,
      message: `Pendiente programado para ${fecha_programada} en turno ${turno_programado}`,
      pendiente: data,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Error general programando pendiente:', error)
    return NextResponse.json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}

// DELETE - Desprogramar pendiente (quitar programación)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const pendiente_id = searchParams.get('id')

    console.log('🗑️ Desprogramando pendiente:', pendiente_id)

    if (!pendiente_id) {
      return NextResponse.json({
        success: false,
        message: 'El ID del pendiente es requerido'
      }, { status: 400 })
    }

    // Desprogramar (quitar fechas pero mantener el pendiente)
    const { data, error } = await supabase
      .from('pendientes_operaciones')
      .update({
        estado: 'pendiente',
        fecha_programada: null,
        turno_programado: null,
        programado_por: null,
        fecha_programacion: null,
        notas_programacion: null,
        fecha_actualizacion: new Date().toISOString()
      })
      .eq('id', parseInt(pendiente_id))
      .select('*')
      .single()

    if (error) {
      console.error('❌ Error desprogramando pendiente:', error)
      return NextResponse.json({
        success: false,
        message: 'Error desprogramando pendiente',
        error: error.message
      }, { status: 500 })
    }

    console.log('✅ Pendiente desprogramado exitosamente:', data)

    return NextResponse.json({
      success: true,
      message: 'Pendiente desprogramado exitosamente',
      pendiente: data,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Error general desprogramando pendiente:', error)
    return NextResponse.json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}