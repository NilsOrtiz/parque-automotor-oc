-- Mejoras a la tabla historial para capturar datos críticos
-- Agregar kilometraje_al_servicio y problema_reportado_por

-- 1. Agregar columna para kilometraje al momento del servicio
ALTER TABLE historial 
ADD COLUMN IF NOT EXISTS kilometraje_al_servicio INTEGER;

-- 2. Agregar columna para identificar quién reportó el problema
ALTER TABLE historial 
ADD COLUMN IF NOT EXISTS problema_reportado_por VARCHAR(20);

-- 3. Agregar constraint para validar valores de problema_reportado_por
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_problema_reportado_por' 
        AND table_name = 'historial'
    ) THEN
        ALTER TABLE historial 
        ADD CONSTRAINT check_problema_reportado_por 
        CHECK (problema_reportado_por IN ('chofer', 'mecanico'));
    END IF;
END $$;

-- 4. Crear índices para mejorar consultas
CREATE INDEX IF NOT EXISTS idx_historial_kilometraje 
ON historial(kilometraje_al_servicio);

CREATE INDEX IF NOT EXISTS idx_historial_problema_reportado 
ON historial(problema_reportado_por);

-- 5. Agregar comentarios para documentación
COMMENT ON COLUMN historial.kilometraje_al_servicio IS 'Kilometraje del vehículo al momento de realizar el servicio';
COMMENT ON COLUMN historial.problema_reportado_por IS 'Quién reportó inicialmente el problema: chofer o mecanico';

-- 6. Actualizar registros existentes (opcional - establecer valores por defecto)
-- Marcar registros existentes como reportados por mecánico (valor conservador)
UPDATE historial 
SET problema_reportado_por = 'mecanico' 
WHERE problema_reportado_por IS NULL;

-- 7. Verificar estructura actualizada
SELECT 'Verificación de columnas agregadas:' as mensaje;
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'historial' 
    AND column_name IN ('kilometraje_al_servicio', 'problema_reportado_por');

-- 8. Mostrar estadísticas de la tabla actualizada
SELECT 'Estadísticas de historial:' as mensaje;
SELECT 
    COUNT(*) as total_servicios,
    COUNT(kilometraje_al_servicio) as con_kilometraje,
    COUNT(problema_reportado_por) as con_origen_problema
FROM historial;

-- 9. Estadísticas por tipo de reporte (después de la migración)
SELECT 'Servicios por origen del problema:' as mensaje;
SELECT 
    problema_reportado_por,
    COUNT(*) as cantidad,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM historial), 2) as porcentaje
FROM historial 
WHERE problema_reportado_por IS NOT NULL
GROUP BY problema_reportado_por
ORDER BY cantidad DESC;