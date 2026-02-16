import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const createSchema = z.object({
  start_datum: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_datum: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  arbeitstage: z.number().int().min(1),
  kommentar: z.string().max(500).optional().default(''),
})

// GET /api/vacation-requests?year=2026
export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const year = searchParams.get('year')
  const von = searchParams.get('von')
  const bis = searchParams.get('bis')

  let query = supabase
    .from('vacation_requests')
    .select('*')
    .eq('user_id', user.id)
    .order('start_datum', { ascending: true })

  if (year) {
    query = query
      .gte('start_datum', `${year}-01-01`)
      .lte('start_datum', `${year}-12-31`)
  }

  if (von) query = query.gte('end_datum', von)
  if (bis) query = query.lte('start_datum', bis)

  const { data, error } = await query

  if (error) {
    console.error('[GET /api/vacation-requests] Supabase error:', error)
    return NextResponse.json({ error: 'Fehler beim Laden der Urlaubsanträge' }, { status: 500 })
  }

  return NextResponse.json(data)
}

// POST /api/vacation-requests
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

  const { start_datum, end_datum, arbeitstage, kommentar } = parsed.data

  if (end_datum < start_datum) {
    return NextResponse.json(
      { error: 'Enddatum muss nach dem Startdatum liegen' },
      { status: 400 },
    )
  }

  // Check for overlapping requests (beantragt or genehmigt)
  const { data: overlapping } = await supabase
    .from('vacation_requests')
    .select('id')
    .eq('user_id', user.id)
    .in('status', ['beantragt', 'genehmigt'])
    .lte('start_datum', end_datum)
    .gte('end_datum', start_datum)
    .limit(1)

  if (overlapping && overlapping.length > 0) {
    return NextResponse.json(
      { error: 'Für diesen Zeitraum existiert bereits ein Urlaubsantrag' },
      { status: 409 },
    )
  }

  const { data, error } = await supabase
    .from('vacation_requests')
    .insert({
      user_id: user.id,
      start_datum,
      end_datum,
      arbeitstage,
      kommentar,
    })
    .select()
    .single()

  if (error) {
    console.error('[POST /api/vacation-requests] Supabase error:', error)
    return NextResponse.json({ error: 'Fehler beim Erstellen des Urlaubsantrags' }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
