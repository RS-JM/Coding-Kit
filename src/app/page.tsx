import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { UserMenu } from '@/components/user-menu'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Calendar, Palmtree, Clock, ClipboardList, FolderOpen, History, LayoutDashboard, Users, ShieldCheck } from 'lucide-react'

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Guten Morgen'
  if (hour < 18) return 'Guten Tag'
  return 'Guten Abend'
}

function getInitials(vorname?: string | null, nachname?: string | null): string {
  const v = vorname?.charAt(0)?.toUpperCase() ?? ''
  const n = nachname?.charAt(0)?.toUpperCase() ?? ''
  return v + n || '?'
}

function formatDate(): string {
  return new Date().toLocaleDateString('de-DE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('vorname, nachname, job_titel, rolle')
    .eq('id', user.id)
    .single()

  const displayName = profile?.vorname && profile?.nachname
    ? `${profile.vorname} ${profile.nachname}`
    : user.email ?? 'Benutzer'

  const jobTitle = profile?.job_titel || 'Mitarbeiter'

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
              {[
                { label: 'Übersicht', icon: LayoutDashboard, href: '/', active: true },
                { label: 'Timesheet', icon: ClipboardList, href: '#' },
                { label: 'Kalender', icon: Calendar, href: '#' },
                { label: 'Akten', icon: FolderOpen, href: '#' },
                { label: 'Historie', icon: History, href: '#' },
              ].map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted ${
                      item.active
                        ? 'bg-muted text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>

            {/* Rollenbasierte Navigation */}
            {(profile?.rolle === 'manager' || profile?.rolle === 'admin') && (
              <>
                <Separator className="my-4" />
                <ul className="space-y-1">
                  {profile.rolle === 'manager' && (
                    <li>
                      <a
                        href="#"
                        className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        <Users className="h-4 w-4" />
                        Team
                      </a>
                    </li>
                  )}
                  {profile.rolle === 'admin' && (
                    <>
                      <li>
                        <a
                          href="#"
                          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                          <Users className="h-4 w-4" />
                          Team
                        </a>
                      </li>
                      <li>
                        <a
                          href="#"
                          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                          <ShieldCheck className="h-4 w-4" />
                          Verwaltung
                        </a>
                      </li>
                    </>
                  )}
                </ul>
              </>
            )}
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {/* Begrüßung */}
          <div className="mb-6">
            <h2 className="text-2xl font-semibold">
              {getGreeting()}, {profile?.vorname || 'Benutzer'}
            </h2>
            <p className="text-muted-foreground">{formatDate()}</p>
          </div>

          {/* Fehler-State für Profil */}
          {profileError && (
            <Card className="mb-6 border-destructive">
              <CardContent className="pt-6">
                <p className="text-sm text-destructive">
                  Profildaten konnten nicht geladen werden. Bitte lade die Seite neu.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Dashboard Grid: Kalender ~80% | Urlaub-Widget ~20% */}
          <div className="grid gap-6 xl:grid-cols-5">
            {/* Kalender-Platzhalter */}
            <Card className="xl:col-span-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Kalender
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex h-96 items-center justify-center rounded-lg border border-dashed text-muted-foreground">
                  <p>Kalender wird in PROJ-4 implementiert</p>
                </div>
              </CardContent>
            </Card>

            {/* Urlaub-Widget (rechte Spalte, ~20%) */}
            <Card className="xl:col-span-1">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Palmtree className="h-4 w-4" />
                  Urlaub
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex h-32 items-center justify-center rounded-lg border border-dashed text-muted-foreground">
                  <p className="text-center text-sm">Urlaubsanzeige kommt in PROJ-6</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
