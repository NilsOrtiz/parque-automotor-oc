-- Crear tabla ordenes_de_compra_por_vehiculo
-- Esta tabla almacena el detalle granular por vehículo de cada OC

CREATE TABLE public.ordenes_de_compra_por_vehiculo (
    id BIGSERIAL PRIMARY KEY,
    id_oc_original BIGINT REFERENCES public.ordenes_de_compra(id) ON DELETE CASCADE,
    codigo_oc TEXT NOT NULL,
    fecha DATE NOT NULL,
    interno INTEGER NOT NULL,
    placa TEXT NOT NULL,
    modelo TEXT,
    titular TEXT,
    proveedor TEXT,
    items TEXT, -- Solo los items de este vehículo específico
    monto_vehiculo NUMERIC(10,2), -- Solo el monto de items de este vehículo
    version CHAR(1), -- 'A', 'B', 'C' para casos múltiples, NULL para casos simples
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para optimizar consultas
CREATE INDEX idx_ordenes_compra_por_vehiculo_codigo ON public.ordenes_de_compra_por_vehiculo(codigo_oc);
CREATE INDEX idx_ordenes_compra_por_vehiculo_interno ON public.ordenes_de_compra_por_vehiculo(interno);
CREATE INDEX idx_ordenes_compra_por_vehiculo_fecha ON public.ordenes_de_compra_por_vehiculo(fecha);
CREATE INDEX idx_ordenes_compra_por_vehiculo_original ON public.ordenes_de_compra_por_vehiculo(id_oc_original);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.ordenes_de_compra_por_vehiculo ENABLE ROW LEVEL SECURITY;

-- Política para permitir operaciones a usuarios autenticados y anónimos
CREATE POLICY "Allow all operations on ordenes_de_compra_por_vehiculo" 
ON public.ordenes_de_compra_por_vehiculo 
FOR ALL 
TO anon, authenticated 
USING (true) 
WITH CHECK (true);

-- Comentarios para documentación
COMMENT ON TABLE public.ordenes_de_compra_por_vehiculo IS 'Tabla de detalle de órdenes de compra por vehículo específico';
COMMENT ON COLUMN public.ordenes_de_compra_por_vehiculo.id_oc_original IS 'Referencia a la OC original en la tabla principal';
COMMENT ON COLUMN public.ordenes_de_compra_por_vehiculo.version IS 'A, B, C para OCs múltiples, NULL para OCs simples';
COMMENT ON COLUMN public.ordenes_de_compra_por_vehiculo.items IS 'Solo los items que corresponden a este vehículo';
COMMENT ON COLUMN public.ordenes_de_compra_por_vehiculo.monto_vehiculo IS 'Monto total solo de los items de este vehículo';