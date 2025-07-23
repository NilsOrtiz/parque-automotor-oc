SELECT interno, placa, modelo, titular, COUNT(*) as cantidad FROM ordenes_de_compra_por_vehiculo WHERE placa LIKE '%TALLER%' OR titular LIKE '%TALLER%' GROUP BY interno, placa, modelo, titular;
