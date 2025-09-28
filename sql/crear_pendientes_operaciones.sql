-- Crear tabla para pendientes que ve operaciones
-- Esta tabla será poblada automáticamente desde datos de mantenimientos
-- y editable directamente por taller desde Supabase

CREATE TABLE IF NOT EXISTS pendientes_operaciones (
  id SERIAL PRIMARY KEY,
  vehiculo_id INTEGER NOT NULL REFERENCES vehiculos(id),
  interno INTEGER,
  placa TEXT NOT NULL,
  trasladar_a TEXT DEFAULT 'Taller',
  tiempo_estimado TEXT DEFAULT '4-6 horas',
  motivo TEXT DEFAULT 'Service + Revisión',
  criticidad TEXT DEFAULT 'critico' CHECK (criticidad IN ('leve', 'medio', 'critico')),
  porcentaje_vida_km DECIMAL(5,2),
  porcentaje_vida_hr DECIMAL(5,2),
  km_faltantes INTEGER,
  hr_faltantes INTEGER,
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'programado', 'en_proceso', 'completado')),
  es_automatico BOOLEAN DEFAULT true, -- true si fue creado automáticamente, false si manual
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  observaciones TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_pendientes_operaciones_vehiculo_id ON pendientes_operaciones(vehiculo_id);
CREATE INDEX IF NOT EXISTS idx_pendientes_operaciones_interno ON pendientes_operaciones(interno);
CREATE INDEX IF NOT EXISTS idx_pendientes_operaciones_placa ON pendientes_operaciones(placa);
CREATE INDEX IF NOT EXISTS idx_pendientes_operaciones_estado ON pendientes_operaciones(estado);
CREATE INDEX IF NOT EXISTS idx_pendientes_operaciones_criticidad ON pendientes_operaciones(criticidad);
CREATE INDEX IF NOT EXISTS idx_pendientes_operaciones_es_automatico ON pendientes_operaciones(es_automatico);

-- Trigger para actualizar fecha_actualizacion
CREATE OR REPLACE FUNCTION update_pendientes_operaciones_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.fecha_actualizacion = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_pendientes_operaciones_updated_at
  BEFORE UPDATE ON pendientes_operaciones
  FOR EACH ROW
  EXECUTE FUNCTION update_pendientes_operaciones_updated_at();

-- Comentarios para documentar la tabla
COMMENT ON TABLE pendientes_operaciones IS 'Tabla que almacena los pendientes de mantenimiento para operaciones. Poblada automáticamente desde criterios de mantenimiento críticos y editable por taller';
COMMENT ON COLUMN pendientes_operaciones.vehiculo_id IS 'ID del vehículo (referencia a tabla vehiculos)';
COMMENT ON COLUMN pendientes_operaciones.interno IS 'Número interno del vehículo (copiado para facilidad de consulta)';
COMMENT ON COLUMN pendientes_operaciones.placa IS 'Placa del vehículo (copiado para facilidad de consulta)';
COMMENT ON COLUMN pendientes_operaciones.trasladar_a IS 'Destino donde llevar el vehículo (ej: Taller, IDISA, etc.)';
COMMENT ON COLUMN pendientes_operaciones.tiempo_estimado IS 'Tiempo estimado que tomará el trabajo (editable por taller)';
COMMENT ON COLUMN pendientes_operaciones.motivo IS 'Descripción del motivo del mantenimiento';
COMMENT ON COLUMN pendientes_operaciones.criticidad IS 'Nivel de criticidad: leve, medio, critico';
COMMENT ON COLUMN pendientes_operaciones.porcentaje_vida_km IS 'Porcentaje de vida útil restante por kilometraje';
COMMENT ON COLUMN pendientes_operaciones.porcentaje_vida_hr IS 'Porcentaje de vida útil restante por horas';
COMMENT ON COLUMN pendientes_operaciones.km_faltantes IS 'Kilómetros faltantes para el próximo service';
COMMENT ON COLUMN pendientes_operaciones.hr_faltantes IS 'Horas faltantes para el próximo service';
COMMENT ON COLUMN pendientes_operaciones.estado IS 'Estado del pendiente: pendiente, programado, en_proceso, completado';
COMMENT ON COLUMN pendientes_operaciones.es_automatico IS 'true si fue creado automáticamente, false si fue creado manualmente';
COMMENT ON COLUMN pendientes_operaciones.observaciones IS 'Observaciones adicionales editables por taller';