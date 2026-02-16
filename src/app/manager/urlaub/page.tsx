import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard-layout'
import { VacationRequestsTable } from '@/components/vacation-requests-table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar } from 'lucide-react'

export default async function ManagerUrlaubPage() {
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

  // Fetch all vacation requests
  const { data: vacationRequests, error: requestsError } = await supabase
    .from('vacation_requests')
    .select('*')
    .order('created_at', { ascending: false })

  if (requestsError) {
    console.error('Error fetching vacation requests:', requestsError)
  }

  // Fetch all profiles
  const { data: allProfiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, vorname, nachname')

  if (profilesError) {
    console.error('Error fetching profiles:', profilesError)
  }

  // Manually join vacation requests with profiles
  const requests = (vacationRequests ?? []).map(request => ({
    ...request,
    profiles: allProfiles?.find(p => p.id === request.user_id) || null,
  }))

  // Fallback to empty array if error or no data
  const safeRequests = requests
  const pendingCount = safeRequests.filter(r => r.status === 'beantragt').length
  const error = requestsError || profilesError

  return (
    <DashboardLayout currentPath="/manager/urlaub">
      <div className="p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Urlaubsanträge</h1>
              <p className="text-muted-foreground">
                Genehmige oder lehne Urlaubsanträge deiner Teammitglieder ab
              </p>
            </div>
            {pendingCount > 0 && (
              <Badge variant="default" className="h-8 px-3 text-base">
                {pendingCount} offen
              </Badge>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Offen</CardDescription>
                <CardTitle className="text-3xl">
                  {safeRequests.filter(r => r.status === 'beantragt').length}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Genehmigt</CardDescription>
                <CardTitle className="text-3xl text-green-600">
                  {safeRequests.filter(r => r.status === 'genehmigt').length}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Abgelehnt</CardDescription>
                <CardTitle className="text-3xl text-red-600">
                  {safeRequests.filter(r => r.status === 'abgelehnt').length}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Error Message */}
          {error && (
            <Card className="border-destructive">
              <CardContent className="pt-6">
                <p className="text-sm text-destructive font-medium">
                  ⚠️ Fehler beim Laden der Urlaubsanträge
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Mögliche Ursachen: Migration 007 nicht ausgeführt oder RLS-Policy Problem
                </p>
              </CardContent>
            </Card>
          )}

          {/* Vacation Requests Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Alle Urlaubsanträge
              </CardTitle>
            </CardHeader>
            <CardContent>
              <VacationRequestsTable requests={safeRequests} />
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
