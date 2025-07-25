-- Agregar columna intervalo_cambio_aceite a la tabla vehiculos
-- Esta columna define cada cuántos kilómetros se debe cambiar el aceite para cada vehículo

DO $$ 
BEGIN 
    -- Verificar si la columna ya existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'vehiculos' 
        AND column_name = 'intervalo_cambio_aceite'
    ) THEN
        -- Agregar la columna con valor por defecto de 10000 km
        ALTER TABLE vehiculos 
        ADD COLUMN intervalo_cambio_aceite INTEGER DEFAULT 10000;
        
        RAISE NOTICE 'Columna intervalo_cambio_aceite agregada exitosamente con valor por defecto 10000 km';
    ELSE
        RAISE NOTICE 'La columna intervalo_cambio_aceite ya existe';
    END IF;
END $$;

-- Opcional: Actualizar algunos vehículos con intervalos específicos si ya conoces cuáles necesitan valores diferentes
-- UPDATE vehiculos SET intervalo_cambio_aceite = 15000 WHERE "Placa" IN ('ABC123', 'DEF456');
-- UPDATE vehiculos SET intervalo_cambio_aceite = 5000 WHERE "Placa" IN ('GHI789');

-- Verificar resultado
SELECT 
    "Placa", 
    "Marca", 
    "Modelo", 
    intervalo_cambio_aceite,
    CASE 
        WHEN intervalo_cambio_aceite IS NULL THEN 'Sin definir'
        ELSE CONCAT(intervalo_cambio_aceite, ' km')
    END as intervalo_display
FROM vehiculos 
ORDER BY "Nro_Interno", "Placa";