-- =====================================================
-- TABLA CONFIGURACIONES DE VEHÍCULO
-- =====================================================
-- Esta tabla define QUÉ COMPONENTES mostrar en la interfaz
-- para cada tipo de vehículo (sedan, camión, etc.)

CREATE TABLE IF NOT EXISTS configuraciones_vehiculo (
  id SERIAL PRIMARY KEY,
  nombre_configuracion VARCHAR(255) NOT NULL,
  descripcion TEXT,
  tipo_vehiculo INTEGER, -- 1=6 Ruedas, 2=Tracción Delantera, 3=Tracción Trasera, 4=4x4
  
  -- Componentes aplicables (JSONB para flexibilidad)
  componentes_aplicables JSONB NOT NULL DEFAULT '{}',
  
  -- Metadatos
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Agregar campo de referencia en tabla vehiculos
ALTER TABLE vehiculos 
ADD COLUMN IF NOT EXISTS configuracion_id INTEGER REFERENCES configuraciones_vehiculo(id);

-- Crear índices para performance
CREATE INDEX IF NOT EXISTS idx_configuraciones_tipo_vehiculo ON configuraciones_vehiculo(tipo_vehiculo);
CREATE INDEX IF NOT EXISTS idx_vehiculos_configuracion_id ON vehiculos(configuracion_id);

-- =====================================================
-- COMENTARIOS SOBRE LA ESTRUCTURA
-- =====================================================

-- El campo 'componentes_aplicables' contendrá:
-- {
--   "1.1": true,    // Aceite de Motor - SÍ mostrar
--   "1.2": true,    // Filtro Aceite Motor - SÍ mostrar  
--   "1.9": false,   // Trampa de Agua - NO mostrar
--   "8.6": false,   // Neumático E - NO mostrar
--   "8.7": false    // Neumático F - NO mostrar
-- }

-- La numeración corresponde a:
-- 1. ACEITES Y FILTROS
-- 1.1. Aceite de Motor, 1.2. Filtro Aceite Motor, etc.
-- 2. TRANSMISIÓN Y LÍQUIDOS  
-- 3. SISTEMA DE FRENOS
-- 4. MOTOR Y EMBRAGUE
-- 5. SUSPENSIÓN
-- 6. CORREAS
-- 7. SISTEMA ELÉCTRICO
-- 8. NEUMÁTICOS