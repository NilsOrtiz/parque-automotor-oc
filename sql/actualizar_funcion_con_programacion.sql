-- Actualizar función para que sea compatible con los nuevos campos de programación
-- Esta función mantiene la programación existente cuando actualiza datos técnicos

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
    -- LÓGICA INTELIGENTE: Preservar programación existente al actualizar datos técnicos
    RAISE NOTICE 'Iniciando actualización inteligente de pendientes_operaciones...';

    -- Recorrer todos los vehículos de Cuenca del Plata (que tienen número interno)
    FOR vehiculo_record IN
        SELECT * FROM public.vehiculos
        WHERE "Nro_Interno" IS NOT NULL
        AND "Nro_Interno" > 0
    LOOP
        -- Calcular porcentaje de vida útil por kilómetros
        calc_porcentaje_km := NULL;
        calc_km_faltantes := NULL;

        IF vehiculo_record."Km_Actual" IS NOT NULL
           AND vehiculo_record."Aceite_Motor_Km" IS NOT NULL
           AND vehiculo_record."Intervalo_Cambio_Aceite_Km" IS NOT NULL THEN

            km_recorridos := vehiculo_record."Km_Actual" - vehiculo_record."Aceite_Motor_Km";
            km_faltantes_calc := vehiculo_record."Intervalo_Cambio_Aceite_Km" - km_recorridos;

            calc_km_faltantes := GREATEST(0, km_faltantes_calc);
            calc_porcentaje_km := (km_faltantes_calc::numeric / vehiculo_record."Intervalo_Cambio_Aceite_Km"::numeric) * 100;
            calc_porcentaje_km := GREATEST(0, LEAST(100, calc_porcentaje_km));
        END IF;

        -- Calcular porcentaje de vida útil por horas
        calc_porcentaje_hr := NULL;
        calc_hr_faltantes := NULL;

        IF vehiculo_record.hora_actual IS NOT NULL
           AND vehiculo_record.aceite_motor_hr IS NOT NULL
           AND vehiculo_record.intervalo_cambio_aceite_hr IS NOT NULL THEN

            hr_recorridas := vehiculo_record.hora_actual - vehiculo_record.aceite_motor_hr;
            hr_faltantes_calc := vehiculo_record.intervalo_cambio_aceite_hr - hr_recorridas;

            calc_hr_faltantes := GREATEST(0, hr_faltantes_calc);
            calc_porcentaje_hr := (hr_faltantes_calc::numeric / vehiculo_record.intervalo_cambio_aceite_hr::numeric) * 100;
            calc_porcentaje_hr := GREATEST(0, LEAST(100, calc_porcentaje_hr));
        END IF;

        -- Determinar si es crítico (≤2% en cualquiera de los dos criterios)
        es_critico := (calc_porcentaje_km IS NOT NULL AND calc_porcentaje_km <= 2) OR
                      (calc_porcentaje_hr IS NOT NULL AND calc_porcentaje_hr <= 2);

        -- NUEVA LÓGICA: Si es crítico, verificar si ya existe o crear/actualizar
        IF es_critico THEN
            -- Determinar tiempo estimado basado en criticidad (solo para nuevos registros)
            tiempo_estimado_calc := '4-6 horas';
            criticidad_calc := 'critico';
            motivo_calc := 'Service + revisión';

            -- VERIFICAR si ya existe un registro para este interno en "Taller"
            IF EXISTS (
                SELECT 1 FROM public.pendientes_operaciones
                WHERE interno = vehiculo_record."Nro_Interno"
                AND trasladar_a = 'Taller'
                AND es_automatico = true
            ) THEN
                -- ACTUALIZAR registro existente (PRESERVANDO PROGRAMACIÓN)
                UPDATE public.pendientes_operaciones SET
                    -- ✅ ACTUALIZAR: Datos técnicos calculados
                    porcentaje_vida_km = calc_porcentaje_km,
                    porcentaje_vida_hr = calc_porcentaje_hr,
                    km_faltantes = calc_km_faltantes,
                    hr_faltantes = calc_hr_faltantes,
                    fecha_actualizacion = now(),

                    -- ✅ PRESERVAR: Campos editables por taller (solo actualizar si están NULL)
                    tiempo_estimado = CASE
                        WHEN tiempo_estimado = '4-6 horas' OR tiempo_estimado IS NULL
                        THEN tiempo_estimado_calc
                        ELSE tiempo_estimado
                    END,
                    motivo = CASE
                        WHEN motivo = 'Service + revisión' OR motivo IS NULL
                        THEN motivo_calc
                        ELSE motivo
                    END,
                    criticidad = CASE
                        WHEN criticidad = 'critico' OR criticidad IS NULL
                        THEN criticidad_calc
                        ELSE criticidad
                    END,

                    -- 🔒 PRESERVAR COMPLETAMENTE: Campos de programación (NO TOCAR)
                    -- fecha_programada, turno_programado, programado_por, fecha_programacion, notas_programacion
                    -- estado (solo cambiar si está en 'pendiente')
                    estado = CASE
                        WHEN estado = 'pendiente' THEN 'pendiente'
                        ELSE estado  -- Mantener 'programado', 'en_proceso', etc.
                    END,

                    -- ✅ PRESERVAR: Observaciones editadas por taller
                    observaciones = CASE
                        WHEN observaciones IS NULL OR observaciones = ''
                        THEN observaciones
                        ELSE observaciones -- Mantener observaciones editadas manualmente
                    END
                WHERE interno = vehiculo_record."Nro_Interno"
                AND trasladar_a = 'Taller'
                AND es_automatico = true;

                RAISE NOTICE 'Actualizado vehículo interno % - KM: %, Horas: % (PROGRAMACIÓN PRESERVADA)',
                    vehiculo_record."Nro_Interno",
                    COALESCE(ROUND(calc_porcentaje_km, 1), 0),
                    COALESCE(ROUND(calc_porcentaje_hr, 1), 0);

            ELSE
                -- CREAR nuevo registro automático (CON CAMPOS DE PROGRAMACIÓN INICIALIZADOS)
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
                    observaciones,
                    -- 🆕 CAMPOS DE PROGRAMACIÓN (INICIALIZAR COMO NULL)
                    fecha_programada,
                    turno_programado,
                    programado_por,
                    fecha_programacion,
                    notas_programacion
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
                    'pendiente', -- Estado inicial
                    true, -- es_automatico
                    NULL, -- observaciones (vacío inicialmente)
                    -- 🆕 CAMPOS DE PROGRAMACIÓN (NULL HASTA QUE OPERACIONES LOS PROGRAME)
                    NULL, -- fecha_programada
                    NULL, -- turno_programado
                    NULL, -- programado_por
                    NULL, -- fecha_programacion
                    NULL  -- notas_programacion
                );

                registros_insertados := registros_insertados + 1;

                RAISE NOTICE 'Creado nuevo pendiente para vehículo interno % - KM: %, Horas: %',
                    vehiculo_record."Nro_Interno",
                    COALESCE(ROUND(calc_porcentaje_km, 1), 0),
                    COALESCE(ROUND(calc_porcentaje_hr, 1), 0);
            END IF;
        END IF;
    END LOOP;

    -- LIMPIAR registros que ya NO son críticos (pero preservar los programados)
    DELETE FROM public.pendientes_operaciones
    WHERE es_automatico = true
    AND interno NOT IN (
        SELECT v."Nro_Interno"
        FROM public.vehiculos v
        WHERE v."Nro_Interno" IS NOT NULL
        AND v."Nro_Interno" > 0
        AND (
            -- Crítico por KM
            (v."Km_Actual" IS NOT NULL
             AND v."Aceite_Motor_Km" IS NOT NULL
             AND v."Intervalo_Cambio_Aceite_Km" IS NOT NULL
             AND ((v."Intervalo_Cambio_Aceite_Km" - (v."Km_Actual" - v."Aceite_Motor_Km"))::numeric / v."Intervalo_Cambio_Aceite_Km"::numeric) * 100 <= 2)
            OR
            -- Crítico por Horas
            (v.hora_actual IS NOT NULL
             AND v.aceite_motor_hr IS NOT NULL
             AND v.intervalo_cambio_aceite_hr IS NOT NULL
             AND ((v.intervalo_cambio_aceite_hr - (v.hora_actual - v.aceite_motor_hr))::numeric / v.intervalo_cambio_aceite_hr::numeric) * 100 <= 2)
        )
    )
    -- 🔒 EXCEPCIÓN: NO eliminar registros que están programados
    AND NOT (estado = 'programado' AND fecha_programada IS NOT NULL);

    RAISE NOTICE 'Actualización de pendientes_operaciones completada: % registros nuevos insertados', registros_insertados;

    RETURN registros_insertados;
END;
$$ LANGUAGE plpgsql;

-- Comentario actualizado
COMMENT ON FUNCTION public.actualizar_pendientes_operaciones() IS 'Función INTELIGENTE que actualiza pendientes_operaciones: 1) Actualiza datos técnicos de registros existentes PRESERVANDO programación y ediciones del taller, 2) Crea nuevos registros solo para vehículos críticos sin registro previo, 3) Elimina registros que ya no son críticos EXCEPTO los programados. Identificación única: interno + trasladar_a. Retorna registros nuevos insertados.';

-- Mensaje de confirmación
SELECT 'Función actualizada para ser compatible con campos de programación' as mensaje;