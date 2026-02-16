import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { UserMenu } from '@/components/user-menu'
import { ThemeToggle } from '@/components/theme-toggle'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Calendar, Clock, ClipboardList, FolderOpen, History, LayoutDashboard, Users, Thermometer } from 'lucide-react'
import Link from 'next/link'

function getInitials(vorname?: string | null, nachname?: string | null): string {
  const v = vorname?.charAt(0)?.toUpperCase() ?? ''
  const n = nachname?.charAt(0)?.toUpperCase() ?? ''
  return v + n || '?'
}

interface DashboardLayoutProps {
  children: React.ReactNode
  currentPath?: string
}

export async function DashboardLayout({ children, currentPath = '/' }: DashboardLayoutProps) {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('vorname, nachname, job_titel, rolle')
    .eq('id', user.id)
    .single()

  const displayName = profile?.vorname && profile?.nachname
    ? `${profile.vorname} ${profile.nachname}`
    : user.email ?? 'Benutzer'

  const jobTitle = profile?.job_titel || 'Mitarbeiter'

  // Fetch pending counts for managers and admins
  let pendingVacationCount = 0
  let pendingSickLeaveCount = 0

  if (profile?.rolle === 'manager' || profile?.rolle === 'admin') {
    // Get team member IDs for managers, or all employees for admins
    let relevantEmployeeIds: string[] = []

    if (profile.rolle === 'manager') {
      const { data: teamMembers } = await supabase
        .from('profiles')
        .select('id')
        .eq('manager_id', user.id)

      relevantEmployeeIds = teamMembers?.map(m => m.id) || []
    } else {
      // Admin sees all employees
      const { data: allProfiles } = await supabase
        .from('profiles')
        .select('id')

      relevantEmployeeIds = allProfiles?.map(p => p.id) || []
    }

    if (relevantEmployeeIds.length > 0) {
      // Count pending vacation requests
      const { count: vacationCount } = await supabase
        .from('vacation_requests')
        .select('*', { count: 'exact', head: true })
        .in('user_id', relevantEmployeeIds)
        .eq('status', 'beantragt')

      pendingVacationCount = vacationCount ?? 0

      // Count recent sick leaves (e.g., submitted in the last 30 days)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { count: sickCount } = await supabase
        .from('sick_leaves')
        .select('*', { count: 'exact', head: true })
        .in('user_id', relevantEmployeeIds)
        .gte('created_at', thirtyDaysAgo.toISOString())

      pendingSickLeaveCount = sickCount ?? 0
    }
  }

  const navigationItems = [
    { label: 'Übersicht', icon: LayoutDashboard, href: '/', active: currentPath === '/' },
    { label: 'Timesheet', icon: ClipboardList, href: '#' },
    { label: 'Kalender', icon: Calendar, href: '#' },
    { label: 'Akten', icon: FolderOpen, href: '#' },
    { label: 'Historie', icon: History, href: '#' },
  ]

  return (
    <div className="min-h-screen bg-muted/40">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Clock className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold">Zeiterfassung</h1>
          </div>
          <div className="flex items-center gap-4">
            {/* Datum + Rolle kompakt */}
            <div className="hidden items-center gap-3 text-sm sm:flex">
              <span className="text-muted-foreground">
                {new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </span>
              <Separator orientation="vertical" className="h-4" />
              <Badge variant="outline" className="capitalize">
                {profile?.rolle ?? 'Unbekannt'}
              </Badge>
            </div>
            <Separator orientation="vertical" className="h-8" />
            {/* Theme Toggle */}
            <ThemeToggle />
            {/* Name + Avatar Dropdown */}
            <div className="flex items-center gap-3">
              <div className="text-right text-sm">
                <p className="font-medium">{displayName}</p>
                <p className="text-xs text-muted-foreground">{jobTitle}</p>
              </div>
              <UserMenu
                initials={getInitials(profile?.vorname, profile?.nachname)}
                displayName={displayName}
                jobTitle={jobTitle}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Content: Navigation + Main */}
      <div className="flex min-h-[calc(100vh-4rem)]">
        {/* Navigation Sidebar */}
        <nav className="hidden w-56 shrink-0 border-r bg-background p-4 lg:block">
          <div className="flex h-full flex-col">
            <ul className="space-y-1">
              {navigationItems.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted ${
                      item.active
                        ? 'bg-muted text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Rollenbasierte Navigation */}
            {(profile?.rolle === 'manager' || profile?.rolle === 'admin') && (
              <>
                <Separator className="my-4" />
                <ul className="space-y-1">
                  {(profile.rolle === 'manager' || profile.rolle === 'admin') && (
                    <>
                      <li>
                        <Link
                          href="/manager/urlaub"
                          className={`flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground ${
                            currentPath === '/manager/urlaub'
                              ? 'bg-muted text-foreground'
                              : 'text-muted-foreground'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Calendar className="h-4 w-4" />
                            Urlaubsanträge
                          </div>
                          {pendingVacationCount > 0 && (
                            <Badge variant="default" className="ml-4 h-5 min-w-[20px] justify-center rounded-full px-1.5 text-xs">
                              {pendingVacationCount}
                            </Badge>
                          )}
                        </Link>
                      </li>
                      <li>
                        <Link
                          href={profile.rolle === 'admin' ? '/admin/krankheit' : '/manager/krankheit'}
                          className={`flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground ${
                            currentPath === '/manager/krankheit' || currentPath === '/admin/krankheit'
                              ? 'bg-muted text-foreground'
                              : 'text-muted-foreground'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Thermometer className="h-4 w-4" />
                            Krankheitsübersicht
                          </div>
                          {pendingSickLeaveCount > 0 && (
                            <Badge variant="default" className="ml-4 h-5 min-w-[20px] justify-center rounded-full px-1.5 text-xs">
                              {pendingSickLeaveCount}
                            </Badge>
                          )}
                        </Link>
                      </li>
                    </>
                  )}
                  {profile.rolle === 'admin' && (
                    <li>
                      <Link
                        href="/admin/users"
                        className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground ${
                          currentPath === '/admin/users'
                            ? 'bg-muted text-foreground'
                            : 'text-muted-foreground'
                        }`}
                      >
                        <Users className="h-4 w-4" />
                        Benutzerverwaltung
                      </Link>
                    </li>
                  )}
                </ul>
              </>
            )}
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  )
}
