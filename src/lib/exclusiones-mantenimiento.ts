// Sistema de exclusiones de columnas de mantenimiento
// Guarda en configuraciones_vehiculo con id=999999

import { supabase } from './supabase'

const EXCLUSIONES_CONFIG_ID = 999999

export type ConfiguracionExclusiones = {
  columnas_excluidas: string[]  // Array de nombres de columnas que NO son de mantenimiento
}

/**
 * Carga las columnas excluidas desde la BD
 */
export async function cargarColumnasExcluidas(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('configuraciones_vehiculo')
      .select('componentes_aplicables')
      .eq('id', EXCLUSIONES_CONFIG_ID)
      .single()

    if (error) {
      // Si no existe, retornar exclusiones por defecto
      if (error.code === 'PGRST116') {
        return obtenerExclusionesPorDefecto()
      }
      throw error
    }

    // componentes_aplicables contiene el array de columnas excluidas
    return Array.isArray(data.componentes_aplicables) ? data.componentes_aplicables : []
  } catch (error) {
    console.error('Error cargando exclusiones:', error)
    return obtenerExclusionesPorDefecto()
  }
}

/**
 * Guarda las columnas excluidas en la BD
 */
export async function guardarColumnasExcluidas(columnasExcluidas: string[]): Promise<void> {
  try {
    // Intentar actualizar primero
    const { error: updateError } = await supabase
      .from('configuraciones_vehiculo')
      .update({
        componentes_aplicables: columnasExcluidas,
        updated_at: new Date().toISOString()
      })
      .eq('id', EXCLUSIONES_CONFIG_ID)

    // Si no existe, crear
    if (updateError && updateError.code === 'PGRST116') {
      const { error: insertError } = await supabase
        .from('configuraciones_vehiculo')
        .insert({
          id: EXCLUSIONES_CONFIG_ID,
          nombre_configuracion: '__EXCLUSIONES_SISTEMA__',
          descripcion: 'Configuración del sistema: columnas que NO son de mantenimiento',
          componentes_aplicables: columnasExcluidas,
          activo: false  // No es un perfil de usuario
        })

      if (insertError) throw insertError
    } else if (updateError) {
      throw updateError
    }
  } catch (error) {
    console.error('Error guardando exclusiones:', error)
    throw error
  }
}

/**
 * Exclusiones por defecto (lo que estaba hardcodeado antes)
 */
export function obtenerExclusionesPorDefecto(): string[] {
  return [
    'id',
    'created_at',
    'Nro_Interno',
    'Placa',
    'Titular',
    'Marca',
    'Modelo',
    'Año',
    'Nro_Chasis',
    'kilometraje_actual',
    'kilometraje_actual_fecha',
    'hora_actual',
    'tipo_vehiculo',
    'configuracion_id',
    'rotacion_actual',
    'capacidad_tanque_litros',
    'fecha_ultima_revision',
    // Columnas especiales de intervalo que no siguen el patrón
    'intervalo_cambio_aceite',
    'intervalo_cambio_aceite_hr',
    'intervalo_rotacion_neumaticos'
  ]
}

/**
 * Verifica si una columna está excluida
 */
export function esColumnaExcluida(nombreColumna: string, exclusiones: string[]): boolean {
  return exclusiones.includes(nombreColumna)
}

/**
 * Obtiene todas las columnas de la tabla vehiculos
 */
export async function obtenerTodasLasColumnas(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('vehiculos')
      .select('*')
      .limit(1)
      .single()

    if (error) throw error

    return Object.keys(data || {})
  } catch (error) {
    console.error('Error obteniendo columnas:', error)
    return []
  }
}
