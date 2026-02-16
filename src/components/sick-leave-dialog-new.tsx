'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

export interface SickLeave {
  id: string
  user_id: string
  start_datum: string
  end_datum: string
  kommentar: string
  created_at: string
  updated_at: string
}

export interface SickLeaveDialogProps {
  open: boolean
  selectedDate?: Date
  existingSickLeave?: SickLeave
  onClose: () => void
  onSave: () => void
}

function formatDateISO(date: Date): string {
  return date.toISOString().split('T')[0]
}

function formatDateDisplay(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function SickLeaveDialogNew({ open, selectedDate, existingSickLeave, onClose, onSave }: SickLeaveDialogProps) {
  const [startDatum, setStartDatum] = useState('')
  const [endDatum, setEndDatum] = useState('')
  const [kommentar, setKommentar] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const isEditMode = !!existingSickLeave

  useEffect(() => {
    if (!open) return

    if (existingSickLeave) {
      setStartDatum(existingSickLeave.start_datum)
      setEndDatum(existingSickLeave.end_datum)
      setKommentar(existingSickLeave.kommentar || '')
    } else if (selectedDate) {
      const iso = formatDateISO(selectedDate)
      setStartDatum(iso)
      setEndDatum(iso)
      setKommentar('')
    } else {
      const today = formatDateISO(new Date())
      setStartDatum(today)
      setEndDatum(today)
      setKommentar('')
    }
  }, [open, selectedDate, existingSickLeave])

  async function handleSubmit() {
    // Validation
    if (!startDatum || !endDatum) {
      toast.error('Bitte Start- und Enddatum angeben')
      return
    }

    if (new Date(startDatum) > new Date(endDatum)) {
      toast.error('Enddatum muss nach Startdatum liegen')
      return
    }

    if (new Date(startDatum) > new Date()) {
      toast.error('Krankmeldung kann nicht in der Zukunft liegen')
      return
    }

    setSaving(true)

    try {
      const res = await fetch('/api/sick-leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start_datum: startDatum,
          end_datum: endDatum,
          kommentar: kommentar.trim(),
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Fehler beim Speichern')
      }

      toast.success('Krankmeldung gespeichert')
      onSave()
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Fehler beim Speichern')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!existingSickLeave) return
    setDeleting(true)

    try {
      const res = await fetch(`/api/sick-leaves/${existingSickLeave.id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        throw new Error('Fehler beim Löschen')
      }

      toast.success('Krankmeldung gelöscht')
      onSave()
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Fehler beim Löschen')
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const dateRange = startDatum === endDatum
    ? formatDateDisplay(startDatum)
    : `${formatDateDisplay(startDatum)} - ${formatDateDisplay(endDatum)}`

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? 'Krankmeldung bearbeiten' : 'Krankmeldung eintragen'}
            </DialogTitle>
            <DialogDescription>
              {isEditMode ? dateRange : 'Trage eine Krankmeldung ein'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-datum">Von</Label>
                <Input
                  id="start-datum"
                  type="date"
                  value={startDatum}
                  onChange={(e) => setStartDatum(e.target.value)}
                  max={formatDateISO(new Date())}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-datum">Bis</Label>
                <Input
                  id="end-datum"
                  type="date"
                  value={endDatum}
                  onChange={(e) => setEndDatum(e.target.value)}
                  max={formatDateISO(new Date())}
                  min={startDatum}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="kommentar">Kommentar (optional)</Label>
              <Textarea
                id="kommentar"
                value={kommentar}
                onChange={(e) => setKommentar(e.target.value)}
                placeholder="Optionale Angabe..."
                rows={3}
              />
            </div>

            <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
              ℹ️ Krankmeldungen können nur für heute oder vergangene Tage eingetragen werden.
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
            <AlertDialogTitle>Krankmeldung löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchtest du die Krankmeldung für {dateRange} wirklich löschen?
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
