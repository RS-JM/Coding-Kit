import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Thermometer, Calendar as CalendarIcon, Users } from 'lucide-react'
import { SickLeavesTable } from '@/components/sick-leaves-table'
import { SickLeaveFilters } from '@/components/sick-leave-filters'

export default async function AdminKrankheitPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const supabase = await createServerSupabaseClient()
  const params = await searchParams

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('rolle')
    .eq('id', user.id)
    .single()

  if (!profile || profile.rolle !== 'admin') {
    redirect('/')
  }

  // Get filter parameters
  const managerId = typeof params.manager_id === 'string' ? params.manager_id : undefined

  // Fetch all managers for filter dropdown
  const { data: managers } = await supabase
    .from('profiles')
    .select('id, vorname, nachname')
    .eq('rolle', 'manager')
    .order('vorname', { ascending: true })

  // Fetch all profiles for name lookup
  const { data: allProfiles } = await supabase
    .from('profiles')
    .select('id, vorname, nachname, manager_id')

  // Determine which employees to show based on filter
  let relevantEmployeeIds: string[] = []

  if (managerId) {
    // Filter by manager's team
    const teamMembers = allProfiles?.filter(p => p.manager_id === managerId)
    relevantEmployeeIds = teamMembers?.map(m => m.id) || []
  } else {
    // Show all employees
    relevantEmployeeIds = allProfiles?.map(p => p.id) || []
  }

  // Fetch sick leaves for relevant employees
  const { data: sickLeaves, error: sickLeavesError } = relevantEmployeeIds.length > 0
    ? await supabase
        .from('sick_leaves')
        .select('*')
        .in('user_id', relevantEmployeeIds)
        .order('start_datum', { ascending: false })
    : { data: [], error: null }

  if (sickLeavesError) {
    console.error('Error fetching sick leaves:', sickLeavesError)
  }

  // Manually join sick leaves with profiles
  const leavesWithProfiles = (sickLeaves ?? []).map(leave => ({
    ...leave,
    profiles: allProfiles?.find(p => p.id === leave.user_id) || null,
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

  // Calculate average sick days per employee (only counting those who were sick)
  const averageSickDays = uniqueEmployeesSick > 0
    ? (totalSickDays / uniqueEmployeesSick).toFixed(1)
    : '0.0'

  // Calculate sick rate (percentage of work days)
  const workDaysInMonth = 22 // Approximate
  const totalEmployees = managerId
    ? relevantEmployeeIds.length
    : allProfiles?.length || 0
  const totalPossibleWorkDays = workDaysInMonth * totalEmployees
  const sickRate = totalPossibleWorkDays > 0
    ? ((totalSickDays / totalPossibleWorkDays) * 100).toFixed(1)
    : '0.0'

  const selectedManager = managers?.find(m => m.id === managerId)

  return (
    <DashboardLayout currentPath="/admin/krankheit">
      <div className="p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Krankheitsübersicht</h1>
              <p className="text-muted-foreground">
                {managerId && selectedManager
                  ? `Team von ${selectedManager.vorname} ${selectedManager.nachname}`
                  : 'Gesamtunternehmen'}
              </p>
            </div>
            {currentlySick > 0 && (
              <Badge variant="destructive" className="h-8 px-3 text-base">
                <Thermometer className="mr-1.5 h-4 w-4" />
                {currentlySick} aktuell krank
              </Badge>
            )}
          </div>

          {/* Filters */}
          <SickLeaveFilters managers={managers || []} currentManagerId={managerId} />

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Gesamt Kranktage</CardTitle>
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalSickDays}</div>
                <p className="text-xs text-muted-foreground">
                  Dieser Monat
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Durchschnitt pro MA</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{averageSickDays}</div>
                <p className="text-xs text-muted-foreground">
                  Tage (betroffene MA)
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Krankheitsquote</CardTitle>
                <Thermometer className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{sickRate}%</div>
                <p className="text-xs text-muted-foreground">
                  Von Arbeitstagen
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Betroffene Mitarbeiter</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{uniqueEmployeesSick}</div>
                <p className="text-xs text-muted-foreground">
                  von {totalEmployees} Mitarbeitern
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Sick Leaves Table */}
          <Card>
            <CardHeader>
              <CardTitle>Krankmeldungen</CardTitle>
              <CardDescription>
                {managerId && selectedManager
                  ? `Team von ${selectedManager.vorname} ${selectedManager.nachname}`
                  : 'Alle Krankmeldungen'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sickLeavesError ? (
                <div className="text-center text-red-600 py-8">
                  Fehler beim Laden der Krankmeldungen
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
