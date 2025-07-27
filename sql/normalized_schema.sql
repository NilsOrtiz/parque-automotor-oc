-- Esquema normalizado para reemplazar la tabla vehiculos de 200+ columnas
-- Dividimos en múltiples tablas relacionadas para mejor mantenimiento y performance

-- Tabla principal de vehículos (solo datos esenciales)
CREATE TABLE IF NOT EXISTS vehiculos_nuevos (
  id SERIAL PRIMARY KEY,
  placa VARCHAR(20) UNIQUE NOT NULL,
  interno INTEGER UNIQUE,
  marca VARCHAR(100),
  modelo VARCHAR(100),
  anio INTEGER,
  tipo_vehiculo VARCHAR(50), -- bus, camion, auto, etc
  estado_operativo VARCHAR(50) DEFAULT 'activo', -- activo, mantenimiento, baja
  fecha_ingreso DATE,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de especificaciones técnicas
CREATE TABLE IF NOT EXISTS vehiculos_especificaciones (
  id SERIAL PRIMARY KEY,
  vehiculo_id INTEGER REFERENCES vehiculos_nuevos(id) ON DELETE CASCADE,
  motor VARCHAR(100),
  combustible VARCHAR(50),
  transmision VARCHAR(50),
  cilindrada VARCHAR(50),
  potencia VARCHAR(50),
  capacidad_pasajeros INTEGER,
  peso_bruto INTEGER,
  numero_chasis VARCHAR(100),
  numero_motor VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de documentación legal
CREATE TABLE IF NOT EXISTS vehiculos_documentacion (
  id SERIAL PRIMARY KEY,
  vehiculo_id INTEGER REFERENCES vehiculos_nuevos(id) ON DELETE CASCADE,
  numero_poliza VARCHAR(100),
  compania_seguro VARCHAR(100),
  fecha_vencimiento_seguro DATE,
  numero_habilitacion VARCHAR(100),
  fecha_vencimiento_habilitacion DATE,
  numero_vtv VARCHAR(100),
  fecha_vencimiento_vtv DATE,
  titular_documento VARCHAR(200),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de mantenimiento (configuración)
CREATE TABLE IF NOT EXISTS vehiculos_mantenimiento_config (
  id SERIAL PRIMARY KEY,
  vehiculo_id INTEGER REFERENCES vehiculos_nuevos(id) ON DELETE CASCADE,
  tipo_aceite VARCHAR(100),
  intervalo_km INTEGER,
  intervalo_horas INTEGER,
  ultimo_cambio_km INTEGER DEFAULT 0,
  ultimo_cambio_horas INTEGER DEFAULT 0,
  fecha_ultimo_cambio DATE,
  proximo_cambio_km INTEGER,
  proximo_cambio_horas INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de estado operativo actual
CREATE TABLE IF NOT EXISTS vehiculos_estado_actual (
  id SERIAL PRIMARY KEY,
  vehiculo_id INTEGER REFERENCES vehiculos_nuevos(id) ON DELETE CASCADE,
  kilometraje_actual INTEGER DEFAULT 0,
  horas_actuales INTEGER DEFAULT 0,
  estado_combustible VARCHAR(50),
  observaciones TEXT,
  ultima_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de costos y valores
CREATE TABLE IF NOT EXISTS vehiculos_costos (
  id SERIAL PRIMARY KEY,
  vehiculo_id INTEGER REFERENCES vehiculos_nuevos(id) ON DELETE CASCADE,
  costo_adquisicion DECIMAL(15,2),
  moneda_adquisicion VARCHAR(10) DEFAULT 'ARS',
  valor_actual DECIMAL(15,2),
  fecha_valuacion DATE,
  costo_mantenimiento_anual DECIMAL(15,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de asignaciones (chofer, ruta, etc)
CREATE TABLE IF NOT EXISTS vehiculos_asignaciones (
  id SERIAL PRIMARY KEY,
  vehiculo_id INTEGER REFERENCES vehiculos_nuevos(id) ON DELETE CASCADE,
  chofer_asignado VARCHAR(200),
  ruta_asignada VARCHAR(200),
  turno VARCHAR(50),
  fecha_asignacion DATE,
  fecha_fin_asignacion DATE,
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_vehiculos_placa ON vehiculos_nuevos(placa);
CREATE INDEX IF NOT EXISTS idx_vehiculos_interno ON vehiculos_nuevos(interno);
CREATE INDEX IF NOT EXISTS idx_vehiculos_tipo ON vehiculos_nuevos(tipo_vehiculo);
CREATE INDEX IF NOT EXISTS idx_vehiculos_estado ON vehiculos_nuevos(estado_operativo);

CREATE INDEX IF NOT EXISTS idx_especificaciones_vehiculo ON vehiculos_especificaciones(vehiculo_id);
CREATE INDEX IF NOT EXISTS idx_documentacion_vehiculo ON vehiculos_documentacion(vehiculo_id);
CREATE INDEX IF NOT EXISTS idx_mantenimiento_vehiculo ON vehiculos_mantenimiento_config(vehiculo_id);
CREATE INDEX IF NOT EXISTS idx_estado_vehiculo ON vehiculos_estado_actual(vehiculo_id);
CREATE INDEX IF NOT EXISTS idx_costos_vehiculo ON vehiculos_costos(vehiculo_id);
CREATE INDEX IF NOT EXISTS idx_asignaciones_vehiculo ON vehiculos_asignaciones(vehiculo_id);
CREATE INDEX IF NOT EXISTS idx_asignaciones_activas ON vehiculos_asignaciones(vehiculo_id, activa);

-- Trigger para actualizar timestamp de modificación
CREATE OR REPLACE FUNCTION update_vehiculo_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.fecha_actualizacion = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_vehiculo_timestamp
  BEFORE UPDATE ON vehiculos_nuevos
  FOR EACH ROW
  EXECUTE FUNCTION update_vehiculo_timestamp();

-- Comentarios para documentación
COMMENT ON TABLE vehiculos_nuevos IS 'Tabla principal con datos básicos de vehículos';
COMMENT ON TABLE vehiculos_especificaciones IS 'Especificaciones técnicas del vehículo';
COMMENT ON TABLE vehiculos_documentacion IS 'Documentación legal y seguros';
COMMENT ON TABLE vehiculos_mantenimiento_config IS 'Configuración de mantenimiento preventivo';
COMMENT ON TABLE vehiculos_estado_actual IS 'Estado operativo actual del vehículo';
COMMENT ON TABLE vehiculos_costos IS 'Información financiera y costos';
COMMENT ON TABLE vehiculos_asignaciones IS 'Historial de asignaciones de personal y rutas';