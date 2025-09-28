-- Función para actualizar automáticamente la tabla pendientes_operaciones
-- VERSIÓN FINAL CORREGIDA - Con nombres de campos exactos de Supabase

CREATE OR REPLACE FUNCTION public.actualizar_pendientes_operaciones()
RETURNS integer AS $$
DECLARE
    vehiculo_record record;
    calc_porcentaje_km numeric(5,2);
    calc_porcentaje_hr numeric(5,2);
    calc_km_faltantes integer;
    calc_hr_faltantes integer;
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
    -- NUEVA LÓGICA: No borrar registros, sino actualizar inteligentemente

    -- Recorrer todos los vehículos de Cuenca del Plata (que tienen número interno)
    FOR vehiculo_record IN
        SELECT * FROM public.vehiculos
        WHERE "Nro_Interno" IS NOT NULL
        AND "Nro_Interno" > 0
        ORDER BY "Nro_Interno"
    LOOP
        -- Inicializar variables
        calc_porcentaje_km := NULL;
        calc_porcentaje_hr := NULL;
        calc_km_faltantes := NULL;
        calc_hr_faltantes := NULL;
        es_critico := false;

        -- Calcular porcentaje de vida útil por kilómetros
        IF vehiculo_record.kilometraje_actual IS NOT NULL AND vehiculo_record.aceite_motor_km IS NOT NULL THEN
            -- Usar intervalo personalizado o 10000 km por defecto
            intervalo_km := COALESCE(vehiculo_record.intervalo_cambio_aceite, 10000);
            km_recorridos := vehiculo_record.kilometraje_actual - vehiculo_record.aceite_motor_km;
            km_faltantes_calc := intervalo_km - km_recorridos;

            calc_km_faltantes := GREATEST(0, km_faltantes_calc);
            calc_porcentaje_km := (km_faltantes_calc::numeric / intervalo_km::numeric) * 100;
            calc_porcentaje_km := GREATEST(0, LEAST(100, calc_porcentaje_km));
        END IF;

        -- Calcular porcentaje de vida útil por horas
        IF vehiculo_record.hora_actual IS NOT NULL
           AND vehiculo_record.aceite_motor_hr IS NOT NULL
           AND vehiculo_record.intervalo_cambio_aceite_hr IS NOT NULL THEN

            hr_recorridas := vehiculo_record.hora_actual - vehiculo_record.aceite_motor_hr;
            hr_faltantes_calc := vehiculo_record.intervalo_cambio_aceite_hr - hr_recorridas;

            calc_hr_faltantes := GREATEST(0, hr_faltantes_calc);
            calc_porcentaje_hr := (hr_faltantes_calc::numeric / vehiculo_record.intervalo_cambio_aceite_hr::numeric) * 100;
            calc_porcentaje_hr := GREATEST(0, LEAST(100, calc_porcentaje_hr));
        END IF;

        -- Determinar si es crítico (≤5% en cualquiera de los dos criterios)
        es_critico := (calc_porcentaje_km IS NOT NULL AND calc_porcentaje_km <= 5) OR
                      (calc_porcentaje_hr IS NOT NULL AND calc_porcentaje_hr <= 5);

        -- NUEVA LÓGICA: Si es crítico, verificar si ya existe o crear/actualizar
        IF es_critico THEN
            -- Determinar tiempo estimado basado en criticidad (solo para nuevos registros)
            IF (calc_porcentaje_km IS NOT NULL AND calc_porcentaje_km <= 1) OR
               (calc_porcentaje_hr IS NOT NULL AND calc_porcentaje_hr <= 1) THEN
                tiempo_estimado_calc := '6-8 horas';
                criticidad_calc := 'critico';
                motivo_calc := 'Service completo + revisión URGENTE';
            ELSIF (calc_porcentaje_km IS NOT NULL AND calc_porcentaje_km <= 3) OR
                  (calc_porcentaje_hr IS NOT NULL AND calc_porcentaje_hr <= 3) THEN
                tiempo_estimado_calc := '4-6 horas';
                criticidad_calc := 'critico';
                motivo_calc := 'Service + revisión';
            ELSE
                tiempo_estimado_calc := '4-6 horas';
                criticidad_calc := 'critico';
                motivo_calc := 'Service + revisión';
            END IF;

            -- VERIFICAR si ya existe un registro para este interno en "Taller"
            IF EXISTS (
                SELECT 1 FROM public.pendientes_operaciones
                WHERE interno = vehiculo_record."Nro_Interno"
                AND trasladar_a = 'Taller'
                AND es_automatico = true
            ) THEN
                -- ACTUALIZAR registro existente (solo datos técnicos)
                UPDATE public.pendientes_operaciones
                SET
                    vehiculo_id = vehiculo_record.id,
                    placa = vehiculo_record."Placa",
                    porcentaje_vida_km = calc_porcentaje_km,
                    porcentaje_vida_hr = calc_porcentaje_hr,
                    km_faltantes = calc_km_faltantes,
                    hr_faltantes = calc_hr_faltantes,
                    criticidad = criticidad_calc,
                    fecha_actualizacion = now(),
                    -- Solo actualizar observaciones si no han sido editadas manualmente
                    observaciones = CASE
                        WHEN observaciones LIKE 'Crítico por %' OR observaciones = 'Generado automáticamente' THEN
                            CASE
                                WHEN calc_porcentaje_km IS NOT NULL AND calc_porcentaje_hr IS NOT NULL THEN
                                    'Crítico por KM (' || ROUND(calc_porcentaje_km, 1) || '%) y Horas (' || ROUND(calc_porcentaje_hr, 1) || '%)'
                                WHEN calc_porcentaje_km IS NOT NULL THEN
                                    'Crítico por KM (' || ROUND(calc_porcentaje_km, 1) || '% vida útil)'
                                WHEN calc_porcentaje_hr IS NOT NULL THEN
                                    'Crítico por Horas (' || ROUND(calc_porcentaje_hr, 1) || '% vida útil)'
                                ELSE
                                    'Generado automáticamente'
                            END
                        ELSE
                            observaciones -- Mantener observaciones editadas manualmente
                    END
                WHERE interno = vehiculo_record."Nro_Interno"
                AND trasladar_a = 'Taller'
                AND es_automatico = true;

                RAISE NOTICE 'Actualizado vehículo interno % - KM: %, Horas: %',
                    vehiculo_record."Nro_Interno",
                    COALESCE(ROUND(calc_porcentaje_km, 1), 0),
                    COALESCE(ROUND(calc_porcentaje_hr, 1), 0);

            ELSE
                -- CREAR nuevo registro automático
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
                    vehiculo_record."Nro_Interno",
                    vehiculo_record."Placa",
                    'Taller',
                    tiempo_estimado_calc,
                    motivo_calc,
                    criticidad_calc,
                    calc_porcentaje_km,
                    calc_porcentaje_hr,
                    calc_km_faltantes,
                    calc_hr_faltantes,
                    'pendiente',
                    true,
                    CASE
                        WHEN calc_porcentaje_km IS NOT NULL AND calc_porcentaje_hr IS NOT NULL THEN
                            'Crítico por KM (' || ROUND(calc_porcentaje_km, 1) || '%) y Horas (' || ROUND(calc_porcentaje_hr, 1) || '%)'
                        WHEN calc_porcentaje_km IS NOT NULL THEN
                            'Crítico por KM (' || ROUND(calc_porcentaje_km, 1) || '% vida útil)'
                        WHEN calc_porcentaje_hr IS NOT NULL THEN
                            'Crítico por Horas (' || ROUND(calc_porcentaje_hr, 1) || '% vida útil)'
                        ELSE
                            'Generado automáticamente'
                    END
                );

                registros_insertados := registros_insertados + 1;

                RAISE NOTICE 'Nuevo vehículo crítico: interno % - KM: %, Horas: %',
                    vehiculo_record."Nro_Interno",
                    COALESCE(ROUND(calc_porcentaje_km, 1), 0),
                    COALESCE(ROUND(calc_porcentaje_hr, 1), 0);
            END IF;

        END IF;
    END LOOP;

    -- LIMPIAR registros automáticos que ya NO son críticos
    -- Solo eliminar los que están en estado 'pendiente' y son automáticos
    DELETE FROM public.pendientes_operaciones
    WHERE es_automatico = true
    AND estado = 'pendiente'
    AND trasladar_a = 'Taller'
    AND interno NOT IN (
        -- Subquery: internos que SÍ siguen siendo críticos
        SELECT v."Nro_Interno"
        FROM public.vehiculos v
        WHERE v."Nro_Interno" IS NOT NULL
        AND v."Nro_Interno" > 0
        AND (
            -- Crítico por KM
            (v.kilometraje_actual IS NOT NULL
             AND v.aceite_motor_km IS NOT NULL
             AND ((COALESCE(v.intervalo_cambio_aceite, 10000) - (v.kilometraje_actual - v.aceite_motor_km))::numeric / COALESCE(v.intervalo_cambio_aceite, 10000)::numeric) * 100 <= 5)
            OR
            -- Crítico por Horas
            (v.hora_actual IS NOT NULL
             AND v.aceite_motor_hr IS NOT NULL
             AND v.intervalo_cambio_aceite_hr IS NOT NULL
             AND ((v.intervalo_cambio_aceite_hr - (v.hora_actual - v.aceite_motor_hr))::numeric / v.intervalo_cambio_aceite_hr::numeric) * 100 <= 5)
        )
    );

    -- Log de la operación
    RAISE NOTICE 'Actualización de pendientes_operaciones completada: % registros nuevos insertados', registros_insertados;

    RETURN registros_insertados;
END;
$$ language 'plpgsql';

-- Comentario de la función
COMMENT ON FUNCTION public.actualizar_pendientes_operaciones() IS 'Función INTELIGENTE que actualiza pendientes_operaciones: 1) Actualiza datos técnicos de registros existentes preservando ediciones del taller, 2) Crea nuevos registros solo para vehículos críticos sin registro previo, 3) Elimina registros que ya no son críticos. Identificación única: interno + trasladar_a. Retorna registros nuevos insertados.';

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