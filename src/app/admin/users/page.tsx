import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { UsersTable } from '@/components/users-table'
import { UserFilters } from '@/components/user-filters'
import { Users, UserPlus, UserCheck, UserX, Shield } from 'lucide-react'
import { AdminUsersHeader } from '@/components/admin-users-header'

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const supabase = await createServerSupabaseClient()
  const params = await searchParams

  // Auth check
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Admin check
  const { data: profile } = await supabase
    .from('profiles')
    .select('rolle')
    .eq('id', user.id)
    .single()

  if (!profile || profile.rolle !== 'admin') {
    redirect('/')
  }

  // Get filter parameters
  const search = typeof params.search === 'string' ? params.search : undefined
  const rolle = typeof params.rolle === 'string' ? params.rolle : undefined
  const status = typeof params.status === 'string' ? params.status : undefined

  // Fetch all profiles
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
    .order('nachname', { ascending: true })
    .order('vorname', { ascending: true })

  if (profilesError) {
    console.error('Error fetching profiles:', profilesError)
  }

  // Server-side filtering
  let filteredUsers = profiles ?? []

  if (search) {
    const term = search.toLowerCase()
    filteredUsers = filteredUsers.filter(
      (u) =>
        u.vorname.toLowerCase().includes(term) ||
        u.nachname.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term)
    )
  }

  if (rolle) {
    filteredUsers = filteredUsers.filter((u) => u.rolle === rolle)
  }

  if (status === 'aktiv') {
    filteredUsers = filteredUsers.filter((u) => u.ist_aktiv === true)
  } else if (status === 'inaktiv') {
    filteredUsers = filteredUsers.filter((u) => u.ist_aktiv === false)
  }

  // Calculate statistics
  const totalUsers = profiles?.length || 0
  const activeUsers = profiles?.filter((p) => p.ist_aktiv).length || 0
  const inactiveUsers = totalUsers - activeUsers
  const adminCount = profiles?.filter((p) => p.rolle === 'admin').length || 0

  return (
    <DashboardLayout currentPath="/admin/users">
      <div className="p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Header */}
          <AdminUsersHeader />

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Gesamt</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalUsers}</div>
                <p className="text-xs text-muted-foreground">Benutzer im System</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Aktiv</CardTitle>
                <UserCheck className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeUsers}</div>
                <p className="text-xs text-muted-foreground">
                  {activeUsers === 1 ? 'Aktiver Benutzer' : 'Aktive Benutzer'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Inaktiv</CardTitle>
                <UserX className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{inactiveUsers}</div>
                <p className="text-xs text-muted-foreground">
                  {inactiveUsers === 1 ? 'Inaktiver Benutzer' : 'Inaktive Benutzer'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Administratoren</CardTitle>
                <Shield className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{adminCount}</div>
                <p className="text-xs text-muted-foreground">
                  {adminCount === 1 ? 'Administrator' : 'Administratoren'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <UserFilters currentSearch={search} currentRolle={rolle} currentStatus={status} />

          {/* Users Table */}
          <Card>
            <CardHeader>
              <CardTitle>Benutzer</CardTitle>
              <CardDescription>
                Verwalte alle Benutzerkonten und deren Berechtigungen
                {filteredUsers.length !== totalUsers && (
                  <span className="ml-1">
                    ({filteredUsers.length} von {totalUsers} angezeigt)
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {profilesError ? (
                <div className="text-center text-red-600 py-8">
                  Fehler beim Laden der Benutzer
                </div>
              ) : (
                <UsersTable users={filteredUsers} />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
