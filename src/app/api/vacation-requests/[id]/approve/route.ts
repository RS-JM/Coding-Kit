import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { id } = await params

    // Verify user is manager or admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('rolle')
      .eq('id', user.id)
      .single()

    if (!profile || (profile.rolle !== 'manager' && profile.rolle !== 'admin')) {
      return NextResponse.json({ error: 'Forbidden: Only managers can approve requests' }, { status: 403 })
    }

    const body = await request.json()
    const { action, ablehnungsgrund } = body

    if (!action || !['genehmigen', 'ablehnen'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    if (action === 'ablehnen' && (!ablehnungsgrund || ablehnungsgrund.trim() === '')) {
      return NextResponse.json({ error: 'Ablehnungsgrund ist erforderlich' }, { status: 400 })
    }

    // Update vacation request
    const updateData: any = {
      status: action === 'genehmigen' ? 'genehmigt' : 'abgelehnt',
      bearbeitet_von: user.id,
      bearbeitet_am: new Date().toISOString(),
    }

    if (action === 'ablehnen') {
      updateData.ablehnungsgrund = ablehnungsgrund
    }

    const { data, error } = await supabase
      .from('vacation_requests')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating vacation request:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error('Error in approve endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
