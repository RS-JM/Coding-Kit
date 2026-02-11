import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { LogoutButton } from '@/components/logout-button'

export default async function DashboardPage() {
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

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="border-b bg-background">
        <div className="flex h-16 items-center justify-between px-6">
          <div>
            <h1 className="text-lg font-semibold">Zeiterfassung</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right text-sm">
              <p className="font-medium">
                {profile?.vorname && profile?.nachname
                  ? `${profile.vorname} ${profile.nachname}`
                  : user.email}
              </p>
              <div className="flex items-center justify-end gap-2">
                {profile?.job_titel && (
                  <span className="text-muted-foreground">{profile.job_titel}</span>
                )}
                {profile?.rolle && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary capitalize">
                    {profile.rolle}
                  </span>
                )}
              </div>
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="p-6">
        <div className="rounded-lg border bg-background p-8 text-center text-muted-foreground">
          <p className="text-lg">Dashboard wird in PROJ-3 implementiert</p>
          <p className="mt-2 text-sm">
            Eingeloggt als: {user.email}
            {profile?.rolle && (
              <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                {profile.rolle}
              </span>
            )}
          </p>
        </div>
      </main>
    </div>
  )
}
