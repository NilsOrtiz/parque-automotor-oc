// Sistema de alias para columnas con nombres no estándar
// Guarda en configuraciones_vehiculo con id=999998

import { supabase } from './supabase'

const ALIAS_CONFIG_ID = 999998

export type AliasColumna = {
  nombre_real: string       // Ej: "intervalo_cambio_aceite"
  componente: string        // Ej: "aceite_motor"
  tipo: 'km' | 'fecha' | 'modelo' | 'intervalo' | 'litros' | 'hr'
}

export type ConfiguracionAlias = {
  alias: AliasColumna[]
}

/**
 * Carga los alias desde la BD
 */
export async function cargarAlias(): Promise<AliasColumna[]> {
  try {
    const { data, error } = await supabase
      .from('configuraciones_vehiculo')
      .select('componentes_aplicables')
      .eq('id', ALIAS_CONFIG_ID)
      .single()

    if (error) {
      // Si no existe, retornar alias por defecto
      if (error.code === 'PGRST116') {
        return obtenerAliasPorDefecto()
      }
      throw error
    }

    // componentes_aplicables contiene el array de alias
    return Array.isArray(data.componentes_aplicables) ? data.componentes_aplicables : []
  } catch (error) {
    console.error('Error cargando alias:', error)
    return obtenerAliasPorDefecto()
  }
}

/**
 * Guarda los alias en la BD
 */
export async function guardarAlias(alias: AliasColumna[]): Promise<void> {
  try {
    // Intentar actualizar primero
    const { error: updateError } = await supabase
      .from('configuraciones_vehiculo')
      .update({
        componentes_aplicables: alias,
        updated_at: new Date().toISOString()
      })
      .eq('id', ALIAS_CONFIG_ID)

    // Si no existe, crear
    if (updateError && updateError.code === 'PGRST116') {
      const { error: insertError } = await supabase
        .from('configuraciones_vehiculo')
        .insert({
          id: ALIAS_CONFIG_ID,
          nombre_configuracion: '__ALIAS_SISTEMA__',
          descripcion: 'Configuración del sistema: mapeo de columnas con nombres no estándar',
          componentes_aplicables: alias,
          activo: false
        })

      if (insertError) throw insertError
    } else if (updateError) {
      throw updateError
    }
  } catch (error) {
    console.error('Error guardando alias:', error)
    throw error
  }
}

/**
 * Alias por defecto (los que ya existían hardcodeados)
 */
export function obtenerAliasPorDefecto(): AliasColumna[] {
  return [
    {
      nombre_real: 'intervalo_cambio_aceite',
      componente: 'aceite_motor',
      tipo: 'intervalo'
    },
    {
      nombre_real: 'intervalo_cambio_aceite_hr',
      componente: 'aceite_motor',
      tipo: 'intervalo'
    },
    {
      nombre_real: 'intervalo_rotacion_neumaticos',
      componente: 'rotacion_neumaticos',
      tipo: 'intervalo'
    }
  ]
}

/**
 * Convierte array de alias a objeto Record para uso rápido
 */
export function convertirAliasARecord(alias: AliasColumna[]): Record<string, { componente: string, tipo: string }> {
  const record: Record<string, { componente: string, tipo: string }> = {}
  alias.forEach(a => {
    record[a.nombre_real] = {
      componente: a.componente,
      tipo: a.tipo
    }
  })
  return record
}
