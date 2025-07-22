-- Script para migrar datos históricos de ordenes_de_compra a ordenes_de_compra_por_vehiculo
-- Basado en el archivo ordenes_de_compra_rows.csv

-- Primero verificar qué códigos ya existen
SELECT 'Códigos ya existentes en ordenes_de_compra_por_vehiculo:' AS mensaje;
SELECT codigo_oc FROM ordenes_de_compra_por_vehiculo 
WHERE codigo_oc IN (
    '250713AGT-000017',
    '250713AGT-000024', 
    '250713AGT-000025',
    '250713AGT-000026',
    '250713AGT-000027',
    '250713AGT-000030',
    '250714AGT-000031',
    '250715AGT-000033',
    '250716AGT-000034',
    '250716AGT-000035',
    '250716AGT-000036',
    '250717AGT-000037',
    '250717AGT-000039',
    '250717AGT-000040'
);

-- Insertar solo los que no existen para evitar duplicados
INSERT INTO ordenes_de_compra_por_vehiculo (
    id_oc_original,
    codigo_oc,
    fecha,
    interno,
    placa,
    modelo,
    titular,
    proveedor,
    items,
    monto_vehiculo,
    version,
    moneda,
    pdf_url
)
SELECT 
    oc.id as id_oc_original,
    oc.codigo as codigo_oc,
    oc.fecha,
    CASE 
        WHEN oc.interno IS NOT NULL AND oc.interno > 0 THEN oc.interno
        ELSE 999999 -- Valor por defecto para casos sin interno específico
    END as interno,
    COALESCE(oc.placa, 'SIN_PLACA') as placa,
    COALESCE(oc.modelo, 'Modelo no especificado') as modelo,
    oc.titular,
    oc.proveedor,
    oc.items,
    oc.monto as monto_vehiculo,
    NULL as version, -- NULL para todas las OC históricas (eran simples)
    COALESCE(oc.moneda, 'ARS') as moneda,
    oc.pdf_url
FROM ordenes_de_compra oc
WHERE oc.codigo IN (
    '250713AGT-000017',
    '250713AGT-000024', 
    '250713AGT-000025',
    '250713AGT-000026',
    '250713AGT-000027',
    '250713AGT-000030',
    '250714AGT-000031',
    '250715AGT-000033',
    '250716AGT-000034',
    '250716AGT-000035',
    '250716AGT-000036',
    '250717AGT-000037',
    '250717AGT-000039',
    '250717AGT-000040'
)
AND NOT EXISTS (
    SELECT 1 FROM ordenes_de_compra_por_vehiculo ocv 
    WHERE ocv.codigo_oc = oc.codigo
);

-- Verificar el resultado final
SELECT 'Resultado final después de la migración:' AS mensaje;
SELECT 
    codigo_oc,
    interno,
    placa,
    modelo,
    titular,
    proveedor,
    monto_vehiculo,
    moneda
FROM ordenes_de_compra_por_vehiculo 
WHERE codigo_oc LIKE '250%'
ORDER BY codigo_oc;