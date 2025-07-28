-- Limpiar todos los constraints de prioridad y recrear correctamente

-- 1. Ver todos los constraints actuales
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'pendientes_observaciones' 
AND constraint_type = 'CHECK';

-- 2. Eliminar TODOS los constraints de prioridad que puedan existir
ALTER TABLE pendientes_observaciones 
DROP CONSTRAINT IF EXISTS check_prioridad;

ALTER TABLE pendientes_observaciones 
DROP CONSTRAINT IF EXISTS pendientes_observaciones_prioridad_check;

-- Buscar cualquier otro constraint que contenga "prioridad"
DO $$
DECLARE
    constraint_name_var TEXT;
BEGIN
    FOR constraint_name_var IN 
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_name = 'pendientes_observaciones' 
        AND constraint_type = 'CHECK'
        AND constraint_name LIKE '%prioridad%'
    LOOP
        EXECUTE 'ALTER TABLE pendientes_observaciones DROP CONSTRAINT IF EXISTS ' || constraint_name_var;
    END LOOP;
END $$;

-- 3. Limpiar datos que no cumplan el nuevo constraint
UPDATE pendientes_observaciones 
SET prioridad = 'medio' 
WHERE prioridad NOT IN ('leve', 'medio', 'critico') OR prioridad IS NULL;

-- 4. Agregar el constraint correcto con nombre único
ALTER TABLE pendientes_observaciones 
ADD CONSTRAINT pendientes_prioridad_check_new 
CHECK (prioridad IN ('leve', 'medio', 'critico'));

-- 5. Verificar que todo esté bien
SELECT 'Constraints actuales:' as mensaje;
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'pendientes_observaciones' 
AND constraint_type = 'CHECK';

-- 6. Probar inserción (comentado por seguridad)
-- INSERT INTO pendientes_observaciones (
--     id, clasificacion, descripcion, criticidad, prioridad, estado, fecha_creacion
-- ) VALUES (
--     999, 'Motor', 'Prueba de inserción', 'media', 'medio', 'pendiente', CURRENT_DATE
-- );

SELECT 'Script completado exitosamente' as resultado;