-- Tabla de Proveedores
-- Basada en la hoja "Proveedores" del Excel

CREATE TABLE public.proveedores (
  id bigint NOT NULL DEFAULT nextval('proveedores_id_seq'::regclass),
  nombre text NOT NULL,
  cuit text,
  direccion text,
  telefono text,
  gmail text,
  con_iva text DEFAULT 'NO',
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT proveedores_pkey PRIMARY KEY (id),
  CONSTRAINT proveedores_cuit_unique UNIQUE (cuit),
  CONSTRAINT proveedores_con_iva_check CHECK (con_iva IN ('SI', 'NO'))
);

-- Crear secuencia para ID
CREATE SEQUENCE IF NOT EXISTS proveedores_id_seq;

-- Configurar secuencia
ALTER SEQUENCE proveedores_id_seq OWNED BY proveedores.id;

-- Comentarios
COMMENT ON TABLE public.proveedores IS 'Tabla de proveedores para órdenes de compra';
COMMENT ON COLUMN public.proveedores.nombre IS 'Nombre o razón social del proveedor';
COMMENT ON COLUMN public.proveedores.cuit IS 'CUIT del proveedor (único)';
COMMENT ON COLUMN public.proveedores.direccion IS 'Dirección del proveedor';
COMMENT ON COLUMN public.proveedores.telefono IS 'Teléfono de contacto';
COMMENT ON COLUMN public.proveedores.gmail IS 'Email de contacto';
COMMENT ON COLUMN public.proveedores.con_iva IS 'Indica si el proveedor maneja IVA (SI/NO)';