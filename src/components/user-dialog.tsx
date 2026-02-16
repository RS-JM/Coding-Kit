'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export interface User {
  id: string
  email: string
  vorname: string
  nachname: string
  job_titel: string
  rolle: 'mitarbeiter' | 'manager' | 'admin'
  urlaubstage_gesamt: number
  ist_aktiv: boolean
}

export interface UserDialogProps {
  open: boolean
  existingUser?: User
  onClose: () => void
  onSave: () => void
}

export function UserDialog({ open, existingUser, onClose, onSave }: UserDialogProps) {
  const [email, setEmail] = useState('')
  const [vorname, setVorname] = useState('')
  const [nachname, setNachname] = useState('')
  const [jobTitel, setJobTitel] = useState('')
  const [rolle, setRolle] = useState<'mitarbeiter' | 'manager' | 'admin'>('mitarbeiter')
  const [urlaubstage, setUrlaubstage] = useState(30)
  const [saving, setSaving] = useState(false)
  const [showServiceKeyInfo, setShowServiceKeyInfo] = useState(false)
  const [serviceKeyMessage, setServiceKeyMessage] = useState('')

  const isEditMode = !!existingUser

  useEffect(() => {
    if (!open) return

    if (existingUser) {
      setEmail(existingUser.email)
      setVorname(existingUser.vorname)
      setNachname(existingUser.nachname)
      setJobTitel(existingUser.job_titel || '')
      setRolle(existingUser.rolle)
      setUrlaubstage(existingUser.urlaubstage_gesamt)
    } else {
      setEmail('')
      setVorname('')
      setNachname('')
      setJobTitel('')
      setRolle('mitarbeiter')
      setUrlaubstage(30)
    }
  }, [open, existingUser])

  async function handleSubmit() {
    // Validation
    if (!email) {
      toast.error('E-Mail ist erforderlich')
      return
    }

    if (!vorname || !nachname) {
      toast.error('Vorname und Nachname sind erforderlich')
      return
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toast.error('Ungültige E-Mail-Adresse')
      return
    }

    if (urlaubstage < 0 || urlaubstage > 365) {
      toast.error('Urlaubstage müssen zwischen 0 und 365 liegen')
      return
    }

    setSaving(true)

    try {
      const endpoint = isEditMode ? `/api/profiles/${existingUser.id}` : '/api/users/invite'
      const method = isEditMode ? 'PATCH' : 'POST'

      const body = isEditMode
        ? {
            vorname,
            nachname,
            job_titel: jobTitel,
            rolle,
            urlaubstage_gesamt: urlaubstage,
          }
        : {
            email,
            vorname,
            nachname,
            job_titel: jobTitel,
            rolle,
            urlaubstage_gesamt: urlaubstage,
          }

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) {
        // Handle service key missing (503)
        if (res.status === 503) {
          setServiceKeyMessage(data.details || 'Service-Schlüssel nicht konfiguriert')
          setShowServiceKeyInfo(true)
          setSaving(false)
          return
        }

        // Handle other errors
        if (res.status === 409) {
          toast.error('Ein Benutzer mit dieser E-Mail existiert bereits')
        } else if (res.status === 400 && data.details) {
          toast.error('Ungültige Daten')
        } else {
          toast.error(data.error || 'Fehler beim Speichern')
        }
        setSaving(false)
        return
      }

      toast.success(
        isEditMode
          ? 'Benutzer wurde erfolgreich aktualisiert'
          : 'Benutzer wurde erfolgreich eingeladen. Eine E-Mail wurde versendet.'
      )
      onSave()
      onClose()
    } catch (error) {
      console.error('Error:', error)
      toast.error('Ein unerwarteter Fehler ist aufgetreten')
    } finally {
      setSaving(false)
    }
  }

  function handleCloseServiceKeyInfo() {
    setShowServiceKeyInfo(false)
    onClose()
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? 'Benutzer bearbeiten' : 'Neuen Benutzer einladen'}
            </DialogTitle>
            <DialogDescription>
              {isEditMode
                ? 'Bearbeite die Benutzerdaten. Die E-Mail-Adresse kann nicht geändert werden.'
                : 'Erstelle einen neuen Benutzer. Eine Einladungs-E-Mail wird an die angegebene Adresse versendet.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Email */}
            <div className="grid gap-2">
              <Label htmlFor="email">
                E-Mail <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isEditMode}
                placeholder="benutzer@beispiel.de"
              />
              {isEditMode && (
                <p className="text-xs text-muted-foreground">
                  Die E-Mail-Adresse kann nicht geändert werden
                </p>
              )}
            </div>

            {/* Vorname */}
            <div className="grid gap-2">
              <Label htmlFor="vorname">
                Vorname <span className="text-destructive">*</span>
              </Label>
              <Input
                id="vorname"
                type="text"
                value={vorname}
                onChange={(e) => setVorname(e.target.value)}
                placeholder="Max"
              />
            </div>

            {/* Nachname */}
            <div className="grid gap-2">
              <Label htmlFor="nachname">
                Nachname <span className="text-destructive">*</span>
              </Label>
              <Input
                id="nachname"
                type="text"
                value={nachname}
                onChange={(e) => setNachname(e.target.value)}
                placeholder="Mustermann"
              />
            </div>

            {/* Job-Titel */}
            <div className="grid gap-2">
              <Label htmlFor="job_titel">Job-Titel</Label>
              <Input
                id="job_titel"
                type="text"
                value={jobTitel}
                onChange={(e) => setJobTitel(e.target.value)}
                placeholder="z.B. Software-Entwickler"
              />
            </div>

            {/* Rolle */}
            <div className="grid gap-2">
              <Label htmlFor="rolle">
                Rolle <span className="text-destructive">*</span>
              </Label>
              <Select value={rolle} onValueChange={(v) => setRolle(v as typeof rolle)}>
                <SelectTrigger id="rolle">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mitarbeiter">Mitarbeiter</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Urlaubstage */}
            <div className="grid gap-2">
              <Label htmlFor="urlaubstage">Urlaubstage gesamt</Label>
              <Input
                id="urlaubstage"
                type="number"
                min="0"
                max="365"
                value={urlaubstage}
                onChange={(e) => setUrlaubstage(Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                Standard: 30 Tage (Vollzeit). Anpassbar für Teilzeit oder Praktikanten.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose} disabled={saving}>
              Abbrechen
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditMode ? 'Speichern' : 'Einladen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Service Key Info Dialog */}
      <AlertDialog open={showServiceKeyInfo} onOpenChange={setShowServiceKeyInfo}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Service-Schlüssel erforderlich</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>{serviceKeyMessage}</p>
              <p className="font-medium">So fügst du den Service Key hinzu:</p>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Öffne das Supabase Dashboard</li>
                <li>Navigiere zu: Project Settings → API</li>
                <li>Kopiere den "service_role" Key (Secret Key)</li>
                <li>Füge folgende Zeile zur .env.local Datei hinzu:</li>
              </ol>
              <code className="block bg-muted p-2 rounded text-xs mt-2">
                SUPABASE_SERVICE_ROLE_KEY=dein-service-key-hier
              </code>
              <p className="text-sm mt-2">Starte dann den Dev-Server neu.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleCloseServiceKeyInfo}>
              Verstanden
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
