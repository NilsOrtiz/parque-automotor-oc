-- Script de migración para mover datos de vehiculos a las nuevas tablas normalizadas
-- IMPORTANTE: Ejecutar solo después de validar el esquema normalizado

-- Verificar estructura actual
SELECT 'Verificando tabla vehiculos actual...' as status;
SELECT count(*) as total_vehiculos FROM vehiculos;

-- 1. Migrar datos básicos a vehiculos_nuevos
INSERT INTO vehiculos_nuevos (
  placa, interno, marca, modelo, anio, tipo_vehiculo, 
  estado_operativo, fecha_ingreso, created_at
)
SELECT DISTINCT
  COALESCE(placa, 'SIN_PLACA_' || id::text) as placa,
  CASE WHEN interno > 0 THEN interno ELSE NULL END as interno,
  COALESCE(marca, 'No especificada') as marca,
  COALESCE(modelo, 'No especificado') as modelo,
  CASE WHEN anio > 1900 AND anio <= EXTRACT(YEAR FROM CURRENT_DATE) + 1 
       THEN anio ELSE NULL END as anio,
  COALESCE(tipo, 'Bus') as tipo_vehiculo, -- Asumir Bus por defecto
  'activo' as estado_operativo, -- Por defecto activo
  CURRENT_DATE as fecha_ingreso,
  CURRENT_TIMESTAMP as created_at
FROM vehiculos
WHERE id IS NOT NULL
ON CONFLICT (placa) DO NOTHING; -- Evitar duplicados

-- 2. Migrar especificaciones técnicas
INSERT INTO vehiculos_especificaciones (
  vehiculo_id, motor, combustible, transmision, cilindrada, 
  potencia, capacidad_pasajeros, peso_bruto, numero_chasis, numero_motor
)
SELECT 
  vn.id as vehiculo_id,
  v.motor,
  v.combustible,
  v.transmision,
  v.cilindrada,
  v.potencia,
  CASE WHEN v.capacidad_pasajeros > 0 THEN v.capacidad_pasajeros ELSE NULL END,
  CASE WHEN v.peso_bruto > 0 THEN v.peso_bruto ELSE NULL END,
  v.numero_chasis,
  v.numero_motor
FROM vehiculos v
JOIN vehiculos_nuevos vn ON (v.placa = vn.placa OR (v.interno = vn.interno AND v.interno > 0))
WHERE v.id IS NOT NULL;

-- 3. Migrar documentación legal
INSERT INTO vehiculos_documentacion (
  vehiculo_id, numero_poliza, compania_seguro, fecha_vencimiento_seguro,
  numero_habilitacion, fecha_vencimiento_habilitacion, numero_vtv, 
  fecha_vencimiento_vtv, titular_documento
)
SELECT 
  vn.id as vehiculo_id,
  v.numero_poliza,
  v.compania_seguro,
  CASE WHEN v.fecha_vencimiento_seguro::text ~ '^\d{4}-\d{2}-\d{2}' 
       THEN v.fecha_vencimiento_seguro::date ELSE NULL END,
  v.numero_habilitacion,
  CASE WHEN v.fecha_vencimiento_habilitacion::text ~ '^\d{4}-\d{2}-\d{2}' 
       THEN v.fecha_vencimiento_habilitacion::date ELSE NULL END,
  v.numero_vtv,
  CASE WHEN v.fecha_vencimiento_vtv::text ~ '^\d{4}-\d{2}-\d{2}' 
       THEN v.fecha_vencimiento_vtv::date ELSE NULL END,
  v.titular
FROM vehiculos v
JOIN vehiculos_nuevos vn ON (v.placa = vn.placa OR (v.interno = vn.interno AND v.interno > 0))
WHERE v.id IS NOT NULL;

-- 4. Migrar configuración de mantenimiento
INSERT INTO vehiculos_mantenimiento_config (
  vehiculo_id, tipo_aceite, intervalo_km, intervalo_horas,
  ultimo_cambio_km, ultimo_cambio_horas, fecha_ultimo_cambio,
  proximo_cambio_km, proximo_cambio_horas
)
SELECT 
  vn.id as vehiculo_id,
  v.tipo_aceite_motor,
  CASE WHEN v.intervalo_cambio_km > 0 THEN v.intervalo_cambio_km ELSE 10000 END,
  CASE WHEN v.intervalo_cambio_hr > 0 THEN v.intervalo_cambio_hr ELSE 250 END,
  COALESCE(v.aceite_motor_km, v.km_actual, 0),
  COALESCE(v.aceite_motor_hr, v.hr_actual, 0),
  CASE WHEN v.fecha_aceite_motor::text ~ '^\d{4}-\d{2}-\d{2}' 
       THEN v.fecha_aceite_motor::date ELSE CURRENT_DATE END,
  CASE WHEN v.km_actual > 0 AND v.intervalo_cambio_km > 0 
       THEN v.km_actual + v.intervalo_cambio_km 
       ELSE v.km_actual + 10000 END,
  CASE WHEN v.hr_actual > 0 AND v.intervalo_cambio_hr > 0 
       THEN v.hr_actual + v.intervalo_cambio_hr 
       ELSE v.hr_actual + 250 END
FROM vehiculos v
JOIN vehiculos_nuevos vn ON (v.placa = vn.placa OR (v.interno = vn.interno AND v.interno > 0))
WHERE v.id IS NOT NULL;

-- 5. Migrar estado actual
INSERT INTO vehiculos_estado_actual (
  vehiculo_id, kilometraje_actual, horas_actuales, 
  estado_combustible, observaciones
)
SELECT 
  vn.id as vehiculo_id,
  COALESCE(v.km_actual, 0),
  COALESCE(v.hr_actual, 0),
  v.estado_combustible,
  CASE WHEN LENGTH(TRIM(v.observaciones)) > 0 THEN v.observaciones ELSE NULL END
FROM vehiculos v
JOIN vehiculos_nuevos vn ON (v.placa = vn.placa OR (v.interno = vn.interno AND v.interno > 0))
WHERE v.id IS NOT NULL;

-- 6. Migrar costos (si existen campos de costos)
INSERT INTO vehiculos_costos (
  vehiculo_id, costo_adquisicion, valor_actual
)
SELECT 
  vn.id as vehiculo_id,
  CASE WHEN v.costo_adquisicion > 0 THEN v.costo_adquisicion ELSE NULL END,
  CASE WHEN v.valor_actual > 0 THEN v.valor_actual ELSE NULL END
FROM vehiculos v
JOIN vehiculos_nuevos vn ON (v.placa = vn.placa OR (v.interno = vn.interno AND v.interno > 0))
WHERE v.id IS NOT NULL 
  AND (v.costo_adquisicion > 0 OR v.valor_actual > 0);

-- 7. Migrar asignaciones actuales (si existen campos de chofer/ruta)
INSERT INTO vehiculos_asignaciones (
  vehiculo_id, chofer_asignado, ruta_asignada, fecha_asignacion, activa
)
SELECT 
  vn.id as vehiculo_id,
  v.chofer_asignado,
  v.ruta_asignada,
  COALESCE(v.fecha_asignacion::date, CURRENT_DATE),
  true
FROM vehiculos v
JOIN vehiculos_nuevos vn ON (v.placa = vn.placa OR (v.interno = vn.interno AND v.interno > 0))
WHERE v.id IS NOT NULL 
  AND (LENGTH(TRIM(v.chofer_asignado)) > 0 OR LENGTH(TRIM(v.ruta_asignada)) > 0);

-- Verificación final
SELECT 'Migración completada. Resumen:' as status;
SELECT 
  'vehiculos_nuevos' as tabla, count(*) as registros 
FROM vehiculos_nuevos
UNION ALL
SELECT 
  'vehiculos_especificaciones' as tabla, count(*) as registros 
FROM vehiculos_especificaciones
UNION ALL
SELECT 
  'vehiculos_documentacion' as tabla, count(*) as registros 
FROM vehiculos_documentacion
UNION ALL
SELECT 
  'vehiculos_mantenimiento_config' as tabla, count(*) as registros 
FROM vehiculos_mantenimiento_config
UNION ALL
SELECT 
  'vehiculos_estado_actual' as tabla, count(*) as registros 
FROM vehiculos_estado_actual
UNION ALL
SELECT 
  'vehiculos_costos' as tabla, count(*) as registros 
FROM vehiculos_costos
UNION ALL
SELECT 
  'vehiculos_asignaciones' as tabla, count(*) as registros 
FROM vehiculos_asignaciones;

-- Verificar datos migrados vs originales
SELECT 'Comparación total:' as status;
SELECT 
  'Original' as fuente, count(*) as total FROM vehiculos
UNION ALL
SELECT 
  'Migrado' as fuente, count(*) as total FROM vehiculos_nuevos;