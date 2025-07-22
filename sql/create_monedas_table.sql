-- Crear tabla de monedas de referencia
CREATE TABLE public.monedas (
    id BIGSERIAL PRIMARY KEY,
    codigo VARCHAR(3) NOT NULL UNIQUE, -- ISO 4217
    nombre VARCHAR(100) NOT NULL,
    simbolo VARCHAR(10) NOT NULL,
    pais VARCHAR(100) NOT NULL,
    activa BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar monedas principales
INSERT INTO public.monedas (codigo, nombre, simbolo, pais) VALUES
-- Monedas principales de la región
('ARS', 'Peso Argentino', '$', 'Argentina'),
('BRL', 'Real Brasileño', 'R$', 'Brasil'),
('USD', 'Dólar Estadounidense', 'US$', 'Estados Unidos'),
('EUR', 'Euro', '€', 'Unión Europea'),

-- Otras monedas sudamericanas
('UYU', 'Peso Uruguayo', '$U', 'Uruguay'),
('CLP', 'Peso Chileno', '$', 'Chile'),
('PEN', 'Sol Peruano', 'S/', 'Perú'),
('COP', 'Peso Colombiano', '$', 'Colombia'),
('BOB', 'Boliviano', 'Bs', 'Bolivia'),
('PYG', 'Guaraní Paraguayo', '₲', 'Paraguay'),

-- Monedas internacionales importantes
('GBP', 'Libra Esterlina', '£', 'Reino Unido'),
('JPY', 'Yen Japonés', '¥', 'Japón'),
('CAD', 'Dólar Canadiense', 'C$', 'Canadá'),
('AUD', 'Dólar Australiano', 'A$', 'Australia'),
('CHF', 'Franco Suizo', 'CHF', 'Suiza'),
('CNY', 'Yuan Chino', '¥', 'China'),
('MXN', 'Peso Mexicano', '$', 'México');

-- Crear índices
CREATE INDEX idx_monedas_codigo ON public.monedas(codigo);
CREATE INDEX idx_monedas_activa ON public.monedas(activa);

-- Habilitar RLS
ALTER TABLE public.monedas ENABLE ROW LEVEL SECURITY;

-- Política para permitir lectura a todos
CREATE POLICY "Allow read access to monedas" 
ON public.monedas 
FOR SELECT 
TO anon, authenticated 
USING (true);

-- Comentarios
COMMENT ON TABLE public.monedas IS 'Tabla de referencia para códigos ISO 4217 de monedas';
COMMENT ON COLUMN public.monedas.codigo IS 'Código ISO 4217 de 3 letras (ej: ARS, BRL, USD)';
COMMENT ON COLUMN public.monedas.simbolo IS 'Símbolo de la moneda para mostrar en UI (ej: $, R$, US$)';