// Catálogo completo de componentes de vehículos
// Extraído del schema de la tabla vehiculos

export type ComponenteVehiculo = {
  id: string
  label: string
  fields: {
    km?: string
    fecha?: string
    modelo?: string
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

export const CATEGORIAS_COMPONENTES: CategoriaComponentes[] = [
  {
    id: 'aceites-filtros',
    nombre: 'Aceites y Filtros',
    icono: '🛢️',
    componentes: [
      {
        id: 'aceite_motor',
        label: 'Aceite de Motor',
        fields: {
          km: 'aceite_motor_km',
          fecha: 'aceite_motor_fecha',
          modelo: 'aceite_motor_modelo',
          litros: 'aceite_motor_litros',
          hr: 'aceite_motor_hr'
        }
      },
      {
        id: 'filtro_aceite_motor',
        label: 'Filtro Aceite Motor',
        fields: {
          modelo: 'filtro_aceite_motor_modelo'
        }
      },
      {
        id: 'filtro_combustible',
        label: 'Filtro de Combustible',
        fields: {
          km: 'filtro_combustible_km',
          fecha: 'filtro_combustible_fecha',
          modelo: 'filtro_combustible_modelo'
        }
      },
      {
        id: 'filtro_aire',
        label: 'Filtro de Aire',
        fields: {
          km: 'filtro_aire_km',
          fecha: 'filtro_aire_fecha',
          modelo: 'filtro_aire_modelo'
        }
      },
      {
        id: 'filtro_cabina',
        label: 'Filtro de Cabina',
        fields: {
          km: 'filtro_cabina_km',
          fecha: 'filtro_cabina_fecha',
          modelo: 'filtro_cabina_modelo'
        }
      },
      {
        id: 'filtro_deshumidificador',
        label: 'Filtro Deshumidificador',
        fields: {
          km: 'filtro_deshumidificador_km',
          fecha: 'filtro_deshumidificador_fecha',
          modelo: 'filtro_deshumidificador_modelo'
        }
      },
      {
        id: 'filtro_secador',
        label: 'Filtro Secador',
        fields: {
          km: 'filtro_secador_km',
          fecha: 'filtro_secador_fecha',
          modelo: 'filtro_secador_modelo'
        }
      },
      {
        id: 'filtro_aire_secundario',
        label: 'Filtro de Aire Secundario',
        fields: {
          km: 'filtro_aire_secundario_km',
          fecha: 'filtro_aire_secundario_fecha',
          modelo: 'filtro_aire_secundario_modelo'
        }
      },
      {
        id: 'trampa_agua',
        label: 'Trampa de Agua',
        fields: {
          km: 'trampa_agua_km',
          fecha: 'trampa_agua_fecha',
          modelo: 'trampa_agua_modelo'
        }
      }
    ]
  },
  {
    id: 'transmision-liquidos',
    nombre: 'Transmisión y Líquidos',
    icono: '⚙️',
    componentes: [
      {
        id: 'aceite_transmision',
        label: 'Aceite de Transmisión',
        fields: {
          km: 'aceite_transmicion_km',
          fecha: 'aceite_transmicion_fecha',
          modelo: 'aceite_transmicion_modelo'
        }
      },
      {
        id: 'liquido_refrigerante',
        label: 'Líquido Refrigerante',
        fields: {
          km: 'liquido_refrigerante_km',
          fecha: 'liquido_refrigerante_fecha',
          modelo: 'liquido_refrigerante_modelo'
        }
      },
      {
        id: 'liquido_frenos',
        label: 'Líquido de Frenos',
        fields: {
          km: 'liquido_frenos_km',
          fecha: 'liquido_frenos_fecha',
          modelo: 'liquido_frenos_modelo'
        }
      }
    ]
  },
  {
    id: 'frenos',
    nombre: 'Sistema de Frenos',
    icono: '🛑',
    componentes: [
      {
        id: 'pastilla_freno_a',
        label: 'Pastillas/Cintas Freno A',
        fields: {
          km: 'pastilla_cinta_freno_km_a',
          fecha: 'pastilla_cinta_freno_fecha_a',
          modelo: 'pastilla_cinta_freno_modelo_a'
        }
      },
      {
        id: 'pastilla_freno_b',
        label: 'Pastillas/Cintas Freno B',
        fields: {
          km: 'pastilla_cinta_freno_km_b',
          fecha: 'pastilla_cinta_freno_fecha_b',
          modelo: 'pastilla_cinta_freno_modelo_b'
        }
      },
      {
        id: 'pastilla_freno_c',
        label: 'Pastillas/Cintas Freno C',
        fields: {
          km: 'pastilla_cinta_freno_km_c',
          fecha: 'pastilla_cinta_freno_fecha_c',
          modelo: 'pastilla_cinta_freno_modelo_c'
        }
      },
      {
        id: 'pastilla_freno_d',
        label: 'Pastillas/Cintas Freno D',
        fields: {
          km: 'pastilla_cinta_freno_km_d',
          fecha: 'pastilla_cinta_freno_fecha_d',
          modelo: 'pastilla_cinta_freno_modelo_d'
        }
      }
    ]
  },
  {
    id: 'motor-embrague',
    nombre: 'Motor y Embrague',
    icono: '🔧',
    componentes: [
      {
        id: 'embrague',
        label: 'Embrague',
        fields: {
          km: 'embrague_km',
          fecha: 'embrague_fecha',
          modelo: 'embrague_modelo'
        }
      }
    ]
  },
  {
    id: 'suspension',
    nombre: 'Suspensión',
    icono: '🚗',
    componentes: [
      {
        id: 'suspension_a',
        label: 'Suspensión A',
        fields: {
          km: 'suspencion_km_a',
          fecha: 'suspencion_fecha_a',
          modelo: 'suspencion_modelo_a'
        }
      },
      {
        id: 'suspension_b',
        label: 'Suspensión B',
        fields: {
          km: 'suspencion_km_b',
          fecha: 'suspencion_fecha_b',
          modelo: 'suspencion_modelo_b'
        }
      },
      {
        id: 'suspension_c',
        label: 'Suspensión C',
        fields: {
          km: 'suspencion_km_c',
          fecha: 'suspencion_fecha_c',
          modelo: 'suspencion_modelo_c'
        }
      },
      {
        id: 'suspension_d',
        label: 'Suspensión D',
        fields: {
          km: 'suspencion_km_d',
          fecha: 'suspencion_fecha_d',
          modelo: 'suspencion_modelo_d'
        }
      }
    ]
  },
  {
    id: 'correas',
    nombre: 'Correas',
    icono: '🔗',
    componentes: [
      {
        id: 'correa_distribucion',
        label: 'Correa de Distribución',
        fields: {
          km: 'correa_distribucion_km',
          fecha: 'correa_distribucion_fecha',
          modelo: 'correa_distribucion_modelo'
        }
      },
      {
        id: 'correa_alternador',
        label: 'Correa de Alternador',
        fields: {
          km: 'correa_alternador_km',
          fecha: 'correa_alternador_fecha',
          modelo: 'correa_alternador_modelo'
        }
      },
      {
        id: 'correa_direccion',
        label: 'Correa de Dirección',
        fields: {
          km: 'correa_direccion_km',
          fecha: 'correa_direccion_fecha',
          modelo: 'correa_direccion_modelo'
        }
      },
      {
        id: 'correa_aire_acondicionado',
        label: 'Correa de Aire Acondicionado',
        fields: {
          km: 'correa_aire_acondicionado_km',
          fecha: 'correa_aire_acondicionado_fecha',
          modelo: 'correa_aire_acondicionado_modelo'
        }
      },
      {
        id: 'correa_polyv',
        label: 'Correa Poly-V',
        fields: {
          km: 'correa_polyv_km',
          fecha: 'correa_polyv_fecha',
          modelo: 'correa_polyv_modelo'
        }
      },
      {
        id: 'tensor_correa',
        label: 'Tensor de Correa',
        fields: {
          km: 'tensor_correa_km',
          fecha: 'tensor_correa_fecha',
          modelo: 'tensor_correa_modelo'
        }
      },
      {
        id: 'polea_tensora',
        label: 'Polea Tensora',
        fields: {
          km: 'polea_tensora_correa_km',
          fecha: 'polea_tensora_correa_fecha',
          modelo: 'polea_tensora_correa_modelo'
        }
      }
    ]
  },
  {
    id: 'electrico',
    nombre: 'Sistema Eléctrico',
    icono: '⚡',
    componentes: [
      {
        id: 'bateria',
        label: 'Batería',
        fields: {
          km: 'bateria_km',
          fecha: 'bateria_fecha',
          modelo: 'bateria_modelo'
        }
      },
      {
        id: 'escobillas',
        label: 'Escobillas',
        fields: {
          km: 'escobillas_km',
          fecha: 'escobillas_fecha',
          modelo: 'escobillas_modelo'
        }
      }
    ]
  },
  {
    id: 'neumaticos',
    nombre: 'Neumáticos',
    icono: '🛞',
    componentes: [
      {
        id: 'neumatico_modelo_marca',
        label: 'Modelo/Marca General',
        fields: {
          modelo: 'neumatico_modelo_marca'
        }
      },
      {
        id: 'neumatico_a',
        label: 'Neumático A',
        fields: {
          km: 'neumatico_km_a',
          fecha: 'neumatico_fecha_a'
        }
      },
      {
        id: 'neumatico_b',
        label: 'Neumático B',
        fields: {
          km: 'neumatico_km_b',
          fecha: 'neumatico_fecha_b'
        }
      },
      {
        id: 'neumatico_c',
        label: 'Neumático C',
        fields: {
          km: 'neumatico_km_c',
          fecha: 'neumatico_fecha_c'
        }
      },
      {
        id: 'neumatico_d',
        label: 'Neumático D',
        fields: {
          km: 'neumatico_km_d',
          fecha: 'neumatico_fecha_d'
        }
      },
      {
        id: 'neumatico_e',
        label: 'Neumático E',
        fields: {
          km: 'neumatico_km_e',
          fecha: 'neumatico_fecha_e'
        }
      },
      {
        id: 'neumatico_f',
        label: 'Neumático F',
        fields: {
          km: 'neumatico_km_f',
          fecha: 'neumatico_fecha_f'
        }
      },
      {
        id: 'alineacion',
        label: 'Alineación',
        fields: {
          km: 'alineacion_neumaticos_km',
          fecha: 'alineacion_neumaticos_fecha'
        }
      },
      {
        id: 'rotacion',
        label: 'Rotación',
        fields: {
          km: 'rotacion_neumaticos_km',
          fecha: 'rotacion_neumaticos_fecha'
        }
      }
    ]
  }
]

// Función helper para obtener todos los IDs de componentes
export function obtenerTodosLosComponentesIds(): string[] {
  return CATEGORIAS_COMPONENTES.flatMap(cat =>
    cat.componentes.map(comp => comp.id)
  )
}

// Función helper para obtener componente por ID
export function obtenerComponentePorId(id: string): ComponenteVehiculo | undefined {
  for (const categoria of CATEGORIAS_COMPONENTES) {
    const componente = categoria.componentes.find(c => c.id === id)
    if (componente) return componente
  }
  return undefined
}
