# Documentación del Sistema - Parque Automotor

Sistema integral de gestión de flota vehicular con énfasis en coordinación operativa y mantenimiento.

## 📚 Índice de Documentación

### [ARCHITECTURE.md](./ARCHITECTURE.md)
Visión general de la arquitectura del sistema:
- Stack tecnológico
- Estructura del proyecto
- Módulos principales
- Patrones de diseño
- Flujo de datos

**Leer cuando:**
- Inicias desarrollo en el proyecto
- Necesitas entender la estructura general
- Vas a agregar un módulo nuevo

---

### [DATABASE.md](./DATABASE.md)
Esquema completo de la base de datos:
- Tablas y columnas
- Relaciones
- Constraints y validaciones
- Queries comunes
- Scripts SQL

**Leer cuando:**
- Necesitas consultar/modificar la base de datos
- Vas a crear una nueva tabla
- Necesitas entender las relaciones entre datos

---

### [FEATURES.md](./FEATURES.md)
Funcionalidades detalladas del sistema:
- Sistema de pendientes de operaciones
- Calendario de programación
- Trabajos multi-franja y multi-día
- Notas recordatorio
- Gestión de vehículos
- Órdenes de compra

**Leer cuando:**
- Necesitas modificar una funcionalidad existente
- Vas a agregar features relacionadas
- Necesitas entender flujos de usuario

---

## 🚀 Quick Start

### Para Claude (AI Assistant)

Cuando retomes el proyecto después de tiempo:

1. **Lee primero:** `ARCHITECTURE.md` (5 min) para recordar la estructura general
2. **Luego:** `FEATURES.md` en la sección relevante a la tarea
3. **Si modificas DB:** Consulta `DATABASE.md`

### Para Desarrolladores

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con credenciales de Supabase

# Ejecutar en desarrollo
npm run dev

# Abrir http://localhost:3000
```

## 📍 Rutas Principales

| Ruta | Descripción |
|------|-------------|
| `/` | Dashboard principal |
| `/pendientes` | Sistema de pendientes (calendario) |
| `/vehiculos` | Gestión de vehículos |
| `/ordenes-compra` | Órdenes de compra |

## 🗄️ Base de Datos

**Proveedor:** Supabase (PostgreSQL)

**Tablas principales:**
- `pendientes_operaciones` - Coordinación operativa
- `notas_recordatorio` - Post-its de recordatorios
- `vehiculos` - Flota
- `ordenes_compra` - Órdenes de compra

**Scripts SQL:** Carpeta `/sql`

## 🎨 Componentes Clave

### CalendarioFranjasHorarias
Calendario visual con 5 franjas horarias diarias.
- **Archivo:** `src/components/CalendarioFranjasHorarias.tsx`
- **Usado en:** `/pendientes`

## 🔧 Mantenimiento

### Agregar una nueva franja horaria
❌ **No recomendado** - Sistema diseñado para 5 franjas (jornada laboral 08:00-18:00)

### Cambiar colores de vehículos
Editar `COLORES_VEHICULOS` en `CalendarioFranjasHorarias.tsx`

### Agregar nuevo estado de pendiente
1. Modificar CHECK constraint en tabla: `DATABASE.md`
2. Actualizar función `getPrioridadColor()` en `page.tsx`
3. Agregar botón de filtro

## 📝 Convenciones

### Commits
```
tipo: Descripción corta

Descripción detallada

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

**Tipos:** Feature, Fix, Refactor, Docs

### Nombres de archivos
- Componentes: `PascalCase.tsx`
- Utilidades: `camelCase.ts`
- SQL: `snake_case.sql`

### TypeScript
- Interfaces: `PascalCase` (ej: `PendienteOperacion`)
- Types: `PascalCase` (ej: `NotaRecordatorio`)
- Funciones: `camelCase`
- Constantes: `UPPER_SNAKE_CASE`

## 🐛 Debugging

### Logs útiles
```typescript
console.log('📅 Programando pendiente:', body)
console.log('✅ Pendiente programado exitosamente:', data)
console.error('❌ Error programando pendiente:', error)
```

### Herramientas
- **Supabase Dashboard:** Ver datos y logs
- **Next.js DevTools:** Performance
- **React DevTools:** Component tree

## 🔐 Seguridad

- **RLS (Row Level Security)** configurado en Supabase
- **Variables de entorno** nunca en el código
- **API keys** solo las públicas (anon key) en cliente

## 📊 Métricas

- **Tablas:** 4 principales
- **Rutas:** ~20
- **Componentes:** ~15
- **Líneas de código:** ~5000

## 🎯 Próximas Mejoras Sugeridas

1. [ ] Sistema de notificaciones en tiempo real (Supabase Realtime)
2. [ ] Exportar calendario a PDF
3. [ ] Dashboard con gráficos de KPIs
4. [ ] App móvil (React Native)
5. [ ] Historial de cambios (audit log)

## 📞 Contacto

**Proyecto:** Parque Automotor - Cuenca del Plata
**Stack:** Next.js 15 + Supabase + TypeScript
**Deploy:** Vercel

---

*Última actualización: Septiembre 2025*
