import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { searchParams } = new URL(request.url)
    const von = searchParams.get('von')
    const bis = searchParams.get('bis')
    const userId = searchParams.get('user_id')
    const managerId = searchParams.get('manager_id')
    const forTeam = searchParams.get('for_team') === 'true'

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user's profile to check role
    const { data: profile } = await supabase
      .from('profiles')
      .select('rolle, manager_id')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    let query = supabase
      .from('sick_leaves')
      .select('*')
      .order('start_datum', { ascending: false })

    // Apply user filtering based on role and parameters
    if (profile.rolle === 'admin') {
      // Admins can filter by manager_id or user_id, or see all
      if (managerId) {
        // Get team members for this manager
        const { data: teamMembers } = await supabase
          .from('profiles')
          .select('id')
          .eq('manager_id', managerId)

        if (teamMembers && teamMembers.length > 0) {
          const memberIds = teamMembers.map((m) => m.id)
          query = query.in('user_id', memberIds)
        } else {
          // No team members, return empty array
          return NextResponse.json([], { status: 200 })
        }
      } else if (userId) {
        query = query.eq('user_id', userId)
      }
      // else: show all (no user_id filter)
    } else if (profile.rolle === 'manager' && forTeam) {
      // Managers can see their team's sick leaves
      const { data: teamMembers } = await supabase
        .from('profiles')
        .select('id')
        .eq('manager_id', user.id)

      if (teamMembers && teamMembers.length > 0) {
        const memberIds = teamMembers.map((m) => m.id)
        query = query.in('user_id', memberIds)

        // Optionally filter by specific user within team
        if (userId && memberIds.includes(userId)) {
          query = query.eq('user_id', userId)
        }
      } else {
        // No team members, return empty array
        return NextResponse.json([], { status: 200 })
      }
    } else {
      // Regular users or managers without for_team flag: only see their own
      query = query.eq('user_id', user.id)
    }

    // Apply date filters
    if (von) {
      query = query.gte('end_datum', von)
    }

    if (bis) {
      query = query.lte('start_datum', bis)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching sick leaves:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [], { status: 200 })
  } catch (error) {
    console.error('Error in sick-leaves GET:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { start_datum, end_datum, kommentar } = body

    // Validation
    if (!start_datum || !end_datum) {
      return NextResponse.json(
        { error: 'start_datum und end_datum sind erforderlich' },
        { status: 400 }
      )
    }

    if (new Date(start_datum) > new Date(end_datum)) {
      return NextResponse.json(
        { error: 'end_datum muss nach start_datum liegen' },
        { status: 400 }
      )
    }

    if (new Date(start_datum) > new Date()) {
      return NextResponse.json(
        { error: 'Krankmeldung kann nicht in der Zukunft liegen' },
        { status: 400 }
      )
    }

    // Check for overlapping sick leaves
    const { data: existing } = await supabase
      .from('sick_leaves')
      .select('id')
      .eq('user_id', user.id)
      .or(`start_datum.lte.${end_datum},end_datum.gte.${start_datum}`)

    if (existing && existing.length > 0) {
      return NextResponse.json(
        { error: 'Für diesen Zeitraum existiert bereits eine Krankmeldung' },
        { status: 409 }
      )
    }

    // Create sick leave
    const { data, error } = await supabase
      .from('sick_leaves')
      .insert({
        user_id: user.id,
        start_datum,
        end_datum,
        kommentar: kommentar || '',
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating sick leave:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Error in sick-leaves POST:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
