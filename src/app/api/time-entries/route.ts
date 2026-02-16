import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const createSchema = z.object({
  datum: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  stunden: z.number().min(0).max(24),
  typ: z.enum(['arbeit', 'krank', 'urlaub']).optional().default('arbeit'),
  arbeitsort: z.enum(['office', 'homeoffice', 'remote', 'kunde']).nullable().optional().default(null),
  kommentar: z.string().max(500).optional().default(''),
})

// GET /api/time-entries?von=2026-02-01&bis=2026-02-28
export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const von = searchParams.get('von')
  const bis = searchParams.get('bis')

  let query = supabase
    .from('time_entries')
    .select('*')
    .eq('user_id', user.id)
    .order('datum', { ascending: true })

  if (von) query = query.gte('datum', von)
  if (bis) query = query.lte('datum', bis)

  const { data, error } = await query

  if (error) {
    console.error('[GET /api/time-entries] Supabase error:', error)
    return NextResponse.json({ error: 'Fehler beim Laden der Einträge' }, { status: 500 })
  }

  return NextResponse.json(data)
}

// POST /api/time-entries
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = createSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Ungültige Eingabe', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const { datum, stunden, typ, arbeitsort, kommentar } = parsed.data

  // Arbeitsort ist Pflicht für Arbeitszeit-Einträge
  if (typ === 'arbeit' && !arbeitsort) {
    return NextResponse.json(
      { error: 'Arbeitsort ist für Arbeitszeit-Einträge erforderlich' },
      { status: 400 },
    )
  }

  // Zukunfts-Check: nur Urlaub darf in der Zukunft liegen
  const today = new Date().toISOString().split('T')[0]
  if (typ !== 'urlaub' && datum > today) {
    return NextResponse.json(
      { error: 'Kann nicht für zukünftige Tage eingetragen werden' },
      { status: 400 },
    )
  }

  const { data, error } = await supabase
    .from('time_entries')
    .insert({
      user_id: user.id,
      datum,
      stunden,
      typ,
      arbeitsort: typ === 'arbeit' ? arbeitsort : null,
      kommentar,
    })
    .select()
    .single()

  if (error) {
    console.error('[POST /api/time-entries] Supabase error:', error)
    return NextResponse.json({ error: 'Fehler beim Speichern' }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
