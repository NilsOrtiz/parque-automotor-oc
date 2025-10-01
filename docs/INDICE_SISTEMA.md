# Índice General del Sistema - Parque Automotor

> **Propósito:** Este índice organiza toda la documentación del sistema por áreas funcionales. A medida que el sistema crece, cada área tendrá su documentación específica.

---

## 📖 Cómo usar este índice

Cada área del sistema tiene:
- **Número de sección** para referencia rápida
- **Páginas/rutas** que componen el área
- **Documentación asociada** (actual o pendiente)
- **Estado** de la documentación

**Leyenda:**
- ✅ Documentado completamente
- 🚧 Documentación en progreso
- 📝 Documentación pendiente

---

## 1. CONFIGURACIÓN DEL SISTEMA (✅)

**Descripción:** Gestión dinámica de componentes de vehículos, estructura de BD, perfiles y categorizaciones.

### 1.1 Schema de Base de Datos
**Ruta:** `/admin/schema`
**Funcionalidad:** Gestión de estructura de tabla vehiculos, generación de SQL, detección de componentes

### 1.2 Exclusiones
**Ruta:** `/admin/exclusiones`
**Funcionalidad:** Definir qué columnas NO son de mantenimiento

### 1.3 Alias de Columnas
**Ruta:** `/admin/alias`
**Funcionalidad:** Mapear nombres legacy a componentes estándar

### 1.4 Categorías de Componentes
**Ruta:** `/admin/categorias`
**Funcionalidad:** Crear y gestionar categorías de agrupación (Aceites, Correas, etc.)

### 1.5 Perfiles de Vehículos
**Ruta:** `/vehiculos/perfiles`
**Funcionalidad:** Definir qué componentes aplican a cada tipo de vehículo

### 📚 Documentación:
- ✅ **ARQUITECTURA_SISTEMA_DINAMICO.md** - Documentación técnica completa
- ✅ **FLUJO_SCHEMA_PERFILES.md** - Guía de usuario del flujo
- ✅ **SISTEMA_ALIAS.md** - Guía específica de alias

---

## 2. GESTIÓN DE VEHÍCULOS (🚧)

**Descripción:** CRUD, búsqueda, edición y consulta de vehículos de la flota.

### 2.1 Hub de Vehículos
**Ruta:** `/vehiculos`
**Funcionalidad:** Página principal con acceso a todas las funciones de vehículos

### 2.2 Búsqueda y Edición
**Ruta:** `/vehiculos/busqueda`
**Funcionalidad:** Buscar vehículos por placa/interno, editar datos con filtrado por perfil

### 2.3 Lista de Mantenimientos
**Ruta:** `/vehiculos/mantenimientos`
**Funcionalidad:** Tabla con todos los vehículos, estado de aceite, km faltantes, ordenamiento

### 2.4 Gestión de Neumáticos
**Ruta:** `/vehiculos/neumaticos`
**Funcionalidad:** Control de neumáticos por posición, rotación, estado

### 2.5 Revisión Mensual
**Ruta:** `/vehiculos/revision-mensual`
**Funcionalidad:** Checklist mensual de vehículos

### 2.6 Reportar Problema
**Ruta:** `/vehiculos/reportar-problema`
**Funcionalidad:** Sistema de reporte de problemas/fallas de vehículos

### 📚 Documentación:
- 🚧 Pendiente crear documentación específica de área

---

## 3. COMBUSTIBLE (📝)

**Descripción:** Gestión, análisis y control de consumo de combustible.

### 3.1 Análisis de Combustible
**Ruta:** `/vehiculos/analisis-combustible`
**Funcionalidad:** Análisis de rendimiento y consumo

### 3.2 Carga Manual de Combustible
**Ruta:** `/vehiculos/carga-combustible-manual`
**Funcionalidad:** Registrar cargas de combustible manualmente

### 📚 Documentación:
- 📝 Pendiente crear documentación

---

## 4. ÓRDENES DE COMPRA Y STOCK (📝)

**Descripción:** Sistema de gestión de órdenes de compra, repuestos y stock.

### 4.1 Hub de Órdenes
**Ruta:** `/ordenes-compra`
**Funcionalidad:** Página principal de órdenes de compra

### 4.2 Crear Orden
**Ruta:** `/ordenes-compra/crear`
**Funcionalidad:** Formulario de creación de órdenes

### 4.3 Listado de Órdenes
**Ruta:** `/ordenes-compra/listado`
**Funcionalidad:** Ver todas las órdenes con filtros

### 4.4 Órdenes por Vehículo
**Ruta:** `/ordenes-compra/por-vehiculo`
**Funcionalidad:** Ver órdenes asociadas a cada vehículo

### 4.5 Control de Stock
**Ruta:** `/ordenes-compra/stock`
**Funcionalidad:** Gestión de inventario de repuestos

### 📚 Documentación:
- 📝 Pendiente crear documentación

---

## 5. REGISTRO DE SERVICIOS (📝)

**Descripción:** Registro de servicios realizados a vehículos.

### 5.1 Registro de Servicio
**Ruta:** `/vehiculos/registro-servicio`
**Funcionalidad:** Registrar servicio/mantenimiento realizado

### 5.2 Registro con Órdenes
**Ruta:** `/vehiculos/registro-servicio-ordenes`
**Funcionalidad:** Registrar servicio vinculado a órdenes de compra

### 5.3 Anexar Órdenes
**Ruta:** `/vehiculos/anexar-ordenes`
**Funcionalidad:** Vincular órdenes existentes a servicios

### 📚 Documentación:
- 📝 Pendiente crear documentación

---

## 6. PENDIENTES Y PROGRAMACIÓN (📝)

**Descripción:** Sistema de coordinación Taller-Operaciones con calendario y programación.

### 6.1 Gestión de Pendientes
**Ruta:** `/pendientes`
**Funcionalidad:** Lista de pendientes, calendario semanal con franjas horarias, programación drag-and-drop

### 6.2 Lista de Pendientes de Vehículos
**Ruta:** `/vehiculos/lista-pendientes`
**Funcionalidad:** Vista de pendientes específicos de vehículos

### 📚 Documentación:
- 📝 Pendiente crear documentación (ver ARCHITECTURE.md sección Pendientes)

---

## 7. UTILIDADES Y DEBUG (📝)

**Descripción:** Herramientas de desarrollo, pruebas y debugging.

### 7.1 Test de Conexión
**Ruta:** `/test-connection`
**Funcionalidad:** Verificar conexión con Supabase

### 7.2 Debug
**Ruta:** `/debug-af949ys`
**Funcionalidad:** Panel de debugging interno

### 📚 Documentación:
- 📝 No requiere documentación (herramientas de desarrollo)

---

## 8. PÁGINA PRINCIPAL (📝)

**Descripción:** Dashboard principal del sistema.

### 8.1 Home
**Ruta:** `/`
**Funcionalidad:** Página de inicio/dashboard

### 📚 Documentación:
- 📝 Pendiente crear documentación

---

## 📑 Documentación Existente

### Documentación General del Proyecto
| Archivo | Descripción | Estado |
|---------|-------------|--------|
| **README.md** | Introducción general al proyecto | ✅ |
| **ARCHITECTURE.md** | Arquitectura general, stack tecnológico | ✅ |
| **DATABASE.md** | Estructura de base de datos | ✅ |
| **FEATURES.md** | Listado de funcionalidades | ✅ |

### Documentación del Sistema Dinámico (Área 1)
| Archivo | Descripción | Estado |
|---------|-------------|--------|
| **ARQUITECTURA_SISTEMA_DINAMICO.md** | Arquitectura técnica completa del sistema de componentes dinámicos | ✅ |
| **FLUJO_SCHEMA_PERFILES.md** | Guía de usuario: Schema → Perfiles → Vehículos | ✅ |
| **SISTEMA_ALIAS.md** | Guía completa del sistema de alias | ✅ |

---

## 🗂️ Estructura de Archivos del Proyecto

```
parque-automotor/
├── src/
│   ├── app/                              # Páginas Next.js (App Router)
│   │   ├── page.tsx                      # → 8.1 Home
│   │   │
│   │   ├── admin/                        # → ÁREA 1: Configuración
│   │   │   ├── schema/page.tsx           #   → 1.1 Schema
│   │   │   ├── exclusiones/page.tsx      #   → 1.2 Exclusiones
│   │   │   ├── alias/page.tsx            #   → 1.3 Alias
│   │   │   └── categorias/page.tsx       #   → 1.4 Categorías
│   │   │
│   │   ├── vehiculos/                    # → ÁREA 2: Vehículos
│   │   │   ├── page.tsx                  #   → 2.1 Hub
│   │   │   ├── busqueda/page.tsx         #   → 2.2 Búsqueda
│   │   │   ├── perfiles/page.tsx         #   → 1.5 Perfiles (config)
│   │   │   ├── mantenimientos/page.tsx   #   → 2.3 Lista Mantenimientos
│   │   │   ├── neumaticos/page.tsx       #   → 2.4 Neumáticos
│   │   │   ├── revision-mensual/page.tsx #   → 2.5 Revisión Mensual
│   │   │   ├── reportar-problema/page.tsx#   → 2.6 Reportar Problema
│   │   │   │
│   │   │   ├── analisis-combustible/...  #   → ÁREA 3: Combustible
│   │   │   ├── carga-combustible-.../... #   → 3.2
│   │   │   │
│   │   │   ├── registro-servicio/...     #   → ÁREA 5: Servicios
│   │   │   ├── registro-servicio-o.../...#   → 5.2
│   │   │   ├── anexar-ordenes/...        #   → 5.3
│   │   │   │
│   │   │   └── lista-pendientes/...      #   → 6.2
│   │   │
│   │   ├── ordenes-compra/               # → ÁREA 4: Órdenes
│   │   │   ├── page.tsx                  #   → 4.1 Hub
│   │   │   ├── crear/page.tsx            #   → 4.2 Crear
│   │   │   ├── listado/page.tsx          #   → 4.3 Listado
│   │   │   ├── por-vehiculo/page.tsx     #   → 4.4 Por Vehículo
│   │   │   └── stock/page.tsx            #   → 4.5 Stock
│   │   │
│   │   ├── pendientes/page.tsx           # → ÁREA 6: Pendientes
│   │   │
│   │   ├── test-connection/page.tsx      # → ÁREA 7: Utilidades
│   │   └── debug-af949ys/page.tsx        #   → 7.2 Debug
│   │
│   ├── lib/                              # Librerías core
│   │   ├── supabase.ts                   # Cliente Supabase + tipos
│   │   ├── componentes-dinamicos.ts      # Sistema dinámico (ÁREA 1)
│   │   ├── exclusiones-mantenimiento.ts  # Exclusiones (ÁREA 1)
│   │   ├── alias-columnas.ts             # Alias (ÁREA 1)
│   │   └── categorias-componentes.ts     # Categorías (ÁREA 1)
│   │
│   └── components/                       # Componentes reutilizables
│       └── CalendarioFranjasHorarias.tsx # Calendario (ÁREA 6)
│
└── docs/                                 # Documentación
    ├── INDICE_SISTEMA.md                 # ← Este archivo
    ├── README.md                         # Intro general
    ├── ARCHITECTURE.md                   # Arquitectura general
    ├── DATABASE.md                       # BD
    ├── FEATURES.md                       # Funcionalidades
    ├── ARQUITECTURA_SISTEMA_DINAMICO.md  # ÁREA 1 (técnico)
    ├── FLUJO_SCHEMA_PERFILES.md          # ÁREA 1 (usuario)
    └── SISTEMA_ALIAS.md                  # ÁREA 1 (usuario)
```

---

## 📋 IDs Reservados en Base de Datos

**Tabla:** `configuraciones_vehiculo`

| ID | Nombre | Área | Propósito |
|----|--------|------|-----------|
| **999999** | `__EXCLUSIONES_SISTEMA__` | 1.2 | Columnas excluidas de mantenimiento |
| **999998** | `__ALIAS_SISTEMA__` | 1.3 | Mapeo de nombres legacy |
| **999997** | `__CATEGORIAS_SISTEMA__` | 1.4 | Categorización de componentes |

---

## 🎯 Roadmap de Documentación

### Prioridad Alta
- [ ] **ÁREA 2: Gestión de Vehículos** - Crear `GESTION_VEHICULOS.md`
- [ ] **ÁREA 6: Pendientes** - Crear `SISTEMA_PENDIENTES.md`

### Prioridad Media
- [ ] **ÁREA 4: Órdenes de Compra** - Crear `ORDENES_COMPRA.md`
- [ ] **ÁREA 5: Registro de Servicios** - Crear `REGISTRO_SERVICIOS.md`

### Prioridad Baja
- [ ] **ÁREA 3: Combustible** - Crear `GESTION_COMBUSTIBLE.md`
- [ ] **ÁREA 8: Dashboard** - Crear `DASHBOARD.md`

---

## 📝 Guía para Agregar Nueva Documentación

Cuando se agregue documentación nueva para un área:

1. **Crear archivo en `/docs`** con nombre descriptivo
   - Ejemplo: `GESTION_VEHICULOS.md`

2. **Actualizar este índice** agregando referencia
   - Cambiar estado de 📝 a 🚧 o ✅
   - Agregar enlace al archivo

3. **Seguir estructura similar a ÁREA 1:**
   - Visión general
   - Flujo de datos
   - Componentes/páginas involucradas
   - Casos de uso
   - Consideraciones técnicas

4. **Mantener consistencia:**
   - Usar numeración de sección del índice
   - Incluir código de ejemplo
   - Documentar tanto para usuarios como desarrolladores

---

## 🔍 Búsqueda Rápida por Funcionalidad

### "¿Cómo agrego un nuevo componente de mantenimiento?"
→ Ver **Sección 1** (Configuración del Sistema)
→ Leer `FLUJO_SCHEMA_PERFILES.md`

### "¿Cómo gestiono el calendario de pendientes?"
→ Ver **Sección 6** (Pendientes y Programación)
→ Leer `ARCHITECTURE.md` (Módulo Pendientes)

### "¿Cómo registro un servicio realizado?"
→ Ver **Sección 5** (Registro de Servicios)
→ Documentación pendiente

### "¿Cómo creo una orden de compra?"
→ Ver **Sección 4** (Órdenes de Compra)
→ Documentación pendiente

### "¿Cómo busco y edito un vehículo?"
→ Ver **Sección 2.2** (Búsqueda y Edición)
→ Documentación pendiente

---

## 📌 Notas Importantes

- Este sistema es **modular**: cada área puede documentarse independientemente
- La **Sección 1** (Configuración) es la base del sistema dinámico
- Las secciones 2-6 son **funcionalidades de negocio**
- La documentación técnica está separada de la de usuario
- Mantener este índice actualizado con cada nueva feature

---

**Última actualización:** 2025-10-01
**Mantenedores:** Equipo de desarrollo
