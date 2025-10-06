// Sistema dinámico de componentes
// Lee los componentes directamente de la tabla vehiculos en Supabase

import { supabase } from './supabase'
import { cargarColumnasExcluidas } from './exclusiones-mantenimiento'
import { cargarAlias, convertirAliasARecord } from './alias-columnas'
import { cargarConfiguracionCategorias, obtenerCategoriaDeComponente } from './categorias-componentes'

export type ComponenteVehiculo = {
  id: string
  label: string
  columnaKm?: string
  columnaFecha?: string
  columnaModelo?: string
  columnaIntervalo?: string
  columnaLitros?: string
  columnaHr?: string
  fields: {
    km?: string
    fecha?: string
    modelo?: string
    intervalo?: string
    litros?: string
    hr?: string
  }
}

export type CategoriaComponentes = {
  id: string
  nombre: string
  icono: string
  componentes: ComponenteVehiculo[]
}

/**
 * Lee los componentes dinámicamente desde la tabla vehiculos
 */
export async function cargarComponentesDinamicos(): Promise<CategoriaComponentes[]> {
  try {
    // Cargar todas las configuraciones dinámicamente
    const [columnasExcluidas, aliasArray, configCategorias] = await Promise.all([
      cargarColumnasExcluidas(),
      cargarAlias(),
      cargarConfiguracionCategorias()
    ])

    // Convertir alias a Record para búsqueda rápida
    const COLUMNAS_ALIAS = convertirAliasARecord(aliasArray)

    // Obtener un registro de vehiculos para extraer las columnas
    const { data, error } = await supabase
      .from('vehiculos')
      .select('*')
      .limit(1)
      .single()

    if (error) throw error

    // Extraer componentes del schema
    const columnas = Object.keys(data || {})
    const componentesMap = new Map<string, ComponenteVehiculo>()

    // Procesar columnas y agrupar por componente
    columnas.forEach(col => {
      if (columnasExcluidas.includes(col)) return

      // Detectar patrón: {componente}_{tipo} o {componente}_{tipo}_{letra}
      let nombreComponente = ''
      let tipoColumna: 'km' | 'fecha' | 'modelo' | 'intervalo' | 'litros' | 'hr' | null = null

      // Primero verificar si es un alias
      if (COLUMNAS_ALIAS[col]) {
        const alias = COLUMNAS_ALIAS[col]
        nombreComponente = alias.componente
        tipoColumna = alias.tipo
      }
      // Detectar patrón con sufijo de letra: {componente}_{tipo}_{a-z}
      else if (/_(km|fecha|modelo|intervalo|litros|hr)_[a-z]$/i.test(col)) {
        const match = col.match(/^(.+)_(km|fecha|modelo|intervalo|litros|hr)_([a-z])$/i)
        if (match) {
          const [, componente, tipo, letra] = match
          nombreComponente = `${componente}_${letra}`
          tipoColumna = tipo as 'km' | 'fecha' | 'modelo' | 'intervalo' | 'litros' | 'hr'
        }
      }
      // Detectar patrón estándar sin sufijo
      else if (col.endsWith('_km')) {
        nombreComponente = col.replace('_km', '')
        tipoColumna = 'km'
      } else if (col.endsWith('_fecha')) {
        nombreComponente = col.replace('_fecha', '')
        tipoColumna = 'fecha'
      } else if (col.endsWith('_modelo')) {
        nombreComponente = col.replace('_modelo', '')
        tipoColumna = 'modelo'
      } else if (col.endsWith('_intervalo')) {
        nombreComponente = col.replace('_intervalo', '')
        tipoColumna = 'intervalo'
      } else if (col.endsWith('_litros')) {
        nombreComponente = col.replace('_litros', '')
        tipoColumna = 'litros'
      } else if (col.endsWith('_hr')) {
        nombreComponente = col.replace('_hr', '')
        tipoColumna = 'hr'
      } else if (col === 'neumatico_modelo_marca') {
        // Caso especial
        nombreComponente = 'neumatico_modelo_marca'
        tipoColumna = 'modelo'
      } else {
        // Columna que no sigue el patrón estándar
        return
      }

      // Validar que tipoColumna no sea null
      if (!tipoColumna) return

      // Crear o actualizar componente en el map
      if (!componentesMap.has(nombreComponente)) {
        componentesMap.set(nombreComponente, {
          id: nombreComponente,
          label: generarLabel(nombreComponente),
          fields: {}
        })
      }

      const comp = componentesMap.get(nombreComponente)!
      comp.fields[tipoColumna] = col

      // También asignar a las propiedades directas
      if (tipoColumna === 'km') comp.columnaKm = col
      else if (tipoColumna === 'fecha') comp.columnaFecha = col
      else if (tipoColumna === 'modelo') comp.columnaModelo = col
      else if (tipoColumna === 'intervalo') comp.columnaIntervalo = col
      else if (tipoColumna === 'litros') comp.columnaLitros = col
      else if (tipoColumna === 'hr') comp.columnaHr = col
    })

    // Convertir a array
    const todosComponentes = Array.from(componentesMap.values())

    // Categorizar componentes usando configuración dinámica
    const categorias: CategoriaComponentes[] = configCategorias.categorias.map(catDef => {
      const componentesCategoria = todosComponentes.filter(comp => {
        const categoriaAsignada = obtenerCategoriaDeComponente(comp.id, configCategorias.asignaciones)
        return categoriaAsignada === catDef.id
      })

      return {
        id: catDef.id,
        nombre: catDef.nombre,
        icono: catDef.icono,
        componentes: componentesCategoria.sort((a, b) => a.label.localeCompare(b.label))
      }
    })

    // Filtrar categorías vacías
    return categorias.filter(cat => cat.componentes.length > 0)

  } catch (error) {
    console.error('Error cargando componentes dinámicos:', error)
    return []
  }
}

/**
 * Genera un label legible desde el nombre del componente
 */
function generarLabel(nombreComponente: string): string {
  // Casos especiales con mejor formato
  const casosEspeciales: Record<string, string> = {
    'neumatico_modelo_marca': 'Modelo/Marca General',
    'neumatico_km_a': 'Neumático A',
    'neumatico_km_b': 'Neumático B',
    'neumatico_km_c': 'Neumático C',
    'neumatico_km_d': 'Neumático D',
    'neumatico_km_e': 'Neumático E',
    'neumatico_km_f': 'Neumático F',
    'pastilla_cinta_freno_km_a': 'Pastillas/Cintas Freno A',
    'pastilla_cinta_freno_km_b': 'Pastillas/Cintas Freno B',
    'pastilla_cinta_freno_km_c': 'Pastillas/Cintas Freno C',
    'pastilla_cinta_freno_km_d': 'Pastillas/Cintas Freno D',
    'suspencion_km_a': 'Suspensión A',
    'suspencion_km_b': 'Suspensión B',
    'suspencion_km_c': 'Suspensión C',
    'suspencion_km_d': 'Suspensión D',
    'aceite_transmicion': 'Aceite de Transmisión',
  }

  if (casosEspeciales[nombreComponente]) {
    return casosEspeciales[nombreComponente]
  }

  // Convertir snake_case a Title Case
  return nombreComponente
    .split('_')
    .map(palabra => {
      // Preservar acrónimos conocidos en mayúsculas
      if (['km', 'hr', 'polyv', 'a', 'b', 'c', 'd', 'e', 'f'].includes(palabra.toLowerCase())) {
        return palabra.toUpperCase()
      }
      return palabra.charAt(0).toUpperCase() + palabra.slice(1)
    })
    .join(' ')
}

/**
 * Helper para obtener todos los IDs de componentes
 */
export function obtenerTodosLosComponentesIds(categorias: CategoriaComponentes[]): string[] {
  return categorias.flatMap(cat => cat.componentes.map(comp => comp.id))
}

/**
 * Helper para obtener componente por ID
 */
export function obtenerComponentePorId(categorias: CategoriaComponentes[], id: string): ComponenteVehiculo | undefined {
  for (const categoria of categorias) {
    const componente = categoria.componentes.find(c => c.id === id)
    if (componente) return componente
  }
  return undefined
}

/**
 * Alias para cargarComponentesDinamicos (para compatibilidad)
 */
export const obtenerComponentesAgrupados = cargarComponentesDinamicos
