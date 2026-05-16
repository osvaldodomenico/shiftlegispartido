import { NextResponse } from 'next/server'

// NextAuth removido — rota desativada
export function GET() {
  return NextResponse.json({ error: 'Not Found' }, { status: 404 })
}

export function POST() {
  return NextResponse.json({ error: 'Not Found' }, { status: 404 })
}
