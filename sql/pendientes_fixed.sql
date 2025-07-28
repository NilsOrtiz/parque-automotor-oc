-- Estructura final para pendientes - Opción A (FIXED)
-- Pendientes = Solo problemas ACTIVOS
-- Historial = Solo trabajos COMPLETADOS
-- Al resolver: DELETE de pendientes + INSERT en historial

-- 1. Agregar nuevas columnas a pendientes_observaciones
ALTER TABLE pendientes_observaciones 
ADD COLUMN IF NOT EXISTS tiempo_estimado INTEGER; -- en horas

ALTER TABLE pendientes_observaciones 
ADD COLUMN IF NOT EXISTS prioridad VARCHAR(10) DEFAULT 'medio'; -- leve, medio, critico

-- 2. Agregar comentarios para documentar el propósito
COMMENT ON TABLE pendientes_observaciones IS 'Problemas ACTIVOS que necesitan ser resueltos';
COMMENT ON COLUMN pendientes_observaciones.prioridad IS 'Nivel de prioridad: leve, medio, critico';
COMMENT ON COLUMN pendientes_observaciones.tiempo_estimado IS 'Tiempo estimado de reparación en horas';
COMMENT ON COLUMN pendientes_observaciones.criticidad IS 'Campo legacy - usar prioridad en su lugar';

COMMENT ON TABLE historial IS 'Trabajos COMPLETADOS - registro histórico permanente';

-- 3. Crear índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_pendientes_prioridad 
ON pendientes_observaciones(prioridad);

CREATE INDEX IF NOT EXISTS idx_pendientes_tiempo_estimado 
ON pendientes_observaciones(tiempo_estimado);

CREATE INDEX IF NOT EXISTS idx_pendientes_estado 
ON pendientes_observaciones(estado);

-- 4. Actualizar datos existentes (migración)
-- Mapear criticidad antigua a nueva prioridad
UPDATE pendientes_observaciones 
SET prioridad = CASE 
    WHEN criticidad = 'alta' THEN 'critico'
    WHEN criticidad = 'media' THEN 'medio' 
    WHEN criticidad = 'baja' THEN 'leve'
    ELSE 'medio'
END
WHERE prioridad IS NULL;

-- 5. Agregar constraints para validar datos (SIN IF NOT EXISTS)
-- Verificar si ya existe antes de crear
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_prioridad' 
        AND table_name = 'pendientes_observaciones'
    ) THEN
        ALTER TABLE pendientes_observaciones 
        ADD CONSTRAINT check_prioridad 
        CHECK (prioridad IN ('leve', 'medio', 'critico'));
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_tiempo_estimado' 
        AND table_name = 'pendientes_observaciones'
    ) THEN
        ALTER TABLE pendientes_observaciones 
        ADD CONSTRAINT check_tiempo_estimado 
        CHECK (tiempo_estimado > 0);
    END IF;
END $$;

-- 6. Crear función para resolver pendiente y moverlo a historial
CREATE OR REPLACE FUNCTION resolver_pendiente(
    p_id_pendiente INTEGER,
    p_descripcion_trabajo TEXT,
    p_items TEXT DEFAULT NULL,
    p_mecanico TEXT DEFAULT 'No especificado'
) RETURNS INTEGER AS $$
DECLARE
    pendiente_record RECORD;
    new_historial_id INTEGER;
BEGIN
    -- 1. Obtener datos del pendiente
    SELECT * INTO pendiente_record 
    FROM pendientes_observaciones 
    WHERE id_pendiente = p_id_pendiente;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Pendiente % no encontrado', p_id_pendiente;
    END IF;
    
    -- 2. Crear registro en historial
    INSERT INTO historial (
        id, 
        clasificacion, 
        subclasificacion, 
        descripcion, 
        items, 
        fecha_servicio,
        created_at
    ) VALUES (
        pendiente_record.id,
        pendiente_record.clasificacion,
        pendiente_record.subclasificacion,
        p_descripcion_trabajo,
        p_items,
        CURRENT_DATE,
        CURRENT_TIMESTAMP
    ) RETURNING id_historial INTO new_historial_id;
    
    -- 3. Eliminar de pendientes
    DELETE FROM pendientes_observaciones 
    WHERE id_pendiente = p_id_pendiente;
    
    RETURN new_historial_id;
END;
$$ LANGUAGE plpgsql;

-- 7. Comentar la función
COMMENT ON FUNCTION resolver_pendiente IS 'Mueve un pendiente resuelto a historial y lo elimina de pendientes';

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

-- Consulta para ver estadísticas de pendientes por prioridad
SELECT 'Estadísticas de pendientes por prioridad:' as mensaje;
SELECT 
    prioridad,
    COUNT(*) as cantidad,
    AVG(tiempo_estimado) as tiempo_promedio_hrs
FROM pendientes_observaciones 
WHERE estado != 'completado' OR estado IS NULL
GROUP BY prioridad
ORDER BY 
    CASE prioridad 
        WHEN 'critico' THEN 1 
        WHEN 'medio' THEN 2 
        WHEN 'leve' THEN 3 
    END;