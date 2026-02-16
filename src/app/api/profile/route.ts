import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

// GET /api/profile — Eigenes Profil abrufen
export async function GET() {
  const supabase = await createServerSupabaseClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) {
    return NextResponse.json({ error: 'Profil nicht gefunden' }, { status: 404 })
  }

  return NextResponse.json(profile)
}
