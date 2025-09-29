-- Agregar campos de programación a pendientes_operaciones
-- Para que operaciones pueda definir CUÁNDO realizar el mantenimiento

-- 1. Agregar campos de programación
ALTER TABLE public.pendientes_operaciones
ADD COLUMN IF NOT EXISTS fecha_programada DATE,
ADD COLUMN IF NOT EXISTS turno_programado TEXT CHECK (turno_programado IN ('mañana', 'tarde')),
ADD COLUMN IF NOT EXISTS programado_por TEXT DEFAULT 'Operaciones',
ADD COLUMN IF NOT EXISTS fecha_programacion TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS notas_programacion TEXT;

-- 2. Comentarios para documentar los nuevos campos
COMMENT ON COLUMN public.pendientes_operaciones.fecha_programada IS 'Fecha en que se programó realizar el mantenimiento';
COMMENT ON COLUMN public.pendientes_operaciones.turno_programado IS 'Turno programado: mañana o tarde';
COMMENT ON COLUMN public.pendientes_operaciones.programado_por IS 'Usuario que programó el mantenimiento';
COMMENT ON COLUMN public.pendientes_operaciones.fecha_programacion IS 'Fecha/hora cuando se hizo la programación';
COMMENT ON COLUMN public.pendientes_operaciones.notas_programacion IS 'Notas adicionales sobre la programación';

-- 3. Crear índices para mejorar rendimiento en consultas de programación
CREATE INDEX IF NOT EXISTS idx_pendientes_operaciones_fecha_programada
ON public.pendientes_operaciones(fecha_programada)
WHERE fecha_programada IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_pendientes_operaciones_turno
ON public.pendientes_operaciones(turno_programado)
WHERE turno_programado IS NOT NULL;

-- 4. Verificar que se agregaron correctamente
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'pendientes_operaciones'
AND column_name IN ('fecha_programada', 'turno_programado', 'programado_por', 'fecha_programacion', 'notas_programacion')
ORDER BY column_name;

-- 5. Mensaje de confirmación
SELECT 'Campos de programación agregados exitosamente a pendientes_operaciones' as mensaje;