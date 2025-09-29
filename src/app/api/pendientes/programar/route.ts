import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Franjas horarias disponibles
const FRANJAS_HORARIAS = [
  { inicio: '08:00', fin: '10:00', label: 'Inicio mañana' },
  { inicio: '10:00', fin: '12:00', label: 'Mitad mañana' },
  { inicio: '12:00', fin: '14:00', label: 'Final mañana' },
  { inicio: '14:00', fin: '16:00', label: 'Inicio tarde' },
  { inicio: '16:00', fin: '18:00', label: 'Mitad tarde' },
  { inicio: '18:00', fin: '20:00', label: 'Final tarde' }
]

// Función para calcular duración en franjas según tiempo estimado
function calcularDuracionFranjas(tiempoEstimado: string): number {
  if (!tiempoEstimado) return 3 // Por defecto 6 horas

  const tiempo = tiempoEstimado.toLowerCase()

  if (tiempo.includes('30 minutos') || tiempo.includes('1 hora')) return 1
  if (tiempo.includes('2 horas')) return 1
  if (tiempo.includes('3 horas') || tiempo.includes('4 horas')) return 2
  if (tiempo.includes('5 horas') || tiempo.includes('6 horas')) return 3
  if (tiempo.includes('7 horas') || tiempo.includes('8 horas')) return 4
  if (tiempo.includes('día') || tiempo.includes('1 día')) return 6
  if (tiempo === 'indeterminado') return 6

  return 3 // Por defecto 6 horas = 3 franjas
}

// Función para calcular fecha de finalización
function calcularFechaFin(fechaInicio: string, franjaInicio: string, duracionFranjas: number): string {
  const fecha = new Date(fechaInicio)
  const franjaInicioNum = FRANJAS_HORARIAS.findIndex(f => f.inicio === franjaInicio)
  const franjasRestantesDelDia = 6 - franjaInicioNum

  if (duracionFranjas <= franjasRestantesDelDia) {
    // Termina el mismo día
    return fechaInicio
  } else {
    // Calcular días adicionales
    const franjasRestantes = duracionFranjas - franjasRestantesDelDia
    const diasAdicionales = Math.ceil(franjasRestantes / 6)
    fecha.setDate(fecha.getDate() + diasAdicionales)
    return fecha.toISOString().split('T')[0]
  }
}

// POST - Programar pendiente en fecha y franja horaria específica
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('📅 Programando pendiente:', body)

    const {
      pendiente_id,
      fecha_programada,
      franja_horaria_inicio,
      turno_programado, // Mantener compatibilidad con versión anterior
      programado_por = 'Operaciones',
      notas_programacion
    } = body

    // Validar datos requeridos
    if (!pendiente_id || !fecha_programada) {
      return NextResponse.json({
        success: false,
        message: 'El ID del pendiente y fecha son requeridos'
      }, { status: 400 })
    }

    // Convertir turno legacy a franja horaria si es necesario
    let franjaInicio = franja_horaria_inicio
    if (!franjaInicio && turno_programado) {
      franjaInicio = turno_programado === 'mañana' ? '08:00' : '14:00'
    }

    // Validar franja horaria
    if (!franjaInicio || !FRANJAS_HORARIAS.some(f => f.inicio === franjaInicio)) {
      return NextResponse.json({
        success: false,
        message: 'La franja horaria debe ser una de: ' + FRANJAS_HORARIAS.map(f => f.inicio).join(', ')
      }, { status: 400 })
    }

    // Obtener información del pendiente para calcular duración
    const { data: pendienteData, error: pendienteError } = await supabase
      .from('pendientes_operaciones')
      .select('tiempo_estimado')
      .eq('id', pendiente_id)
      .single()

    if (pendienteError) {
      return NextResponse.json({
        success: false,
        message: 'Pendiente no encontrado',
        error: pendienteError.message
      }, { status: 404 })
    }

    // Calcular duración y fecha de finalización
    const duracionFranjas = calcularDuracionFranjas(pendienteData.tiempo_estimado || '')
    const franjaFin = FRANJAS_HORARIAS.find(f => f.inicio === franjaInicio)?.fin || '20:00'
    const fechaFinEstimada = calcularFechaFin(fecha_programada, franjaInicio, duracionFranjas)
    const esTrabajoContinuo = pendienteData.tiempo_estimado === 'Indeterminado'

    // Actualizar el pendiente con información de programación mejorada
    const { data, error } = await supabase
      .from('pendientes_operaciones')
      .update({
        estado: 'programado',
        fecha_programada: fecha_programada,
        turno_programado: turno_programado, // Mantener compatibilidad
        franja_horaria_inicio: franjaInicio,
        franja_horaria_fin: franjaFin,
        duracion_franjas: duracionFranjas,
        fecha_fin_estimada: fechaFinEstimada,
        es_trabajo_continuo: esTrabajoContinuo,
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

    const franjaLabel = FRANJAS_HORARIAS.find(f => f.inicio === franjaInicio)?.label || franjaInicio

    return NextResponse.json({
      success: true,
      message: `Pendiente programado para ${fecha_programada} de ${franjaInicio} a ${franjaFin} (${franjaLabel})`,
      pendiente: data,
      detalles: {
        duracion_franjas: duracionFranjas,
        fecha_fin_estimada: fechaFinEstimada,
        es_trabajo_continuo: esTrabajoContinuo,
        franja_label: franjaLabel
      },
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

    // Desprogramar (quitar fechas y franjas horarias pero mantener el pendiente)
    const { data, error } = await supabase
      .from('pendientes_operaciones')
      .update({
        estado: 'pendiente',
        fecha_programada: null,
        turno_programado: null,
        franja_horaria_inicio: null,
        franja_horaria_fin: null,
        duracion_franjas: null,
        fecha_fin_estimada: null,
        es_trabajo_continuo: false,
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