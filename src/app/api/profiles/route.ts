import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

// GET /api/profiles — Alle Profile abrufen (nur Manager/Admin)
export async function GET() {
  const supabase = await createServerSupabaseClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
  }

  // Rolle prüfen
  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('rolle')
    .eq('id', user.id)
    .single()

  if (!currentProfile || !['manager', 'admin'].includes(currentProfile.rolle)) {
    return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  }

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .order('nachname', { ascending: true })

  if (error) {
    return NextResponse.json({ error: 'Fehler beim Laden der Profile' }, { status: 500 })
  }

  return NextResponse.json(profiles)
}
