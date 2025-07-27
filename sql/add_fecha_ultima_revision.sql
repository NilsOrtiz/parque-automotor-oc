-- Agregar campo fecha_ultima_revision a la tabla vehiculos para el sistema de revisiones mensuales

-- Agregar la columna si no existe
ALTER TABLE vehiculos 
ADD COLUMN IF NOT EXISTS fecha_ultima_revision DATE;

-- Agregar comentario para documentación
COMMENT ON COLUMN vehiculos.fecha_ultima_revision IS 'Fecha de la última revisión mensual del vehículo (cada 30 días)';

-- Crear índice para mejorar performance en consultas de revisiones
CREATE INDEX IF NOT EXISTS idx_vehiculos_fecha_ultima_revision 
ON vehiculos(fecha_ultima_revision);

-- Verificar que la columna se agregó correctamente
SELECT 
    column_name, 
    data_type, 
    is_nullable 
FROM information_schema.columns 
WHERE table_name = 'vehiculos' 
    AND column_name = 'fecha_ultima_revision';

-- Mostrar algunos ejemplos para verificar
SELECT 
    'Vehículos sin fecha de revisión:' as mensaje,
    COUNT(*) as cantidad
FROM vehiculos 
WHERE fecha_ultima_revision IS NULL;

-- Ejemplo de actualización manual (opcional, para testing)
-- UPDATE vehiculos 
-- SET fecha_ultima_revision = CURRENT_DATE - INTERVAL '15 days'
-- WHERE Nro_Interno = 1; -- Solo para testing