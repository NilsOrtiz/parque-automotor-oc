-- Arreglar constraint de prioridad en pendientes_observaciones

-- 1. Primero eliminar el constraint problemático
ALTER TABLE pendientes_observaciones 
DROP CONSTRAINT IF EXISTS pendientes_observaciones_prioridad_check;

-- 2. Agregar el constraint correcto
ALTER TABLE pendientes_observaciones 
ADD CONSTRAINT check_prioridad 
CHECK (prioridad IN ('leve', 'medio', 'critico'));

-- 3. Verificar que los datos existentes cumplan el constraint
UPDATE pendientes_observaciones 
SET prioridad = 'medio' 
WHERE prioridad NOT IN ('leve', 'medio', 'critico') OR prioridad IS NULL;

-- 4. Verificar la estructura final
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'pendientes_observaciones' 
    AND column_name IN ('tiempo_estimado', 'prioridad');

-- 5. Probar inserción de prueba (opcional)
-- INSERT INTO pendientes_observaciones (
--     id, clasificacion, descripcion, criticidad, prioridad, estado, fecha_creacion
-- ) VALUES (
--     1, 'Motor', 'Prueba de inserción', 'media', 'medio', 'pendiente', CURRENT_DATE
-- );