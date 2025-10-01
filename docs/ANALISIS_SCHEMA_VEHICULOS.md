# Análisis del Schema de Tabla Vehiculos

## Patrón Estándar por Componente

Cada componente debería tener 4 columnas:
- `{componente}_km` (integer) - Kilometraje al último cambio
- `{componente}_fecha` (date) - Fecha del último cambio
- `{componente}_modelo` (text) - Marca/modelo de la pieza
- `{componente}_intervalo` (integer) - Período de cambio en km

## Componentes Actuales - Análisis

### ✅ COMPLETOS (tienen las 4 columnas)

**Aceite de Motor:**
- ✅ aceite_motor_km
- ✅ aceite_motor_fecha
- ✅ aceite_motor_modelo
- ✅ intervalo_cambio_aceite (nombre diferente, debería ser aceite_motor_intervalo)
- ⚠️ Tiene extras: aceite_motor_litros, aceite_motor_hr, intervalo_cambio_aceite_hr

**Rotación de Neumáticos:**
- ✅ rotacion_neumaticos_km
- ✅ rotacion_neumaticos_fecha
- ❌ rotacion_neumaticos_modelo (NO TIENE)
- ✅ intervalo_rotacion_neumaticos

### ⚠️ INCOMPLETOS (faltan columnas)

**Filtro de Combustible:**
- ✅ filtro_combustible_km
- ✅ filtro_combustible_fecha
- ✅ filtro_combustible_modelo
- ❌ filtro_combustible_intervalo (FALTA)

**Filtro de Aire:**
- ✅ filtro_aire_km
- ✅ filtro_aire_fecha
- ✅ filtro_aire_modelo
- ❌ filtro_aire_intervalo (FALTA)

**Filtro de Cabina:**
- ✅ filtro_cabina_km
- ✅ filtro_cabina_fecha
- ✅ filtro_cabina_modelo
- ❌ filtro_cabina_intervalo (FALTA)

**Filtro Aceite Motor:**
- ❌ filtro_aceite_motor_km (FALTA)
- ❌ filtro_aceite_motor_fecha (FALTA)
- ✅ filtro_aceite_motor_modelo
- ❌ filtro_aceite_motor_intervalo (FALTA)

**Aceite de Transmisión:**
- ✅ aceite_transmicion_km (typo: debería ser transmision)
- ✅ aceite_transmicion_fecha
- ✅ aceite_transmicion_modelo
- ❌ aceite_transmicion_intervalo (FALTA)

**Filtro Deshumidificador:**
- ✅ filtro_deshumidificador_km
- ✅ filtro_deshumidificador_fecha
- ✅ filtro_deshumidificador_modelo
- ❌ filtro_deshumidificador_intervalo (FALTA)

**Líquido Refrigerante:**
- ✅ liquido_refrigerante_km
- ✅ liquido_refrigerante_fecha
- ✅ liquido_refrigerante_modelo
- ❌ liquido_refrigerante_intervalo (FALTA)

**Líquido de Frenos:**
- ✅ liquido_frenos_km
- ✅ liquido_frenos_fecha
- ✅ liquido_frenos_modelo
- ❌ liquido_frenos_intervalo (FALTA)

**Pastillas/Cintas de Freno A, B, C, D:**
- ✅ pastilla_cinta_freno_km_{a,b,c,d}
- ✅ pastilla_cinta_freno_fecha_{a,b,c,d}
- ✅ pastilla_cinta_freno_modelo_{a,b,c,d}
- ❌ pastilla_cinta_freno_intervalo_{a,b,c,d} (FALTA)

**Embrague:**
- ✅ embrague_km
- ✅ embrague_fecha
- ✅ embrague_modelo
- ❌ embrague_intervalo (FALTA)

**Suspensión A, B, C, D:**
- ✅ suspencion_km_{a,b,c,d} (typo: debería ser suspension)
- ✅ suspencion_fecha_{a,b,c,d}
- ✅ suspencion_modelo_{a,b,c,d}
- ❌ suspencion_intervalo_{a,b,c,d} (FALTA)

**Correas (Distribución, Alternador, Dirección, Aire Acondicionado, Poly-V):**
- ✅ correa_{tipo}_km
- ✅ correa_{tipo}_fecha
- ✅ correa_{tipo}_modelo
- ❌ correa_{tipo}_intervalo (FALTA TODAS)

**Tensor de Correa:**
- ✅ tensor_correa_km
- ✅ tensor_correa_fecha
- ✅ tensor_correa_modelo
- ❌ tensor_correa_intervalo (FALTA)

**Polea Tensora:**
- ✅ polea_tensora_correa_km
- ✅ polea_tensora_correa_fecha
- ✅ polea_tensora_correa_modelo
- ❌ polea_tensora_correa_intervalo (FALTA)

**Batería:**
- ✅ bateria_km
- ✅ bateria_fecha
- ✅ bateria_modelo
- ❌ bateria_intervalo (FALTA)

**Neumáticos A-F:**
- ✅ neumatico_km_{a-f}
- ✅ neumatico_fecha_{a-f}
- ❌ neumatico_modelo_{a-f} (FALTA - solo hay neumatico_modelo_marca general)
- ❌ neumatico_intervalo_{a-f} (FALTA)

**Alineación:**
- ✅ alineacion_neumaticos_km
- ✅ alineacion_neumaticos_fecha
- ❌ alineacion_neumaticos_modelo (FALTA)
- ❌ alineacion_neumaticos_intervalo (FALTA)

**Escobillas:**
- ✅ escobillas_km
- ✅ escobillas_fecha
- ✅ escobillas_modelo
- ❌ escobillas_intervalo (FALTA)

**Filtro Secador:**
- ✅ filtro_secador_km
- ✅ filtro_secador_fecha
- ✅ filtro_secador_modelo
- ❌ filtro_secador_intervalo (FALTA)

**Filtro Aire Secundario:**
- ✅ filtro_aire_secundario_km
- ✅ filtro_aire_secundario_fecha
- ✅ filtro_aire_secundario_modelo
- ❌ filtro_aire_secundario_intervalo (FALTA)

**Trampa de Agua:**
- ✅ trampa_agua_km
- ✅ trampa_agua_fecha
- ✅ trampa_agua_modelo
- ❌ trampa_agua_intervalo (FALTA)

## Resumen de Acciones Necesarias

### 1. Agregar columnas de intervalo (FALTA EN ~40 COMPONENTES)

Todos los componentes necesitan `{componente}_intervalo` excepto:
- ✅ aceite_motor (ya tiene intervalo_cambio_aceite)
- ✅ rotacion_neumaticos (ya tiene intervalo_rotacion_neumaticos)

### 2. Completar componentes incompletos

- **Filtro Aceite Motor**: Agregar _km, _fecha, _intervalo
- **Neumáticos individuales**: Agregar _modelo para cada uno (A-F)
- **Alineación**: Agregar _modelo, _intervalo
- **Rotación**: Agregar _modelo

### 3. Estandarizar nombres (opcional pero recomendado)

- `aceite_transmicion` → `aceite_transmision`
- `suspencion` → `suspension`
- `intervalo_cambio_aceite` → `aceite_motor_intervalo`
- `intervalo_rotacion_neumaticos` → `rotacion_neumaticos_intervalo`

### 4. Componentes que podrían faltar (según necesidades)

Ejemplos de componentes comunes que NO están:
- Polea loca
- Kit de distribución
- Rodamientos
- Rótulas
- Brazos de suspensión
- Bujías
- Cables de bujía
- Bobina de encendido
- Alternador
- Motor de arranque
- Compresor A/C
- Radiador
- Termostato
- Válvula EGR
- Sensor MAF/MAP
- Sensor O2

## Total de Columnas a Agregar

- **Columnas de intervalo**: ~38 columnas
- **Columnas faltantes en existentes**: ~10 columnas
- **TOTAL**: ~48 columnas nuevas para completar el esquema actual
