-- Tabla de Titulares
-- Basada en la hoja "Titulares" del Excel

CREATE TABLE public.titulares (
  id bigint NOT NULL DEFAULT nextval('titulares_id_seq'::regclass),
  nombre_titular text NOT NULL,
  cuit text,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT titulares_pkey PRIMARY KEY (id),
  CONSTRAINT titulares_cuit_unique UNIQUE (cuit)
);

-- Crear secuencia para ID
CREATE SEQUENCE IF NOT EXISTS titulares_id_seq;

-- Configurar secuencia
ALTER SEQUENCE titulares_id_seq OWNED BY titulares.id;

-- Comentarios
COMMENT ON TABLE public.titulares IS 'Tabla de titulares de vehículos con sus datos fiscales';
COMMENT ON COLUMN public.titulares.nombre_titular IS 'Nombre completo del titular';
COMMENT ON COLUMN public.titulares.cuit IS 'CUIT del titular (único)';