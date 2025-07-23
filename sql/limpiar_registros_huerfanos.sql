-- Limpiar registros huérfanos en ordenes_de_compra_por_vehiculo
-- que no tienen correspondencia en la tabla principal ordenes_de_compra

-- Ver registros huérfanos antes de eliminar
SELECT 
    pv.codigo_oc,
    pv.fecha,
    pv.placa,
    'HUERFANO - No existe en tabla principal' as estado
FROM ordenes_de_compra_por_vehiculo pv
LEFT JOIN ordenes_de_compra oc ON pv.codigo_oc = oc.codigo
WHERE oc.codigo IS NULL;

-- Eliminar registros huérfanos
DELETE FROM ordenes_de_compra_por_vehiculo 
WHERE codigo_oc NOT IN (
    SELECT codigo FROM ordenes_de_compra
);

-- Verificar cuántos registros quedan
SELECT 
    COUNT(*) as total_registros_restantes
FROM ordenes_de_compra_por_vehiculo;