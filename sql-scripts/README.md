# 📊 Scripts SQL para Migración de Datos

Scripts para crear la estructura de datos que replica el sistema Excel existente.

## 📋 Orden de Ejecución

Ejecutar en este orden en Supabase SQL Editor:

### 1. Crear Tablas
```sql
-- 1. Crear tabla titulares
\i 01-create-titulares.sql

-- 2. Crear tabla proveedores  
\i 02-create-proveedores.sql

-- 3. Actualizar tabla ordenes_de_compra
\i 03-update-ordenes-compra.sql
```

### 2. Insertar Datos
```sql
-- 4. Insertar titulares
\i 04-insert-data-titulares.sql

-- 5. Insertar proveedores
\i 05-insert-data-proveedores.sql

-- 6. Insertar órdenes de ejemplo
\i 06-insert-sample-ordenes.sql
```

## 🗂️ Estructura Final

### Tablas creadas:
- ✅ `vehiculos` (ya existía)
- 🆕 `titulares` 
- 🆕 `proveedores`
- 🔄 `ordenes_de_compra` (actualizada)

### Funcionalidades:
- Réplica exacta del Excel
- Búsqueda por vehículo (interno/placa)
- Búsqueda por proveedor (nombre/CUIT)
- Sistema de órdenes con códigos únicos
- Compatibilidad con sistema actual

## ⚠️ Notas

- El script 03 elimina y recrea `ordenes_de_compra`
- Se mantienen los estados de aprobación originales
- Los datos de ejemplo vienen del Excel actual