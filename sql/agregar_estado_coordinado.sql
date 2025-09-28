-- Agregar estado "coordinado" para pendientes enviados a operaciones
-- Esto permite distinguir pendientes que ya fueron coordinados vs los que siguen pendientes

-- 1. Agregar el nuevo estado al constraint existente
ALTER TABLE pendientes_observaciones
DROP CONSTRAINT IF EXISTS check_estado;

ALTER TABLE pendientes_observaciones
ADD CONSTRAINT check_estado
CHECK (estado IN ('pendiente', 'en_progreso', 'completado', 'coordinado'));

-- 2. Agregar columna para tracking de coordinación
ALTER TABLE pendientes_observaciones
ADD COLUMN IF NOT EXISTS coordinado_con TEXT;

ALTER TABLE pendientes_observaciones
ADD COLUMN IF NOT EXISTS fecha_coordinacion TIMESTAMP WITH TIME ZONE;

-- 3. Comentarios para documentar
COMMENT ON COLUMN pendientes_observaciones.estado IS 'Estado del pendiente: pendiente, en_progreso, completado, coordinado (enviado a operaciones)';
COMMENT ON COLUMN pendientes_observaciones.coordinado_con IS 'Destino donde fue coordinado: Taller, IDISA, Taller Externo, etc.';
COMMENT ON COLUMN pendientes_observaciones.fecha_coordinacion IS 'Fecha cuando fue enviado a coordinación con operaciones';

-- 4. Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_pendientes_estado_coordinado
ON pendientes_observaciones(estado) WHERE estado = 'coordinado';

CREATE INDEX IF NOT EXISTS idx_pendientes_coordinado_con
ON pendientes_observaciones(coordinado_con) WHERE coordinado_con IS NOT NULL;

-- 5. Función para obtener estadísticas de coordinación
CREATE OR REPLACE FUNCTION public.estadisticas_coordinacion_pendientes()
RETURNS JSON AS $$
DECLARE
    resultado JSON;
BEGIN
    SELECT json_build_object(
        'total_pendientes', (
            SELECT COUNT(*) FROM pendientes_observaciones
        ),
        'pendientes_activos', (
            SELECT COUNT(*) FROM pendientes_observaciones
            WHERE estado IN ('pendiente', 'en_progreso')
        ),
        'pendientes_coordinados', (
            SELECT COUNT(*) FROM pendientes_observaciones
            WHERE estado = 'coordinado'
        ),
        'pendientes_completados', (
            SELECT COUNT(*) FROM pendientes_observaciones
            WHERE estado = 'completado'
        ),
        'coordinacion_por_destino', (
            SELECT json_object_agg(coordinado_con, cantidad)
            FROM (
                SELECT coordinado_con, COUNT(*) as cantidad
                FROM pendientes_observaciones
                WHERE estado = 'coordinado' AND coordinado_con IS NOT NULL
                GROUP BY coordinado_con
            ) sub
        ),
        'pendientes_por_prioridad', (
            SELECT json_object_agg(prioridad, cantidad)
            FROM (
                SELECT prioridad, COUNT(*) as cantidad
                FROM pendientes_observaciones
                WHERE estado IN ('pendiente', 'en_progreso')
                GROUP BY prioridad
            ) sub
        ),
        'timestamp', now()
    ) INTO resultado;

    RETURN resultado;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.estadisticas_coordinacion_pendientes IS 'Retorna estadísticas completas del estado de coordinación entre taller y operaciones';

-- Ejemplos de uso:
-- SELECT estadisticas_coordinacion_pendientes();
-- SELECT * FROM pendientes_observaciones WHERE estado = 'coordinado';
-- SELECT coordinado_con, COUNT(*) FROM pendientes_observaciones WHERE estado = 'coordinado' GROUP BY coordinado_con;