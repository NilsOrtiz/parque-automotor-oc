-- Actualizar campos de programación para que coincidan con el nuevo diseño
-- Este script limpia campos anteriores y agrega los correctos

-- 1. Eliminar campos anteriores si existen (de la versión anterior)
ALTER TABLE public.pendientes_operaciones
DROP COLUMN IF EXISTS hora_programada;

-- 2. Modificar fecha_programada a DATE si es TIMESTAMP
ALTER TABLE public.pendientes_operaciones
ALTER COLUMN fecha_programada TYPE DATE;

-- 3. Agregar campo turno_programado si no existe
ALTER TABLE public.pendientes_operaciones
ADD COLUMN IF NOT EXISTS turno_programado TEXT CHECK (turno_programado IN ('mañana', 'tarde'));

-- 4. Agregar otros campos si no existen
ALTER TABLE public.pendientes_operaciones
ADD COLUMN IF NOT EXISTS programado_por TEXT DEFAULT 'Operaciones',
ADD COLUMN IF NOT EXISTS fecha_programacion TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS notas_programacion TEXT;

-- 5. Comentarios actualizados
COMMENT ON COLUMN public.pendientes_operaciones.fecha_programada IS 'Fecha en que se programó realizar el mantenimiento';
COMMENT ON COLUMN public.pendientes_operaciones.turno_programado IS 'Turno programado: mañana o tarde';
COMMENT ON COLUMN public.pendientes_operaciones.programado_por IS 'Usuario que programó el mantenimiento';
COMMENT ON COLUMN public.pendientes_operaciones.fecha_programacion IS 'Fecha/hora cuando se hizo la programación';
COMMENT ON COLUMN public.pendientes_operaciones.notas_programacion IS 'Notas adicionales sobre la programación';

-- 6. Índices
CREATE INDEX IF NOT EXISTS idx_pendientes_operaciones_fecha_programada
ON public.pendientes_operaciones(fecha_programada)
WHERE fecha_programada IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_pendientes_operaciones_turno
ON public.pendientes_operaciones(turno_programado)
WHERE turno_programado IS NOT NULL;

-- 7. Verificar estructura final
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'pendientes_operaciones'
AND column_name IN ('fecha_programada', 'turno_programado', 'programado_por', 'fecha_programacion', 'notas_programacion')
ORDER BY column_name;

SELECT 'Campos de programación actualizados correctamente' as mensaje;