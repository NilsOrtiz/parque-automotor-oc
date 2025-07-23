-- Limpiar las OCs de prueba creadas durante la resolución del problema
-- Volver al estado anterior (hasta la OC 40)

-- Ver qué OCs se van a eliminar antes de proceder
SELECT 
    'TABLA PRINCIPAL - Se eliminarán estas OCs:' as info,
    codigo,
    fecha,
    monto
FROM ordenes_de_compra 
WHERE codigo IN ('250723AGT-000041', '250723AGT-000042', '250723AGT-000043', '250723AGT-000044')
ORDER BY codigo;

SELECT 
    'TABLA DETALLE - Se eliminarán estos registros:' as info,
    codigo_oc,
    placa,
    monto_vehiculo
FROM ordenes_de_compra_por_vehiculo 
WHERE codigo_oc IN ('250723AGT-000041', '250723AGT-000042', '250723AGT-000043', '250723AGT-000044')
ORDER BY codigo_oc;

-- IMPORTANTE: Descomenta las siguientes líneas SOLO si estás seguro de eliminar
-- Eliminar primero de la tabla de detalle (por la foreign key)
-- DELETE FROM ordenes_de_compra_por_vehiculo 
-- WHERE codigo_oc IN ('250723AGT-000041', '250723AGT-000042', '250723AGT-000043', '250723AGT-000044');

-- Eliminar de la tabla principal
-- DELETE FROM ordenes_de_compra 
-- WHERE codigo IN ('250723AGT-000041', '250723AGT-000042', '250723AGT-000043', '250723AGT-000044');

-- Resincronizar las secuencias después de eliminar
-- SELECT setval('ordenes_de_compra_id_seq', COALESCE((SELECT MAX(id) FROM ordenes_de_compra), 1));
-- SELECT setval('ordenes_de_compra_por_vehiculo_id_seq', COALESCE((SELECT MAX(id) FROM ordenes_de_compra_por_vehiculo), 1));

-- Verificar estado final
-- SELECT 'Último ID en ordenes_de_compra' as info, MAX(id) as ultimo_id FROM ordenes_de_compra;
-- SELECT 'Último ID en ordenes_de_compra_por_vehiculo' as info, MAX(id) as ultimo_id FROM ordenes_de_compra_por_vehiculo;