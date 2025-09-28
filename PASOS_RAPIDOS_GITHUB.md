# ⚡ Configuración Rápida - GitHub Actions

## 🎯 Lo que necesitas hacer:

### 1. En GitHub (2 minutos)
```
1. Ve a tu repositorio → Settings → Secrets and variables → Actions
2. Crear estos 2 secrets:

   Secret 1:
   Name: APP_URL
   Value: https://tu-app.vercel.app  (tu URL real)

   Secret 2:
   Name: CRON_SECRET_TOKEN
   Value: parque_auto_2024_secreto   (cualquier texto)
```

### 2. En tu código (.env.local)
```env
# Agregar esta línea:
CRON_SECRET_TOKEN=parque_auto_2024_secreto
```
*(Debe ser igual al secret de GitHub)*

### 3. Hacer commit y push
```bash
git add .
git commit -m "Configurar GitHub Actions para pendientes automáticos"
git push
```

### 4. Probar manualmente
```
1. GitHub → Actions → "Actualizar Pendientes"
2. "Run workflow" → "Run workflow"
3. Esperar 2-3 minutos y verificar que sea exitoso ✅
```

## 🕒 Horarios Automáticos:
- **3:00 AM** (Argentina) - Actualización matutina
- **11:00 AM** (Argentina) - Actualización mediodía
- **3:00 PM** (Argentina) - Actualización tarde

## 🎉 ¡Listo!
El sistema se ejecutará automáticamente. Puedes ver los resultados en `/pendientes` de tu aplicación.

---

**⚠️ Problemas?** Ver archivo `CONFIGURAR_GITHUB_ACTIONS.md` para guía completa.