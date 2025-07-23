-- Agregar columnas para filtro secador, filtro aire secundario y trampa de agua
-- Cada filtro tiene: fecha, kilometraje y modelo

-- Filtro Secador
ALTER TABLE public.vehiculos ADD COLUMN filtro_secador_fecha date;
ALTER TABLE public.vehiculos ADD COLUMN filtro_secador_km integer;
ALTER TABLE public.vehiculos ADD COLUMN filtro_secador_modelo text;

-- Filtro de Aire Secundario
ALTER TABLE public.vehiculos ADD COLUMN filtro_aire_secundario_fecha date;
ALTER TABLE public.vehiculos ADD COLUMN filtro_aire_secundario_km integer;
ALTER TABLE public.vehiculos ADD COLUMN filtro_aire_secundario_modelo text;

-- Trampa de Agua
ALTER TABLE public.vehiculos ADD COLUMN trampa_agua_fecha date;
ALTER TABLE public.vehiculos ADD COLUMN trampa_agua_km integer;
ALTER TABLE public.vehiculos ADD COLUMN trampa_agua_modelo text;

-- Comentarios para documentación
COMMENT ON COLUMN public.vehiculos.filtro_secador_fecha IS 'Fecha del último cambio de filtro secador';
COMMENT ON COLUMN public.vehiculos.filtro_secador_km IS 'Kilometraje del último cambio de filtro secador';
COMMENT ON COLUMN public.vehiculos.filtro_secador_modelo IS 'Modelo/tipo del filtro secador';

COMMENT ON COLUMN public.vehiculos.filtro_aire_secundario_fecha IS 'Fecha del último cambio de filtro de aire secundario';
COMMENT ON COLUMN public.vehiculos.filtro_aire_secundario_km IS 'Kilometraje del último cambio de filtro de aire secundario';
COMMENT ON COLUMN public.vehiculos.filtro_aire_secundario_modelo IS 'Modelo/tipo del filtro de aire secundario';

COMMENT ON COLUMN public.vehiculos.trampa_agua_fecha IS 'Fecha del último cambio de trampa de agua';
COMMENT ON COLUMN public.vehiculos.trampa_agua_km IS 'Kilometraje del último cambio de trampa de agua';
COMMENT ON COLUMN public.vehiculos.trampa_agua_modelo IS 'Modelo/tipo de la trampa de agua';