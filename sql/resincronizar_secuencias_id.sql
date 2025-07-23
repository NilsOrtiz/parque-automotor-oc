-- Resincronizar las secuencias de ID para evitar conflictos de duplicate key
-- Esto asegura que los próximos IDs sean mayores a los existentes

-- Mostrar estado actual: máximo ID en cada tabla
SELECT 
    'ordenes_de_compra' as tabla,
    MAX(id) as max_id_tabla
FROM ordenes_de_compra

UNION ALL

SELECT 
    'ordenes_de_compra_por_vehiculo' as tabla,
    MAX(id) as max_id_tabla
FROM ordenes_de_compra_por_vehiculo;

-- Resincronizar secuencia de ordenes_de_compra
SELECT setval('ordenes_de_compra_id_seq', COALESCE((SELECT MAX(id) FROM ordenes_de_compra), 1));

-- Resincronizar secuencia de ordenes_de_compra_por_vehiculo  
SELECT setval('ordenes_de_compra_por_vehiculo_id_seq', COALESCE((SELECT MAX(id) FROM ordenes_de_compra_por_vehiculo), 1));

-- Verificar que las secuencias quedaron correctas
SELECT 
    'ordenes_de_compra - Próximo ID será' as tabla,
    nextval('ordenes_de_compra_id_seq') as proximo_id
    
UNION ALL

SELECT 
    'ordenes_de_compra_por_vehiculo - Próximo ID será' as tabla,
    nextval('ordenes_de_compra_por_vehiculo_id_seq') as proximo_id;