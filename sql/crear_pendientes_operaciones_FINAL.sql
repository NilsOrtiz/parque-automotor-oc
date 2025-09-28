-- Crear tabla para pendientes que ve operaciones - VERSIÓN FINAL CORREGIDA
-- Esta tabla será poblada automáticamente desde datos de mantenimientos
-- y editable directamente por taller desde Supabase

-- Primero crear la secuencia
CREATE SEQUENCE IF NOT EXISTS public.pendientes_operaciones_id_seq
    AS bigint
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

-- Ahora crear la tabla
CREATE TABLE IF NOT EXISTS public.pendientes_operaciones (
  id bigint NOT NULL DEFAULT nextval('pendientes_operaciones_id_seq'::regclass),
  vehiculo_id bigint NOT NULL,
  interno bigint,
  placa text NOT NULL,
  trasladar_a text DEFAULT 'Taller',
  tiempo_estimado text DEFAULT '4-6 horas',
  motivo text DEFAULT 'Service + Revisión',
  criticidad text DEFAULT 'critico' CHECK (criticidad = ANY (ARRAY['leve'::text, 'medio'::text, 'critico'::text])),
  porcentaje_vida_km numeric(5,2),
  porcentaje_vida_hr numeric(5,2),
  km_faltantes integer,
  hr_faltantes integer,
  estado text DEFAULT 'pendiente' CHECK (estado = ANY (ARRAY['pendiente'::text, 'programado'::text, 'en_proceso'::text, 'completado'::text])),
  es_automatico boolean DEFAULT true,
  fecha_creacion timestamp with time zone DEFAULT now(),
  fecha_actualizacion timestamp with time zone DEFAULT now(),
  observaciones text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT pendientes_operaciones_pkey PRIMARY KEY (id),
  CONSTRAINT pendientes_operaciones_vehiculo_id_fkey FOREIGN KEY (vehiculo_id) REFERENCES public.vehiculos(id)
);

-- Asignar la secuencia a la columna id
ALTER SEQUENCE public.pendientes_operaciones_id_seq OWNED BY public.pendientes_operaciones.id;

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_pendientes_operaciones_vehiculo_id ON public.pendientes_operaciones(vehiculo_id);
CREATE INDEX IF NOT EXISTS idx_pendientes_operaciones_interno ON public.pendientes_operaciones(interno);
CREATE INDEX IF NOT EXISTS idx_pendientes_operaciones_placa ON public.pendientes_operaciones(placa);
CREATE INDEX IF NOT EXISTS idx_pendientes_operaciones_estado ON public.pendientes_operaciones(estado);
CREATE INDEX IF NOT EXISTS idx_pendientes_operaciones_criticidad ON public.pendientes_operaciones(criticidad);
CREATE INDEX IF NOT EXISTS idx_pendientes_operaciones_es_automatico ON public.pendientes_operaciones(es_automatico);

-- Trigger para actualizar fecha_actualizacion
CREATE OR REPLACE FUNCTION public.update_pendientes_operaciones_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.fecha_actualizacion = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_pendientes_operaciones_updated_at ON public.pendientes_operaciones;
CREATE TRIGGER update_pendientes_operaciones_updated_at
  BEFORE UPDATE ON public.pendientes_operaciones
  FOR EACH ROW
  EXECUTE FUNCTION public.update_pendientes_operaciones_updated_at();

-- Comentarios para documentar la tabla
COMMENT ON TABLE public.pendientes_operaciones IS 'Tabla que almacena los pendientes de mantenimiento para operaciones. Poblada automáticamente desde criterios de mantenimiento críticos y editable por taller';
COMMENT ON COLUMN public.pendientes_operaciones.vehiculo_id IS 'ID del vehículo (referencia a tabla vehiculos)';
COMMENT ON COLUMN public.pendientes_operaciones.interno IS 'Número interno del vehículo (copiado para facilidad de consulta)';
COMMENT ON COLUMN public.pendientes_operaciones.placa IS 'Placa del vehículo (copiado para facilidad de consulta)';
COMMENT ON COLUMN public.pendientes_operaciones.trasladar_a IS 'Destino donde llevar el vehículo (ej: Taller, IDISA, etc.)';
COMMENT ON COLUMN public.pendientes_operaciones.tiempo_estimado IS 'Tiempo estimado que tomará el trabajo (editable por taller)';
COMMENT ON COLUMN public.pendientes_operaciones.motivo IS 'Descripción del motivo del mantenimiento';
COMMENT ON COLUMN public.pendientes_operaciones.criticidad IS 'Nivel de criticidad: leve, medio, critico';
COMMENT ON COLUMN public.pendientes_operaciones.porcentaje_vida_km IS 'Porcentaje de vida útil restante por kilometraje';
COMMENT ON COLUMN public.pendientes_operaciones.porcentaje_vida_hr IS 'Porcentaje de vida útil restante por horas';
COMMENT ON COLUMN public.pendientes_operaciones.km_faltantes IS 'Kilómetros faltantes para el próximo service';
COMMENT ON COLUMN public.pendientes_operaciones.hr_faltantes IS 'Horas faltantes para el próximo service';
COMMENT ON COLUMN public.pendientes_operaciones.estado IS 'Estado del pendiente: pendiente, programado, en_proceso, completado';
COMMENT ON COLUMN public.pendientes_operaciones.es_automatico IS 'true si fue creado automáticamente, false si fue creado manualmente';
COMMENT ON COLUMN public.pendientes_operaciones.observaciones IS 'Observaciones adicionales editables por taller';