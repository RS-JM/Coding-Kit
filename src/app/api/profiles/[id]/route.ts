import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'

const updateProfileSchema = z.object({
  vorname: z.string().min(1).optional(),
  nachname: z.string().min(1).optional(),
  job_titel: z.string().optional(),
  rolle: z.enum(['mitarbeiter', 'manager', 'admin']).optional(),
  urlaubstage_gesamt: z.number().int().min(0).optional(),
  ist_aktiv: z.boolean().optional(),
  is_locked: z.boolean().optional(),
  failed_login_attempts: z.number().int().min(0).optional(),
})

// PATCH /api/profiles/[id] — Profil bearbeiten (nur Admin)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
  }

  // Nur Admins dürfen Profile bearbeiten
  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('rolle')
    .eq('id', user.id)
    .single()

  if (!currentProfile || currentProfile.rolle !== 'admin') {
    return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  }

  // Request-Body validieren
  const body = await request.json()
  const parsed = updateProfileSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Ungültige Daten', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  // Schutz: Letzter Admin darf nicht degradiert werden
  if (parsed.data.rolle && parsed.data.rolle !== 'admin') {
    const { count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('rolle', 'admin')

    if (count === 1) {
      // Prüfe ob der zu ändernde User der letzte Admin ist
      const { data: targetProfile } = await supabase
        .from('profiles')
        .select('rolle')
        .eq('id', id)
        .single()

      if (targetProfile?.rolle === 'admin') {
        return NextResponse.json(
          { error: 'Mindestens ein Admin muss existieren' },
          { status: 400 }
        )
      }
    }
  }

  const { data: updatedProfile, error } = await supabase
    .from('profiles')
    .update(parsed.data)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Fehler beim Aktualisieren' }, { status: 500 })
  }

  return NextResponse.json(updatedProfile)
}
