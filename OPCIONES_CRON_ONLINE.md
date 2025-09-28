# Servicios de Cron Online

## 1. cron-job.org (Gratuito)
- **URL**: https://cron-job.org
- **Configuración**:
  - URL: `https://tu-app.vercel.app/api/cron/actualizar-pendientes`
  - Método: GET
  - Horario: */6 * * * * (cada 6 horas)

## 2. EasyCron (Freemium)
- **URL**: https://www.easycron.com
- **Configuración**:
  - URL: `https://tu-app.vercel.app/api/cron/actualizar-pendientes`
  - Intervalo: Every 6 hours

## 3. Cronhooks (Gratuito hasta 5 jobs)
- **URL**: https://cronhooks.io
- **Configuración**:
  - Endpoint: `https://tu-app.vercel.app/api/cron/actualizar-pendientes`
  - Schedule: 0 */6 * * *

## 4. UptimeRobot (Monitoring + Cron)
- **URL**: https://uptimerobot.com
- **Configuración**:
  - Monitor Type: HTTP(s)
  - URL: `https://tu-app.vercel.app/api/cron/actualizar-pendientes`
  - Monitoring Interval: 6 hours

## Configuración Típica
- **Método**: GET o POST
- **URL**: `https://tu-aplicacion.vercel.app/api/cron/actualizar-pendientes`
- **Headers** (opcional):
  ```
  Authorization: Bearer tu_token_secreto
  User-Agent: CronService/1.0
  ```
- **Frecuencia recomendada**: Cada 4-6 horas