// Verificación completa de campos generados vs tabla SQL

// CAMPOS QUE EXISTEN EN LA TABLA SQL (extraídos del schema)
const camposSQL = [
  // Campos básicos
  'id', 'Nro_Interno', 'Placa', 'Titular', 'Marca', 'Modelo', 'Año', 'Nro_Chasis', 
  'kilometraje_actual', 'intervalo_cambio_aceite', 'hora_actual', 'intervalo_cambio_aceite_hr',
  'fecha_ultima_revision', 'capacidad_tanque_litros', 'intervalo_rotacion_neumaticos', 
  'tipo_vehiculo', 'rotacion_actual', 'configuracion_id',
  
  // Aceite motor
  'aceite_motor_km', 'aceite_motor_fecha', 'aceite_motor_modelo', 'aceite_motor_litros', 'aceite_motor_hr',
  
  // Filtro aceite motor
  'filtro_aceite_motor_modelo',
  
  // Filtro combustible
  'filtro_combustible_fecha', 'filtro_combustible_modelo', 'filtro_combustible_km',
  
  // Filtro aire
  'filtro_aire_fecha', 'filtro_aire_modelo', 'filtro_aire_km',
  
  // Filtro cabina
  'filtro_cabina_fecha', 'filtro_cabina_modelo', 'filtro_cabina_km',
  
  // Aceite transmision (con C)
  'aceite_transmicion_fecha', 'aceite_transmicion_modelo', 'aceite_transmicion_km',
  
  // Filtro deshumidificador
  'filtro_deshumidificador_fecha', 'filtro_deshumidificador_modelo', 'filtro_deshumidificador_km',
  
  // Liquido refrigerante
  'liquido_refrigerante_fecha', 'liquido_refrigerante_modelo', 'liquido_refrigerante_km',
  
  // Liquido frenos
  'liquido_frenos_fecha', 'liquido_frenos_modelo', 'liquido_frenos_km',
  
  // Pastilla cinta freno (A,B,C,D)
  'pastilla_cinta_freno_fecha_a', 'pastilla_cinta_freno_modelo_a', 'pastilla_cinta_freno_km_a',
  'pastilla_cinta_freno_fecha_b', 'pastilla_cinta_freno_modelo_b', 'pastilla_cinta_freno_km_b',
  'pastilla_cinta_freno_fecha_c', 'pastilla_cinta_freno_modelo_c', 'pastilla_cinta_freno_km_c',
  'pastilla_cinta_freno_fecha_d', 'pastilla_cinta_freno_modelo_d', 'pastilla_cinta_freno_km_d',
  
  // Embrague
  'embrague_fecha', 'embrague_modelo', 'embrague_km',
  
  // Suspension (con C) (A,B,C,D)
  'suspencion_fecha_a', 'suspencion_modelo_a', 'suspencion_km_a',
  'suspencion_fecha_b', 'suspencion_modelo_b', 'suspencion_km_b',
  'suspencion_fecha_c', 'suspencion_modelo_c', 'suspencion_km_c',
  'suspencion_fecha_d', 'suspencion_modelo_d', 'suspencion_km_d',
  
  // Correas
  'correa_distribucion_fecha', 'correa_distribucion_modelo', 'correa_distribucion_km',
  'correa_alternador_fecha', 'correa_alternador_modelo', 'correa_alternador_km',
  'correa_direccion_fecha', 'correa_direccion_modelo', 'correa_direccion_km',
  'correa_aire_acondicionado_fecha', 'correa_aire_acondicionado_modelo', 'correa_aire_acondicionado_km',
  'correa_polyv_fecha', 'correa_polyv_modelo', 'correa_polyv_km',
  
  // Tensor y polea
  'tensor_correa_fecha', 'tensor_correa_modelo', 'tensor_correa_km',
  'polea_tensora_correa_fecha', 'polea_tensora_correa_modelo', 'polea_tensora_correa_km',
  
  // Bateria
  'bateria_fecha', 'bateria_modelo', 'bateria_km',
  
  // Neumaticos
  'neumatico_modelo_marca', // Campo especial compartido
  'neumatico_fecha_a', 'neumatico_km_a',
  'neumatico_fecha_b', 'neumatico_km_b', 
  'neumatico_fecha_c', 'neumatico_km_c',
  'neumatico_fecha_d', 'neumatico_km_d',
  'neumatico_fecha_e', 'neumatico_km_e',
  'neumatico_fecha_f', 'neumatico_km_f',
  
  // Alineacion y rotacion
  'alineacion_neumaticos_fecha', 'alineacion_neumaticos_km',
  'rotacion_neumaticos_fecha', 'rotacion_neumaticos_km',
  
  // Escobillas
  'escobillas_modelo', 'escobillas_fecha', 'escobillas_km',
  
  // Filtros adicionales
  'filtro_secador_fecha', 'filtro_secador_km', 'filtro_secador_modelo',
  'filtro_aire_secundario_fecha', 'filtro_aire_secundario_km', 'filtro_aire_secundario_modelo',
  
  // Trampa agua
  'trampa_agua_fecha', 'trampa_agua_km', 'trampa_agua_modelo'
];

// COMPONENTES BASE QUE MI CÓDIGO PUEDE GENERAR
const componentesBase = [
  'aceite_motor',
  'filtro_aceite_motor',
  'filtro_combustible', 
  'filtro_aire',
  'filtro_cabina',
  'filtro_deshumidificador',
  'filtro_secador',
  'filtro_aire_secundario', 
  'trampa_agua',
  'aceite_transmicion', // CON C
  'liquido_refrigerante',
  'liquido_frenos',
  'pastilla_cinta_freno_a', // CON SUFIJO _a
  'pastilla_cinta_freno_b',
  'pastilla_cinta_freno_c', 
  'pastilla_cinta_freno_d',
  'embrague',
  'suspencion_a', // CON C Y SUFIJO _a
  'suspencion_b',
  'suspencion_c',
  'suspencion_d',
  'correa_distribucion',
  'correa_alternador',
  'correa_direccion',
  'correa_aire_acondicionado',
  'correa_polyv',
  'tensor_correa',
  'polea_tensora_correa', // NOMBRE COMPLETO
  'bateria',
  'escobillas',
  'neumatico_modelo_marca', // CAMPO ESPECIAL
  'neumatico_a',
  'neumatico_b',
  'neumatico_c',
  'neumatico_d',
  'neumatico_e',
  'neumatico_f',
  'alineacion_neumaticos', // NOMBRE COMPLETO
  'rotacion_neumaticos' // NOMBRE COMPLETO
];

// FUNCIÓN PARA GENERAR CAMPOS COMO LO HACE MI CÓDIGO
function generarCamposDesdeComponente(componenteBase) {
  const campos = [];
  
  // Para componentes con sufijos _a, _b, etc (pastilla_cinta_freno_a, suspencion_a, neumatico_a)
  if (componenteBase.match(/_(a|b|c|d|e|f)$/)) {
    const baseWithoutLetter = componenteBase.replace(/_(a|b|c|d|e|f)$/, '');
    const letter = componenteBase.match(/_(a|b|c|d|e|f)$/)?.[1];
    
    // Para neumáticos individuales NO hay modelo (solo compartido neumatico_modelo_marca)
    if (!componenteBase.startsWith('neumatico_') || componenteBase === 'neumatico_modelo_marca') {
      campos.push(`${baseWithoutLetter}_modelo_${letter}`);
    }
    
    campos.push(`${baseWithoutLetter}_km_${letter}`);
    campos.push(`${baseWithoutLetter}_fecha_${letter}`);
  } else {
    // Componentes normales sin sufijos
    if (componenteBase !== 'neumatico_modelo_marca') { // Este es solo modelo
      campos.push(`${componenteBase}_modelo`);
      campos.push(`${componenteBase}_km`);
      campos.push(`${componenteBase}_fecha`);
    } else {
      campos.push(componenteBase); // neumatico_modelo_marca va tal como está
    }
  }
  
  // Campos especiales para aceite motor
  if (componenteBase === 'aceite_motor') {
    campos.push('aceite_motor_hr');
    campos.push('aceite_motor_litros');
  }
  
  return campos;
}

// GENERAR TODOS LOS CAMPOS POSIBLES DE MI CÓDIGO
let camposMiCodigo = [];
componentesBase.forEach(comp => {
  camposMiCodigo = camposMiCodigo.concat(generarCamposDesdeComponente(comp));
});

// VERIFICACIÓN
console.log('=== VERIFICACIÓN DE CAMPOS ===');
console.log(`Campos en SQL: ${camposSQL.length}`);
console.log(`Campos que puede generar mi código: ${camposMiCodigo.length}`);

// Buscar campos que mi código genera pero no existen en SQL
const camposInexistentes = camposMiCodigo.filter(campo => !camposSQL.includes(campo));
console.log('\n❌ CAMPOS QUE MI CÓDIGO GENERA PERO NO EXISTEN EN SQL:');
camposInexistentes.forEach(campo => console.log(`  - ${campo}`));

// Buscar campos que existen en SQL pero mi código no puede generar
const camposMantenimiento = camposSQL.filter(campo => 
  campo.includes('_fecha') || campo.includes('_modelo') || campo.includes('_km') || campo.includes('_hr') || campo.includes('_litros') || campo === 'neumatico_modelo_marca'
);
const camposNoGenerados = camposMantenimiento.filter(campo => !camposMiCodigo.includes(campo));
console.log('\n⚠️  CAMPOS DE MANTENIMIENTO EN SQL QUE MI CÓDIGO NO PUEDE GENERAR:');
camposNoGenerados.forEach(campo => console.log(`  - ${campo}`));

console.log('\n✅ RESUMEN:');
console.log(`Campos problemáticos: ${camposInexistentes.length}`);
console.log(`Campos no cubiertos: ${camposNoGenerados.length}`);