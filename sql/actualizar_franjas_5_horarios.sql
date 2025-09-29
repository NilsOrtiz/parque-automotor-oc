-- ACTUALIZAR ESQUEMA PARA 5 FRANJAS HORARIAS (8:00 - 18:00)
-- Eliminar franja 18:00-20:00 ya que nadie trabaja en esa hora

-- 1. Actualizar constraints para 5 franjas
ALTER TABLE public.pendientes_operaciones
DROP CONSTRAINT IF EXISTS pendientes_operaciones_franja_horaria_inicio_check;

ALTER TABLE public.pendientes_operaciones
DROP CONSTRAINT IF EXISTS pendientes_operaciones_franja_horaria_fin_check;

ALTER TABLE public.pendientes_operaciones
ADD CONSTRAINT pendientes_operaciones_franja_horaria_inicio_check
CHECK (franja_horaria_inicio IN ('08:00', '10:00', '12:00', '14:00', '16:00'));

ALTER TABLE public.pendientes_operaciones
ADD CONSTRAINT pendientes_operaciones_franja_horaria_fin_check
CHECK (franja_horaria_fin IN ('10:00', '12:00', '14:00', '16:00', '18:00'));

-- 2. Actualizar constraint de duración para máximo 5 franjas
ALTER TABLE public.pendientes_operaciones
DROP CONSTRAINT IF EXISTS pendientes_operaciones_duracion_franjas_check;

ALTER TABLE public.pendientes_operaciones
ADD CONSTRAINT pendientes_operaciones_duracion_franjas_check
CHECK (duracion_franjas BETWEEN 1 AND 5);

-- 3. Migrar cualquier registro en franja 18:00-20:00 a 16:00-18:00
UPDATE public.pendientes_operaciones
SET
  franja_horaria_inicio = '16:00',
  franja_horaria_fin = '18:00'
WHERE franja_horaria_inicio = '18:00';

-- 4. Actualizar función de cálculo de franjas
CREATE OR REPLACE FUNCTION public.calcular_franjas_por_tiempo(tiempo_estimado text)
RETURNS integer AS $$
BEGIN
  RETURN CASE
    WHEN tiempo_estimado ILIKE '%30 minutos%' OR tiempo_estimado ILIKE '%1 hora%' THEN 1
    WHEN tiempo_estimado ILIKE '%2 horas%' THEN 1
    WHEN tiempo_estimado ILIKE '%3 horas%' OR tiempo_estimado ILIKE '%4 horas%' THEN 2
    WHEN tiempo_estimado ILIKE '%5 horas%' OR tiempo_estimado ILIKE '%6 horas%' THEN 3
    WHEN tiempo_estimado ILIKE '%7 horas%' OR tiempo_estimado ILIKE '%8 horas%' THEN 4
    WHEN tiempo_estimado ILIKE '%1 día%' OR tiempo_estimado ILIKE '%día%' THEN 5  -- Día completo = 5 franjas
    WHEN tiempo_estimado = 'Indeterminado' THEN 5
    ELSE 3 -- Por defecto 6 horas = 3 franjas
  END;
END;
$$ LANGUAGE plpgsql;

-- 5. Actualizar función de cálculo de fecha fin
CREATE OR REPLACE FUNCTION public.calcular_fecha_fin(
  fecha_inicio date,
  franja_inicio text,
  duracion_franjas integer
) RETURNS date AS $$
DECLARE
  franjas_por_dia constant integer := 5;  -- Ahora son 5 franjas por día
  franja_inicio_num integer;
  total_franjas_restantes integer;
  dias_adicionales integer;
BEGIN
  -- Convertir franja de inicio a número (0-4)
  franja_inicio_num := CASE franja_inicio
    WHEN '08:00' THEN 0
    WHEN '10:00' THEN 1
    WHEN '12:00' THEN 2
    WHEN '14:00' THEN 3
    WHEN '16:00' THEN 4
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

-- 6. Recalcular fechas de finalización con 5 franjas
UPDATE public.pendientes_operaciones
SET fecha_fin_estimada = public.calcular_fecha_fin(
  fecha_programada,
  franja_horaria_inicio,
  duracion_franjas
)
WHERE fecha_programada IS NOT NULL
AND franja_horaria_inicio IS NOT NULL
AND duracion_franjas IS NOT NULL;

-- 7. Actualizar comentarios
COMMENT ON COLUMN public.pendientes_operaciones.franja_horaria_inicio IS 'Hora de inicio de la franja (08:00, 10:00, 12:00, 14:00, 16:00) - 5 franjas de 8:00 a 18:00';
COMMENT ON COLUMN public.pendientes_operaciones.franja_horaria_fin IS 'Hora de fin de la franja (10:00, 12:00, 14:00, 16:00, 18:00) - 5 franjas de 8:00 a 18:00';
COMMENT ON COLUMN public.pendientes_operaciones.duracion_franjas IS 'Número de franjas de 2 horas que ocupa el trabajo (1-5, máximo día completo)';

-- Verificación
SELECT 'Esquema actualizado: 5 franjas horarias de 8:00 a 18:00' as mensaje;

SELECT
  franja_horaria_inicio,
  franja_horaria_fin,
  COUNT(*) as total_registros
FROM public.pendientes_operaciones
WHERE franja_horaria_inicio IS NOT NULL
GROUP BY franja_horaria_inicio, franja_horaria_fin
ORDER BY franja_horaria_inicio;