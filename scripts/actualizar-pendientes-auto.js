#!/usr/bin/env node

/**
 * Script para ejecutar la actualización automática de pendientes_operaciones
 *
 * Uso:
 * node scripts/actualizar-pendientes-auto.js
 *
 * Para configurar como cron job (ejecutar cada 4 horas):
 * 0 */4 * * * cd /path/to/parque-automotor && node scripts/actualizar-pendientes-auto.js >> logs/cron.log 2>&1
 */

const https = require('https')
const http = require('http')

const config = {
  // URL de tu aplicación (cambiar según el entorno)
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
  // Token secreto para autenticación (opcional, configurar en .env)
  cronToken: process.env.CRON_SECRET_TOKEN,
  // Timeout en millisegundos
  timeout: 30000
}

function log(message) {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] ${message}`)
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url)
    const client = urlObj.protocol === 'https:' ? https : http

    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'PendientesAutoUpdater/1.0',
        ...options.headers
      },
      timeout: config.timeout
    }

    const req = client.request(requestOptions, (res) => {
      let data = ''

      res.on('data', (chunk) => {
        data += chunk
      })

      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data)
          resolve({
            statusCode: res.statusCode,
            data: jsonData
          })
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            data: { message: data }
          })
        }
      })
    })

    req.on('error', (error) => {
      reject(error)
    })

    req.on('timeout', () => {
      req.destroy()
      reject(new Error('Request timeout'))
    })

    if (options.body) {
      req.write(options.body)
    }

    req.end()
  })
}

async function actualizarPendientes() {
  try {
    log('🔄 Iniciando actualización automática de pendientes...')

    const url = `${config.baseUrl}/api/cron/actualizar-pendientes`
    const options = {
      method: 'POST'
    }

    // Agregar token de autenticación si está configurado
    if (config.cronToken) {
      options.headers = {
        'Authorization': `Bearer ${config.cronToken}`
      }
    }

    log(`📡 Realizando petición a: ${url}`)

    const response = await makeRequest(url, options)

    if (response.statusCode === 200 && response.data.success) {
      log(`✅ Actualización exitosa: ${response.data.registros_insertados} registros procesados`)
      log(`📊 Detalles: ${response.data.message}`)

      // Exit code 0 para indicar éxito
      process.exit(0)
    } else {
      log(`❌ Error en actualización (${response.statusCode}): ${response.data.message}`)

      // Exit code 1 para indicar error
      process.exit(1)
    }

  } catch (error) {
    log(`❌ Error ejecutando actualización: ${error.message}`)

    // Detalles adicionales para debugging
    if (error.code === 'ECONNREFUSED') {
      log('💡 Verificar que la aplicación esté ejecutándose')
    } else if (error.code === 'ENOTFOUND') {
      log('💡 Verificar la URL base en la configuración')
    }

    // Exit code 1 para indicar error
    process.exit(1)
  }
}

// Verificar configuración
if (!config.baseUrl) {
  log('❌ Error: No se ha configurado NEXT_PUBLIC_BASE_URL')
  process.exit(1)
}

// Ejecutar actualización
actualizarPendientes()