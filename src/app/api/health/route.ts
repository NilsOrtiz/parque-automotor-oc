import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'API Health Check - Parque Automotor',
    environment: process.env.NODE_ENV || 'unknown'
  })
}

export async function POST() {
  return NextResponse.json({
    status: 'ok',
    method: 'POST',
    timestamp: new Date().toISOString(),
    message: 'API Health Check - Parque Automotor POST',
    environment: process.env.NODE_ENV || 'unknown'
  })
}