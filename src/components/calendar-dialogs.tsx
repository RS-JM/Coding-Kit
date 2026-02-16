'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Loader2, Trash2 } from 'lucide-react'

// --- Shared Types ---

export interface TimeEntry {
  id: string
  user_id: string
  datum: string
  stunden: number
  typ: 'arbeit' | 'krank' | 'urlaub'
  arbeitsort: string | null
  kommentar: string
  created_at: string
  updated_at: string
}

export interface DialogProps {
  open: boolean
  dates: Date[]
  onClose: () => void
}

export interface EntryDialogProps extends DialogProps {
  entries: Map<string, TimeEntry[]>
  onSave: () => void
}

// --- Date Helpers ---

function formatDateISO(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatDateLong(date: Date): string {
  return date.toLocaleDateString('de-DE', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function formatDateShort(date: Date): string {
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function describeDates(dates: Date[]): string {
  if (dates.length === 0) return ''
  if (dates.length === 1) return formatDateLong(dates[0])
  const first = formatDateShort(dates[0])
  const last = formatDateShort(dates[dates.length - 1])
  return `${first} – ${last} (${dates.length} Tage)`
}

function findEntry(entries: Map<string, TimeEntry[]>, date: Date, typ: string): TimeEntry | null {
  const dayEntries = entries.get(formatDateISO(date))
  if (!dayEntries) return null
  return dayEntries.find((e) => e.typ === typ) ?? null
}

function timeToHours(von: string, bis: string): number {
  const [vh, vm] = von.split(':').map(Number)
  const [bh, bm] = bis.split(':').map(Number)
  return (bh * 60 + bm - (vh * 60 + vm)) / 60
}

// --- Arbeitszeit Dialog ---

export function WorkTimeDialog({ open, dates, entries, onClose, onSave }: EntryDialogProps) {
  const [stunden, setStunden] = useState('8')
  const [arbeitsort, setArbeitsort] = useState('office')
  const [kommentar, setKommentar] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const existingEntry = dates.length === 1 ? findEntry(entries, dates[0], 'arbeit') : null
  const isEditMode = existingEntry !== null

  useEffect(() => {
    if (!open) return
    if (existingEntry) {
      setStunden(String(existingEntry.stunden))
      setArbeitsort(existingEntry.arbeitsort || 'office')
      setKommentar(existingEntry.kommentar || '')
    } else {
      setStunden('8')
      setArbeitsort('office')
      setKommentar('')
    }
  }, [open, existingEntry])

  async function handleSubmit() {
    const h = parseFloat(stunden)
    if (isNaN(h) || h < 0 || h > 24) {
      toast.error('Bitte gültige Stunden eingeben (0–24)')
      return
    }

    setSaving(true)

    try {
      if (isEditMode && existingEntry) {
        const res = await fetch(`/api/time-entries/${existingEntry.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stunden: h, arbeitsort, kommentar }),
        })
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || 'Fehler beim Aktualisieren')
        }
        toast.success('Arbeitszeit aktualisiert')
      } else {
        const errors: string[] = []
        for (const date of dates) {
          const res = await fetch('/api/time-entries', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              datum: formatDateISO(date),
              stunden: h,
              typ: 'arbeit',
              arbeitsort,
              kommentar,
            }),
          })
          if (!res.ok) {
            const err = await res.json()
            errors.push(`${formatDateShort(date)}: ${err.error}`)
          }
        }
        if (errors.length > 0) {
          toast.error(`${errors.length} Fehler beim Speichern`, {
            description: errors.join('\n'),
          })
        } else {
          toast.success(
            `Arbeitszeit für ${dates.length} Tag${dates.length > 1 ? 'e' : ''} gespeichert`,
          )
        }
      }

      onSave()
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Fehler beim Speichern')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!existingEntry) return
    setDeleting(true)

    try {
      const res = await fetch(`/api/time-entries/${existingEntry.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Fehler beim Löschen')

      toast.success('Eintrag gelöscht')
      onSave()
      onClose()
    } catch {
      toast.error('Fehler beim Löschen')
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? 'Arbeitszeit bearbeiten' : 'Arbeitszeit erfassen'}
            </DialogTitle>
            <DialogDescription>{describeDates(dates)}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="stunden">Stunden pro Tag</Label>
              <Input
                id="stunden"
                type="number"
                min="0"
                max="24"
                step="0.5"
                value={stunden}
                onChange={(e) => setStunden(e.target.value)}
                placeholder="z.B. 8"
              />
            </div>
            <div className="space-y-2">
              <Label>Arbeitsort</Label>
              <Select value={arbeitsort} onValueChange={setArbeitsort}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="office">Office</SelectItem>
                  <SelectItem value="homeoffice">Homeoffice</SelectItem>
                  <SelectItem value="remote">Remote</SelectItem>
                  <SelectItem value="kunde">Kunde</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="kommentar-arbeit">Kommentar (optional)</Label>
              <Textarea
                id="kommentar-arbeit"
                value={kommentar}
                onChange={(e) => setKommentar(e.target.value)}
                placeholder="Optionale Notizen..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter className="flex-row justify-between sm:justify-between">
            {isEditMode && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={saving || deleting}
              >
                <Trash2 className="mr-1.5 h-4 w-4" />
                Löschen
              </Button>
            )}
            <div className={`flex gap-2 ${!isEditMode ? 'ml-auto' : ''}`}>
              <Button variant="outline" onClick={onClose} disabled={saving}>
                Abbrechen
              </Button>
              <Button onClick={handleSubmit} disabled={saving}>
                {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                Speichern
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eintrag löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchtest du die Arbeitszeit für {describeDates(dates)} wirklich löschen?
              Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// --- Krankmeldung Dialog (mit API) ---

export function SickLeaveDialog({ open, dates, entries, onClose, onSave }: EntryDialogProps) {
  const [ganztags, setGanztags] = useState(true)
  const [von, setVon] = useState('08:00')
  const [bis, setBis] = useState('17:00')
  const [grund, setGrund] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const existingEntry = dates.length === 1 ? findEntry(entries, dates[0], 'krank') : null
  const isEditMode = existingEntry !== null

  useEffect(() => {
    if (!open) return
    if (existingEntry) {
      const h = Number(existingEntry.stunden)
      if (h === 8) {
        setGanztags(true)
      } else {
        setGanztags(false)
        setVon('08:00')
        const endH = 8 + h
        setBis(`${String(Math.floor(endH)).padStart(2, '0')}:${String((endH % 1) * 60).padStart(2, '0')}`)
      }
      setGrund(existingEntry.kommentar || '')
    } else {
      setGanztags(true)
      setVon('08:00')
      setBis('17:00')
      setGrund('')
    }
  }, [open, existingEntry])

  async function handleSubmit() {
    if (!ganztags && von >= bis) {
      toast.error('Die Endzeit muss nach der Startzeit liegen')
      return
    }

    const h = ganztags ? 8 : timeToHours(von, bis)
    setSaving(true)

    try {
      if (isEditMode && existingEntry) {
        const res = await fetch(`/api/time-entries/${existingEntry.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stunden: h, kommentar: grund }),
        })
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || 'Fehler beim Aktualisieren')
        }
        toast.success('Krankmeldung aktualisiert')
      } else {
        const errors: string[] = []
        for (const date of dates) {
          const res = await fetch('/api/time-entries', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              datum: formatDateISO(date),
              stunden: h,
              typ: 'krank',
              kommentar: grund,
            }),
          })
          if (!res.ok) {
            const err = await res.json()
            errors.push(`${formatDateShort(date)}: ${err.error}`)
          }
        }
        if (errors.length > 0) {
          toast.error(`${errors.length} Fehler beim Speichern`, {
            description: errors.join('\n'),
          })
        } else {
          toast.success(
            `Krankmeldung für ${dates.length} Tag${dates.length > 1 ? 'e' : ''} gespeichert`,
          )
        }
      }

      onSave()
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Fehler beim Speichern')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!existingEntry) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/time-entries/${existingEntry.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Fehler beim Löschen')
      toast.success('Krankmeldung gelöscht')
      onSave()
      onClose()
    } catch {
      toast.error('Fehler beim Löschen')
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Krankmeldung bearbeiten' : 'Krankmeldung eintragen'}</DialogTitle>
            <DialogDescription>{describeDates(dates)}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-3">
              <Checkbox
                id="ganztags-krank"
                checked={ganztags}
                onCheckedChange={(c) => setGanztags(c === true)}
              />
              <Label htmlFor="ganztags-krank" className="cursor-pointer">
                Ganztags (8h)
              </Label>
            </div>
            {!ganztags && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="von-krank">Von</Label>
                  <Input id="von-krank" type="time" value={von} onChange={(e) => setVon(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bis-krank">Bis</Label>
                  <Input id="bis-krank" type="time" value={bis} onChange={(e) => setBis(e.target.value)} />
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="grund-krank">Grund (optional)</Label>
              <Textarea
                id="grund-krank"
                value={grund}
                onChange={(e) => setGrund(e.target.value)}
                placeholder="Optionale Angabe..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter className="flex-row justify-between sm:justify-between">
            {isEditMode && (
              <Button variant="destructive" size="sm" onClick={() => setShowDeleteConfirm(true)} disabled={saving || deleting}>
                <Trash2 className="mr-1.5 h-4 w-4" />
                Löschen
              </Button>
            )}
            <div className={`flex gap-2 ${!isEditMode ? 'ml-auto' : ''}`}>
              <Button variant="outline" onClick={onClose} disabled={saving}>Abbrechen</Button>
              <Button onClick={handleSubmit} disabled={saving}>
                {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                Speichern
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Krankmeldung löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchtest du die Krankmeldung für {describeDates(dates)} wirklich löschen?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// --- Shared VacationRequest type ---

export interface VacationRequest {
  id: string
  user_id: string
  start_datum: string
  end_datum: string
  arbeitstage: number
  kommentar: string
  status: 'beantragt' | 'genehmigt' | 'abgelehnt'
  bearbeitet_von: string | null
  bearbeitet_am: string | null
  created_at: string
  updated_at: string
}

export interface VacationDialogProps {
  open: boolean
  dates: Date[]
  vacationRequests: VacationRequest[]
  urlaubstageGesamt: number
  onClose: () => void
  onSave: () => void
}

// --- Business days helper ---

function countBusinessDays(start: Date, end: Date): number {
  let count = 0
  const current = new Date(start)
  current.setHours(0, 0, 0, 0)
  const endNorm = new Date(end)
  endNorm.setHours(0, 0, 0, 0)
  while (current <= endNorm) {
    const dow = current.getDay()
    if (dow !== 0 && dow !== 6) count++
    current.setDate(current.getDate() + 1)
  }
  return count
}

// --- Urlaub Dialog (vacation_requests API) ---

export function VacationDialog({ open, dates, vacationRequests, urlaubstageGesamt, onClose, onSave }: VacationDialogProps) {
  const [startDatum, setStartDatum] = useState('')
  const [endDatum, setEndDatum] = useState('')
  const [kommentar, setKommentar] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Find existing request that covers the selected date
  const existingRequest = dates.length === 1
    ? vacationRequests.find((r) => {
        const d = formatDateISO(dates[0])
        return d >= r.start_datum && d <= r.end_datum && r.status !== 'abgelehnt'
      }) ?? null
    : null
  const isEditMode = existingRequest !== null
  const canCancel = existingRequest?.status === 'beantragt'

  // Calculate used vacation days this year
  const currentYear = new Date().getFullYear()
  const usedDays = vacationRequests
    .filter((r) => r.status === 'genehmigt' && r.start_datum.startsWith(String(currentYear)))
    .reduce((sum, r) => sum + r.arbeitstage, 0)
  const pendingDays = vacationRequests
    .filter((r) => r.status === 'beantragt' && r.start_datum.startsWith(String(currentYear)))
    .reduce((sum, r) => sum + r.arbeitstage, 0)

  // Calculate business days for current selection
  const arbeitstage = startDatum && endDatum && endDatum >= startDatum
    ? countBusinessDays(new Date(startDatum + 'T00:00:00'), new Date(endDatum + 'T00:00:00'))
    : 0
  const remaining = urlaubstageGesamt - usedDays - pendingDays
  const wouldExceed = arbeitstage > remaining

  useEffect(() => {
    if (!open) return
    if (existingRequest) {
      setStartDatum(existingRequest.start_datum)
      setEndDatum(existingRequest.end_datum)
      setKommentar(existingRequest.kommentar || '')
    } else {
      const sorted = [...dates].sort((a, b) => a.getTime() - b.getTime())
      setStartDatum(sorted.length > 0 ? formatDateISO(sorted[0]) : '')
      setEndDatum(sorted.length > 0 ? formatDateISO(sorted[sorted.length - 1]) : '')
      setKommentar('')
    }
  }, [open, existingRequest, dates])

  async function handleSubmit() {
    if (!startDatum || !endDatum) {
      toast.error('Bitte Start- und Enddatum angeben')
      return
    }
    if (endDatum < startDatum) {
      toast.error('Enddatum muss nach dem Startdatum liegen')
      return
    }
    if (arbeitstage === 0) {
      toast.error('Der gewählte Zeitraum enthält keine Arbeitstage')
      return
    }

    setSaving(true)

    try {
      const res = await fetch('/api/vacation-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start_datum: startDatum,
          end_datum: endDatum,
          arbeitstage,
          kommentar,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Fehler beim Beantragen')
      }
      toast.success('Urlaubsantrag eingereicht')
      onSave()
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Fehler beim Beantragen')
    } finally {
      setSaving(false)
    }
  }

  async function handleCancel() {
    if (!existingRequest) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/vacation-requests/${existingRequest.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Fehler beim Stornieren')
      toast.success('Antrag storniert')
      onSave()
      onClose()
    } catch {
      toast.error('Fehler beim Stornieren')
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const STATUS_LABELS: Record<string, string> = {
    beantragt: 'Beantragt',
    genehmigt: 'Genehmigt',
    abgelehnt: 'Abgelehnt',
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? 'Urlaubsantrag' : 'Urlaub beantragen'}
            </DialogTitle>
            <DialogDescription>
              {isEditMode
                ? `Status: ${STATUS_LABELS[existingRequest.status]} — ${existingRequest.arbeitstage} Arbeitstag${existingRequest.arbeitstage !== 1 ? 'e' : ''}`
                : `${remaining} Urlaubstag${remaining !== 1 ? 'e' : ''} verbleibend`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-urlaub">Startdatum</Label>
                <Input
                  id="start-urlaub"
                  type="date"
                  value={startDatum}
                  onChange={(e) => setStartDatum(e.target.value)}
                  disabled={isEditMode}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-urlaub">Enddatum</Label>
                <Input
                  id="end-urlaub"
                  type="date"
                  value={endDatum}
                  onChange={(e) => setEndDatum(e.target.value)}
                  min={startDatum}
                  disabled={isEditMode}
                />
              </div>
            </div>

            {!isEditMode && arbeitstage > 0 && (
              <div className={`rounded-md px-3 py-2 text-sm ${wouldExceed ? 'bg-destructive/10 text-destructive' : 'bg-muted'}`}>
                {arbeitstage} Arbeitstag{arbeitstage !== 1 ? 'e' : ''} Urlaub
                {wouldExceed && ' — Achtung: Nicht genug Resturlaub!'}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="kommentar-urlaub">Kommentar (optional)</Label>
              <Textarea
                id="kommentar-urlaub"
                value={kommentar}
                onChange={(e) => setKommentar(e.target.value)}
                placeholder="Optionale Notizen..."
                rows={2}
                disabled={isEditMode}
              />
            </div>
          </div>
          <DialogFooter className="flex-row justify-between sm:justify-between">
            {isEditMode && canCancel && (
              <Button variant="destructive" size="sm" onClick={() => setShowDeleteConfirm(true)} disabled={saving || deleting}>
                <Trash2 className="mr-1.5 h-4 w-4" />
                Stornieren
              </Button>
            )}
            <div className={`flex gap-2 ${!(isEditMode && canCancel) ? 'ml-auto' : ''}`}>
              <Button variant="outline" onClick={onClose} disabled={saving}>
                {isEditMode ? 'Schließen' : 'Abbrechen'}
              </Button>
              {!isEditMode && (
                <Button onClick={handleSubmit} disabled={saving || arbeitstage === 0}>
                  {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                  Beantragen
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Urlaubsantrag stornieren?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchtest du den Urlaubsantrag ({existingRequest?.arbeitstage} Arbeitstage) wirklich stornieren?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel} disabled={deleting}>
              {deleting && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              Stornieren
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
