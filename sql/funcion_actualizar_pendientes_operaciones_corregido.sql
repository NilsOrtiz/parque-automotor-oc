-- Función para actualizar automáticamente la tabla pendientes_operaciones
-- VERSIÓN CORREGIDA PARA SUPABASE - basada en los criterios de mantenimiento críticos (≤5% vida útil)

CREATE OR REPLACE FUNCTION public.actualizar_pendientes_operaciones()
RETURNS integer AS $$
DECLARE
    vehiculo_record record;
    porcentaje_km numeric(5,2);
    porcentaje_hr numeric(5,2);
    km_faltantes integer;
    hr_faltantes integer;
    es_critico boolean;
    registros_insertados integer := 0;
    intervalo_km integer;
    intervalo_hr integer;
    km_recorridos integer;
    hr_recorridas integer;
    km_faltantes_calc integer;
    hr_faltantes_calc integer;
    tiempo_estimado_calc text;
    motivo_calc text;
    criticidad_calc text;
BEGIN
    -- Limpiar registros automáticos existentes que ya no son críticos
    DELETE FROM public.pendientes_operaciones
    WHERE es_automatico = true
    AND estado = 'pendiente';

    -- Recorrer todos los vehículos de Cuenca del Plata (que tienen número interno)
    FOR vehiculo_record IN
        SELECT * FROM public.vehiculos
        WHERE Nro_Interno IS NOT NULL
        AND Nro_Interno > 0
        ORDER BY Nro_Interno
    LOOP
        -- Inicializar variables
        porcentaje_km := NULL;
        porcentaje_hr := NULL;
        km_faltantes := NULL;
        hr_faltantes := NULL;
        es_critico := false;

        -- Calcular porcentaje de vida útil por kilómetros
        IF vehiculo_record.kilometraje_actual IS NOT NULL AND vehiculo_record.aceite_motor_km IS NOT NULL THEN
            -- Usar intervalo personalizado o 10000 km por defecto
            intervalo_km := COALESCE(vehiculo_record.intervalo_cambio_aceite, 10000);
            km_recorridos := vehiculo_record.kilometraje_actual - vehiculo_record.aceite_motor_km;
            km_faltantes_calc := intervalo_km - km_recorridos;

            km_faltantes := GREATEST(0, km_faltantes_calc);
            porcentaje_km := (km_faltantes_calc::numeric / intervalo_km::numeric) * 100;
            porcentaje_km := GREATEST(0, LEAST(100, porcentaje_km));
        END IF;

        -- Calcular porcentaje de vida útil por horas
        IF vehiculo_record.hora_actual IS NOT NULL
           AND vehiculo_record.aceite_motor_hr IS NOT NULL
           AND vehiculo_record.intervalo_cambio_aceite_hr IS NOT NULL THEN

            hr_recorridas := vehiculo_record.hora_actual - vehiculo_record.aceite_motor_hr;
            hr_faltantes_calc := vehiculo_record.intervalo_cambio_aceite_hr - hr_recorridas;

            hr_faltantes := GREATEST(0, hr_faltantes_calc);
            porcentaje_hr := (hr_faltantes_calc::numeric / vehiculo_record.intervalo_cambio_aceite_hr::numeric) * 100;
            porcentaje_hr := GREATEST(0, LEAST(100, porcentaje_hr));
        END IF;

        -- Determinar si es crítico (≤5% en cualquiera de los dos criterios)
        es_critico := (porcentaje_km IS NOT NULL AND porcentaje_km <= 5) OR
                      (porcentaje_hr IS NOT NULL AND porcentaje_hr <= 5);

        -- Si es crítico, insertar nuevo registro
        IF es_critico THEN
            -- Determinar tiempo estimado basado en criticidad
            IF (porcentaje_km IS NOT NULL AND porcentaje_km <= 1) OR
               (porcentaje_hr IS NOT NULL AND porcentaje_hr <= 1) THEN
                tiempo_estimado_calc := '6-8 horas';
                criticidad_calc := 'critico';
                motivo_calc := 'Service completo + revisión URGENTE';
            ELSIF (porcentaje_km IS NOT NULL AND porcentaje_km <= 3) OR
                  (porcentaje_hr IS NOT NULL AND porcentaje_hr <= 3) THEN
                tiempo_estimado_calc := '4-6 horas';
                criticidad_calc := 'critico';
                motivo_calc := 'Service + revisión';
            ELSE
                tiempo_estimado_calc := '4-6 horas';
                criticidad_calc := 'critico';
                motivo_calc := 'Service + revisión';
            END IF;

            -- Insertar nuevo registro automático
            INSERT INTO public.pendientes_operaciones (
                vehiculo_id,
                interno,
                placa,
                trasladar_a,
                tiempo_estimado,
                motivo,
                criticidad,
                porcentaje_vida_km,
                porcentaje_vida_hr,
                km_faltantes,
                hr_faltantes,
                estado,
                es_automatico,
                observaciones
            ) VALUES (
                vehiculo_record.id,
                vehiculo_record.Nro_Interno,
                vehiculo_record.Placa,
                'Taller',
                tiempo_estimado_calc,
                motivo_calc,
                criticidad_calc,
                porcentaje_km,
                porcentaje_hr,
                km_faltantes,
                hr_faltantes,
                'pendiente',
                true,
                CASE
                    WHEN porcentaje_km IS NOT NULL AND porcentaje_hr IS NOT NULL THEN
                        'Crítico por KM (' || ROUND(porcentaje_km, 1) || '%) y Horas (' || ROUND(porcentaje_hr, 1) || '%)'
                    WHEN porcentaje_km IS NOT NULL THEN
                        'Crítico por KM (' || ROUND(porcentaje_km, 1) || '% vida útil)'
                    WHEN porcentaje_hr IS NOT NULL THEN
                        'Crítico por Horas (' || ROUND(porcentaje_hr, 1) || '% vida útil)'
                    ELSE
                        'Generado automáticamente'
                END
            );

            registros_insertados := registros_insertados + 1;
        END IF;
    END LOOP;

    -- Log de la operación
    RAISE NOTICE 'Actualización de pendientes_operaciones completada: % registros insertados', registros_insertados;

    RETURN registros_insertados;
END;
$$ language 'plpgsql';

-- Comentario de la función
COMMENT ON FUNCTION public.actualizar_pendientes_operaciones() IS 'Función que actualiza automáticamente la tabla pendientes_operaciones basada en criterios de mantenimiento críticos (≤5% vida útil). Retorna el número de registros insertados.';

-- Crear función helper para ejecutar desde la aplicación
CREATE OR REPLACE FUNCTION public.ejecutar_actualizacion_pendientes()
RETURNS json AS $$
DECLARE
    registros_afectados integer;
    resultado json;
BEGIN
    -- Ejecutar la actualización
    SELECT public.actualizar_pendientes_operaciones() INTO registros_afectados;

    -- Preparar resultado JSON
    resultado := json_build_object(
        'success', true,
        'message', 'Actualización completada exitosamente',
        'registros_insertados', registros_afectados,
        'timestamp', now()
    );

    RETURN resultado;
EXCEPTION WHEN OTHERS THEN
    -- En caso de error, devolver información del error
    resultado := json_build_object(
        'success', false,
        'message', 'Error durante la actualización: ' || SQLERRM,
        'timestamp', now()
    );

    RETURN resultado;
END;
$$ language 'plpgsql';

COMMENT ON FUNCTION public.ejecutar_actualizacion_pendientes() IS 'Función wrapper que ejecuta la actualización de pendientes y devuelve resultado en JSON para la aplicación';