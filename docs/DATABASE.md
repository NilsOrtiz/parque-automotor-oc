# Base de Datos - Esquema y Tablas

## Conexión Supabase

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

## Tablas Principales

### `pendientes_operaciones`

Registros de vehículos que requieren coordinación operativa.

**Columnas principales:**
```sql
id                      SERIAL PRIMARY KEY
interno                 INTEGER           -- Número interno del vehículo
placa                   TEXT
motivo                  TEXT              -- Razón del pendiente
criticidad              TEXT              -- 'critico', 'medio', 'leve'
estado                  TEXT              -- 'pendiente', 'programado', 'en_proceso', 'completado'
trasladar_a             TEXT              -- 'Taller', 'IDISA', 'Disbral', etc
tiempo_estimado         TEXT              -- '2 horas', '6 horas', '1 día', 'Indeterminado'
fecha_creacion          TIMESTAMP
fecha_programada        DATE              -- Fecha de inicio del trabajo
turno_programado        TEXT              -- 'mañana', 'tarde' (legacy)
observaciones           TEXT

-- Nuevas columnas para franjas horarias
franja_horaria_inicio   TEXT              -- '08:00', '10:00', '12:00', '14:00', '16:00'
franja_horaria_fin      TEXT              -- '10:00', '12:00', '14:00', '16:00', '18:00'
duracion_franjas        INTEGER           -- Número de franjas que ocupa (1-5)
fecha_fin_estimada      DATE              -- Fecha estimada de finalización
es_trabajo_continuo     BOOLEAN           -- true para "Indeterminado"
```

**Constraints:**
```sql
CHECK (franja_horaria_inicio IN ('08:00', '10:00', '12:00', '14:00', '16:00'))
CHECK (duracion_franjas BETWEEN 1 AND 5)
CHECK (estado IN ('pendiente', 'programado', 'en_proceso', 'completado'))
CHECK (criticidad IN ('critico', 'medio', 'leve'))
```

**Índices:**
```sql
idx_pendientes_estado          ON estado
idx_pendientes_fecha           ON fecha_programada
idx_pendientes_franja_inicio   ON franja_horaria_inicio
```

**Script de creación:** `sql/actualizar_franjas_5_horarios.sql`

---

### `notas_recordatorio`

Notas adhesivas tipo post-it para recordatorios.

**Columnas:**
```sql
id                 SERIAL PRIMARY KEY
recoger            TEXT NOT NULL      -- Número interno o "Repuestos"
de                 TEXT NOT NULL      -- 'IDISA', 'Disbral', 'Taller'
comentario         TEXT               -- Opcional
fecha_creacion     TIMESTAMP DEFAULT NOW()
creado_por         TEXT DEFAULT 'Operaciones'
activo             BOOLEAN DEFAULT TRUE    -- Soft delete
```

**Índices:**
```sql
idx_notas_recordatorio_activo ON activo
```

**Script de creación:** `sql/crear_tabla_notas_recordatorio.sql`

---

### `vehiculos`

Información de vehículos de la flota.

**Columnas principales:**
```sql
id                    SERIAL PRIMARY KEY
interno               INTEGER UNIQUE    -- Número interno
placa                 TEXT UNIQUE
marca                 TEXT
modelo                TEXT
año                   INTEGER
tipo_vehiculo         TEXT              -- 'auto', 'camioneta', etc
estado                TEXT              -- 'activo', 'mantenimiento', 'dado_baja'
km_actual             INTEGER
hr_actual             INTEGER           -- Horas (para maquinaria)
```

---

### `ordenes_compra`

Órdenes de compra de repuestos y servicios.

**Columnas principales:**
```sql
id                    SERIAL PRIMARY KEY
numero_orden          TEXT UNIQUE
fecha_orden           DATE
proveedor             TEXT
vehiculo_id           INTEGER REFERENCES vehiculos(id)
monto_total           DECIMAL(10,2)
estado                TEXT              -- 'pendiente', 'aprobada', 'recibida'
descripcion           TEXT
```

---

## Relaciones

```
vehiculos (1) ──< (N) pendientes_operaciones
vehiculos (1) ──< (N) ordenes_compra
```

## Mapeo de Tiempo Estimado a Franjas

```typescript
'2 horas'         → 1 franja
'4 horas'         → 2 franjas
'6 horas'         → 3 franjas
'8 horas'         → 4 franjas
'1 día'           → 5 franjas
'Indeterminado'   → es_trabajo_continuo = true
```

## Cálculo de Fecha Fin

```typescript
function calcularFechaFin(fechaInicio, franjaInicio, duracionFranjas) {
  const franjaInicioNum = FRANJAS.findIndex(f => f.inicio === franjaInicio)
  const franjasRestantesDelDia = 5 - franjaInicioNum

  if (duracionFranjas <= franjasRestantesDelDia) {
    return fechaInicio  // Termina el mismo día
  } else {
    const franjasRestantes = duracionFranjas - franjasRestantesDelDia
    const diasAdicionales = Math.ceil(franjasRestantes / 5)
    return sumarDias(fechaInicio, diasAdicionales)
  }
}
```

## Queries Comunes

### Obtener pendientes programados para una fecha
```typescript
const { data } = await supabase
  .from('pendientes_operaciones')
  .select('*')
  .eq('fecha_programada', '2025-09-30')
  .eq('estado', 'programado')
```

### Obtener trabajos que continúan desde días anteriores
```typescript
const { data } = await supabase
  .from('pendientes_operaciones')
  .select('*')
  .lt('fecha_programada', fechaActual)      // Empezaron antes
  .gte('fecha_fin_estimada', fechaActual)   // Terminan hoy o después
  .eq('estado', 'programado')
```

### Obtener notas activas
```typescript
const { data } = await supabase
  .from('notas_recordatorio')
  .select('*')
  .eq('activo', true)
  .order('fecha_creacion', { ascending: false })
```

## Migraciones Importantes

1. **Franjas horarias**: `sql/actualizar_franjas_5_horarios.sql`
   - Agregar columnas de franjas horarias
   - Migrar de sistema 2 turnos a 5 franjas

2. **Notas recordatorio**: `sql/crear_tabla_notas_recordatorio.sql`
   - Crear tabla para post-its

## Backups

Supabase hace backups automáticos. Para restaurar:
1. Dashboard → Settings → Backups
2. Seleccionar punto de restauración
