# Funcionalidades del Sistema

## 1. Sistema de Pendientes de Operaciones

**Ruta:** `/pendientes`
**Componente principal:** `src/app/pendientes/page.tsx`

### Descripción
Sistema de coordinación entre Taller y Operaciones para vehículos que requieren traslado o servicio externo.

### Características

#### 1.1 Lista de Pendientes
- **Filtros por estado**: Todos, Pendiente, Programado, En Proceso, Completado
- **Código de colores**:
  - Rosa/Naranja/Amarillo: según criticidad (pendiente)
  - Verde: programado
- **Información mostrada**:
  - Número interno y placa
  - Dónde trasladar (Taller, IDISA, Disbral)
  - Tiempo estimado
  - Motivo del pendiente
  - Criticidad

#### 1.2 Calendario de Programación Semanal
**Componente:** `src/components/CalendarioFranjasHorarias.tsx`

**Características visuales:**
- Muestra 7 días consecutivos desde hoy (rolling calendar)
- Días pasados no se muestran
- 5 franjas horarias por día:
  - 08:00-10:00
  - 10:00-12:00
  - 12:00-14:00
  - 14:00-16:00
  - 16:00-18:00

**Funcionalidades:**
- Click en vehículo de la lista → selección
- Click en franja del calendario → programar
- Múltiples vehículos por franja permitidos
- Color único por vehículo (basado en ID)
- Posición vertical consistente

#### 1.3 Trabajos Multi-Franja
Trabajos que ocupan múltiples slots consecutivos:
- **2 horas** → 1 slot
- **6 horas** → 3 slots (ejemplo: 08:00, 10:00, 12:00)
- **1 día** → 5 slots completos

**Visualización:**
- Slot de inicio: muestra número interno + botón eliminar
- Slots de continuación: muestra número interno + "..." (opacidad 75%)

**Código clave:**
```typescript
// Detectar si es continuación
const esInicioTrabajo = scheduled.franja_horaria_inicio === franja.inicio
const esContinuacionTrabajo =
  scheduled.franja_horaria_inicio !== franja.inicio &&
  scheduled.duracion_franjas > 1
```

#### 1.4 Trabajos Multi-Día
Trabajos que no terminan en un día continúan al siguiente:
- **Ejemplo**: Vehículo programado 16:00-18:00 con 6 horas (3 slots)
  - Día 1: 16:00-18:00 (1 slot)
  - Día 2: 08:00-10:00, 10:00-12:00 (2 slots restantes)

**Función clave:**
```typescript
function getTrabajosDesdeOtrosDias(fecha: string): ScheduledVehicle[] {
  // Busca trabajos que empezaron antes pero continúan hoy
  const trabajosAnteriores = pendientes.filter(p =>
    p.fecha_programada < fecha &&
    p.fecha_fin_estimada >= fecha &&
    p.estado === 'programado'
  )
  // Calcula franjas restantes para hoy
}
```

#### 1.5 Posición Vertical Persistente
Los vehículos mantienen su "fila" incluso cuando otros desaparecen:

```typescript
// Crear array con espacios vacíos
const slotsConEspacios = new Array(maxPosiciones).fill(null)

// Asignar cada vehículo a su posición global
todosLosVehiculos.forEach(trabajo => {
  const posicionGlobal = posicionesGlobales.get(trabajo.id)
  slotsConEspacios[posicionGlobal] = { /* datos */ }
})

// Renderizar incluyendo espacios vacíos invisibles
{slotsConEspacios.map(scheduled =>
  scheduled === null
    ? <div style={{visibility: 'hidden'}} />
    : <div>...</div>
)}
```

#### 1.6 Notas Recordatorio (Post-it)
**Ubicación:** Entre filtros y lista de pendientes

**Características:**
- Estilo post-it amarillo
- Campos:
  - **Recoger**: Número interno o "Repuestos"
  - **De**: IDISA, Disbral, Taller, etc
  - **Comentario**: Opcional
- Botón X para eliminar
- Hover scale effect
- Almacenadas en Supabase (`notas_recordatorio`)

**Uso típico:**
```
Recoger: 74
De: IDISA
Comentario: Reparación completa
```

---

## 2. Gestión de Vehículos

**Ruta:** `/vehiculos`

### 2.1 Lista de Vehículos
CRUD completo de vehículos de la flota.

### 2.2 Análisis de Combustible
**Ruta:** `/vehiculos/analisis-combustible`
Visualización de consumos y rendimientos.

### 2.3 Neumáticos
**Ruta:** `/vehiculos/neumaticos`
Control de neumáticos por vehículo.

### 2.4 Registro de Servicio
**Ruta:** `/vehiculos/registro-servicio`
Historial de mantenimientos.

---

## 3. Órdenes de Compra

**Ruta:** `/ordenes-compra`

### 3.1 Crear Orden
**Ruta:** `/ordenes-compra/crear`
Formulario para nuevas órdenes.

### 3.2 Listado
**Ruta:** `/ordenes-compra/listado`
Todas las órdenes con filtros.

### 3.3 Stock
**Ruta:** `/ordenes-compra/stock`
Control de inventario.

### 3.4 Por Vehículo
**Ruta:** `/ordenes-compra/por-vehiculo`
Órdenes agrupadas por vehículo.

---

## APIs Importantes

### `/api/pendientes/programar`
**Método:** POST, DELETE

**POST - Programar pendiente:**
```typescript
{
  pendiente_id: number
  fecha_programada: string      // '2025-09-30'
  franja_horaria_inicio: string // '08:00'
}
```

**Respuesta:**
```typescript
{
  success: true
  pendiente: PendienteOperacion
  detalles: {
    duracion_franjas: number
    fecha_fin_estimada: string
    es_trabajo_continuo: boolean
  }
}
```

**DELETE - Desprogramar:**
```
/api/pendientes/programar?id=123
```

---

## Flujos Clave

### Programar un Vehículo

1. Usuario selecciona vehículo de la lista (click)
2. Click en franja del calendario
3. `handleSchedulePendiente()` se ejecuta:
   ```typescript
   - Valida franja horaria
   - Calcula duracion_franjas basado en tiempo_estimado
   - Calcula fecha_fin_estimada
   - POST a /api/pendientes/programar
   - Recarga pendientes
   ```
4. Vehículo aparece en calendario con su color único
5. Si ocupa múltiples franjas, se extiende automáticamente
6. Si no termina hoy, continúa mañana

### Desprogramar un Vehículo

1. Click en botón X en el slot de inicio
2. `handleRemoveScheduled()` se ejecuta:
   ```typescript
   - DELETE a /api/pendientes/programar?id=X
   - Recarga pendientes
   ```
3. Vehículo desaparece del calendario
4. Vuelve a estado "pendiente" en la lista

### Crear Nota Recordatorio

1. Click en botón "+ Nueva Nota"
2. Aparece formulario (post-it verde)
3. Llenar campos: Recoger, De, Comentario
4. Click "Guardar Nota"
5. `agregarNota()` se ejecuta:
   ```typescript
   - Valida campos requeridos
   - INSERT en notas_recordatorio
   - Recarga notas
   ```
6. Nota aparece como post-it amarillo

---

## Shortcuts y Atajos

- **Seleccionar pendiente**: Click en fila de la tabla
- **Programar**: Click en franja (con pendiente seleccionado)
- **Desprogramar**: Click en X (solo en slot de inicio)
- **Agregar nota**: Click en botón "+"
- **Eliminar nota**: Click en X de la nota

---

## Estados y Transiciones

```
pendiente → [programar] → programado → [iniciar] → en_proceso → [completar] → completado
    ↑                          |
    |                          |
    +------[desprogramar]------+
```

---

## Reglas de Negocio

1. **No se puede programar en el pasado** - `isPast` previene clicks
2. **Múltiples vehículos por slot permitidos** - Sin límite
3. **Trabajos "Indeterminado"** aparecen todos los días como "Trabajos Continuos"
4. **Color se mantiene** - Un vehículo siempre tiene el mismo color
5. **Posición vertical se mantiene** - Un vehículo en 2da fila siempre está en 2da fila
6. **Soft delete** - Notas marcadas como `activo=false`, no se borran
7. **Calendario rolling** - Siempre muestra 7 días desde hoy
