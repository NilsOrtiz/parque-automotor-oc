-- Insertar datos de titulares desde el Excel
-- Basado en la hoja "Titulares"

INSERT INTO public.titulares (nombre_titular, cuit) VALUES
('Ipg - Turismo Ltda CNPJ', '07.311.967/0001-33'),
('Duran Vaca Patricia', '27-19003612-5'),
('TRANSPORTE CUENCA DEL PLATA SAS', NULL);

-- Verificar inserción
SELECT * FROM public.titulares ORDER BY id;