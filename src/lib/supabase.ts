import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

// Configuración de Storage para documentos OC
export const STORAGE_BUCKET = 'oc-documents'

// Helper para subir archivos al storage
export const uploadOCDocument = async (fileName: string, file: Blob) => {
  console.log('🔍 Intentando subir archivo:', { fileName, bucket: STORAGE_BUCKET, size: file.size })
  
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: true
    })

  if (error) {
    console.error('❌ Error detallado de Storage:', error)
    console.error('❌ Error message:', error.message)
    console.error('❌ Error statusCode:', error.statusCode)
    console.error('❌ Error name:', error.name)
    console.error('❌ Bucket:', STORAGE_BUCKET)
    console.error('❌ FileName:', fileName)
    console.error('❌ Error completo:', JSON.stringify(error, null, 2))
    throw error
  }
  
  console.log('✅ Archivo subido exitosamente:', data)
  return data
}

// Helper para obtener URL pública del documento
export const getOCDocumentURL = async (fileName: string) => {
  const { data } = await supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(fileName)

  return data.publicUrl
}

// Helper para obtener información de moneda
export const getMonedaInfo = async (codigo: string) => {
  const { data, error } = await supabase
    .from('monedas')
    .select('*')
    .eq('codigo', codigo)
    .eq('activa', true)
    .single()

  if (error || !data) {
    // Fallback para códigos comunes
    const fallbacks: Record<string, { simbolo: string, nombre: string }> = {
      'ARS': { simbolo: '$', nombre: 'Peso Argentino' },
      'BRL': { simbolo: 'R$', nombre: 'Real Brasileño' },
      'USD': { simbolo: 'US$', nombre: 'Dólar Estadounidense' }
    }
    return fallbacks[codigo] || { simbolo: '$', nombre: 'Moneda' }
  }

  return {
    simbolo: data.simbolo,
    nombre: data.nombre,
    pais: data.pais
  }
}

// Helper para formatear monto con símbolo correcto
export const formatearMonto = async (monto: number, codigoMoneda?: string) => {
  if (!codigoMoneda) return `$${monto.toLocaleString()}`
  
  const monedaInfo = await getMonedaInfo(codigoMoneda)
  return `${monedaInfo.simbolo}${monto.toLocaleString()}`
}

// Types para las tablas
export interface Vehiculo {
  id: number
  Nro_Interno: number
  Placa: string
  Titular: string
  Marca: string
  Modelo: string
  Año: number
  Nro_Chasis: string
  aceite_motor_km?: number
  aceite_motor_fecha?: string
  kilometraje_actual?: number
  intervalo_cambio_aceite?: number
  hora_actual?: number
  aceite_motor_hr?: number
  intervalo_cambio_aceite_hr?: number
  aceite_motor_modelo?: string
  aceite_motor_litros?: number
  filtro_aceite_motor_modelo?: string
  filtro_combustible_fecha?: string
  filtro_combustible_modelo?: string
  filtro_combustible_km?: number
  filtro_aire_fecha?: string
  filtro_aire_modelo?: string
  filtro_aire_km?: number
  filtro_cabina_fecha?: string
  filtro_cabina_modelo?: string
  filtro_cabina_km?: number
  aceite_transmicion_fecha?: string
  aceite_transmicion_modelo?: string
  aceite_transmicion_km?: number
  filtro_deshumidificador_fecha?: string
  filtro_deshumidificador_modelo?: string
  filtro_deshumidificador_km?: number
  liquido_refrigerante_fecha?: string
  liquido_refrigerante_modelo?: string
  liquido_refrigerante_km?: number
  liquido_frenos_fecha?: string
  liquido_frenos_modelo?: string
  liquido_frenos_km?: number
  pastilla_cinta_freno_fecha_a?: string
  pastilla_cinta_freno_modelo_a?: string
  pastilla_cinta_freno_km_a?: number
  pastilla_cinta_freno_fecha_b?: string
  pastilla_cinta_freno_modelo_b?: string
  pastilla_cinta_freno_km_b?: number
  pastilla_cinta_freno_fecha_c?: string
  pastilla_cinta_freno_modelo_c?: string
  pastilla_cinta_freno_km_c?: number
  pastilla_cinta_freno_fecha_d?: string
  pastilla_cinta_freno_modelo_d?: string
  pastilla_cinta_freno_km_d?: number
  embrague_fecha?: string
  embrague_modelo?: string
  embrague_km?: number
  suspencion_fecha_a?: string
  suspencion_modelo_a?: string
  suspencion_km_a?: number
  suspencion_fecha_b?: string
  suspencion_modelo_b?: string
  suspencion_km_b?: number
  suspencion_fecha_c?: string
  suspencion_modelo_c?: string
  suspencion_km_c?: number
  suspencion_fecha_d?: string
  suspencion_modelo_d?: string
  suspencion_km_d?: number
  correa_distribucion_fecha?: string
  correa_distribucion_modelo?: string
  correa_distribucion_km?: number
  correa_alternador_fecha?: string
  correa_alternador_modelo?: string
  correa_alternador_km?: number
  correa_direccion_fecha?: string
  correa_direccion_modelo?: string
  correa_direccion_km?: number
  correa_aire_acondicionado_fecha?: string
  correa_aire_acondicionado_modelo?: string
  correa_aire_acondicionado_km?: number
  correa_polyv_fecha?: string
  correa_polyv_modelo?: string
  correa_polyv_km?: number
  tensor_correa_fecha?: string
  tensor_correa_modelo?: string
  tensor_correa_km?: number
  polea_tensora_correa_fecha?: string
  polea_tensora_correa_modelo?: string
  polea_tensora_correa_km?: number
  bateria_fecha?: string
  bateria_modelo?: string
  bateria_km?: number
  neumatico_modelo_marca?: string
  neumatico_fecha_a?: string
  neumatico_km_a?: number
  neumatico_fecha_b?: string
  neumatico_km_b?: number
  neumatico_fecha_c?: string
  neumatico_km_c?: number
  neumatico_fecha_d?: string
  neumatico_km_d?: number
  neumatico_fecha_e?: string
  neumatico_km_e?: number
  neumatico_fecha_f?: string
  neumatico_km_f?: number
  alineacion_neumaticos_fecha?: string
  alineacion_neumaticos_km?: number
  rotacion_neumaticos_fecha?: string
  rotacion_neumaticos_km?: number
  escobillas_modelo?: string
  escobillas_fecha?: string
  escobillas_km?: number
  // Nuevos filtros agregados
  filtro_secador_fecha?: string
  filtro_secador_km?: number
  filtro_secador_modelo?: string
  filtro_aire_secundario_fecha?: string
  filtro_aire_secundario_km?: number
  filtro_aire_secundario_modelo?: string
  trampa_agua_fecha?: string
  trampa_agua_km?: number
  trampa_agua_modelo?: string
  // Campo para revisiones mensuales
  fecha_ultima_revision?: string
}

export interface OrdenCompra {
  id: number
  id_oc?: string
  fecha: string
  codigo: string
  titular?: string
  cuit?: string
  monto?: number
  interno?: number
  modelo?: string
  placa?: string
  proveedor?: string
  items?: string
  adjuntos?: string
  est_compras: boolean
  est_tesoreria: boolean
  est_gerencia: boolean
  es_emergencia?: boolean
  moneda?: string
  pdf_url?: string
  created_at: string
}

export interface OrdenCompraPorVehiculo {
  id: number
  id_oc_original: number
  codigo_oc: string
  fecha: string
  interno: number
  placa: string
  modelo?: string
  titular?: string
  proveedor?: string
  items?: string
  monto_vehiculo?: number
  version?: string | null
  es_emergencia?: boolean
  moneda?: string
  pdf_url?: string
  created_at: string
}

export interface Moneda {
  id: number
  codigo: string
  nombre: string
  simbolo: string
  pais: string
  activa: boolean
  created_at: string
}

export interface Proveedor {
  id: number
  nombre: string
  cuit?: string
  direccion?: string
  telefono?: string
  gmail?: string
  con_iva: string
  moneda?: string
  created_at: string
}

export interface Titular {
  id: number
  nombre_titular: string
  cuit?: string
}

export interface CorrelativoOC {
  id: number
  year: number
  ultimo_numero: number
  fecha_actualizacion: string
}

export interface Historial {
  id_historial: number
  id: number
  clasificacion: string
  subclasificacion?: string
  descripcion: string
  items?: string
  fecha_servicio: string
  created_at: string
}

export interface PendienteObservacion {
  id_pendiente: number
  id: number
  clasificacion: string
  subclasificacion?: string
  descripcion: string
  criticidad: string
  estado?: string
  fecha_creacion: string
  fecha_programada?: string
  created_at: string
}