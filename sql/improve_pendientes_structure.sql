-- Mejoras a la estructura de pendientes y historial
-- Agregar tiempo estimado, prioridad mejorada y enlace con historial

-- 1. Agregar nuevas columnas a pendientes_observaciones
ALTER TABLE pendientes_observaciones 
ADD COLUMN IF NOT EXISTS tiempo_estimado INTEGER; -- en horas

ALTER TABLE pendientes_observaciones 
ADD COLUMN IF NOT EXISTS prioridad VARCHAR(10) DEFAULT 'medio'; -- leve, medio, critico

-- 2. Actualizar la columna criticidad existente para que sea consistente con prioridad
-- (Mantenemos ambas por compatibilidad, pero prioridad será la nueva)
COMMENT ON COLUMN pendientes_observaciones.criticidad IS 'Campo legacy - usar prioridad en su lugar';
COMMENT ON COLUMN pendientes_observaciones.prioridad IS 'Nivel de prioridad: leve, medio, critico';
COMMENT ON COLUMN pendientes_observaciones.tiempo_estimado IS 'Tiempo estimado de reparación en horas';

-- 3. Agregar enlace entre pendientes resueltos e historial
ALTER TABLE historial 
ADD COLUMN IF NOT EXISTS pendiente_origen_id INTEGER;

-- 4. Crear constraint de foreign key para el enlace
ALTER TABLE historial 
ADD CONSTRAINT IF NOT EXISTS fk_historial_pendiente 
FOREIGN KEY (pendiente_origen_id) REFERENCES pendientes_observaciones(id_pendiente)
ON DELETE SET NULL;

-- 5. Crear índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_pendientes_prioridad 
ON pendientes_observaciones(prioridad);

CREATE INDEX IF NOT EXISTS idx_pendientes_tiempo_estimado 
ON pendientes_observaciones(tiempo_estimado);

CREATE INDEX IF NOT EXISTS idx_historial_pendiente_origen 
ON historial(pendiente_origen_id);

-- 6. Actualizar datos existentes (migración)
-- Mapear criticidad antigua a nueva prioridad
UPDATE pendientes_observaciones 
SET prioridad = CASE 
    WHEN criticidad = 'alta' THEN 'critico'
    WHEN criticidad = 'media' THEN 'medio' 
    WHEN criticidad = 'baja' THEN 'leve'
    ELSE 'medio'
END
WHERE prioridad IS NULL;

-- 7. Agregar constraint para validar valores de prioridad
ALTER TABLE pendientes_observaciones 
ADD CONSTRAINT IF NOT EXISTS check_prioridad 
CHECK (prioridad IN ('leve', 'medio', 'critico'));

-- 8. Agregar constraint para validar tiempo estimado (debe ser positivo)
ALTER TABLE pendientes_observaciones 
ADD CONSTRAINT IF NOT EXISTS check_tiempo_estimado 
CHECK (tiempo_estimado > 0);

-- Verificación de la estructura actualizada
SELECT 'Verificación de columnas agregadas:' as mensaje;
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'pendientes_observaciones' 
    AND column_name IN ('tiempo_estimado', 'prioridad');

SELECT 'Verificación de enlace historial-pendientes:' as mensaje;
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'historial' 
    AND column_name = 'pendiente_origen_id';

-- Ejemplo de uso del enlace pendiente → historial
SELECT 'Ejemplo de consulta con enlace:' as mensaje;
SELECT 
    h.id_historial,
    h.descripcion as trabajo_realizado,
    h.fecha_servicio,
    p.descripcion as problema_original,
    p.prioridad,
    p.tiempo_estimado
FROM historial h
LEFT JOIN pendientes_observaciones p ON h.pendiente_origen_id = p.id_pendiente
LIMIT 5;