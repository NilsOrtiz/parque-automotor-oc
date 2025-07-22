-- Insertar datos de proveedores desde el Excel  
-- Basado en la hoja "Proveedores"

INSERT INTO public.proveedores (nombre, cuit, direccion, telefono, gmail, con_iva) VALUES
('TRUCK CENTER', '27-40413369-7', 'Av. Su Santidad Papa Francisco', '3757631238', 'grupoaquinotruckneumaticos@gmail.com', 'NO'),
('BAZYLUK SA', '33-70759714-9', 'Ruta Nacional 12 KM 8,5 Posadas Misiones', '3764481488', 'mariana.gonzalez@bazyluk.com.ar', 'NO'),
('IDISA', NULL, NULL, NULL, NULL, 'NO'),
('AUTOMOTORES SANTA ROSA', NULL, NULL, NULL, NULL, 'NO'),
('FOREST REN', NULL, NULL, NULL, NULL, 'NO'),
('AUTO REPUESTOS CENTRO', NULL, NULL, NULL, NULL, 'NO'),
('PRECAP', NULL, NULL, NULL, NULL, 'NO'),
('MECANICA GENERAL EZEQUIEL', NULL, NULL, NULL, NULL, 'NO'),
('METALURGICA POSADAS', NULL, NULL, NULL, NULL, 'NO'),
('GOMERIA LOS PIONEROS', NULL, NULL, NULL, NULL, 'NO'),
('AUTOMOTORES PEPE', NULL, NULL, NULL, NULL, 'NO'),
('TALLERES NAVARRO', NULL, NULL, NULL, NULL, 'NO');

-- Verificar inserción
SELECT * FROM public.proveedores ORDER BY id;