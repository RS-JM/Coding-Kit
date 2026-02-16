import { createClient } from '@supabase/supabase-js'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'

const inviteUserSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
  vorname: z.string().min(1, 'Vorname ist erforderlich'),
  nachname: z.string().min(1, 'Nachname ist erforderlich'),
  job_titel: z.string().optional(),
  rolle: z.enum(['mitarbeiter', 'manager', 'admin'], {
    errorMap: () => ({ message: 'Ungültige Rolle' }),
  }),
  urlaubstage_gesamt: z.number().int().min(0).max(365).optional(),
})

// POST /api/users/invite — Neuen Benutzer einladen (nur Admin)
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()

  // 1. Auth-Check
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
  }

  // 2. Admin-Check
  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('rolle')
    .eq('id', user.id)
    .single()

  if (!currentProfile || currentProfile.rolle !== 'admin') {
    return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  }

  // 3. Service-Key-Check
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceKey) {
    return NextResponse.json(
      {
        error: 'Service-Schlüssel nicht konfiguriert',
        details: 'Um neue Benutzer einzuladen, füge SUPABASE_SERVICE_ROLE_KEY zur .env.local hinzu.',
        hint: 'Den Service Role Key findest du im Supabase Dashboard unter Project Settings → API.',
      },
      { status: 503 }
    )
  }

  // 4. Request-Body validieren
  const body = await request.json()
  const parsed = inviteUserSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Ungültige Daten', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  try {
    // 5. Admin-Client erstellen (mit Service Role Key)
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // 6. User einladen via Admin API
    const { data: authUser, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
      parsed.data.email
    )

    if (inviteError) {
      // Prüfe ob Email bereits existiert
      if (inviteError.message.includes('already') || inviteError.message.includes('exists')) {
        return NextResponse.json(
          { error: 'Ein Benutzer mit dieser E-Mail existiert bereits' },
          { status: 409 }
        )
      }

      console.error('Invite error:', inviteError)
      return NextResponse.json(
        { error: 'Fehler beim Einladen des Benutzers', details: inviteError.message },
        { status: 500 }
      )
    }

    if (!authUser.user) {
      return NextResponse.json({ error: 'Benutzer konnte nicht erstellt werden' }, { status: 500 })
    }

    // 7. Profile aktualisieren (Trigger hat bereits Basis-Profil erstellt)
    // Warte kurz damit der Trigger ausgeführt wird
    await new Promise(resolve => setTimeout(resolve, 500))

    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({
        vorname: parsed.data.vorname,
        nachname: parsed.data.nachname,
        job_titel: parsed.data.job_titel || '',
        rolle: parsed.data.rolle,
        urlaubstage_gesamt: parsed.data.urlaubstage_gesamt ?? 30,
      })
      .eq('id', authUser.user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Profile update error:', updateError)
      return NextResponse.json(
        { error: 'Benutzer wurde erstellt, aber Profil konnte nicht aktualisiert werden' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      user: updatedProfile,
      message: 'Benutzer wurde erfolgreich eingeladen. Eine Einladungs-E-Mail wurde versendet.',
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Ein unerwarteter Fehler ist aufgetreten' },
      { status: 500 }
    )
  }
}
