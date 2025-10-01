# Arquitectura del Sistema - Parque Automotor

## Stack Tecnológico

- **Framework**: Next.js 15 (App Router)
- **Lenguaje**: TypeScript
- **Base de Datos**: Supabase (PostgreSQL)
- **Estilos**: Tailwind CSS
- **Despliegue**: Vercel
- **Iconos**: Lucide React

## Estructura del Proyecto

```
parque-automotor/
├── src/
│   ├── app/                    # App Router (Next.js 15)
│   │   ├── pendientes/         # Sistema de pendientes de operaciones
│   │   ├── vehiculos/          # Gestión de vehículos
│   │   ├── ordenes-compra/     # Sistema de órdenes de compra
│   │   └── api/                # API Routes
│   ├── components/             # Componentes React reutilizables
│   │   └── CalendarioFranjasHorarias.tsx  # Calendario de programación
│   └── lib/
│       └── supabase.ts         # Cliente y tipos de Supabase
├── sql/                        # Scripts SQL para Supabase
└── docs/                       # Documentación del proyecto
```

## Módulos Principales

### 1. Pendientes de Operaciones (`/pendientes`)
Sistema de coordinación entre Taller y Operaciones para vehículos que requieren traslado o atención especial.

**Características:**
- Lista de pendientes con filtros por estado
- Calendario semanal con 5 franjas horarias (08:00-18:00)
- Programación visual drag-and-drop
- Trabajos multi-día (continúan al día siguiente)
- Notas adhesivas (post-it) para recordatorios
- Colores por vehículo y estado

### 2. Gestión de Vehículos (`/vehiculos`)
CRUD y seguimiento de vehículos de la flota.

### 3. Órdenes de Compra (`/ordenes-compra`)
Sistema de gestión de órdenes de compra y repuestos.

## Conceptos Clave

### Franjas Horarias
Sistema de 5 slots de 2 horas cada uno:
- 08:00-10:00 (Inicio mañana)
- 10:00-12:00 (Mitad mañana)
- 12:00-14:00 (Final mañana)
- 14:00-16:00 (Inicio tarde)
- 16:00-18:00 (Final tarde)

### Duración de Trabajos
Mapeo de tiempo estimado a franjas:
- 2 horas → 1 franja
- 4 horas → 2 franjas
- 6 horas → 3 franjas
- 8 horas → 4 franjas
- 1 día → 5 franjas
- Indeterminado → Trabajo continuo (aparece todos los días)

### Trabajos Multi-día
Trabajos que no terminan en el día actual continúan automáticamente:
- Se calcula `fecha_fin_estimada` basado en franjas restantes
- Aparecen en días siguientes con duración ajustada
- Mantienen color y posición vertical consistente

### Estados de Pendientes
- `pendiente` - Color rosa/naranja/amarillo según criticidad
- `programado` - Color verde
- `en_proceso` - En ejecución
- `completado` - Finalizado

## Patrones de Diseño

### Color Consistente por Vehículo
Cada vehículo tiene un color único basado en su ID:
```typescript
const colorIndex = vehicleId % 10  // 10 colores en paleta
```
El color se mantiene en todos los slots donde aparece el vehículo.

### Posición Vertical Persistente
Los vehículos mantienen su posición vertical (fila) incluso cuando otros desaparecen:
- Se usa un array con slots vacíos (`null`)
- Los espacios vacíos se renderizan como divs invisibles
- Preserva la altura visual

### Soft Delete
Las eliminaciones no borran registros, solo marcan como inactivo:
```sql
UPDATE tabla SET activo = false WHERE id = X
```

## Variables de Entorno

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
```

## Flujo de Datos

1. **Cliente** (React) ↔ Supabase Client (`@/lib/supabase`)
2. **API Routes** (`/api/*`) ↔ Supabase (operaciones complejas)
3. **Directo desde Cliente** para operaciones simples (CRUD)

## Consideraciones Importantes

- **No usar git commands destructivos** sin confirmación del usuario
- **Commits incluyen co-author**: Claude <noreply@anthropic.com>
- **localStorage solo para preferencias UI**, datos en Supabase
- **Fechas en formato ISO**: `YYYY-MM-DD`
- **Timezone**: Uruguay (America/Montevideo)
