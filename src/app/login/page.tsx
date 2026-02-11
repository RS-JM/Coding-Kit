'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertCircle, Mail, Lock, KeyRound } from 'lucide-react'
import { toast } from 'sonner'

const loginSchema = z.object({
  email: z.string().email('Bitte gib eine gültige E-Mail-Adresse ein'),
  password: z.string().min(8, 'Passwort muss mindestens 8 Zeichen lang sein'),
})

const resetSchema = z.object({
  email: z.string().email('Bitte gib eine gültige E-Mail-Adresse ein'),
})

type LoginFormData = z.infer<typeof loginSchema>
type ResetFormData = z.infer<typeof resetSchema>

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showResetForm, setShowResetForm] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  // Supabase Recovery-Flow erkennen und zu /reset-password weiterleiten
  useEffect(() => {
    const supabase = createClient()

    // Hash-Fragment prüfen (Supabase implicit flow: #access_token=...&type=recovery)
    const hash = window.location.hash
    if (hash && hash.includes('type=recovery')) {
      window.location.href = `/reset-password${hash}`
      return
    }

    // Code-Parameter prüfen (PKCE flow: ?code=...)
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    if (code) {
      window.location.href = `/reset-password?code=${code}`
      return
    }

    // Auth State Change Event abfangen
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        window.location.href = '/reset-password'
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const resetForm = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
    defaultValues: { email: '' },
  })

  async function onLogin(data: LoginFormData) {
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      // Prüfe ob Account gesperrt ist (via RPC — umgeht RLS)
      const { data: lockCheck } = await supabase.rpc('check_account_locked', {
        p_email: data.email,
      })

      if (lockCheck?.is_locked) {
        setError('Ihr Konto wurde gesperrt. Bitte wenden Sie sich an den Administrator.')
        setIsLoading(false)
        return
      }

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (authError) {
        // Fehlversuch zählen (via RPC — umgeht RLS)
        const { data: result } = await supabase.rpc('record_failed_login', {
          p_email: data.email,
        })

        if (result?.is_locked) {
          setError('Ihr Konto wurde gesperrt. Bitte wenden Sie sich an den Administrator.')
          setIsLoading(false)
          return
        }

        setError('E-Mail oder Passwort falsch')
        setIsLoading(false)
        return
      }

      if (authData.session) {
        // Fehlversuche zurücksetzen (via RPC)
        await supabase.rpc('reset_failed_login', {
          p_user_id: authData.user.id,
        })

        window.location.href = '/'
      } else {
        setError('Login fehlgeschlagen. Bitte versuche es erneut.')
        setIsLoading(false)
      }
    } catch {
      setError('Verbindungsfehler. Bitte versuche es erneut.')
      setIsLoading(false)
    }
  }

  async function onResetPassword(data: ResetFormData) {
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (resetError) {
        setError('Fehler beim Senden der E-Mail. Bitte versuche es erneut.')
        setIsLoading(false)
        return
      }

      setResetSent(true)
      toast.success('E-Mail gesendet')
    } catch {
      setError('Verbindungsfehler. Bitte versuche es erneut.')
    } finally {
      setIsLoading(false)
    }
  }

  // Passwort-Reset Formular
  if (showResetForm) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/40 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <KeyRound className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">Passwort zurücksetzen</CardTitle>
            <CardDescription>
              {resetSent
                ? 'Falls ein Konto mit dieser E-Mail existiert, wurde eine E-Mail gesendet.'
                : 'Gib deine E-Mail-Adresse ein, um einen Reset-Link zu erhalten.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {resetSent ? (
              <div className="space-y-4">
                <Alert>
                  <Mail className="h-4 w-4" />
                  <AlertDescription>
                    Prüfe dein Postfach und klicke auf den Link in der E-Mail, um dein Passwort zurückzusetzen.
                  </AlertDescription>
                </Alert>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setShowResetForm(false)
                    setResetSent(false)
                    setError(null)
                  }}
                >
                  Zurück zum Login
                </Button>
              </div>
            ) : (
              <form onSubmit={resetForm.handleSubmit(onResetPassword)} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="reset-email">E-Mail</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="name@firma.de"
                    {...resetForm.register('email')}
                    disabled={isLoading}
                  />
                  {resetForm.formState.errors.email && (
                    <p className="text-sm text-destructive">
                      {resetForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Reset-Link senden
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setShowResetForm(false)
                    setError(null)
                  }}
                  disabled={isLoading}
                >
                  Zurück zum Login
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // Login Formular
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Zeiterfassung</CardTitle>
          <CardDescription>Melde dich mit deinem Konto an</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">E-Mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@firma.de"
                {...loginForm.register('email')}
                disabled={isLoading}
              />
              {loginForm.formState.errors.email && (
                <p className="text-sm text-destructive">
                  {loginForm.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Passwort</Label>
              <Input
                id="password"
                type="password"
                placeholder="Mindestens 8 Zeichen"
                {...loginForm.register('password')}
                disabled={isLoading}
              />
              {loginForm.formState.errors.password && (
                <p className="text-sm text-destructive">
                  {loginForm.formState.errors.password.message}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Anmelden
            </Button>

            <Button
              type="button"
              variant="link"
              className="w-full text-sm"
              onClick={() => {
                setShowResetForm(true)
                setError(null)
              }}
              disabled={isLoading}
            >
              Passwort vergessen?
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
