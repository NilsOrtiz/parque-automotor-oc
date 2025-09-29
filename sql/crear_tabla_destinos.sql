-- Tabla para gestionar destinos de migración de forma dinámica
-- Permite agregar/quitar destinos sin modificar código

CREATE TABLE IF NOT EXISTS public.destinos_migracion (
    id SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL UNIQUE,
    icono TEXT DEFAULT '🔧',
    descripcion TEXT,
    activo BOOLEAN DEFAULT true,
    orden INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Comentarios para documentar
COMMENT ON TABLE public.destinos_migracion IS 'Destinos disponibles para migración de pendientes desde taller a operaciones';
COMMENT ON COLUMN public.destinos_migracion.nombre IS 'Nombre único del destino (ej: "Taller", "IDISA")';
COMMENT ON COLUMN public.destinos_migracion.icono IS 'Emoji o icono para mostrar en la UI';
COMMENT ON COLUMN public.destinos_migracion.descripcion IS 'Descripción explicativa del destino';
COMMENT ON COLUMN public.destinos_migracion.activo IS 'Si está activo aparece en la lista de opciones';
COMMENT ON COLUMN public.destinos_migracion.orden IS 'Orden de aparición en la UI (menor = primero)';

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_destinos_activos
ON public.destinos_migracion(activo, orden) WHERE activo = true;

CREATE INDEX IF NOT EXISTS idx_destinos_nombre
ON public.destinos_migracion(nombre);

-- Insertar destinos por defecto
INSERT INTO public.destinos_migracion (nombre, icono, descripcion, orden) VALUES
('Taller', '🔧', 'Trabajo interno en nuestro taller', 1),
('IDISA', '🏭', 'Enviar a taller IDISA', 2),
('Taller Externo', '🔧', 'Taller externo especializado', 3),
('Taller Especializado', '⚡', 'Para trabajos complejos específicos', 4)
ON CONFLICT (nombre) DO NOTHING;

-- Función para obtener destinos activos ordenados
CREATE OR REPLACE FUNCTION public.obtener_destinos_activos()
RETURNS TABLE(
    id INTEGER,
    nombre TEXT,
    icono TEXT,
    descripcion TEXT,
    orden INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        dm.id,
        dm.nombre,
        dm.icono,
        dm.descripcion,
        dm.orden
    FROM public.destinos_migracion dm
    WHERE dm.activo = true
    ORDER BY dm.orden ASC, dm.nombre ASC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.obtener_destinos_activos IS 'Retorna lista de destinos activos ordenados para usar en la UI';

-- Función para gestionar destinos (CRUD)
CREATE OR REPLACE FUNCTION public.gestionar_destino(
    p_accion TEXT, -- 'crear', 'actualizar', 'activar', 'desactivar', 'eliminar'
    p_id INTEGER DEFAULT NULL,
    p_nombre TEXT DEFAULT NULL,
    p_icono TEXT DEFAULT '🔧',
    p_descripcion TEXT DEFAULT NULL,
    p_orden INTEGER DEFAULT 1
)
RETURNS JSON AS $$
DECLARE
    resultado JSON;
    destino_id INTEGER;
BEGIN
    CASE p_accion
        WHEN 'crear' THEN
            -- Crear nuevo destino
            IF p_nombre IS NULL THEN
                resultado := json_build_object(
                    'success', false,
                    'message', 'El nombre es requerido para crear un destino'
                );
                RETURN resultado;
            END IF;

            INSERT INTO public.destinos_migracion (nombre, icono, descripcion, orden)
            VALUES (p_nombre, p_icono, p_descripcion, p_orden)
            RETURNING id INTO destino_id;

            resultado := json_build_object(
                'success', true,
                'message', 'Destino creado exitosamente',
                'id', destino_id,
                'nombre', p_nombre
            );

        WHEN 'actualizar' THEN
            -- Actualizar destino existente
            IF p_id IS NULL THEN
                resultado := json_build_object(
                    'success', false,
                    'message', 'El ID es requerido para actualizar'
                );
                RETURN resultado;
            END IF;

            UPDATE public.destinos_migracion
            SET
                nombre = COALESCE(p_nombre, nombre),
                icono = COALESCE(p_icono, icono),
                descripcion = COALESCE(p_descripcion, descripcion),
                orden = COALESCE(p_orden, orden),
                updated_at = now()
            WHERE id = p_id;

            resultado := json_build_object(
                'success', true,
                'message', 'Destino actualizado exitosamente',
                'id', p_id
            );

        WHEN 'activar' THEN
            -- Activar destino
            UPDATE public.destinos_migracion
            SET activo = true, updated_at = now()
            WHERE id = p_id;

            resultado := json_build_object(
                'success', true,
                'message', 'Destino activado exitosamente',
                'id', p_id
            );

        WHEN 'desactivar' THEN
            -- Desactivar destino (no eliminar para mantener histórico)
            UPDATE public.destinos_migracion
            SET activo = false, updated_at = now()
            WHERE id = p_id;

            resultado := json_build_object(
                'success', true,
                'message', 'Destino desactivado exitosamente',
                'id', p_id
            );

        WHEN 'eliminar' THEN
            -- Eliminar completamente (solo si no hay registros relacionados)
            DELETE FROM public.destinos_migracion
            WHERE id = p_id;

            resultado := json_build_object(
                'success', true,
                'message', 'Destino eliminado exitosamente',
                'id', p_id
            );

        ELSE
            resultado := json_build_object(
                'success', false,
                'message', 'Acción no válida: ' || p_accion
            );
    END CASE;

    RETURN resultado;

EXCEPTION WHEN OTHERS THEN
    resultado := json_build_object(
        'success', false,
        'message', 'Error: ' || SQLERRM
    );
    RETURN resultado;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.gestionar_destino IS 'Función CRUD para gestionar destinos de migración';

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION public.actualizar_timestamp_destinos()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_actualizar_destinos ON public.destinos_migracion;
CREATE TRIGGER trigger_actualizar_destinos
    BEFORE UPDATE ON public.destinos_migracion
    FOR EACH ROW
    EXECUTE FUNCTION public.actualizar_timestamp_destinos();

-- Verificar instalación
SELECT 'Tabla de destinos creada exitosamente' as mensaje;
SELECT * FROM public.obtener_destinos_activos();