import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Thermometer, Calendar as CalendarIcon } from 'lucide-react'
import { SickLeavesTable } from '@/components/sick-leaves-table'

export default async function ManagerKrankheitPage() {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if user is manager or admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('rolle')
    .eq('id', user.id)
    .single()

  if (!profile || (profile.rolle !== 'manager' && profile.rolle !== 'admin')) {
    redirect('/')
  }

  // Fetch team members
  const { data: teamMembers } = await supabase
    .from('profiles')
    .select('id, vorname, nachname')
    .eq('manager_id', user.id)

  const teamMemberIds = teamMembers?.map(m => m.id) || []

  // Fetch sick leaves for team
  const { data: sickLeaves, error: sickLeavesError } = teamMemberIds.length > 0
    ? await supabase
        .from('sick_leaves')
        .select('*')
        .in('user_id', teamMemberIds)
        .order('start_datum', { ascending: false })
    : { data: [], error: null }

  if (sickLeavesError) {
    console.error('Error fetching sick leaves:', sickLeavesError)
  }

  // Manually join sick leaves with profiles
  const leavesWithProfiles = (sickLeaves ?? []).map(leave => ({
    ...leave,
    profiles: teamMembers?.find(p => p.id === leave.user_id) || null,
  }))

  // Calculate stats
  const today = new Date().toISOString().split('T')[0]
  const currentlySick = leavesWithProfiles.filter(
    leave => leave.start_datum <= today && leave.end_datum >= today
  ).length

  // Calculate total sick days this month
  const now = new Date()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

  const thisMonthLeaves = leavesWithProfiles.filter(
    leave => leave.start_datum <= lastDayOfMonth && leave.end_datum >= firstDayOfMonth
  )

  // Count unique employees sick this month
  const uniqueEmployeesSick = new Set(thisMonthLeaves.map(l => l.user_id)).size

  // Calculate total sick days this month
  let totalSickDays = 0
  thisMonthLeaves.forEach(leave => {
    const start = new Date(Math.max(new Date(leave.start_datum).getTime(), new Date(firstDayOfMonth).getTime()))
    const end = new Date(Math.min(new Date(leave.end_datum).getTime(), new Date(lastDayOfMonth).getTime()))
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
    totalSickDays += days
  })

  return (
    <DashboardLayout currentPath="/manager/krankheit">
      <div className="p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Krankheitsübersicht</h1>
              <p className="text-muted-foreground">
                Übersicht der Krankmeldungen deiner Teammitglieder
              </p>
            </div>
            {currentlySick > 0 && (
              <Badge variant="destructive" className="h-8 px-3 text-base">
                <Thermometer className="mr-1.5 h-4 w-4" />
                {currentlySick} aktuell krank
              </Badge>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Aktuell krank</CardTitle>
                <Thermometer className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{currentlySick}</div>
                <p className="text-xs text-muted-foreground">
                  {currentlySick === 1 ? 'Mitarbeiter' : 'Mitarbeiter'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Dieser Monat</CardTitle>
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalSickDays}</div>
                <p className="text-xs text-muted-foreground">
                  Kranktage insgesamt
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Betroffene Mitarbeiter</CardTitle>
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{uniqueEmployeesSick}</div>
                <p className="text-xs text-muted-foreground">
                  {uniqueEmployeesSick === 1 ? 'Person' : 'Personen'} diesen Monat
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Sick Leaves Table */}
          <Card>
            <CardHeader>
              <CardTitle>Krankmeldungen</CardTitle>
              <CardDescription>
                Alle Krankmeldungen deiner Teammitglieder
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sickLeavesError ? (
                <div className="text-center text-red-600 py-8">
                  Fehler beim Laden der Krankmeldungen
                </div>
              ) : teamMemberIds.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  Du hast noch keine Teammitglieder zugewiesen.
                </div>
              ) : leavesWithProfiles.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  Keine Krankmeldungen vorhanden.
                </div>
              ) : (
                <SickLeavesTable sickLeaves={leavesWithProfiles} />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
