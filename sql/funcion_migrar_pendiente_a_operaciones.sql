-- Función para migrar un pendiente del taller a pendientes_operaciones
-- Esto permite que los pendientes reportados por taller sean coordinados por operaciones

CREATE OR REPLACE FUNCTION public.migrar_pendiente_a_operaciones(
    p_id_pendiente INTEGER,
    p_trasladar_a TEXT DEFAULT 'Taller'
)
RETURNS JSON AS $$
DECLARE
    pendiente_record RECORD;
    vehiculo_data RECORD;
    tiempo_estimado_convertido TEXT;
    resultado JSON;
BEGIN
    -- 1. Obtener datos del pendiente del taller
    SELECT po.*, v.id as vehiculo_id, v."Nro_Interno", v."Placa"
    INTO pendiente_record
    FROM pendientes_observaciones po
    JOIN vehiculos v ON po.id = v.id
    WHERE po.id_pendiente = p_id_pendiente
    AND po.estado IN ('pendiente', 'en_progreso'); -- Solo pendientes activos

    IF NOT FOUND THEN
        resultado := json_build_object(
            'success', false,
            'message', 'Pendiente no encontrado o ya completado',
            'id_pendiente', p_id_pendiente
        );
        RETURN resultado;
    END IF;

    -- 2. Verificar si ya existe en pendientes_operaciones
    IF EXISTS (
        SELECT 1 FROM public.pendientes_operaciones
        WHERE interno = pendiente_record."Nro_Interno"
        AND trasladar_a = p_trasladar_a
        AND es_automatico = false -- Solo verificar manuales
    ) THEN
        resultado := json_build_object(
            'success', false,
            'message', 'Ya existe un pendiente manual para este vehículo en ' || p_trasladar_a,
            'interno', pendiente_record."Nro_Interno",
            'trasladar_a', p_trasladar_a
        );
        RETURN resultado;
    END IF;

    -- 3. Convertir tiempo estimado de horas (INTEGER) a texto descriptivo
    tiempo_estimado_convertido := CASE
        WHEN pendiente_record.tiempo_estimado <= 2 THEN '1-2 horas'
        WHEN pendiente_record.tiempo_estimado <= 4 THEN '2-4 horas'
        WHEN pendiente_record.tiempo_estimado <= 6 THEN '4-6 horas'
        WHEN pendiente_record.tiempo_estimado <= 8 THEN '6-8 horas'
        WHEN pendiente_record.tiempo_estimado <= 24 THEN '1 día'
        WHEN pendiente_record.tiempo_estimado <= 48 THEN '2 días'
        ELSE '3+ días'
    END;

    -- 4. Crear registro en pendientes_operaciones
    INSERT INTO public.pendientes_operaciones (
        vehiculo_id,
        interno,
        placa,
        trasladar_a,
        tiempo_estimado,
        motivo,
        criticidad,
        estado,
        es_automatico,
        observaciones
    ) VALUES (
        pendiente_record.vehiculo_id,
        pendiente_record."Nro_Interno",
        pendiente_record."Placa",
        p_trasladar_a,
        tiempo_estimado_convertido,
        COALESCE(pendiente_record.clasificacion ||
            CASE WHEN pendiente_record.subclasificacion IS NOT NULL
                 THEN ' - ' || pendiente_record.subclasificacion
                 ELSE ''
            END, 'Trabajo solicitado por taller'),
        pendiente_record.prioridad, -- 'critico', 'medio', 'leve' coinciden
        'pendiente',
        false, -- es_automatico = false (creado manualmente desde taller)
        'Migrado desde taller. Descripción original: ' || COALESCE(pendiente_record.descripcion, 'Sin descripción')
    );

    -- 5. Marcar el pendiente original como "coordinado" (opcional)
    UPDATE pendientes_observaciones
    SET estado = 'coordinado', -- Nuevo estado para pendientes enviados a operaciones
        observaciones = COALESCE(observaciones, '') ||
                       ' [COORDINADO con operaciones: ' || p_trasladar_a || ' - ' || now()::date || ']'
    WHERE id_pendiente = p_id_pendiente;

    -- 6. Preparar resultado exitoso
    resultado := json_build_object(
        'success', true,
        'message', 'Pendiente migrado exitosamente a operaciones',
        'id_pendiente_original', p_id_pendiente,
        'interno', pendiente_record."Nro_Interno",
        'placa', pendiente_record."Placa",
        'trasladar_a', p_trasladar_a,
        'tiempo_estimado', tiempo_estimado_convertido,
        'motivo', pendiente_record.clasificacion,
        'prioridad', pendiente_record.prioridad
    );

    RETURN resultado;

EXCEPTION WHEN OTHERS THEN
    -- En caso de error, devolver información del error
    resultado := json_build_object(
        'success', false,
        'message', 'Error durante la migración: ' || SQLERRM,
        'id_pendiente', p_id_pendiente
    );
    RETURN resultado;
END;
$$ LANGUAGE plpgsql;

-- Comentario de la función
COMMENT ON FUNCTION public.migrar_pendiente_a_operaciones IS 'Migra un pendiente del taller (pendientes_observaciones) a coordinación de operaciones (pendientes_operaciones). Marca el original como coordinado y crea nuevo registro manual en operaciones.';

-- Función helper para migrar múltiples pendientes
CREATE OR REPLACE FUNCTION public.migrar_pendientes_masivos(
    p_ids_pendientes INTEGER[],
    p_trasladar_a TEXT DEFAULT 'Taller'
)
RETURNS JSON AS $$
DECLARE
    id_pendiente INTEGER;
    resultado_individual JSON;
    resultados_exitosos INTEGER := 0;
    resultados_fallidos INTEGER := 0;
    errores TEXT[] := ARRAY[]::TEXT[];
    resultado_final JSON;
BEGIN
    -- Procesar cada pendiente individualmente
    FOREACH id_pendiente IN ARRAY p_ids_pendientes
    LOOP
        SELECT public.migrar_pendiente_a_operaciones(id_pendiente, p_trasladar_a)
        INTO resultado_individual;

        IF (resultado_individual->>'success')::boolean THEN
            resultados_exitosos := resultados_exitosos + 1;
        ELSE
            resultados_fallidos := resultados_fallidos + 1;
            errores := errores || (resultado_individual->>'message');
        END IF;
    END LOOP;

    -- Preparar resultado final
    resultado_final := json_build_object(
        'success', resultados_exitosos > 0,
        'message', 'Migración masiva completada',
        'total_procesados', array_length(p_ids_pendientes, 1),
        'exitosos', resultados_exitosos,
        'fallidos', resultados_fallidos,
        'errores', errores,
        'trasladar_a', p_trasladar_a,
        'timestamp', now()
    );

    RETURN resultado_final;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.migrar_pendientes_masivos IS 'Migra múltiples pendientes del taller a operaciones en una sola operación. Retorna resumen de resultados.';

-- Función para deshacer migración (en caso de error)
CREATE OR REPLACE FUNCTION public.deshacer_migracion_pendiente(
    p_interno INTEGER,
    p_trasladar_a TEXT DEFAULT 'Taller'
)
RETURNS JSON AS $$
DECLARE
    operacion_record RECORD;
    resultado JSON;
BEGIN
    -- 1. Buscar el registro en pendientes_operaciones
    SELECT * INTO operacion_record
    FROM public.pendientes_operaciones
    WHERE interno = p_interno
    AND trasladar_a = p_trasladar_a
    AND es_automatico = false; -- Solo manuales

    IF NOT FOUND THEN
        resultado := json_build_object(
            'success', false,
            'message', 'No se encontró pendiente manual para deshacer',
            'interno', p_interno,
            'trasladar_a', p_trasladar_a
        );
        RETURN resultado;
    END IF;

    -- 2. Eliminar de pendientes_operaciones
    DELETE FROM public.pendientes_operaciones
    WHERE id = operacion_record.id;

    -- 3. Restaurar estado original en pendientes_observaciones
    UPDATE pendientes_observaciones
    SET estado = 'pendiente',
        observaciones = REPLACE(observaciones, '[COORDINADO con operaciones: ' || p_trasladar_a || ' - ' || now()::date || ']', '')
    WHERE id IN (
        SELECT v.id FROM vehiculos v
        WHERE v."Nro_Interno" = p_interno
    )
    AND estado = 'coordinado';

    resultado := json_build_object(
        'success', true,
        'message', 'Migración deshecha exitosamente',
        'interno', p_interno,
        'trasladar_a', p_trasladar_a
    );

    RETURN resultado;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.deshacer_migracion_pendiente IS 'Deshace una migración de pendiente, eliminando de operaciones y restaurando estado original en taller.';