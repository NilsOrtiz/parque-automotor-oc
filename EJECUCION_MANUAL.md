# Ejecución Manual del Sistema

## 1. Desde la Aplicación Web
- Ve a la página `/pendientes`
- Haz clic en el botón **"Actualizar Automáticos"**
- El sistema ejecutará la función y mostrará los resultados

## 2. Desde la Terminal (Desarrollo)
```bash
# Navegar al directorio del proyecto
cd "/home/nils/cuenca del plata/parque-automotor"

# Ejecutar el script directamente
node scripts/actualizar-pendientes-auto.js
```

## 3. Prueba del Endpoint Directamente
```bash
# Probar con curl
curl -X POST https://tu-app.vercel.app/api/actualizar-pendientes

# O simplemente abrir en el navegador:
# https://tu-app.vercel.app/api/actualizar-pendientes
```

## 4. Programar Recordatorios
Si no quieres automatización completa, puedes:
- Configurar recordatorios en tu teléfono/calendario
- Ejecutar manualmente cada mañana desde `/pendientes`
- Asignar la tarea a alguien del equipo

## Frecuencia Recomendada
- **Mínimo**: Una vez al día (por la mañana)
- **Óptimo**: Dos veces al día (mañana y tarde)
- **Intensivo**: Cada 4-6 horas