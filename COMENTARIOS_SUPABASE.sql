-- ==========================================
-- DOCUMENTACIÓN DEL SISTEMA EN SUPABASE
-- Sistema de Pendientes Automáticos
-- ==========================================

-- Este archivo contiene comentarios explicativos del flujo completo
-- para recordar cómo funciona el sistema desde Supabase

-- ==========================================
-- 📊 TABLA PRINCIPAL: pendientes_operaciones
-- ==========================================

/*
PROPÓSITO:
- Almacena vehículos que requieren mantenimiento crítico (≤5% vida útil)
- Es poblada automáticamente por GitHub Actions
- Puede ser editada manualmente por taller desde Table Editor

CAMPOS EDITABLES POR TALLER:
- trasladar_a: "Taller" → "IDISA" / "Taller Externo"
- tiempo_estimado: "4-6 horas" → "8 horas" / "1 día"
- motivo: "Service + revisión" → "Reparación motor" / etc
- estado: "pendiente" → "programado" → "en_proceso" → "completado"
- observaciones: Agregar notas específicas

CAMPOS AUTOMÁTICOS (NO EDITAR):
- vehiculo_id, interno, placa: Datos del vehículo
- porcentaje_vida_km/hr: Cálculos automáticos
- es_automatico: true = creado por sistema, false = manual
- fechas: Timestamps de creación y actualización
*/

-- Ver pendientes actuales:
-- SELECT * FROM pendientes_operaciones ORDER BY fecha_creacion DESC;

-- ==========================================
-- ⚙️ FUNCIÓN PRINCIPAL: ejecutar_actualizacion_pendientes()
-- ==========================================

/*
PROPÓSITO:
- Es la función que GitHub Actions ejecuta automáticamente
- Analiza TODOS los vehículos de Cuenca del Plata
- Detecta los que tienen ≤5% vida útil (críticos)
- Los inserta en pendientes_operaciones

CUÁNDO SE EJECUTA:
- Automático: 3 veces al día via GitHub Actions (3 AM, 11 AM, 3 PM Argentina)
- Manual: Botón "Actualizar Automáticos" en /pendientes
- Manual: Ejecutar en SQL Editor: SELECT ejecutar_actualizacion_pendientes();

LO QUE HACE PASO A PASO:
1. Busca vehículos WHERE "Nro_Interno" > 0 (solo Cuenca del Plata)
2. Para cada vehículo calcula:
   - % vida útil por KM: (km_faltantes / intervalo) * 100
   - % vida útil por horas: (hr_faltantes / intervalo) * 100
3. Si cualquier % ≤ 5% → Lo marca como crítico
4. Borra registros automáticos anteriores (estado=pendiente)
5. Inserta nuevos registros críticos
6. Retorna JSON con resultado

CRITERIOS DE CRITICIDAD:
- ≤ 1%: "6-8 horas", "Service completo + revisión URGENTE"
- ≤ 3%: "4-6 horas", "Service + revisión"
- ≤ 5%: "4-6 horas", "Service + revisión"
*/

-- Ejecutar manualmente:
-- SELECT ejecutar_actualizacion_pendientes();

-- Ver resultado esperado:
-- {
--   "success": true,
--   "message": "Actualización completada exitosamente",
--   "registros_insertados": 3,
--   "timestamp": "2024-01-15T10:30:00Z"
-- }

-- ==========================================
-- 🔄 FLUJO DE AUTOMATIZACIÓN
-- ==========================================

/*
GITHUB ACTIONS → API ENDPOINT → FUNCIÓN SQL → TABLA → PÁGINA WEB
      ↓              ↓             ↓         ↓        ↓
   3 veces/día    recibe       ejecuta    guarda   muestra
                 petición      función    datos    a ops

DETALLES DEL FLUJO:

1. GITHUB ACTIONS (.github/workflows/actualizar-pendientes.yml)
   - Horarios: 06:00, 14:00, 18:00 UTC (3:00, 11:00, 15:00 Argentina)
   - Hace HTTP POST a: /api/cron/actualizar-pendientes

2. API CRON (src/app/api/cron/actualizar-pendientes/route.ts)
   - Recibe petición de GitHub Actions
   - Verifica token de autorización
   - Redirige a API principal

3. API PRINCIPAL (src/app/api/actualizar-pendientes/route.ts)
   - Ejecuta: supabase.rpc('ejecutar_actualizacion_pendientes')
   - Maneja errores y devuelve JSON

4. FUNCIÓN SQL (ejecutar_actualizacion_pendientes)
   - Hace los cálculos y detecta críticos
   - Actualiza tabla pendientes_operaciones

5. PÁGINA WEB (/pendientes)
   - Lee de pendientes_operaciones
   - Muestra lista para operaciones
   - Botón manual para forzar actualización
*/

-- ==========================================
-- 🛠️ COMANDOS ÚTILES PARA TALLER
-- ==========================================

-- Ver todos los pendientes:
-- SELECT
--   interno,
--   placa,
--   trasladar_a,
--   tiempo_estimado,
--   motivo,
--   estado,
--   observaciones,
--   es_automatico
-- FROM pendientes_operaciones
-- ORDER BY criticidad DESC, fecha_creacion ASC;

-- Ver solo pendientes automáticos críticos:
-- SELECT * FROM pendientes_operaciones
-- WHERE es_automatico = true AND estado = 'pendiente';

-- Marcar un pendiente como programado:
-- UPDATE pendientes_operaciones
-- SET estado = 'programado',
--     observaciones = 'Programado para mañana 8 AM'
-- WHERE id = 123;

-- Cambiar tiempo estimado:
-- UPDATE pendientes_operaciones
-- SET tiempo_estimado = '8 horas',
--     motivo = 'Service completo + reparación transmisión'
-- WHERE placa = 'ABC123';

-- Cambiar destino:
-- UPDATE pendientes_operaciones
-- SET trasladar_a = 'IDISA'
-- WHERE interno = 45;

-- Agregar pendiente manual:
-- INSERT INTO pendientes_operaciones
-- (vehiculo_id, interno, placa, trasladar_a, tiempo_estimado, motivo, criticidad, estado, es_automatico, observaciones)
-- VALUES
-- (123, 45, 'XYZ789', 'Taller Externo', '2 días', 'Reparación motor', 'critico', 'pendiente', false, 'Requiere presupuesto previo');

-- Limpiar todos los pendientes automáticos (CUIDADO):
-- DELETE FROM pendientes_operaciones WHERE es_automatico = true;

-- Ver vehículos que deberían ser críticos pero no están en pendientes:
-- SELECT v.*,
--        (v.kilometraje_actual - v.aceite_motor_km) as km_recorridos,
--        (COALESCE(v.intervalo_cambio_aceite, 10000) - (v.kilometraje_actual - v.aceite_motor_km)) as km_faltantes
-- FROM vehiculos v
-- WHERE v."Nro_Interno" > 0
--   AND v.kilometraje_actual IS NOT NULL
--   AND v.aceite_motor_km IS NOT NULL
--   AND ((COALESCE(v.intervalo_cambio_aceite, 10000) - (v.kilometraje_actual - v.aceite_motor_km))::numeric / COALESCE(v.intervalo_cambio_aceite, 10000)::numeric) * 100 <= 5
--   AND v.id NOT IN (SELECT vehiculo_id FROM pendientes_operaciones WHERE es_automatico = true);

-- ==========================================
-- 🚨 SOLUCIÓN DE PROBLEMAS
-- ==========================================

/*
PROBLEMA: No aparecen pendientes automáticos
SOLUCIÓN:
1. Ejecutar: SELECT ejecutar_actualizacion_pendientes();
2. Verificar que hay vehículos críticos en tabla vehiculos
3. Revisar logs de GitHub Actions

PROBLEMA: GitHub Actions falla
SOLUCIÓN:
1. Verificar secrets: APP_URL, CRON_SECRET_TOKEN
2. Probar API manualmente: curl -X POST https://parque-automotor-oc.vercel.app/api/actualizar-pendientes
3. Revisar logs del workflow en GitHub

PROBLEMA: Función SQL da error
SOLUCIÓN:
1. Verificar estructura de tabla vehiculos
2. Comprobar que nombres de campos tengan comillas: "Nro_Interno", "Placa"
3. Revisar permisos de la función

PROBLEMA: Pendientes duplicados
SOLUCIÓN:
1. La función debería limpiar automáticamente
2. Si persiste: DELETE FROM pendientes_operaciones WHERE es_automatico = true AND estado = 'pendiente';
3. Volver a ejecutar: SELECT ejecutar_actualizacion_pendientes();
*/

-- ==========================================
-- 📝 NOTAS PARA FUTURAS MODIFICACIONES
-- ==========================================

/*
PARA CAMBIAR CRITERIO DE CRITICIDAD:
- Modificar en función SQL: WHERE porcentaje <= 5
- Cambiar 5 por el nuevo porcentaje deseado

PARA AGREGAR NUEVOS DESTINOS:
- Solo editar campo trasladar_a en Table Editor
- No requiere cambios de código

PARA CAMBIAR HORARIOS:
- Modificar .github/workflows/actualizar-pendientes.yml
- Cambiar valores en "schedule" (formato cron)

PARA DESHABILITAR TEMPORALMENTE:
- En GitHub: Actions → Workflow → Disable workflow
- O comentar líneas de schedule en el archivo .yml

PARA AGREGAR NUEVOS CAMPOS:
- Modificar tabla: ALTER TABLE pendientes_operaciones ADD COLUMN nuevo_campo TEXT;
- Actualizar función SQL para poblar el nuevo campo
- Actualizar página web para mostrar el nuevo campo
*/