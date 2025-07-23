-- Script para agregar solo las columnas que faltan
-- Usar IF NOT EXISTS para evitar errores de duplicados

-- Verificar y agregar columnas del Filtro Secador
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vehiculos' AND column_name='filtro_secador_fecha') THEN
        ALTER TABLE public.vehiculos ADD COLUMN filtro_secador_fecha date;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vehiculos' AND column_name='filtro_secador_km') THEN
        ALTER TABLE public.vehiculos ADD COLUMN filtro_secador_km integer;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vehiculos' AND column_name='filtro_secador_modelo') THEN
        ALTER TABLE public.vehiculos ADD COLUMN filtro_secador_modelo text;
    END IF;
END $$;

-- Verificar y agregar columnas del Filtro de Aire Secundario
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vehiculos' AND column_name='filtro_aire_secundario_fecha') THEN
        ALTER TABLE public.vehiculos ADD COLUMN filtro_aire_secundario_fecha date;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vehiculos' AND column_name='filtro_aire_secundario_km') THEN
        ALTER TABLE public.vehiculos ADD COLUMN filtro_aire_secundario_km integer;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vehiculos' AND column_name='filtro_aire_secundario_modelo') THEN
        ALTER TABLE public.vehiculos ADD COLUMN filtro_aire_secundario_modelo text;
    END IF;
END $$;

-- Verificar y agregar columnas de Trampa de Agua
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vehiculos' AND column_name='trampa_agua_fecha') THEN
        ALTER TABLE public.vehiculos ADD COLUMN trampa_agua_fecha date;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vehiculos' AND column_name='trampa_agua_km') THEN
        ALTER TABLE public.vehiculos ADD COLUMN trampa_agua_km integer;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vehiculos' AND column_name='trampa_agua_modelo') THEN
        ALTER TABLE public.vehiculos ADD COLUMN trampa_agua_modelo text;
    END IF;
END $$;

-- Agregar comentarios para documentación (estos no fallan si ya existen)
COMMENT ON COLUMN public.vehiculos.filtro_secador_fecha IS 'Fecha del último cambio de filtro secador';
COMMENT ON COLUMN public.vehiculos.filtro_secador_km IS 'Kilometraje del último cambio de filtro secador';
COMMENT ON COLUMN public.vehiculos.filtro_secador_modelo IS 'Modelo/tipo del filtro secador';

COMMENT ON COLUMN public.vehiculos.filtro_aire_secundario_fecha IS 'Fecha del último cambio de filtro de aire secundario';
COMMENT ON COLUMN public.vehiculos.filtro_aire_secundario_km IS 'Kilometraje del último cambio de filtro de aire secundario';
COMMENT ON COLUMN public.vehiculos.filtro_aire_secundario_modelo IS 'Modelo/tipo del filtro de aire secundario';

COMMENT ON COLUMN public.vehiculos.trampa_agua_fecha IS 'Fecha del último cambio de trampa de agua';
COMMENT ON COLUMN public.vehiculos.trampa_agua_km IS 'Kilometraje del último cambio de trampa de agua';
COMMENT ON COLUMN public.vehiculos.trampa_agua_modelo IS 'Modelo/tipo de la trampa de agua';

-- Verificar qué columnas se agregaron exitosamente
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'vehiculos' 
AND column_name IN (
    'filtro_secador_fecha', 'filtro_secador_km', 'filtro_secador_modelo',
    'filtro_aire_secundario_fecha', 'filtro_aire_secundario_km', 'filtro_aire_secundario_modelo',
    'trampa_agua_fecha', 'trampa_agua_km', 'trampa_agua_modelo'
)
ORDER BY column_name;