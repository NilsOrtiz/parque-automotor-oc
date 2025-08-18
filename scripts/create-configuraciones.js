// Script para crear tabla configuraciones_vehiculo
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://pzqprblqxwevluqmytig.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6cXByYmxxeHdldmx1cW15dGlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5NTEyNTksImV4cCI6MjA2ODUyNzI1OX0.qd_99FNyQDTbXQ85nhqoOjIU5uydm49RIpxM9QFFB1w'

const supabase = createClient(supabaseUrl, supabaseKey)

async function createConfiguracionesTable() {
  console.log('🏗️ Creando tabla configuraciones_vehiculo...')
  
  // Como no podemos crear tablas con el cliente, 
  // vamos a verificar si existe y simular
  try {
    const { data, error } = await supabase
      .from('configuraciones_vehiculo')
      .select('id')
      .limit(1)
    
    if (error && error.code === '42P01') {
      console.log('❌ Tabla no existe. Necesita crearse manualmente en Supabase Dashboard.')
      console.log('📋 SQL a ejecutar:')
      console.log(`
CREATE TABLE configuraciones_vehiculo (
  id SERIAL PRIMARY KEY,
  nombre_configuracion VARCHAR(255) NOT NULL,
  descripcion TEXT,
  tipo_vehiculo INTEGER,
  componentes_aplicables JSONB NOT NULL DEFAULT '{}',
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE vehiculos 
ADD COLUMN configuracion_id INTEGER REFERENCES configuraciones_vehiculo(id);
      `)
    } else {
      console.log('✅ Tabla configuraciones_vehiculo ya existe.')
    }
  } catch (error) {
    console.error('Error:', error)
  }
}

createConfiguracionesTable()