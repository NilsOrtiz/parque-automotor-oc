# 📚 Documentación Completa del Sistema de Pendientes Automáticos

## 🎯 Resumen del Sistema

Sistema que detecta automáticamente vehículos críticos (≤5% vida útil de aceite) y los coloca en una tabla controlable para Operaciones. Taller puede editar los detalles desde Supabase directamente.

---

## 🔄 Flujo Completo del Sistema

### **1. 🤖 GitHub Actions** (Automático - 3 veces/día)
**Archivo**: `.github/workflows/actualizar-pendientes.yml`
**Horarios**: 3:00 AM, 11:00 AM, 3:00 PM (Argentina)
**¿Qué hace?**:
- Se ejecuta automáticamente según el schedule
- Hace petición HTTP GET/POST a: `https://parque-automotor-oc.vercel.app/api/cron/actualizar-pendientes`
- Incluye logs detallados y manejo de errores
- Genera resumen en GitHub del resultado

**Comando para ejecutar manualmente**: GitHub → Actions → "🔄 Actualizar Pendientes" → "Run workflow"

---

### **2. 🌐 API Endpoint de Cron** (Recibe de GitHub Actions)
**Archivo**: `src/app/api/cron/actualizar-pendientes/route.ts`
**URL**: `/api/cron/actualizar-pendientes`
**¿Qué hace?**:
- Recibe la petición de GitHub Actions
- Verifica el token de autorización (opcional)
- Redirige la llamada al API principal
- **Llama a**: `fetch('/api/actualizar-pendientes')`

**Para probar**: `GET https://parque-automotor-oc.vercel.app/api/cron/actualizar-pendientes`

---

### **3. ⚙️ API Principal** (Ejecuta la función)
**Archivo**: `src/app/api/actualizar-pendientes/route.ts`
**URL**: `/api/actualizar-pendientes`
**¿Qué hace?**:
- Conecta con Supabase
- **Ejecuta**: `supabase.rpc('ejecutar_actualizacion_pendientes')`
- Devuelve resultado en JSON
- Maneja errores y timeouts

**Para probar**: `POST https://parque-automotor-oc.vercel.app/api/actualizar-pendientes`

---

### **4. 🗄️ Función SQL en Supabase** (Hace el trabajo real)
**Archivo**: `sql/funcion_actualizar_pendientes_FINAL.sql`
**Función**: `ejecutar_actualizacion_pendientes()`
**¿Qué hace?**:
1. **Busca** todos los vehículos de Cuenca del Plata (`"Nro_Interno" > 0`)
2. **Calcula** porcentaje de vida útil por KM y horas
3. **Identifica** críticos (≤5% en cualquier criterio)
4. **Borra** registros automáticos anteriores
5. **Inserta** nuevos registros críticos en `pendientes_operaciones`
6. **Retorna** JSON con resultado

**Para probar**: En Supabase SQL Editor: `SELECT ejecutar_actualizacion_pendientes();`

---

### **5. 🗃️ Tabla de Datos** (Almacena resultados)
**Tabla**: `public.pendientes_operaciones`
**Archivo**: `sql/crear_pendientes_operaciones_FINAL.sql`
**Campos importantes**:
- `vehiculo_id` - Referencia a tabla vehiculos
- `interno` - Número interno del vehículo
- `placa` - Placa del vehículo
- `trasladar_a` - "Taller", "IDISA", etc. ✏️ EDITABLE
- `tiempo_estimado` - "4-6 horas", "8 horas", etc. ✏️ EDITABLE
- `motivo` - Descripción del trabajo ✏️ EDITABLE
- `criticidad` - "critico", "medio", "leve"
- `estado` - "pendiente", "programado", "en_proceso", "completado" ✏️ EDITABLE
- `es_automatico` - `true` si fue creado por el sistema
- `observaciones` - Notas adicionales ✏️ EDITABLE

**Para editar**: Supabase → Table Editor → pendientes_operaciones

---

### **6. 🖥️ Página Web** (Interface para usuarios)
**Archivo**: `src/app/pendientes/page.tsx`
**URL**: `https://parque-automotor-oc.vercel.app/pendientes`
**¿Qué hace?**:
- Lee datos de `pendientes_operaciones`
- Botón "Actualizar Automáticos" → llama al API Principal (#3)
- Filtros por estado (pendiente, programado, etc.)
- Calendario para programar vehículos
- Muestra elementos AUTO vs manuales

**Para usar**: Ir a /pendientes → Click "Actualizar Automáticos"

---

## 🛠️ Componentes del Sistema

### **Archivos SQL** (Una vez - Supabase):
- `sql/crear_pendientes_operaciones_FINAL.sql` - Crea la tabla
- `sql/funcion_actualizar_pendientes_FINAL.sql` - Crea las funciones

### **Archivos de Código** (GitHub):
- `src/app/pendientes/page.tsx` - Página principal
- `src/app/api/actualizar-pendientes/route.ts` - API principal
- `src/app/api/cron/actualizar-pendientes/route.ts` - API para cron
- `src/lib/supabase.ts` - Tipos TypeScript
- `.github/workflows/actualizar-pendientes.yml` - Automatización

### **Variables de Entorno** (.env.local):
```env
CRON_SECRET_TOKEN=parque_auto_2024_secreto
NEXT_PUBLIC_BASE_URL=https://parque-automotor-oc.vercel.app
```

### **Secrets de GitHub**:
- `APP_URL`: https://parque-automotor-oc.vercel.app
- `CRON_SECRET_TOKEN`: parque_auto_2024_secreto

---

## 🎮 Comandos Útiles

### **Ejecutar manualmente desde Supabase**:
```sql
SELECT ejecutar_actualizacion_pendientes();
```

### **Ver pendientes actuales**:
```sql
SELECT * FROM pendientes_operaciones ORDER BY fecha_creacion DESC;
```

### **Limpiar pendientes automáticos**:
```sql
DELETE FROM pendientes_operaciones WHERE es_automatico = true;
```

### **Probar API desde terminal**:
```bash
curl -X POST https://parque-automotor-oc.vercel.app/api/actualizar-pendientes
```

---

## 🔧 Roles y Responsabilidades

### **Taller** (Control total):
- Edita directamente en Supabase → Table Editor → pendientes_operaciones
- Cambia tiempos, destinos, motivos, observaciones
- Marca estados como programado/completado

### **Operaciones** (Solo lectura/coordinación):
- Ve la lista limpia en /pendientes
- Programa vehículos en el calendario
- Filtra por estados

### **Sistema** (Automatización):
- Detecta vehículos críticos automáticamente
- Mantiene la tabla actualizada
- Genera logs en GitHub Actions

---

## 🚨 Troubleshooting

### **Si no aparecen pendientes**:
1. Ejecutar manualmente: `SELECT ejecutar_actualizacion_pendientes();`
2. Verificar que hay vehículos críticos en /vehiculos/mantenimientos
3. Revisar logs en GitHub Actions

### **Si GitHub Actions falla**:
1. Verificar secrets en GitHub (APP_URL, CRON_SECRET_TOKEN)
2. Probar endpoint manualmente
3. Revisar logs del workflow

### **Para debugging**:
- GitHub Actions: Ver logs detallados en cada step
- Supabase: Usar SQL Editor para queries manuales
- API: Verificar Network tab en Developer Tools

---

## 📊 Estados del Sistema

### **Funciona correctamente cuando**:
- ✅ GitHub Actions se ejecuta sin errores
- ✅ API responde con `"success": true`
- ✅ Tabla `pendientes_operaciones` tiene registros
- ✅ Página `/pendientes` muestra vehículos críticos
- ✅ Taller puede editar campos en Supabase

### **Indicadores de problemas**:
- ❌ GitHub Actions falla
- ❌ API responde con `"success": false`
- ❌ Tabla vacía cuando debería tener registros
- ❌ Página muestra "No hay pendientes" cuando hay vehículos críticos

---

## 🔄 Flujo de Datos Simplificado

```
Vehículos (datos base)
    ↓
Función SQL (detecta críticos ≤5%)
    ↓
pendientes_operaciones (tabla controlable)
    ↓
Taller edita (Supabase)
    ↓
Operaciones coordina (/pendientes)
```

**Automatización**: GitHub Actions → API → Función SQL → Tabla → Página