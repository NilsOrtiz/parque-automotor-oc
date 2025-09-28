# Sistema de Pendientes de Operaciones

## Resumen del Sistema

Se ha implementado un sistema completo para gestionar pendientes de mantenimiento orientado a Operaciones, que permite un control más granular y editable desde taller.

## Componentes Implementados

### 1. Base de Datos
- **Tabla nueva**: `pendientes_operaciones`
- **Función SQL**: `actualizar_pendientes_operaciones()` - Pobla automáticamente la tabla
- **Función wrapper**: `ejecutar_actualizacion_pendientes()` - Devuelve JSON para la app

### 2. API Endpoints
- **`/api/actualizar-pendientes`** (POST/GET) - Ejecuta actualización manual
- **`/api/cron/actualizar-pendientes`** (GET/POST) - Para ejecución automática

### 3. Interfaz de Usuario
- **Página `/pendientes`** - Completamente rediseñada para usar la nueva tabla
- **Filtros por estado** - pendiente, programado, en_proceso, completado
- **Botón de actualización manual** - "Actualizar Automáticos"
- **Indicadores visuales** - elementos AUTO vs manuales

### 4. Automatización
- **Script Node.js** - `scripts/actualizar-pendientes-auto.js`
- **Endpoint de cron** - Para servicios como Vercel Cron

## Configuración y Uso

### 1. Configurar Base de Datos
```sql
-- Ejecutar en Supabase SQL Editor:
-- 1. Crear tabla
\i sql/crear_pendientes_operaciones.sql

-- 2. Crear funciones
\i sql/funcion_actualizar_pendientes_operaciones.sql
```

### 2. Primera Ejecución
Una vez creada la tabla, en la página `/pendientes`:
1. Hacer clic en "Actualizar Automáticos"
2. Verificar que aparezcan los vehículos críticos (≤5% vida útil)

### 3. Edición Manual (Para Taller)
Los registros se pueden editar directamente en Supabase:

**Campos editables más importantes:**
- `trasladar_a` - Cambiar "Taller" por "IDISA", etc.
- `tiempo_estimado` - Modificar "4-6 horas" por "8 horas", etc.
- `motivo` - Personalizar descripción del trabajo
- `estado` - Cambiar entre: pendiente, programado, en_proceso, completado
- `observaciones` - Agregar notas específicas

### 4. Automatización Periódica

#### Opción A: Cron Job en Servidor
```bash
# Cada 4 horas
0 */4 * * * cd /path/to/parque-automotor && node scripts/actualizar-pendientes-auto.js >> logs/cron.log 2>&1

# Cada día a las 6 AM
0 6 * * * cd /path/to/parque-automotor && node scripts/actualizar-pendientes-auto.js >> logs/cron.log 2>&1
```

#### Opción B: Vercel Cron (Recomendado)
```javascript
// En vercel.json
{
  "crons": [
    {
      "path": "/api/cron/actualizar-pendientes",
      "schedule": "0 */4 * * *"
    }
  ]
}
```

#### Opción C: Manual
Los usuarios pueden hacer clic en "Actualizar Automáticos" cuando lo necesiten.

## Flujo de Trabajo

### 1. Detección Automática
- La función SQL analiza todos los vehículos de Cuenca del Plata
- Identifica aquellos con ≤5% vida útil (por KM o horas)
- Crea registros automáticos con valores predeterminados

### 2. Personalización por Taller
- Taller edita directamente en Supabase los campos necesarios
- Puede cambiar tiempos, destinos, agregar observaciones
- Marcar elementos como procesados

### 3. Coordinación Operacional
- Operaciones ve la lista filtrada y controlada
- Pueden programar vehículos en el calendario
- Filtrar por estado para seguimiento

## Variables de Entorno Opcionales

```env
# Token para proteger endpoints de cron (opcional)
CRON_SECRET_TOKEN=tu_token_secreto_aqui

# URL base para el script de automatización
NEXT_PUBLIC_BASE_URL=https://tu-app.vercel.app
```

## Ventajas del Nuevo Sistema

1. **Control Total**: Taller puede modificar cualquier aspecto desde Supabase
2. **Automatización**: Los casos críticos se detectan automáticamente
3. **Flexibilidad**: Mezcla elementos automáticos con manuales
4. **Seguimiento**: Estados permiten rastrear progreso
5. **Separación de Roles**: Taller controla, Operaciones coordina

## Troubleshooting

### Si no aparecen pendientes automáticos:
1. Verificar que existe la tabla `pendientes_operaciones`
2. Ejecutar manualmente la función SQL: `SELECT ejecutar_actualizacion_pendientes();`
3. Verificar que haya vehículos con ≤5% vida útil en `/vehiculos/mantenimientos`

### Si el cron no funciona:
1. Verificar logs del servidor
2. Probar el endpoint manualmente: `GET /api/cron/actualizar-pendientes`
3. Verificar que la URL base esté correcta

### Para debugging:
- Logs disponibles en consola del navegador
- Endpoint GET `/api/actualizar-pendientes` muestra estadísticas
- Verificar tablas directamente en Supabase