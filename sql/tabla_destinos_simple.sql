-- Tabla simple para gestionar destinos de migración
-- Editable directamente desde Supabase Table Editor

CREATE TABLE IF NOT EXISTS public.destinos_migracion (
    id SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL UNIQUE,
    icono TEXT DEFAULT '🔧',
    descripcion TEXT,
    activo BOOLEAN DEFAULT true,
    orden INTEGER DEFAULT 1
);

-- Comentarios para documentar
COMMENT ON TABLE public.destinos_migracion IS 'Destinos para migración de pendientes - EDITABLE desde Table Editor';
COMMENT ON COLUMN public.destinos_migracion.nombre IS 'Nombre del destino (ej: "Taller", "IDISA")';
COMMENT ON COLUMN public.destinos_migracion.icono IS 'Emoji para mostrar en la UI';
COMMENT ON COLUMN public.destinos_migracion.descripcion IS 'Descripción del destino';
COMMENT ON COLUMN public.destinos_migracion.activo IS 'true = aparece en opciones, false = oculto';
COMMENT ON COLUMN public.destinos_migracion.orden IS 'Orden en la lista (menor = primero)';

-- Insertar destinos por defecto
INSERT INTO public.destinos_migracion (nombre, icono, descripcion, orden) VALUES
('Taller', '🔧', 'Trabajo interno en nuestro taller', 1),
('IDISA', '🏭', 'Enviar a taller IDISA', 2),
('Taller Externo', '🔧', 'Taller externo especializado', 3),
('Taller Especializado', '⚡', 'Para trabajos complejos específicos', 4)
ON CONFLICT (nombre) DO NOTHING;

-- Función simple para obtener destinos activos
CREATE OR REPLACE FUNCTION public.obtener_destinos_activos()
RETURNS TABLE(
    nombre TEXT,
    icono TEXT,
    descripcion TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT dm.nombre, dm.icono, dm.descripcion
    FROM public.destinos_migracion dm
    WHERE dm.activo = true
    ORDER BY dm.orden ASC, dm.nombre ASC;
END;
$$ LANGUAGE plpgsql;

-- Verificar que se creó correctamente
SELECT 'Tabla destinos_migracion creada exitosamente' as mensaje;
SELECT * FROM public.destinos_migracion ORDER BY orden;