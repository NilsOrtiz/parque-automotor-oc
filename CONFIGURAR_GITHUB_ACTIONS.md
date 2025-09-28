# 🚀 Configurar GitHub Actions para Actualización Automática

## 📋 Pasos para Configurar

### 1. 🔐 Configurar Secrets en GitHub

Ve a tu repositorio en GitHub y sigue estos pasos:

1. **Ir a Settings** → **Secrets and variables** → **Actions**
2. **Hacer clic en "New repository secret"**
3. **Agregar estos secrets:**

#### Secrets Requeridos:

| Secret Name | Descripción | Ejemplo |
|-------------|-------------|---------|
| `APP_URL` | URL de tu aplicación | `https://parque-automotor.vercel.app` |
| `CRON_SECRET_TOKEN` | Token de seguridad (opcional) | `mi_token_secreto_123` |

#### Cómo obtener la APP_URL:
- Si usas Vercel: Ve a tu dashboard de Vercel y copia la URL de producción
- Si usas otro hosting: Usa la URL principal de tu aplicación
- **Importante**: NO incluir `/` al final

#### Generar CRON_SECRET_TOKEN (Opcional pero recomendado):
```bash
# Generar token aleatorio
openssl rand -base64 32
# O usar este comando en Linux/Mac:
echo "parque_$(date +%s)_$(openssl rand -hex 8)"
```

### 2. 📁 Estructura de Archivos

Asegúrate de que estos archivos estén en tu repositorio:

```
.github/
└── workflows/
    └── actualizar-pendientes.yml  ✅ Ya creado

src/
└── app/
    └── api/
        └── cron/
            └── actualizar-pendientes/
                └── route.ts  ✅ Ya creado
```

### 3. 🕒 Horarios de Ejecución

El workflow está configurado para ejecutarse:
- **6:00 AM UTC** (3:00 AM Argentina) - Inicio del día
- **2:00 PM UTC** (11:00 AM Argentina) - Medio día
- **6:00 PM UTC** (3:00 PM Argentina) - Tarde

#### Personalizar Horarios:
Edita el archivo `.github/workflows/actualizar-pendientes.yml`:

```yaml
schedule:
  - cron: '0 6 * * *'   # 6 AM UTC - Mañana
  - cron: '0 14 * * *'  # 2 PM UTC - Mediodía
  - cron: '0 18 * * *'  # 6 PM UTC - Tarde
```

**Convertir horarios:**
- Argentina (UTC-3): Resta 3 horas al horario deseado
- España (UTC+1): Resta 1 hora al horario deseado
- México (UTC-6): Resta 6 horas al horario deseado

### 4. 🧪 Probar la Configuración

#### Ejecución Manual:
1. Ve a tu repositorio en GitHub
2. **Actions** → **"🔄 Actualizar Pendientes de Operaciones"**
3. **"Run workflow"** → **"Run workflow"**

#### Verificar Logs:
1. Hacer clic en la ejecución del workflow
2. Hacer clic en **"🚛 Actualizar Lista de Pendientes"**
3. Revisar cada paso para ver si hay errores

### 5. 🔍 Monitoreo y Debugging

#### Ver Historial:
- GitHub → Actions → Historial de ejecuciones
- Cada ejecución muestra éxito/fallo y logs detallados

#### Notificaciones:
GitHub te enviará emails si el workflow falla (configurable en Settings → Notifications)

#### Logs Importantes:
- ✅ "Actualización exitosa" = Todo funcionó
- ❌ "Error en actualización" = Revisar configuración
- ⚠️ "No hay token de autorización" = Agregar CRON_SECRET_TOKEN

## 🛠️ Troubleshooting

### Error: "secrets.APP_URL is empty"
**Solución:** Configurar el secret `APP_URL` en GitHub Settings

### Error: "404 Not Found"
**Solución:** Verificar que la URL en `APP_URL` sea correcta y la app esté desplegada

### Error: "401 Unauthorized"
**Solución:** El token en `CRON_SECRET_TOKEN` no coincide, o falta configurarlo

### Error: "timeout"
**Solución:** La aplicación está muy lenta, verificar estado de Supabase

### El workflow no se ejecuta automáticamente
**Solución:**
1. Verificar que el repositorio tenga activadas las GitHub Actions
2. El repositorio debe tener al menos 1 commit en la rama principal
3. Las Actions se pausan después de 60 días de inactividad

## 📊 Verificar que Funciona

### 1. En GitHub:
- Actions → Ver ejecuciones exitosas
- Resumen del workflow muestra registros procesados

### 2. En tu aplicación:
- Ir a `/pendientes`
- Debe mostrar vehículos críticos automáticamente
- Verificar timestamp de "Última actualización"

### 3. En Supabase:
- Tabla `pendientes_operaciones` debe tener registros
- Campo `es_automatico = true` en registros creados por el workflow

## 🎯 Próximos Pasos

1. **Configurar secrets** siguiendo esta guía
2. **Ejecutar manualmente** el workflow para probar
3. **Esperar a la próxima ejecución automática** (según horarios)
4. **Personalizar desde Supabase** los registros que necesites ajustar

¡El sistema quedará ejecutándose automáticamente sin intervención manual!