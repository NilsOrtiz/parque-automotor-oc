-- Tabla para notas recordatorios (post-it)
CREATE TABLE IF NOT EXISTS public.notas_recordatorio (
  id SERIAL PRIMARY KEY,
  recoger TEXT NOT NULL, -- Número interno o "Repuestos"
  de TEXT NOT NULL, -- IDISA, Disbral, Taller, etc
  comentario TEXT, -- Opcional
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  creado_por TEXT DEFAULT 'Operaciones',
  activo BOOLEAN DEFAULT TRUE
);

-- Índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_notas_recordatorio_activo ON public.notas_recordatorio(activo);

-- Comentarios para documentación
COMMENT ON TABLE public.notas_recordatorio IS 'Notas adhesivas tipo post-it para recordatorios de recoger vehículos o repuestos';
COMMENT ON COLUMN public.notas_recordatorio.recoger IS 'Qué recoger: número interno (74, 85) o "Repuestos"';
COMMENT ON COLUMN public.notas_recordatorio.de IS 'De dónde recoger: IDISA, Disbral, Taller, etc';
COMMENT ON COLUMN public.notas_recordatorio.comentario IS 'Comentario adicional opcional';
COMMENT ON COLUMN public.notas_recordatorio.activo IS 'Si false, la nota fue eliminada (soft delete)';
