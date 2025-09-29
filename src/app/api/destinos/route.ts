import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET - Obtener todos los destinos activos
export async function GET() {
  try {
    console.log('📋 Obteniendo destinos activos...')

    const { data, error } = await supabase
      .rpc('obtener_destinos_activos')

    if (error) {
      console.error('❌ Error obteniendo destinos:', error)
      return NextResponse.json({
        success: false,
        message: 'Error obteniendo destinos',
        error: error.message
      }, { status: 500 })
    }

    console.log('✅ Destinos obtenidos:', data)

    return NextResponse.json({
      success: true,
      message: 'Destinos obtenidos exitosamente',
      destinos: data || [],
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Error general obteniendo destinos:', error)
    return NextResponse.json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}

// POST - Crear nuevo destino
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('➕ Creando nuevo destino:', body)

    const {
      nombre,
      icono = '🔧',
      descripcion,
      orden = 1
    } = body

    // Validar datos requeridos
    if (!nombre || nombre.trim() === '') {
      return NextResponse.json({
        success: false,
        message: 'El nombre del destino es requerido'
      }, { status: 400 })
    }

    // Crear destino
    const { data, error } = await supabase
      .rpc('gestionar_destino', {
        p_accion: 'crear',
        p_nombre: nombre.trim(),
        p_icono: icono,
        p_descripcion: descripcion?.trim() || null,
        p_orden: parseInt(orden) || 1
      })

    if (error) {
      console.error('❌ Error creando destino:', error)
      return NextResponse.json({
        success: false,
        message: 'Error creando destino',
        error: error.message
      }, { status: 500 })
    }

    console.log('✅ Destino creado:', data)

    if (data.success) {
      return NextResponse.json({
        success: true,
        message: data.message,
        destino: data,
        timestamp: new Date().toISOString()
      })
    } else {
      return NextResponse.json({
        success: false,
        message: data.message
      }, { status: 400 })
    }

  } catch (error) {
    console.error('❌ Error general creando destino:', error)
    return NextResponse.json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}

// PUT - Actualizar destino existente
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('📝 Actualizando destino:', body)

    const {
      id,
      nombre,
      icono,
      descripcion,
      orden,
      accion = 'actualizar' // 'actualizar', 'activar', 'desactivar'
    } = body

    // Validar ID
    if (!id) {
      return NextResponse.json({
        success: false,
        message: 'El ID del destino es requerido'
      }, { status: 400 })
    }

    // Ejecutar acción
    const { data, error } = await supabase
      .rpc('gestionar_destino', {
        p_accion: accion,
        p_id: parseInt(id),
        p_nombre: nombre?.trim() || null,
        p_icono: icono || null,
        p_descripcion: descripcion?.trim() || null,
        p_orden: orden ? parseInt(orden) : null
      })

    if (error) {
      console.error('❌ Error actualizando destino:', error)
      return NextResponse.json({
        success: false,
        message: 'Error actualizando destino',
        error: error.message
      }, { status: 500 })
    }

    console.log('✅ Destino actualizado:', data)

    if (data.success) {
      return NextResponse.json({
        success: true,
        message: data.message,
        destino: data,
        timestamp: new Date().toISOString()
      })
    } else {
      return NextResponse.json({
        success: false,
        message: data.message
      }, { status: 400 })
    }

  } catch (error) {
    console.error('❌ Error general actualizando destino:', error)
    return NextResponse.json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}

// DELETE - Eliminar destino
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    console.log('🗑️ Eliminando destino:', id)

    if (!id) {
      return NextResponse.json({
        success: false,
        message: 'El ID del destino es requerido'
      }, { status: 400 })
    }

    // Eliminar destino
    const { data, error } = await supabase
      .rpc('gestionar_destino', {
        p_accion: 'eliminar',
        p_id: parseInt(id)
      })

    if (error) {
      console.error('❌ Error eliminando destino:', error)
      return NextResponse.json({
        success: false,
        message: 'Error eliminando destino',
        error: error.message
      }, { status: 500 })
    }

    console.log('✅ Destino eliminado:', data)

    if (data.success) {
      return NextResponse.json({
        success: true,
        message: data.message,
        timestamp: new Date().toISOString()
      })
    } else {
      return NextResponse.json({
        success: false,
        message: data.message
      }, { status: 400 })
    }

  } catch (error) {
    console.error('❌ Error general eliminando destino:', error)
    return NextResponse.json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}