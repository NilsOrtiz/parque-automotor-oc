-- Agregar columna capacidad_tanque_litros a la tabla vehiculos
-- Para análisis de combustible y cálculos de eficiencia

-- Agregar la columna
ALTER TABLE public.vehiculos 
ADD COLUMN capacidad_tanque_litros integer;

-- Agregar comentario para documentar el propósito
COMMENT ON COLUMN public.vehiculos.capacidad_tanque_litros 
IS 'Capacidad total del tanque de combustible en litros para cálculos de eficiencia y análisis';

-- Opcional: Agregar constraint para valores razonables (20-200 litros)
ALTER TABLE public.vehiculos 
ADD CONSTRAINT check_capacidad_tanque_valida 
CHECK (capacidad_tanque_litros IS NULL OR (capacidad_tanque_litros >= 20 AND capacidad_tanque_litros <= 500));