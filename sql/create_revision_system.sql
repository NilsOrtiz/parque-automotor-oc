-- =====================================================
-- SISTEMA DE REVISIONES VEHICULARES
-- Estructura optimizada para Google Cloud Document AI
-- =====================================================

-- Tabla principal de revisiones
CREATE TABLE revisiones_vehiculares (
    id SERIAL PRIMARY KEY,
    vehiculo_id INTEGER NOT NULL REFERENCES vehiculos(id),
    fecha_revision DATE NOT NULL,
    kilometraje_actual INTEGER,
    horas_motor_actual INTEGER,
    tecnico_responsable VARCHAR(100),
    turno VARCHAR(10) CHECK (turno IN ('mañana', 'tarde', 'noche')),
    
    -- Información del procesamiento OCR
    pdf_original_url TEXT,
    procesado_con_ia BOOLEAN DEFAULT FALSE,
    confianza_ocr DECIMAL(5,2), -- Nivel de confianza del OCR (0-100)
    
    -- Evaluación general
    evaluacion_general VARCHAR(20) CHECK (evaluacion_general IN ('excelente', 'bueno', 'regular', 'malo', 'critico')),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de items de revisión detallados
CREATE TABLE items_revision (
    id SERIAL PRIMARY KEY,
    revision_id INTEGER NOT NULL REFERENCES revisiones_vehiculares(id) ON DELETE CASCADE,
    
    -- Categorización
    seccion VARCHAR(50) NOT NULL, -- 'motor', 'filtros', 'frenos', 'neumaticos', etc.
    subseccion VARCHAR(100), -- 'aceite_motor', 'filtro_aire', 'pastillas_eje_a', etc.
    item_especifico VARCHAR(150), -- 'nivel_adecuado', 'color_normal', 'presion_correcta', etc.
    
    -- Estado del checkbox
    checkbox_marcado BOOLEAN,
    confianza_checkbox DECIMAL(5,2), -- Confianza del OCR para este checkbox
    
    -- Valores medidos (para campos numéricos)
    valor_numerico INTEGER, -- Para kilometrajes, presiones, etc.
    unidad_medida VARCHAR(10), -- 'km', 'psi', 'mm', 'hr'
    
    -- Coordenadas del OCR (para debugging)
    bbox_x1 INTEGER,
    bbox_y1 INTEGER,
    bbox_x2 INTEGER,
    bbox_y2 INTEGER,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de observaciones manuscritas
CREATE TABLE observaciones_revision (
    id SERIAL PRIMARY KEY,
    revision_id INTEGER NOT NULL REFERENCES revisiones_vehiculares(id) ON DELETE CASCADE,
    seccion VARCHAR(50) NOT NULL,
    
    -- Texto extraído por OCR
    texto_ocr TEXT,
    confianza_texto DECIMAL(5,2),
    
    -- Imagen de la región manuscrita (para revisión manual)
    imagen_region_url TEXT,
    
    -- Texto corregido manualmente
    texto_corregido TEXT,
    revisado_manualmente BOOLEAN DEFAULT FALSE,
    revisado_por VARCHAR(100),
    fecha_revision_manual TIMESTAMP,
    
    -- Coordenadas de la región
    bbox_x1 INTEGER,
    bbox_y1 INTEGER,
    bbox_x2 INTEGER,
    bbox_y2 INTEGER,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de acciones requeridas (basada en la evaluación)
CREATE TABLE acciones_revision (
    id SERIAL PRIMARY KEY,
    revision_id INTEGER NOT NULL REFERENCES revisiones_vehiculares(id) ON DELETE CASCADE,
    
    -- Clasificación de la acción
    prioridad VARCHAR(20) NOT NULL CHECK (prioridad IN ('inmediata', '7_dias', '30_dias', 'proximo_servicio')),
    componente VARCHAR(100) NOT NULL,
    descripcion TEXT NOT NULL,
    
    -- Estado de la acción
    estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_proceso', 'completada', 'cancelada')),
    
    -- Estimaciones
    costo_estimado DECIMAL(10,2),
    tiempo_estimado_horas INTEGER,
    
    -- Seguimiento
    fecha_programada DATE,
    fecha_completada DATE,
    realizada_por VARCHAR(100),
    observaciones_accion TEXT,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de historial de procesamiento OCR
CREATE TABLE log_procesamiento_ocr (
    id SERIAL PRIMARY KEY,
    revision_id INTEGER NOT NULL REFERENCES revisiones_vehiculares(id),
    
    -- Información del procesamiento
    servicio_usado VARCHAR(50) DEFAULT 'google_document_ai',
    tiempo_procesamiento_ms INTEGER,
    costo_procesamiento DECIMAL(8,4),
    
    -- Métricas de calidad
    total_checkboxes_detectados INTEGER,
    total_texto_regiones INTEGER,
    confianza_promedio DECIMAL(5,2),
    
    -- Información técnica
    modelo_usado VARCHAR(100),
    version_api VARCHAR(50),
    
    -- Resultado crudo (para debugging)
    response_crudo JSONB,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- VISTAS ÚTILES PARA CONSULTAS
-- =====================================================

-- Vista de revisiones con resumen de problemas
CREATE VIEW vista_revisiones_resumen AS
SELECT 
    r.id,
    r.fecha_revision,
    v.Placa,
    v.Marca,
    v.Modelo,
    r.kilometraje_actual,
    r.tecnico_responsable,
    r.evaluacion_general,
    
    -- Contadores de acciones por prioridad
    COUNT(CASE WHEN a.prioridad = 'inmediata' THEN 1 END) as acciones_inmediatas,
    COUNT(CASE WHEN a.prioridad = '7_dias' THEN 1 END) as acciones_7_dias,
    COUNT(CASE WHEN a.prioridad = '30_dias' THEN 1 END) as acciones_30_dias,
    COUNT(CASE WHEN a.prioridad = 'proximo_servicio' THEN 1 END) as acciones_programadas,
    
    -- Estado general de acciones
    COUNT(CASE WHEN a.estado = 'pendiente' THEN 1 END) as acciones_pendientes,
    COUNT(CASE WHEN a.estado = 'completada' THEN 1 END) as acciones_completadas
    
FROM revisiones_vehiculares r
JOIN vehiculos v ON r.vehiculo_id = v.id
LEFT JOIN acciones_revision a ON r.id = a.revision_id
GROUP BY r.id, v.Placa, v.Marca, v.Modelo;

-- Vista de componentes que requieren atención
CREATE VIEW vista_componentes_atencion AS
SELECT 
    v.Placa,
    v.Marca,
    v.Modelo,
    r.fecha_revision,
    a.componente,
    a.prioridad,
    a.descripcion,
    a.estado,
    a.fecha_programada,
    a.costo_estimado
FROM acciones_revision a
JOIN revisiones_vehiculares r ON a.revision_id = r.id
JOIN vehiculos v ON r.vehiculo_id = v.id
WHERE a.estado IN ('pendiente', 'en_proceso')
ORDER BY 
    CASE a.prioridad 
        WHEN 'inmediata' THEN 1
        WHEN '7_dias' THEN 2
        WHEN '30_dias' THEN 3
        WHEN 'proximo_servicio' THEN 4
    END,
    a.created_at;

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

CREATE INDEX idx_revisiones_vehiculo_fecha ON revisiones_vehiculares(vehiculo_id, fecha_revision DESC);
CREATE INDEX idx_items_revision_seccion ON items_revision(revision_id, seccion, subseccion);
CREATE INDEX idx_acciones_prioridad_estado ON acciones_revision(prioridad, estado, fecha_programada);
CREATE INDEX idx_observaciones_revision ON observaciones_revision(revision_id, seccion);

-- =====================================================
-- FUNCIONES ÚTILES
-- =====================================================

-- Función para calcular score de salud del vehículo
CREATE OR REPLACE FUNCTION calcular_score_vehiculo(p_vehiculo_id INTEGER)
RETURNS DECIMAL(5,2) AS $$
DECLARE
    score DECIMAL(5,2) := 100.0;
    acciones_criticas INTEGER;
    acciones_importantes INTEGER;
    ultima_revision DATE;
BEGIN
    -- Obtener última revisión
    SELECT fecha_revision INTO ultima_revision
    FROM revisiones_vehiculares 
    WHERE vehiculo_id = p_vehiculo_id 
    ORDER BY fecha_revision DESC 
    LIMIT 1;
    
    -- Si no hay revisión reciente, score bajo
    IF ultima_revision IS NULL OR ultima_revision < CURRENT_DATE - INTERVAL '45 days' THEN
        RETURN 30.0;
    END IF;
    
    -- Contar acciones pendientes por prioridad
    SELECT 
        COUNT(CASE WHEN prioridad IN ('inmediata', 'critico') THEN 1 END),
        COUNT(CASE WHEN prioridad = '7_dias' THEN 1 END)
    INTO acciones_criticas, acciones_importantes
    FROM acciones_revision a
    JOIN revisiones_vehiculares r ON a.revision_id = r.id
    WHERE r.vehiculo_id = p_vehiculo_id 
    AND a.estado = 'pendiente'
    AND r.fecha_revision = ultima_revision;
    
    -- Penalizar según acciones pendientes
    score := score - (acciones_criticas * 25.0) - (acciones_importantes * 10.0);
    
    -- Asegurar que esté entre 0 y 100
    RETURN GREATEST(0.0, LEAST(100.0, score));
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS PARA AUDITORÍA
-- =====================================================

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION actualizar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_revisiones_updated_at
    BEFORE UPDATE ON revisiones_vehiculares
    FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();

CREATE TRIGGER trigger_acciones_updated_at
    BEFORE UPDATE ON acciones_revision
    FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();