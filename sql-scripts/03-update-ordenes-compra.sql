-- Actualizar tabla ordenes_de_compra para que coincida con "OC creadas" del Excel
-- Primero eliminamos la tabla actual y la recreamos con la estructura correcta

DROP TABLE IF EXISTS public.ordenes_de_compra;

CREATE TABLE public.ordenes_de_compra (
  id bigint NOT NULL DEFAULT nextval('ordenes_de_compra_id_seq'::regclass),
  fecha date NOT NULL,
  codigo text NOT NULL, -- Era "id_oc", ahora "codigo" como en Excel
  titular text,
  cuit text,
  monto numeric,
  interno bigint,
  modelo text,
  placa text,
  proveedor text,
  items text,
  adjuntos text DEFAULT 'Sin adjuntos', -- Nueva columna para archivos adjuntos
  -- Estados de aprobación (mantenemos estos del diseño original)
  est_compras boolean DEFAULT false,
  est_tesoreria boolean DEFAULT false,
  est_gerencia boolean DEFAULT false,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT ordenes_de_compra_pkey PRIMARY KEY (id),
  CONSTRAINT ordenes_de_compra_codigo_unique UNIQUE (codigo)
);

-- Crear secuencia para ID si no existe
CREATE SEQUENCE IF NOT EXISTS ordenes_de_compra_id_seq;

-- Configurar secuencia
ALTER SEQUENCE ordenes_de_compra_id_seq OWNED BY ordenes_de_compra.id;

-- Comentarios
COMMENT ON TABLE public.ordenes_de_compra IS 'Tabla de órdenes de compra generadas';
COMMENT ON COLUMN public.ordenes_de_compra.codigo IS 'Código único de la OC (ej: 250713AGT-000017)';
COMMENT ON COLUMN public.ordenes_de_compra.adjuntos IS 'Información sobre archivos adjuntos';