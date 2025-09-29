-- ACTUALIZAR ESQUEMA PARA FRANJAS HORARIAS DETALLADAS
-- Cambiar de mañana/tarde a 6 franjas horarias específicas

-- 1. Agregar nueva columna para franjas horarias detalladas
ALTER TABLE public.pendientes_operaciones
ADD COLUMN IF NOT EXISTS franja_horaria_inicio text CHECK (franja_horaria_inicio IN ('08:00', '10:00', '12:00', '14:00', '16:00', '18:00'));

ALTER TABLE public.pendientes_operaciones
ADD COLUMN IF NOT EXISTS franja_horaria_fin text CHECK (franja_horaria_fin IN ('10:00', '12:00', '14:00', '16:00', '18:00', '20:00'));

-- 2. Agregar columna para duración en franjas (1-6 franjas)
ALTER TABLE public.pendientes_operaciones
ADD COLUMN IF NOT EXISTS duracion_franjas integer DEFAULT 1 CHECK (duracion_franjas BETWEEN 1 AND 6);

-- 3. Agregar columna para indicar si es trabajo continuo multi-día
ALTER TABLE public.pendientes_operaciones
ADD COLUMN IF NOT EXISTS es_trabajo_continuo boolean DEFAULT false;

-- 4. Agregar columna para fecha de finalización estimada
ALTER TABLE public.pendientes_operaciones
ADD COLUMN IF NOT EXISTS fecha_fin_estimada date;

-- 5. Migrar datos existentes de turno_programado a franjas horarias
UPDATE public.pendientes_operaciones
SET
  franja_horaria_inicio = CASE
    WHEN turno_programado = 'mañana' THEN '08:00'
    WHEN turno_programado = 'tarde' THEN '14:00'
    ELSE NULL
  END,
  franja_horaria_fin = CASE
    WHEN turno_programado = 'mañana' THEN '12:00'
    WHEN turno_programado = 'tarde' THEN '18:00'
    ELSE NULL
  END,
  duracion_franjas = CASE
    WHEN tiempo_estimado LIKE '%2 horas%' THEN 1
    WHEN tiempo_estimado LIKE '%6 horas%' THEN 3
    WHEN tiempo_estimado LIKE '%1 día%' THEN 6
    WHEN tiempo_estimado = 'Indeterminado' THEN 6 -- Máximo por defecto
    ELSE 3 -- Por defecto 6 horas = 3 franjas
  END,
  es_trabajo_continuo = CASE
    WHEN tiempo_estimado = 'Indeterminado' THEN true
    ELSE false
  END
WHERE turno_programado IS NOT NULL;

-- 6. Función helper para calcular franjas según tiempo estimado
CREATE OR REPLACE FUNCTION public.calcular_franjas_por_tiempo(tiempo_estimado text)
RETURNS integer AS $$
BEGIN
  RETURN CASE
    WHEN tiempo_estimado ILIKE '%30 minutos%' OR tiempo_estimado ILIKE '%1 hora%' THEN 1
    WHEN tiempo_estimado ILIKE '%2 horas%' THEN 1
    WHEN tiempo_estimado ILIKE '%3 horas%' OR tiempo_estimado ILIKE '%4 horas%' THEN 2
    WHEN tiempo_estimado ILIKE '%5 horas%' OR tiempo_estimado ILIKE '%6 horas%' THEN 3
    WHEN tiempo_estimado ILIKE '%7 horas%' OR tiempo_estimado ILIKE '%8 horas%' THEN 4
    WHEN tiempo_estimado ILIKE '%1 día%' OR tiempo_estimado ILIKE '%día%' THEN 6
    WHEN tiempo_estimado = 'Indeterminado' THEN 6
    ELSE 3 -- Por defecto 6 horas
  END;
END;
$$ LANGUAGE plpgsql;

-- 7. Función para calcular fecha de finalización
CREATE OR REPLACE FUNCTION public.calcular_fecha_fin(
  fecha_inicio date,
  franja_inicio text,
  duracion_franjas integer
) RETURNS date AS $$
DECLARE
  franjas_por_dia constant integer := 6;
  franja_inicio_num integer;
  total_franjas_restantes integer;
  dias_adicionales integer;
BEGIN
  -- Convertir franja de inicio a número (0-5)
  franja_inicio_num := CASE franja_inicio
    WHEN '08:00' THEN 0
    WHEN '10:00' THEN 1
    WHEN '12:00' THEN 2
    WHEN '14:00' THEN 3
    WHEN '16:00' THEN 4
    WHEN '18:00' THEN 5
    ELSE 0
  END;

  -- Calcular si se desborda del día actual
  total_franjas_restantes := duracion_franjas - (franjas_por_dia - franja_inicio_num);

  IF total_franjas_restantes <= 0 THEN
    -- Termina el mismo día
    RETURN fecha_inicio;
  ELSE
    -- Calcular días adicionales necesarios
    dias_adicionales := CEILING(total_franjas_restantes::float / franjas_por_dia::float);
    RETURN fecha_inicio + dias_adicionales;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 8. Actualizar fechas de finalización para registros existentes
UPDATE public.pendientes_operaciones
SET fecha_fin_estimada = public.calcular_fecha_fin(
  fecha_programada,
  franja_horaria_inicio,
  duracion_franjas
)
WHERE fecha_programada IS NOT NULL
AND franja_horaria_inicio IS NOT NULL;

-- 9. Comentarios
COMMENT ON COLUMN public.pendientes_operaciones.franja_horaria_inicio IS 'Hora de inicio de la franja (08:00, 10:00, 12:00, 14:00, 16:00, 18:00)';
COMMENT ON COLUMN public.pendientes_operaciones.franja_horaria_fin IS 'Hora de fin de la franja (10:00, 12:00, 14:00, 16:00, 18:00, 20:00)';
COMMENT ON COLUMN public.pendientes_operaciones.duracion_franjas IS 'Número de franjas de 2 horas que ocupa el trabajo (1-6)';
COMMENT ON COLUMN public.pendientes_operaciones.es_trabajo_continuo IS 'Indica si es un trabajo indeterminado que aparece todos los días';
COMMENT ON COLUMN public.pendientes_operaciones.fecha_fin_estimada IS 'Fecha estimada de finalización considerando la duración';

-- Verificación
SELECT 'Esquema actualizado con franjas horarias detalladas (6 franjas por día)' as mensaje;

SELECT
  COUNT(*) as total_registros,
  COUNT(franja_horaria_inicio) as con_franja_inicio,
  COUNT(duracion_franjas) as con_duracion,
  COUNT(fecha_fin_estimada) as con_fecha_fin
FROM public.pendientes_operaciones
WHERE fecha_programada IS NOT NULL;