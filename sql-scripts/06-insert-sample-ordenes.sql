-- Insertar algunas órdenes de compra de ejemplo desde el Excel
-- Basado en la hoja "OC creadas"

INSERT INTO public.ordenes_de_compra (
  fecha, codigo, titular, cuit, monto, interno, modelo, placa, proveedor, items, adjuntos
) VALUES
('2025-07-13', '250713AGT-000017', 'Ipg - Turismo Ltda CNPJ', '07.311.967/0001-33', 400.00, 60, 'Mercedes Benz 167-0-500-M', 'KNM213', 'IDISA', 'flexible aire comprimido (1x$400.00)', '1 archivo(s)'),
('2025-07-13', '250713AGT-000023-B', 'TRANSPORTE CUENCA DEL PLATA SAS', 'N/A', 68086.46, 82, 'Mercedes Benz D39-Vito Tourer 121', 'AF097ST', 'BAZYLUK SA', 'tuberia de aireacion (1x$56269.80)', 'Sin adjuntos'),
('2025-07-13', '250713AGT-000024', 'Duran Vaca Patricia', '27-19003612-5', 2500.00, 1, 'Toyota Hilux 4x4 D/C DX 2.4 TDI 6MT', 'AE5060K', 'TRUCK CENTER', 'neumaticos delanteros (2x$1250.00)', '1 archivo(s)');

-- Verificar inserción
SELECT * FROM public.ordenes_de_compra ORDER BY fecha DESC;