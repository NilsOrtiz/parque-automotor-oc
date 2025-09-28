#!/bin/bash

# Script para configurar cron job en servidor Linux

echo "🔧 Configurando cron job para actualización de pendientes..."

# Crear directorio de logs si no existe
mkdir -p /var/log/parque-automotor

# Obtener la ruta actual del proyecto
PROJECT_PATH=$(pwd)

# Configurar variables de entorno en el script
cat > /tmp/cron-pendientes.sh << EOF
#!/bin/bash
export PATH=/usr/local/bin:/usr/bin:/bin
export NODE_ENV=production
export NEXT_PUBLIC_BASE_URL="https://tu-app.vercel.app"  # CAMBIAR ESTA URL

cd "$PROJECT_PATH"
node scripts/actualizar-pendientes-auto.js >> /var/log/parque-automotor/cron.log 2>&1
EOF

chmod +x /tmp/cron-pendientes.sh

# Agregar al crontab
(crontab -l 2>/dev/null; echo "# Actualizar pendientes de operaciones cada 6 horas") | crontab -
(crontab -l 2>/dev/null; echo "0 */6 * * * /tmp/cron-pendientes.sh") | crontab -

echo "✅ Cron job configurado exitosamente"
echo "📋 Para ver los cron jobs actuales: crontab -l"
echo "📁 Logs en: /var/log/parque-automotor/cron.log"

# Mostrar configuración actual
echo ""
echo "🕒 Configuración de cron actual:"
crontab -l | grep -E "(pendientes|actualizar)"