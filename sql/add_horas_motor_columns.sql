-- Agregar columnas para control de horas de motor en vehículos
-- Estas columnas permiten mantenimiento dual: por kilómetros O por horas (lo que llegue primero)

DO $$ 
BEGIN 
    -- Agregar hora_actual (paralelo a kilometraje_actual)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'vehiculos' 
        AND column_name = 'hora_actual'
    ) THEN
        ALTER TABLE vehiculos 
        ADD COLUMN hora_actual INTEGER;
        
        RAISE NOTICE 'Columna hora_actual agregada exitosamente';
    ELSE
        RAISE NOTICE 'La columna hora_actual ya existe';
    END IF;

    -- Agregar aceite_motor_hr (paralelo a aceite_motor_km)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'vehiculos' 
        AND column_name = 'aceite_motor_hr'
    ) THEN
        ALTER TABLE vehiculos 
        ADD COLUMN aceite_motor_hr INTEGER;
        
        RAISE NOTICE 'Columna aceite_motor_hr agregada exitosamente';
    ELSE
        RAISE NOTICE 'La columna aceite_motor_hr ya existe';
    END IF;

    -- Agregar intervalo_cambio_aceite_hr (paralelo a intervalo_cambio_aceite)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'vehiculos' 
        AND column_name = 'intervalo_cambio_aceite_hr'
    ) THEN
        ALTER TABLE vehiculos 
        ADD COLUMN intervalo_cambio_aceite_hr INTEGER DEFAULT 500;
        
        RAISE NOTICE 'Columna intervalo_cambio_aceite_hr agregada exitosamente con valor por defecto 500 horas';
    ELSE
        RAISE NOTICE 'La columna intervalo_cambio_aceite_hr ya existe';
    END IF;
END $$;

-- Opcional: Actualizar algunos vehículos con intervalos específicos por horas
-- Para buses que requieren mantenimiento cada 250, 500, o 750 horas
-- UPDATE vehiculos SET intervalo_cambio_aceite_hr = 250 WHERE "Placa" IN ('BUS001', 'BUS002');
-- UPDATE vehiculos SET intervalo_cambio_aceite_hr = 750 WHERE "Placa" IN ('BUS003', 'BUS004');

-- Verificar resultado
SELECT 
    "Placa", 
    "Marca", 
    "Modelo", 
    kilometraje_actual,
    hora_actual,
    aceite_motor_km,
    aceite_motor_hr,
    intervalo_cambio_aceite,
    intervalo_cambio_aceite_hr,
    CASE 
        WHEN intervalo_cambio_aceite_hr IS NULL THEN 'Sin definir'
        ELSE CONCAT(intervalo_cambio_aceite_hr, ' hrs')
    END as intervalo_horas_display
FROM vehiculos 
WHERE "Nro_Interno" IS NOT NULL AND "Nro_Interno" > 0
ORDER BY "Nro_Interno", "Placa"
LIMIT 10;