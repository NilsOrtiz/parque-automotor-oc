// Sistema de categorización de componentes
// Guarda en configuraciones_vehiculo con id=999997

import { supabase } from './supabase'

const CATEGORIAS_CONFIG_ID = 999997

export type CategoriaDefinicion = {
  id: string
  nombre: string
  icono: string
}

export type ComponenteCategoria = {
  componente: string  // Ej: "correa_polyv"
  categoria_id: string // Ej: "correas"
}

export type ConfiguracionCategorias = {
  categorias: CategoriaDefinicion[]
  asignaciones: ComponenteCategoria[]
}

/**
 * Categorías por defecto del sistema
 */
export function obtenerCategoriasPorDefecto(): CategoriaDefinicion[] {
  return [
    { id: 'aceites-filtros', nombre: 'Aceites y Filtros', icono: '🛢️' },
    { id: 'transmision-liquidos', nombre: 'Transmisión y Líquidos', icono: '⚙️' },
    { id: 'frenos', nombre: 'Sistema de Frenos', icono: '🛑' },
    { id: 'motor-embrague', nombre: 'Motor y Embrague', icono: '🔧' },
    { id: 'suspension', nombre: 'Suspensión', icono: '🚗' },
    { id: 'correas', nombre: 'Correas', icono: '🔗' },
    { id: 'electrico', nombre: 'Sistema Eléctrico', icono: '⚡' },
    { id: 'neumaticos', nombre: 'Neumáticos', icono: '🛞' },
    { id: 'otros', nombre: 'Otros Componentes', icono: '🔩' }
  ]
}

/**
 * Asignaciones por defecto (basadas en prefijos)
 */
export function obtenerAsignacionesPorDefecto(): ComponenteCategoria[] {
  return [
    // Aceites y Filtros
    { componente: 'aceite_motor', categoria_id: 'aceites-filtros' },
    { componente: 'filtro_aceite_motor', categoria_id: 'aceites-filtros' },
    { componente: 'filtro_combustible', categoria_id: 'aceites-filtros' },
    { componente: 'filtro_aire', categoria_id: 'aceites-filtros' },
    { componente: 'filtro_cabina', categoria_id: 'aceites-filtros' },
    { componente: 'filtro_deshumidificador', categoria_id: 'aceites-filtros' },
    { componente: 'filtro_secador', categoria_id: 'aceites-filtros' },
    { componente: 'filtro_aire_secundario', categoria_id: 'aceites-filtros' },

    // Transmisión y Líquidos
    { componente: 'aceite_transmicion', categoria_id: 'transmision-liquidos' },
    { componente: 'liquido_refrigerante', categoria_id: 'transmision-liquidos' },
    { componente: 'liquido_frenos', categoria_id: 'transmision-liquidos' },
    { componente: 'trampa_agua', categoria_id: 'transmision-liquidos' },

    // Frenos
    { componente: 'pastilla_cinta_freno_km_a', categoria_id: 'frenos' },
    { componente: 'pastilla_cinta_freno_km_b', categoria_id: 'frenos' },
    { componente: 'pastilla_cinta_freno_km_c', categoria_id: 'frenos' },
    { componente: 'pastilla_cinta_freno_km_d', categoria_id: 'frenos' },

    // Motor y Embrague
    { componente: 'embrague', categoria_id: 'motor-embrague' },

    // Suspensión
    { componente: 'suspencion_km_a', categoria_id: 'suspension' },
    { componente: 'suspencion_km_b', categoria_id: 'suspension' },
    { componente: 'suspencion_km_c', categoria_id: 'suspension' },
    { componente: 'suspencion_km_d', categoria_id: 'suspension' },

    // Correas
    { componente: 'correa_distribucion', categoria_id: 'correas' },
    { componente: 'correa_alternador', categoria_id: 'correas' },
    { componente: 'correa_direccion', categoria_id: 'correas' },
    { componente: 'correa_aire_acondicionado', categoria_id: 'correas' },
    { componente: 'correa_polyv', categoria_id: 'correas' },
    { componente: 'tensor_correa', categoria_id: 'correas' },
    { componente: 'polea_tensora_correa', categoria_id: 'correas' },

    // Eléctrico
    { componente: 'bateria', categoria_id: 'electrico' },
    { componente: 'escobillas', categoria_id: 'electrico' },

    // Neumáticos
    { componente: 'neumatico_modelo_marca', categoria_id: 'neumaticos' },
    { componente: 'neumatico_km_a', categoria_id: 'neumaticos' },
    { componente: 'neumatico_km_b', categoria_id: 'neumaticos' },
    { componente: 'neumatico_km_c', categoria_id: 'neumaticos' },
    { componente: 'neumatico_km_d', categoria_id: 'neumaticos' },
    { componente: 'neumatico_km_e', categoria_id: 'neumaticos' },
    { componente: 'neumatico_km_f', categoria_id: 'neumaticos' },
    { componente: 'alineacion_neumaticos', categoria_id: 'neumaticos' },
    { componente: 'rotacion_neumaticos', categoria_id: 'neumaticos' }
  ]
}

/**
 * Carga la configuración de categorías desde la BD
 */
export async function cargarConfiguracionCategorias(): Promise<ConfiguracionCategorias> {
  try {
    const { data, error } = await supabase
      .from('configuraciones_vehiculo')
      .select('componentes_aplicables')
      .eq('id', CATEGORIAS_CONFIG_ID)
      .single()

    if (error) {
      // Si no existe, retornar configuración por defecto
      if (error.code === 'PGRST116') {
        return {
          categorias: obtenerCategoriasPorDefecto(),
          asignaciones: obtenerAsignacionesPorDefecto()
        }
      }
      throw error
    }

    // componentes_aplicables contiene el objeto con categorías y asignaciones
    const config = data.componentes_aplicables as any
    return {
      categorias: config.categorias || obtenerCategoriasPorDefecto(),
      asignaciones: config.asignaciones || obtenerAsignacionesPorDefecto()
    }
  } catch (error) {
    console.error('Error cargando configuración de categorías:', error)
    return {
      categorias: obtenerCategoriasPorDefecto(),
      asignaciones: obtenerAsignacionesPorDefecto()
    }
  }
}

/**
 * Guarda la configuración de categorías en la BD
 */
export async function guardarConfiguracionCategorias(config: ConfiguracionCategorias): Promise<void> {
  try {
    // Intentar actualizar primero
    const { error: updateError } = await supabase
      .from('configuraciones_vehiculo')
      .update({
        componentes_aplicables: config,
        updated_at: new Date().toISOString()
      })
      .eq('id', CATEGORIAS_CONFIG_ID)

    // Si no existe, crear
    if (updateError && updateError.code === 'PGRST116') {
      const { error: insertError } = await supabase
        .from('configuraciones_vehiculo')
        .insert({
          id: CATEGORIAS_CONFIG_ID,
          nombre_configuracion: '__CATEGORIAS_SISTEMA__',
          descripcion: 'Configuración del sistema: categorización de componentes',
          componentes_aplicables: config,
          activo: false
        })

      if (insertError) throw insertError
    } else if (updateError) {
      throw updateError
    }
  } catch (error) {
    console.error('Error guardando configuración de categorías:', error)
    throw error
  }
}

/**
 * Obtiene la categoría de un componente
 */
export function obtenerCategoriaDeComponente(
  componente: string,
  asignaciones: ComponenteCategoria[]
): string {
  const asignacion = asignaciones.find(a => a.componente === componente)
  return asignacion?.categoria_id || 'otros'
}
