-- Actualizar función de migración para permitir tiempo estimado personalizado

CREATE OR REPLACE FUNCTION public.migrar_pendiente_a_operaciones(
    p_id_pendiente INTEGER,
    p_trasladar_a TEXT DEFAULT 'Taller',
    p_tiempo_estimado_custom TEXT DEFAULT NULL  -- ✅ NUEVO PARÁMETRO
)
RETURNS JSON AS $$
DECLARE
    pendiente_record record;
    vehiculo_info record;
    tiempo_estimado_convertido text;
    resultado JSON;
BEGIN
    -- 1. Buscar el pendiente en pendientes_observaciones
    SELECT po.*, v."Nro_Interno", v."Placa"
    INTO pendiente_record
    FROM public.pendientes_observaciones po
    JOIN public.vehiculos v ON po.vehiculo_id = v.id
    WHERE po.id = p_id_pendiente;

    IF NOT FOUND THEN
        resultado := json_build_object(
            'success', false,
            'message', 'Pendiente no encontrado'
        );
        RETURN resultado;
    END IF;

    -- 2. Verificar si ya existe en pendientes_operaciones
    IF EXISTS (
        SELECT 1 FROM public.pendientes_operaciones
        WHERE vehiculo_id = pendiente_record.vehiculo_id
        AND trasladar_a = p_trasladar_a
        AND es_automatico = false
        AND estado IN ('pendiente', 'programado', 'en_proceso')
    ) THEN
        resultado := json_build_object(
            'success', false,
            'message', 'Este vehículo ya tiene un pendiente activo en ' || p_trasladar_a
        );
        RETURN resultado;
    END IF;

    -- 3. ✅ LÓGICA MEJORADA: Usar tiempo personalizado O convertir automáticamente
    IF p_tiempo_estimado_custom IS NOT NULL AND p_tiempo_estimado_custom != '' THEN
        -- 🎯 USAR TIEMPO PERSONALIZADO DIRECTAMENTE
        tiempo_estimado_convertido := p_tiempo_estimado_custom;
        RAISE NOTICE 'Usando tiempo personalizado: %', tiempo_estimado_convertido;
    ELSE
        -- 🔄 FALLBACK: Convertir automáticamente si no se especifica
        tiempo_estimado_convertido := CASE
            WHEN pendiente_record.tiempo_estimado IS NULL THEN '6 horas'
            WHEN pendiente_record.tiempo_estimado <= 2 THEN '1-2 horas'
            WHEN pendiente_record.tiempo_estimado <= 4 THEN '2-4 horas'
            WHEN pendiente_record.tiempo_estimado <= 6 THEN '4-6 horas'
            WHEN pendiente_record.tiempo_estimado <= 8 THEN '6-8 horas'
            WHEN pendiente_record.tiempo_estimado <= 24 THEN '1 día'
            WHEN pendiente_record.tiempo_estimado <= 48 THEN '2 días'
            ELSE '3+ días'
        END;
        RAISE NOTICE 'Usando tiempo automático: %', tiempo_estimado_convertido;
    END IF;

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
        tiempo_estimado_convertido,  -- ✅ USAR TIEMPO PERSONALIZADO O AUTOMÁTICO
        COALESCE(pendiente_record.clasificacion ||
            CASE WHEN pendiente_record.subclasificacion IS NOT NULL
                 THEN ' - ' || pendiente_record.subclasificacion
                 ELSE ''
            END, 'Trabajo solicitado por taller'),
        pendiente_record.prioridad, -- 'critico', 'medio', 'leve' coinciden
        'pendiente',
        false, -- es_automatico = false (creado manualmente desde taller)
        CASE
            WHEN p_tiempo_estimado_custom IS NOT NULL THEN
                'Migrado desde taller (tiempo personalizado: ' || p_tiempo_estimado_custom || '). Descripción: ' || COALESCE(pendiente_record.descripcion, 'Sin descripción')
            ELSE
                'Migrado desde taller. Descripción original: ' || COALESCE(pendiente_record.descripcion, 'Sin descripción')
        END
    );

    -- 5. Marcar el pendiente original como "coordinado"
    UPDATE pendientes_observaciones
    SET estado = 'coordinado'
    WHERE id = p_id_pendiente;

    resultado := json_build_object(
        'success', true,
        'message', 'Pendiente migrado exitosamente a ' || p_trasladar_a,
        'tiempo_estimado_usado', tiempo_estimado_convertido,
        'es_tiempo_personalizado', (p_tiempo_estimado_custom IS NOT NULL),
        'vehiculo', json_build_object(
            'interno', pendiente_record."Nro_Interno",
            'placa', pendiente_record."Placa"
        )
    );

    RETURN resultado;

EXCEPTION WHEN OTHERS THEN
    resultado := json_build_object(
        'success', false,
        'message', 'Error interno: ' || SQLERRM
    );
    RETURN resultado;
END;
$$ LANGUAGE plpgsql;

-- Comentario actualizado
COMMENT ON FUNCTION public.migrar_pendiente_a_operaciones IS 'Migra un pendiente del taller a operaciones. Parámetros: p_id_pendiente (requerido), p_trasladar_a (default: Taller), p_tiempo_estimado_custom (opcional: permite especificar tiempo personalizado)';

-- Verificación
SELECT 'Función migrar_pendiente_a_operaciones actualizada con soporte para tiempo personalizado' as mensaje;