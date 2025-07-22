-- Agregar campo pdf_url a la tabla principal
ALTER TABLE public.ordenes_de_compra 
ADD COLUMN pdf_url TEXT;

-- Agregar campo pdf_url a la tabla de detalle por vehículo
ALTER TABLE public.ordenes_de_compra_por_vehiculo 
ADD COLUMN pdf_url TEXT;

-- Agregar comentarios para documentación
COMMENT ON COLUMN public.ordenes_de_compra.pdf_url IS 'URL pública del PDF generado en Supabase Storage';
COMMENT ON COLUMN public.ordenes_de_compra_por_vehiculo.pdf_url IS 'URL pública del PDF generado en Supabase Storage (mismo PDF para todas las versiones de una OC)';