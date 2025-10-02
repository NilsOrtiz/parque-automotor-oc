# Arquitectura del Sistema Dinámico de Componentes de Vehículos

## Índice
1. [Visión General](#visión-general)
2. [Estructura de Datos](#estructura-de-datos)
3. [Flujo de Datos](#flujo-de-datos)
4. [Componentes del Sistema](#componentes-del-sistema)
5. [IDs Reservados](#ids-reservados)
6. [Patrones de Implementación](#patrones-de-implementación)
7. [Casos de Uso](#casos-de-uso)
8. [Consideraciones Técnicas](#consideraciones-técnicas)

---

## Visión General

### Concepto Principal
El sistema permite gestionar dinámicamente los componentes de mantenimiento de vehículos sin modificar código. Se basa en 4 capas configurables:

```
┌─────────────────────────────────────────────────┐
│  CAPA 1: SCHEMA (Estructura de BD)             │
│  Define qué columnas existen en vehiculos       │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  CAPA 2: EXCLUSIONES (Filtrado)                │
│  Define qué columnas NO son de mantenimiento    │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  CAPA 3: ALIAS (Mapeo Legacy)                  │
│  Mapea nombres no estándar a componentes        │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  CAPA 4: CATEGORÍAS (Agrupación)               │
│  Define cómo agrupar componentes en UI          │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  CAPA 5: PERFILES (Aplicabilidad)              │
│  Define qué componentes aplican a cada vehículo │
└─────────────────────────────────────────────────┘
```

### Principio de Diseño
**Todo es dinámico y configurable desde la interfaz**. No se requiere tocar código para:
- Agregar nuevos componentes
- Cambiar categorización
- Crear perfiles de vehículos
- Manejar nombres legacy

---

## Estructura de Datos

### Patrón de Columnas en BD

**Formato estándar:**
```
{componente}_{tipo}
```

**Tipos soportados:**
- `_km` → Kilometraje del último mantenimiento (integer)
- `_fecha` → Fecha del último mantenimiento (date)
- `_modelo` → Modelo/marca del componente (text)
- `_intervalo` → Intervalo de cambio en km (integer)
- `_litros` → Capacidad en litros (decimal)
- `_hr` → Horas de uso (integer, para maquinaria)

**Ejemplo:**
```sql
-- Componente: aceite_motor
aceite_motor_km         integer
aceite_motor_fecha      date
aceite_motor_modelo     text
aceite_motor_intervalo  integer
aceite_motor_litros     decimal
aceite_motor_hr         integer
```

### Componente Virtual

Un "componente" es una agrupación lógica de columnas relacionadas:

```typescript
type ComponenteVehiculo = {
  id: string              // "aceite_motor"
  label: string           // "Aceite Motor" (generado)
  fields: {
    km?: string          // "aceite_motor_km" (nombre real en BD)
    fecha?: string       // "aceite_motor_fecha"
    modelo?: string      // "aceite_motor_modelo"
    intervalo?: string   // "aceite_motor_intervalo"
    litros?: string      // "aceite_motor_litros"
    hr?: string          // "aceite_motor_hr"
  }
}
```

**Proceso de detección:**
1. Lee todas las columnas de `vehiculos`
2. Excluye las que están en exclusiones (id=999999)
3. Detecta patrón `{componente}_{tipo}` o busca en alias (id=999998)
4. Agrupa por `{componente}` base
5. Asigna a categoría según configuración (id=999997)

---

## Flujo de Datos

### 1. Lectura de Componentes Dinámicos

**Archivo:** `src/lib/componentes-dinamicos.ts`
**Función:** `cargarComponentesDinamicos()`

```typescript
async function cargarComponentesDinamicos(): Promise<CategoriaComponentes[]> {
  // 1. Cargar configuraciones del sistema
  const [exclusiones, alias, categorias] = await Promise.all([
    cargarColumnasExcluidas(),        // id=999999
    cargarAlias(),                     // id=999998
    cargarConfiguracionCategorias()    // id=999997
  ])

  // 2. Leer columnas de vehiculos
  const { data } = await supabase.from('vehiculos').select('*').limit(1)
  const columnas = Object.keys(data)

  // 3. Procesar cada columna
  columnas.forEach(col => {
    // 3.1 Excluir si está en exclusiones
    if (exclusiones.includes(col)) return

    // 3.2 Detectar componente y tipo
    let componente = ''
    let tipo = ''

    // Primero verificar alias
    if (alias[col]) {
      componente = alias[col].componente
      tipo = alias[col].tipo
    }
    // Luego patrón estándar
    else if (col.endsWith('_km')) {
      componente = col.replace('_km', '')
      tipo = 'km'
    }
    // ... más tipos

    // 3.3 Agrupar por componente
    if (!componentesMap.has(componente)) {
      componentesMap.set(componente, {
        id: componente,
        label: generarLabel(componente),
        fields: {}
      })
    }
    componentesMap.get(componente).fields[tipo] = col
  })

  // 4. Categorizar componentes
  const categoriasFinales = categorias.categorias.map(catDef => ({
    id: catDef.id,
    nombre: catDef.nombre,
    icono: catDef.icono,
    componentes: todosComponentes.filter(comp =>
      obtenerCategoriaDeComponente(comp.id, categorias.asignaciones) === catDef.id
    )
  }))

  return categoriasFinales
}
```

**Salida:**
```typescript
[
  {
    id: "aceites-filtros",
    nombre: "Aceites y Filtros",
    icono: "🛢️",
    componentes: [
      {
        id: "aceite_motor",
        label: "Aceite Motor",
        fields: {
          km: "aceite_motor_km",
          fecha: "aceite_motor_fecha",
          modelo: "aceite_motor_modelo",
          intervalo: "aceite_motor_intervalo"
        }
      },
      // ... más componentes
    ]
  },
  // ... más categorías
]
```

### 2. Aplicación de Perfiles

**Flujo en `/vehiculos/busqueda`:**

```typescript
// 1. Cargar vehículo
const vehiculo = await supabase
  .from('vehiculos')
  .select('*')
  .eq('id', vehiculoId)
  .single()

// 2. Cargar perfil asignado
const perfil = await supabase
  .from('configuraciones_vehiculo')
  .select('componentes_aplicables')
  .eq('id', vehiculo.tipo_vehiculo)
  .single()

// componentes_aplicables = ["aceite_motor", "filtro_combustible", "bateria"]

// 3. Filtrar componentes aplicables
function filtrarComponentesAplicables(componenteId: string) {
  if (!perfil?.componentes_aplicables) return true // Mostrar todo si no hay perfil
  return perfil.componentes_aplicables.includes(componenteId)
}

// 4. Renderizar solo componentes del perfil
<ComponenteInput
  fields={allFields.filter((_, idx) =>
    filtrarComponentesAplicables(componentIds[idx])
  )}
/>
```

---

## Componentes del Sistema

### 1. Schema (`/admin/schema`)

**Propósito:** Gestionar la estructura de la tabla `vehiculos`

**Funcionalidades:**
- ✅ Muestra todas las columnas existentes
- ✅ Detecta componentes automáticamente
- ✅ Identifica componentes incompletos (falta _km, _fecha, etc.)
- ✅ Genera SQL para agregar columnas faltantes
- ✅ Muestra alias configurados
- ✅ Navegación a exclusiones, alias y categorías

**Archivos:**
- `src/app/admin/schema/page.tsx`

**Proceso:**
```typescript
async function cargarSchemaReal() {
  // 1. Cargar configuraciones
  const [exclusiones, alias] = await Promise.all([
    cargarColumnasExcluidas(),
    cargarAlias()
  ])

  // 2. Leer columnas de BD
  const { data } = await supabase.from('vehiculos').select('*').limit(1)
  const columnas = Object.keys(data)

  // 3. Procesar y agrupar por componente
  // Similar a cargarComponentesDinamicos pero para visualización de schema
}
```

### 2. Exclusiones (`/admin/exclusiones`)

**Propósito:** Definir qué columnas NO son de mantenimiento

**Configuración guardada en:** `configuraciones_vehiculo` id=999999

**Estructura:**
```json
{
  "id": 999999,
  "nombre_configuracion": "__EXCLUSIONES_SISTEMA__",
  "componentes_aplicables": [
    "id",
    "created_at",
    "updated_at",
    "placa",
    "numero_interno",
    "marca",
    "modelo",
    "año",
    "kilometraje_actual",
    "hora_actual",
    "tipo_vehiculo"
  ]
}
```

**Archivos:**
- `src/app/admin/exclusiones/page.tsx`
- `src/lib/exclusiones-mantenimiento.ts`

**Funciones principales:**
```typescript
export async function cargarColumnasExcluidas(): Promise<string[]>
export async function guardarColumnasExcluidas(columnas: string[]): Promise<void>
export async function obtenerTodasLasColumnas(): Promise<string[]>
export function obtenerExclusionesPorDefecto(): string[]
```

### 3. Alias (`/admin/alias`)

**Propósito:** Mapear nombres de columnas no estándar

**Configuración guardada en:** `configuraciones_vehiculo` id=999998

**Estructura:**
```json
{
  "id": 999998,
  "nombre_configuracion": "__ALIAS_SISTEMA__",
  "componentes_aplicables": [
    {
      "nombre_real": "intervalo_cambio_aceite",
      "componente": "aceite_motor",
      "tipo": "intervalo"
    },
    {
      "nombre_real": "intervalo_cambio_aceite_hr",
      "componente": "aceite_motor",
      "tipo": "intervalo"
    }
  ]
}
```

**Archivos:**
- `src/app/admin/alias/page.tsx`
- `src/lib/alias-columnas.ts`

**Tipos:**
```typescript
export type AliasColumna = {
  nombre_real: string       // Nombre exacto en BD
  componente: string        // Componente al que pertenece
  tipo: 'km' | 'fecha' | 'modelo' | 'intervalo' | 'litros' | 'hr'
}
```

**Funciones principales:**
```typescript
export async function cargarAlias(): Promise<AliasColumna[]>
export async function guardarAlias(alias: AliasColumna[]): Promise<void>
export function convertirAliasARecord(alias: AliasColumna[]): Record<string, {...}>
```

**Uso en detección de componentes:**
```typescript
// Primero verificar alias
if (COLUMNAS_ALIAS[col]) {
  const alias = COLUMNAS_ALIAS[col]
  nombreComponente = alias.componente
  tipoColumna = alias.tipo
}
// Luego patrón estándar
else if (col.endsWith('_km')) {
  nombreComponente = col.replace('_km', '')
  tipoColumna = 'km'
}
```

### 4. Categorías (`/admin/categorias`)

**Propósito:** Agrupar componentes en secciones lógicas

**Configuración guardada en:** `configuraciones_vehiculo` id=999997

**Estructura:**
```json
{
  "id": 999997,
  "nombre_configuracion": "__CATEGORIAS_SISTEMA__",
  "componentes_aplicables": {
    "categorias": [
      {
        "id": "aceites-filtros",
        "nombre": "Aceites y Filtros",
        "icono": "🛢️"
      },
      {
        "id": "correas",
        "nombre": "Correas",
        "icono": "🔗"
      }
    ],
    "asignaciones": [
      {
        "componente": "aceite_motor",
        "categoria_id": "aceites-filtros"
      },
      {
        "componente": "correa_polyv",
        "categoria_id": "correas"
      }
    ]
  }
}
```

**Archivos:**
- `src/app/admin/categorias/page.tsx`
- `src/lib/categorias-componentes.ts`

**Tipos:**
```typescript
export type CategoriaDefinicion = {
  id: string          // "aceites-filtros"
  nombre: string      // "Aceites y Filtros"
  icono: string       // "🛢️"
}

export type ComponenteCategoria = {
  componente: string      // "aceite_motor"
  categoria_id: string    // "aceites-filtros"
}
```

**Funciones principales:**
```typescript
export async function cargarConfiguracionCategorias(): Promise<ConfiguracionCategorias>
export async function guardarConfiguracionCategorias(config: ConfiguracionCategorias): Promise<void>
export function obtenerCategoriaDeComponente(componente: string, asignaciones: ComponenteCategoria[]): string
```

**Funcionalidades UI:**
- Crear nueva categoría (nombre + emoji)
- Editar categoría existente
- Eliminar categoría (mueve componentes a "Otros")
- Asignar componentes a categorías con dropdown

### 5. Perfiles (`/vehiculos/perfiles`)

**Propósito:** Definir qué componentes aplican a cada tipo de vehículo

**Configuración guardada en:** `configuraciones_vehiculo` (IDs normales, no reservados)

**Estructura:**
```json
{
  "id": 1,
  "nombre_configuracion": "Mercedes Bus Escolar",
  "descripcion": "Buses Mercedes para transporte escolar",
  "componentes_aplicables": [
    "aceite_motor",
    "filtro_aceite_motor",
    "filtro_combustible",
    "bateria",
    "neumatico_modelo_marca"
  ],
  "activo": true
}
```

**Archivos:**
- `src/app/vehiculos/perfiles/page.tsx`

**Uso:**
```typescript
// 1. Cargar componentes dinámicos
const categorias = await cargarComponentesDinamicos()

// 2. Crear perfil seleccionando componentes
const perfil = {
  nombre_configuracion: "Mercedes Bus",
  componentes_aplicables: ["aceite_motor", "filtro_combustible"]
}

// 3. Guardar
await supabase.from('configuraciones_vehiculo').insert(perfil)

// 4. Asignar a vehículo
await supabase
  .from('vehiculos')
  .update({ tipo_vehiculo: perfil.id })
  .eq('id', vehiculoId)
```

**Importante:** El sistema filtra automáticamente los IDs reservados:
```typescript
const perfilesNormalizados = (data || [])
  .filter(perfil => perfil.id !== 999998 && perfil.id !== 999999 && perfil.id !== 999997)
  .map(perfil => ({...}))
```

### 6. Búsqueda de Vehículos (`/vehiculos/busqueda`)

**Propósito:** Editar vehículos mostrando solo componentes aplicables

**Archivos:**
- `src/app/vehiculos/busqueda/page.tsx`

**Flujo:**
```typescript
// 1. Cargar vehículo
const vehiculo = await buscarVehiculo(placa)

// 2. Cargar configuración del perfil
if (vehiculo.tipo_vehiculo) {
  const perfil = await supabase
    .from('configuraciones_vehiculo')
    .select('componentes_aplicables')
    .eq('id', vehiculo.tipo_vehiculo)
    .single()

  setConfiguracion(perfil.componentes_aplicables)
}

// 3. Filtrar componentes
function filtrarComponentesAplicables(componenteId: string): boolean {
  if (!configuracion || configuracion.length === 0) return true
  return configuracion.includes(componenteId)
}

// 4. Renderizar secciones filtradas
{categorias.map(categoria => (
  <div>
    <h3>{categoria.nombre}</h3>
    {categoria.componentes
      .filter(comp => filtrarComponentesAplicables(comp.id))
      .map(comp => (
        <ComponenteInput fields={comp.fields} />
      ))
    }
  </div>
))}
```

---

## IDs Reservados

El sistema usa IDs especiales en la tabla `configuraciones_vehiculo` para almacenar configuraciones del sistema:

| ID | Nombre | Propósito | Estructura |
|----|--------|-----------|------------|
| **999999** | `__EXCLUSIONES_SISTEMA__` | Columnas excluidas de mantenimiento | `string[]` |
| **999998** | `__ALIAS_SISTEMA__` | Mapeo de nombres legacy | `AliasColumna[]` |
| **999997** | `__CATEGORIAS_SISTEMA__` | Categorización de componentes | `{categorias, asignaciones}` |

**Campo utilizado:** `componentes_aplicables` (JSONB)

**Importante:**
- Estos IDs nunca deben usarse para perfiles reales
- El sistema los filtra automáticamente al listar perfiles
- Se crean con `activo: false` para distinguirlos visualmente

---

## Patrones de Implementación

### Patrón 1: Carga de Configuraciones en Paralelo

Siempre cargar todas las configuraciones necesarias en paralelo:

```typescript
const [exclusiones, alias, categorias] = await Promise.all([
  cargarColumnasExcluidas(),
  cargarAlias(),
  cargarConfiguracionCategorias()
])
```

**Razón:** Minimiza latencia al hacer una sola espera para múltiples queries.

### Patrón 2: Detección con Prioridad de Alias

El orden de detección es importante:

```typescript
// 1. Primero alias (nombres no estándar)
if (COLUMNAS_ALIAS[col]) {
  componente = COLUMNAS_ALIAS[col].componente
  tipo = COLUMNAS_ALIAS[col].tipo
}
// 2. Luego patrón estándar
else if (col.endsWith('_km')) {
  componente = col.replace('_km', '')
  tipo = 'km'
}
```

**Razón:** Los alias permiten manejar excepciones antes de aplicar reglas generales.

### Patrón 3: Componente Map para Agrupación

Usar `Map` para agrupar campos por componente:

```typescript
const componentesMap = new Map<string, ComponenteVehiculo>()

columnas.forEach(col => {
  if (!componentesMap.has(componente)) {
    componentesMap.set(componente, {
      id: componente,
      label: generarLabel(componente),
      fields: {}
    })
  }

  const comp = componentesMap.get(componente)!
  comp.fields[tipo] = col
})

const todosComponentes = Array.from(componentesMap.values())
```

**Razón:** Permite agrupar eficientemente múltiples campos de un mismo componente.

### Patrón 4: Filtrado en Cliente

El filtrado de componentes aplicables se hace en el cliente:

```typescript
// Cargar todas las categorías con todos los componentes
const categorias = await cargarComponentesDinamicos()

// Filtrar en renderizado
{categoria.componentes
  .filter(comp => filtrarComponentesAplicables(comp.id))
  .map(comp => <ComponenteInput {...comp} />)
}
```

**Razón:**
- Simplifica lógica del servidor
- Permite cambiar filtros sin recargar datos
- Mejor UX con actualizaciones instantáneas

### Patrón 5: Actualización con "Recargar"

En páginas que dependen de configuraciones dinámicas, siempre incluir botón "Recargar":

```typescript
async function cargarComponentes() {
  setLoadingComponentes(true)
  try {
    const cats = await cargarComponentesDinamicos()
    setCategorias(cats)
  } finally {
    setLoadingComponentes(false)
  }
}

<button onClick={cargarComponentes}>
  <RefreshCw className={loading ? 'animate-spin' : ''} />
  Recargar
</button>
```

**Razón:** Permite ver cambios en schema/exclusiones/alias/categorías sin recargar página completa.

---

## Casos de Uso

### Caso 1: Agregar Nuevo Componente "Filtro DPF"

**1. Ejecutar SQL en Supabase:**
```sql
ALTER TABLE vehiculos ADD COLUMN filtro_dpf_km integer;
ALTER TABLE vehiculos ADD COLUMN filtro_dpf_fecha date;
ALTER TABLE vehiculos ADD COLUMN filtro_dpf_modelo text;
ALTER TABLE vehiculos ADD COLUMN filtro_dpf_intervalo integer;
```

**2. Configurar categoría (opcional):**
- Ir a `/admin/categorias`
- Asignar "filtro_dpf" → "Aceites y Filtros"
- Guardar

**3. Actualizar perfiles:**
- Ir a `/vehiculos/perfiles`
- Click "Recargar" → Aparece "Filtro DPF"
- Editar cada perfil que lo necesite
- Marcar ☑ Filtro DPF
- Guardar

**4. Resultado:**
- En búsqueda de vehículos con ese perfil, aparece "Filtro DPF"

### Caso 2: Manejar Columna Legacy "intervalo_aceite_viejo"

**Problema:** Ya existe columna `intervalo_aceite_viejo` en BD que debería ser parte de "aceite_motor"

**Solución:**

**1. Crear alias:**
- Ir a `/admin/alias`
- Agregar alias:
  - Nombre Real: `intervalo_aceite_viejo`
  - Componente: `aceite_motor`
  - Tipo: `intervalo`
- Guardar

**2. Verificar en schema:**
- Ir a `/admin/schema`
- Buscar "aceite_motor"
- Ver que en columna "Intervalo" aparece "intervalo_aceite_viejo" con indicador "📌 Alias"

**3. Actualizar perfiles:**
- Ir a `/vehiculos/perfiles`
- Click "Recargar"
- "Aceite Motor" ahora incluye el campo legacy

### Caso 3: Crear Categoría Nueva "Sistema Hidráulico"

**1. Crear categoría:**
- Ir a `/admin/categorias`
- Click "Nueva Categoría"
- Nombre: "Sistema Hidráulico"
- Icono: 💧
- Guardar

**2. Asignar componentes:**
- En la misma página, en cada componente hidráulico
- Cambiar dropdown a "💧 Sistema Hidráulico"
- Guardar

**3. Verificar en perfiles:**
- Ir a `/vehiculos/perfiles`
- Click "Recargar"
- Ahora hay sección "💧 Sistema Hidráulico"

### Caso 4: Excluir Columna "observaciones"

**Problema:** Columna `observaciones` aparece como componente pero es solo un campo de texto

**Solución:**

**1. Marcar como excluida:**
- Ir a `/admin/exclusiones`
- Buscar "observaciones"
- Click para marcarla (fondo amarillo)
- Guardar

**2. Verificar:**
- Ir a `/admin/schema` → Ya no aparece
- Ir a `/vehiculos/perfiles` → Click "Recargar" → Ya no aparece

---

## Consideraciones Técnicas

### 1. Rendimiento

**Carga de Componentes:**
- Se hace 1 query a `vehiculos` (limit 1) para schema
- Se hacen 3 queries paralelas para configuraciones
- Total: 4 queries, solo al cargar página o hacer "Recargar"

**Caché Natural:**
- Los componentes se cargan en estado React
- No se recargan en cada renderizado
- Solo se actualizan con "Recargar" explícito

**Optimización:**
```typescript
// ✅ Bueno: Cargar una vez
useEffect(() => {
  cargarComponentesDinamicos()
}, [])

// ❌ Malo: Cargar en cada render
const componentes = await cargarComponentesDinamicos() // No usar en render
```

### 2. Consistencia de Datos

**Problema:** Usuario cambia schema mientras otro edita perfiles

**Mitigación:**
- Botón "Recargar" visible en todas las páginas
- Validación en guardado (si componente no existe, ignorar)
- No hay locks ni transacciones complejas

**Recomendación:**
- Cambios en schema/configuraciones: hacerlos en horarios de baja actividad
- Comunicar a usuarios antes de cambios grandes

### 3. Migración de Datos

**Al renombrar componente:**

❌ **Incorrecto:**
```sql
-- No hacer esto directamente
ALTER TABLE vehiculos RENAME COLUMN aceite_viejo_km TO aceite_motor_km;
```

✅ **Correcto:**
1. Crear alias para nombre viejo
2. Agregar columnas con nombre nuevo
3. Copiar datos:
```sql
UPDATE vehiculos SET aceite_motor_km = aceite_viejo_km;
```
4. Mantener alias hasta verificar
5. Eventualmente eliminar columnas viejas

### 4. Validación de IDs

**IDs Reservados:**
```typescript
const IDS_RESERVADOS = [999997, 999998, 999999]

function esIdReservado(id: number): boolean {
  return IDS_RESERVADOS.includes(id)
}

// Filtrar al cargar perfiles
.filter(perfil => !esIdReservado(perfil.id))
```

### 5. Generación de Labels

**Función `generarLabel()`:**

```typescript
function generarLabel(nombreComponente: string): string {
  // 1. Casos especiales hardcodeados
  const casosEspeciales: Record<string, string> = {
    'neumatico_modelo_marca': 'Modelo/Marca General',
    'aceite_transmicion': 'Aceite de Transmisión'
  }

  if (casosEspeciales[nombreComponente]) {
    return casosEspeciales[nombreComponente]
  }

  // 2. Conversión automática de snake_case a Title Case
  return nombreComponente
    .split('_')
    .map(palabra => {
      // Preservar acrónimos
      if (['km', 'hr'].includes(palabra.toLowerCase())) {
        return palabra.toUpperCase()
      }
      return palabra.charAt(0).toUpperCase() + palabra.slice(1)
    })
    .join(' ')
}

// Ejemplos:
// "aceite_motor" → "Aceite Motor"
// "filtro_aire_km_a" → "Filtro Aire KM A"
// "correa_polyv" → "Correa Polyv"
```

**Agregar casos especiales:**
Editar directamente la función en `src/lib/componentes-dinamicos.ts`

### 6. Tipos TypeScript

**Mantener sincronizados:**

```typescript
// src/lib/supabase.ts
export interface Vehiculo {
  id: number
  placa: string
  tipo_vehiculo?: number  // ← Debe corresponder a configuraciones_vehiculo.id

  // Componentes dinámicos (ejemplos)
  aceite_motor_km?: number
  aceite_motor_fecha?: string
  // ... no es necesario declarar todos
}

// src/lib/componentes-dinamicos.ts
export type ComponenteVehiculo = {
  id: string
  label: string
  fields: Record<string, string>  // ← Nombres de columnas reales
}
```

**No es necesario** mantener types exhaustivos de cada columna. El sistema es dinámico.

### 7. Debugging

**Habilitar logs de detección:**

```typescript
// En componentes-dinamicos.ts (ya implementado)
if (COLUMNAS_ALIAS[col]) {
  const alias = COLUMNAS_ALIAS[col]
  nombreComponente = alias.componente
  tipoColumna = alias.tipo
  console.log('🔍 Alias detectado:', col, '→', nombreComponente, tipoColumna)
}

// En guardado de componentes
if (tipoColumna === 'intervalo') {
  comp.tieneIntervalo = true
  comp.columnaIntervalo = col
  console.log('  ✅ Guardado intervalo:', comp.nombre, '→', col)
}
```

**Ver en consola del navegador:**
- F12 → Console
- Buscar logs con emoji (🔍, ✅)
- Verificar qué se detecta y qué se guarda

---

## Resumen de Archivos Clave

### Librerías Core
```
src/lib/
├── componentes-dinamicos.ts      # Motor principal de detección
├── exclusiones-mantenimiento.ts  # Gestión de exclusiones (999999)
├── alias-columnas.ts             # Gestión de alias (999998)
└── categorias-componentes.ts     # Gestión de categorías (999997)
```

### Interfaces de Administración
```
src/app/admin/
├── schema/page.tsx         # Gestión de estructura BD
├── exclusiones/page.tsx    # Configurar columnas excluidas
├── alias/page.tsx          # Configurar mapeos legacy
└── categorias/page.tsx     # Configurar agrupaciones
```

### Interfaces de Usuario
```
src/app/vehiculos/
├── page.tsx               # Hub principal con menú admin
├── perfiles/page.tsx      # Crear/editar perfiles de vehículos
└── busqueda/page.tsx      # Buscar y editar vehículos
```

### Documentación
```
docs/
├── ARQUITECTURA_SISTEMA_DINAMICO.md   # Este archivo (referencia técnica)
├── FLUJO_SCHEMA_PERFILES.md          # Guía de usuario
├── SISTEMA_ALIAS.md                  # Guía de alias
└── DATABASE.md                       # Estructura de BD
```

---

## Checklist para Implementaciones Futuras

Al replicar este sistema en otro proyecto:

### Setup Inicial
- [ ] Crear tabla base con patrón `{componente}_{tipo}`
- [ ] Crear tabla de configuraciones (equivalente a `configuraciones_vehiculo`)
- [ ] Reservar IDs especiales (999997, 999998, 999999)
- [ ] Definir tipos de campos soportados

### Librerías
- [ ] Implementar detección dinámica (basado en `componentes-dinamicos.ts`)
- [ ] Implementar sistema de exclusiones
- [ ] Implementar sistema de alias
- [ ] Implementar sistema de categorías

### Interfaces
- [ ] Página de schema/estructura
- [ ] Página de exclusiones
- [ ] Página de alias
- [ ] Página de categorías
- [ ] Página de perfiles/configuraciones
- [ ] Página de uso/aplicación

### Testing
- [ ] Probar agregar componente nuevo
- [ ] Probar manejar nombre legacy con alias
- [ ] Probar crear categoría nueva
- [ ] Probar crear perfil y filtrar
- [ ] Probar botones "Recargar"

### Documentación
- [ ] Documentar patrones de columnas
- [ ] Documentar IDs reservados
- [ ] Documentar flujo de datos
- [ ] Crear guía de usuario

---

## Conclusión

Este sistema es una arquitectura de **detección dinámica con configuración en BD**.

**Ventajas:**
- ✅ Zero código para agregar funcionalidad
- ✅ Flexible y extensible
- ✅ Backward compatible con alias
- ✅ UI amigable para configuración

**Trade-offs:**
- ⚠️ Requiere disciplina en nomenclatura
- ⚠️ No hay validación fuerte de tipos
- ⚠️ Debugging más complejo (todo es dinámico)

**Cuándo usar:**
- Cuando la estructura de datos cambia frecuentemente
- Cuando diferentes clientes necesitan diferentes campos
- Cuando usuarios técnicos pueden gestionar configuraciones

**Cuándo NO usar:**
- Cuando la estructura es fija y conocida
- Cuando se necesita validación estricta de tipos
- Cuando el rendimiento es crítico (muchas queries)

---

## 9. Integración en Páginas del Sistema

### 9.1 Búsqueda de Vehículos (`/vehiculos/busqueda`)

**Implementación del Sistema Dinámico:**

```typescript
// Cargar categorías al montar
const [componentesAgrupados, setComponentesAgrupados] = useState<CategoriaComponentes[]>([])

useEffect(() => {
  cargarComponentesAgrupados()
}, [])

async function cargarComponentesAgrupados() {
  const categorias = await obtenerComponentesAgrupados()
  setComponentesAgrupados(categorias)
}
```

**Navegación Rápida Dinámica:**

```tsx
{/* Botones de navegación generados dinámicamente */}
<div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
  {componentesAgrupados.map((categoria) => (
    <button
      key={categoria.id}
      onClick={() => scrollToSection(categoria.id)}
      className="flex flex-col items-center p-3 rounded-lg"
    >
      <span className="text-2xl mb-2">{categoria.icono}</span>
      <span className="text-xs font-medium">{categoria.nombre}</span>
    </button>
  ))}
</div>
```

**Secciones de Mantenimiento Dinámicas:**

```tsx
{/* Mapeo dinámico de categorías a secciones de UI */}
{componentesAgrupados.map((categoria) => (
  <div key={categoria.id} id={categoria.id}>
    <MantenimientoSection
      title={categoria.nombre}
      fields={categoria.componentes.map(comp => ({
        label: comp.label,
        kmField: comp.columnaKm as keyof Vehiculo,
        dateField: comp.columnaFecha as keyof Vehiculo,
        modelField: comp.columnaModelo as keyof Vehiculo,
        intervaloField: comp.columnaIntervalo as keyof Vehiculo,
        litersField: comp.columnaLitros as keyof Vehiculo,
        hrField: comp.columnaHr as keyof Vehiculo
      }))}
      vehiculo={vehiculo}
      editedVehiculo={editedVehiculo}
      editMode={editMode}
      onUpdate={updateVehiculo}
    />
  </div>
))}
```

**Ventajas de esta implementación:**
- ✅ No requiere actualizar código al agregar componentes
- ✅ Iconos y nombres se cargan desde la configuración
- ✅ Secciones se generan automáticamente
- ✅ Se adapta al perfil del vehículo (si está implementado)

### 9.2 Registro de Servicio (`/vehiculos/registro-servicio`)

**Carga de Categorías Dinámicas:**

```typescript
const [categoriasComponentes, setCategoriasComponentes] = useState<CategoriaComponentes[]>([])

useEffect(() => {
  cargarCategorias()
}, [])

async function cargarCategorias() {
  const categorias = await obtenerComponentesAgrupados()
  setCategoriasComponentes(categorias)
}
```

**Selección de Sistemas con Iconos Dinámicos:**

```tsx
{/* Toggles de sistemas generados desde categorías */}
<div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
  {categoriasComponentes.map((categoria) => {
    const estaActiva = seccionesSeleccionadas.has(categoria.id)

    return (
      <button
        key={categoria.id}
        onClick={() => toggleSeccionMultiple(categoria.id)}
        className={`flex flex-col items-center p-3 rounded-lg border-2 ${
          estaActiva
            ? 'border-green-500 bg-green-100 shadow-lg'
            : 'border-gray-200 bg-gray-50'
        }`}
      >
        <span className="text-2xl mb-2">{categoria.icono}</span>
        <span className="text-xs font-medium">{categoria.nombre}</span>
        {/* Indicador de estado */}
        <div className={`mt-1 w-2 h-2 rounded-full ${
          estaActiva ? 'bg-green-500' : 'bg-gray-300'
        }`}></div>
      </button>
    )
  })}
</div>
```

**Función para Obtener Campos por Categoría:**

```typescript
// Obtener campos de una categoría específica
const obtenerCamposPorCategoria = (categoriaId: string) => {
  const categoria = categoriasComponentes.find(cat => cat.id === categoriaId)
  if (!categoria) return []

  return categoria.componentes.map(comp => ({
    label: comp.label,
    kmField: comp.columnaKm,
    dateField: comp.columnaFecha,
    modelField: comp.columnaModelo,
    intervaloField: comp.columnaIntervalo,
    litersField: comp.columnaLitros,
    hrField: comp.columnaHr
  }))
}

// Retrocompatibilidad con código existente
const obtenerCamposFiltrados = (seccionId: string) => {
  return obtenerCamposPorCategoria(seccionId)
}
```

**Actualización de Subclasificaciones:**

```typescript
// Al seleccionar una categoría, actualizar subclasificación
const toggleSeccionMultiple = (seccionId: string) => {
  const nuevasSecciones = new Set(seccionesSeleccionadas)

  if (nuevasSecciones.has(seccionId)) {
    nuevasSecciones.delete(seccionId)
  } else {
    nuevasSecciones.add(seccionId)
  }

  setSeccionesSeleccionadas(nuevasSecciones)

  // Actualizar subclasificación con nombres dinámicos
  if (nuevasSecciones.size > 0) {
    const nombresSecciones = Array.from(nuevasSecciones)
      .map(id => categoriasComponentes.find(c => c.id === id)?.nombre)
      .filter(Boolean)
      .join(', ')
    setSubclasificacion(nombresSecciones)
  } else {
    setSubclasificacion('')
  }
}
```

**Listado de Componentes para Selección:**

```tsx
{/* Componentes seleccionables por categoría */}
{Array.from(seccionesSeleccionadas).map(seccionId => {
  const categoria = categoriasComponentes.find(c => c.id === seccionId)
  const campos = obtenerCamposFiltrados(seccionId)

  return (
    <div key={seccionId} className="border rounded-lg overflow-hidden">
      <div className="p-3 bg-gray-50 border-b">
        <div className="flex items-center gap-2">
          <span className="text-xl">{categoria?.icono || '📦'}</span>
          <h6 className="font-semibold">{categoria?.nombre}</h6>
          <span className="text-xs bg-white px-2 py-1 rounded-full">
            {campos.length} componentes
          </span>
        </div>
      </div>

      <div className="p-3 space-y-2">
        {campos.map((campo, index) => (
          <div key={`${seccionId}-${index}`} className="p-2 border rounded-lg">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={componentesSeleccionados.has(campo.label)}
                onChange={() => toggleComponente(campo.label)}
                className="mr-3"
              />
              <span className="font-medium">{campo.label}</span>
            </label>
          </div>
        ))}
      </div>
    </div>
  )
})}
```

**Ventajas de esta implementación:**
- ✅ Formularios rápidos se adaptan automáticamente
- ✅ Componentes se cargan desde configuración
- ✅ Iconos personalizables por categoría
- ✅ Estado visual dinámico (activo/inactivo)
- ✅ Subclasificaciones automáticas

### 9.3 Manejo de Errores en Datos Legacy

**Problema:** Registros antiguos con datos corruptos en `ocs_vehiculos`

**Solución Implementada:**

```typescript
// Validación antes de parsear JSON
historialConOrdenes?.forEach(registro => {
  if (registro.ocs_vehiculos) {
    try {
      // Validar formato JSON válido
      const value = registro.ocs_vehiculos.trim()
      if (value.startsWith('[') || value.startsWith('{')) {
        const ids = JSON.parse(value)
        if (Array.isArray(ids)) {
          ids.forEach(id => ordenesUtilizadas.add(id))
        }
      }
      // Si no es JSON válido, ignorar silenciosamente
    } catch (e) {
      // Ignorar silenciosamente datos corruptos
    }
  }
})
```

**Errores comunes evitados:**
- ❌ `SyntaxError: Unexpected token 'N', "NA" is not valid JSON`
- ❌ `SyntaxError: Unexpected non-whitespace character after JSON`

**Aplicado en:**
- `/vehiculos/busqueda` (función `cargarHistorial`)
- `/vehiculos/registro-servicio` (función `cargarOrdenesDisponibles`)

### 9.4 Componente MantenimientoSection

**Actualización para Soportar Todos los Campos:**

```typescript
interface Props {
  title: string
  fields: Array<{
    label: string
    kmField?: keyof Vehiculo
    dateField?: keyof Vehiculo
    modelField?: keyof Vehiculo
    intervaloField?: keyof Vehiculo    // ← NUEVO
    litersField?: keyof Vehiculo
    hrField?: keyof Vehiculo
  }>
  vehiculo: Vehiculo
  editedVehiculo: Vehiculo | null
  editMode: boolean
  onUpdate: (updates: Partial<Vehiculo>) => void
}
```

**Campos Renderizados:**
1. **Kilometraje** - Valor numérico con formato `X,XXX km`
2. **Fecha** - Date picker con formato local
3. **Modelo** - Campo de texto libre
4. **Intervalo** - Valor numérico con formato `X,XXX km` (NUEVO)
5. **Litros** - Valor decimal con formato `X.X L`
6. **Horas** - Valor numérico con formato `X,XXX hrs`

**Lógica de Ocultación:**
- Solo muestra campos que tienen datos válidos
- Oculta campos marcados como "N/A" o "No Aplica"
- Oculta fechas con valor `1900-01-01`
- Oculta valores numéricos con `-1`

### 9.5 Patrón de Migración para Otras Páginas

**Template para adaptar páginas al sistema dinámico:**

1. **Importar dependencias:**
```typescript
import { obtenerComponentesAgrupados, type CategoriaComponentes } from '@/lib/componentes-dinamicos'
```

2. **Agregar estado:**
```typescript
const [categoriasComponentes, setCategoriasComponentes] = useState<CategoriaComponentes[]>([])
```

3. **Cargar en useEffect:**
```typescript
useEffect(() => {
  async function cargar() {
    const categorias = await obtenerComponentesAgrupados()
    setCategoriasComponentes(categorias)
  }
  cargar()
}, [])
```

4. **Reemplazar constantes hardcodeadas:**
```typescript
// ❌ ANTES
const secciones = [
  { id: 'aceites-filtros', nombre: 'Aceites y Filtros', ... },
  // ...
]

// ✅ DESPUÉS
{categoriasComponentes.map(categoria => (
  // Usar categoria.id, categoria.nombre, categoria.icono
))}
```

5. **Actualizar referencias:**
```typescript
// ❌ ANTES
secciones.find(s => s.id === id)?.nombre

// ✅ DESPUÉS
categoriasComponentes.find(c => c.id === id)?.nombre
```

**Páginas pendientes de migración:**
- `/vehiculos/mantenimientos` - Lista de mantenimientos
- `/vehiculos/neumaticos` - Gestión de neumáticos
- Otras páginas que muestren componentes de vehículos

---

## Resumen de Mejoras Recientes

### Cambios en la Arquitectura
1. ✅ Sistema completamente dinámico de categorías
2. ✅ Integración en búsqueda de vehículos
3. ✅ Integración en registro de servicio
4. ✅ Soporte completo de 6 tipos de campos
5. ✅ Manejo robusto de datos legacy corruptos

### Impacto en Mantenibilidad
- **Reducción de código:** ~550 líneas menos de código hardcodeado
- **Flexibilidad:** Cambios en UI sin tocar código
- **Escalabilidad:** Agregar componentes es instantáneo
- **Debugging:** Errores silenciosos para datos legacy

### Próximos Pasos Recomendados
1. Migrar `/vehiculos/mantenimientos` al sistema dinámico
2. Agregar filtrado por perfil en registro de servicio
3. Implementar validaciones dinámicas por tipo de componente
4. Crear página de reportes con categorías dinámicas
