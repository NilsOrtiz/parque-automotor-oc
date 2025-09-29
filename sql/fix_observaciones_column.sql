-- Arreglar error: column "observaciones" does not exist
-- Agregar columna observaciones a pendientes_observaciones si no existe

-- 1. Agregar columna observaciones
ALTER TABLE pendientes_observaciones
ADD COLUMN IF NOT EXISTS observaciones TEXT;

-- 2. Comentario para documentar
COMMENT ON COLUMN pendientes_observaciones.observaciones IS 'Notas adicionales y comentarios del pendiente';

-- 3. Verificar que se agregó correctamente
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'pendientes_observaciones'
AND column_name = 'observaciones';

-- 4. Si quieres ver todas las columnas de la tabla:
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'pendientes_observaciones'
-- ORDER BY ordinal_position;