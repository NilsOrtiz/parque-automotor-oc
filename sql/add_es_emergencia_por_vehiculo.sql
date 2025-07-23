-- Agregar la columna es_emergencia que falta en la tabla ordenes_de_compra_por_vehiculo
-- Esta columna es necesaria para mantener consistencia con la tabla principal

DO $$ 
BEGIN
    -- Verificar si la columna ya existe antes de agregarla
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ordenes_de_compra_por_vehiculo' AND column_name='es_emergencia') THEN
        ALTER TABLE public.ordenes_de_compra_por_vehiculo ADD COLUMN es_emergencia boolean DEFAULT false;
    END IF;
END $$;

-- Agregar comentario para documentación
COMMENT ON COLUMN public.ordenes_de_compra_por_vehiculo.es_emergencia IS 'Indica si la orden de compra es de emergencia (heredado de la OC principal)';

-- Verificar que la columna se agregó correctamente
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'ordenes_de_compra_por_vehiculo' 
AND column_name = 'es_emergencia';