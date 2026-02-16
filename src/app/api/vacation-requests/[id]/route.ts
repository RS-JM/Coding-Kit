import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

// DELETE /api/vacation-requests/[id] — Stornierung (nur beantragt)
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

  // RLS enforces: only own + status='beantragt' can be deleted
  const { error } = await supabase
    .from('vacation_requests')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
    .eq('status', 'beantragt')

  if (error) {
    console.error('[DELETE /api/vacation-requests] Supabase error:', error)
    return NextResponse.json({ error: 'Fehler beim Stornieren' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
