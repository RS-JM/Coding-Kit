import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const updateSchema = z.object({
  stunden: z.number().min(0).max(24).optional(),
  arbeitsort: z.enum(['office', 'homeoffice', 'remote', 'kunde']).nullable().optional(),
  kommentar: z.string().max(500).optional(),
})

// PATCH /api/time-entries/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createServerSupabaseClient()
  const { id } = await params

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = updateSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Ungültige Eingabe', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const { data, error } = await supabase
    .from('time_entries')
    .update(parsed.data)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Fehler beim Aktualisieren' }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ error: 'Eintrag nicht gefunden' }, { status: 404 })
  }

  return NextResponse.json(data)
}

// DELETE /api/time-entries/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createServerSupabaseClient()
  const { id } = await params

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
  }

  const { error } = await supabase
    .from('time_entries')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: 'Fehler beim Löschen' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
