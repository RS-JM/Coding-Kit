'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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

export interface DialogProps {
  open: boolean
  dates: Date[]
  onClose: () => void
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

// --- Arbeitszeit Dialog ---

export function WorkTimeDialog({ open, dates, onClose }: DialogProps) {
  const [stunden, setStunden] = useState('8')
  const [arbeitsort, setArbeitsort] = useState('office')
  const [kommentar, setKommentar] = useState('')

  function handleSubmit() {
    const h = parseFloat(stunden)
    if (isNaN(h) || h < 0 || h > 24) {
      toast.error('Bitte gültige Stunden eingeben (0–24)')
      return
    }

    const ortLabels: Record<string, string> = {
      office: 'Office',
      homeoffice: 'Homeoffice',
      remote: 'Remote',
      kunde: 'Kunde',
    }

    toast.success(
      `${h}h ${ortLabels[arbeitsort]} für ${dates.length} Tag${dates.length > 1 ? 'e' : ''} eingetragen`,
      { description: describeDates(dates) },
    )

    setStunden('8')
    setArbeitsort('office')
    setKommentar('')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Arbeitszeit erfassen</DialogTitle>
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
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Abbrechen
          </Button>
          <Button onClick={handleSubmit}>Speichern</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// --- Krankmeldung Dialog ---

export function SickLeaveDialog({ open, dates, onClose }: DialogProps) {
  const [ganztags, setGanztags] = useState(true)
  const [von, setVon] = useState('08:00')
  const [bis, setBis] = useState('17:00')
  const [grund, setGrund] = useState('')

  function handleSubmit() {
    if (!ganztags && von >= bis) {
      toast.error('Die Endzeit muss nach der Startzeit liegen')
      return
    }

    const zeitInfo = ganztags ? 'Ganztags' : `${von} – ${bis}`
    toast.success(
      `Krankmeldung: ${zeitInfo} (${dates.length} Tag${dates.length > 1 ? 'e' : ''})`,
      { description: describeDates(dates) },
    )

    setGanztags(true)
    setVon('08:00')
    setBis('17:00')
    setGrund('')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Krankmeldung eintragen</DialogTitle>
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
              Ganztags
            </Label>
          </div>
          {!ganztags && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="von-krank">Von</Label>
                <Input
                  id="von-krank"
                  type="time"
                  value={von}
                  onChange={(e) => setVon(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bis-krank">Bis</Label>
                <Input
                  id="bis-krank"
                  type="time"
                  value={bis}
                  onChange={(e) => setBis(e.target.value)}
                />
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
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Abbrechen
          </Button>
          <Button onClick={handleSubmit}>Speichern</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// --- Urlaub Dialog ---

export function VacationDialog({ open, dates, onClose }: DialogProps) {
  const [ganztags, setGanztags] = useState(true)
  const [von, setVon] = useState('08:00')
  const [bis, setBis] = useState('17:00')
  const [kommentar, setKommentar] = useState('')

  function handleSubmit() {
    if (!ganztags && von >= bis) {
      toast.error('Die Endzeit muss nach der Startzeit liegen')
      return
    }

    const zeitInfo = ganztags ? 'Ganztags' : `${von} – ${bis}`
    toast.success(
      `Urlaubsantrag: ${zeitInfo} (${dates.length} Tag${dates.length > 1 ? 'e' : ''})`,
      { description: describeDates(dates) },
    )

    setGanztags(true)
    setVon('08:00')
    setBis('17:00')
    setKommentar('')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Urlaub beantragen</DialogTitle>
          <DialogDescription>{describeDates(dates)}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="flex items-center gap-3">
            <Checkbox
              id="ganztags-urlaub"
              checked={ganztags}
              onCheckedChange={(c) => setGanztags(c === true)}
            />
            <Label htmlFor="ganztags-urlaub" className="cursor-pointer">
              Ganztags
            </Label>
          </div>
          {!ganztags && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="von-urlaub">Von</Label>
                <Input
                  id="von-urlaub"
                  type="time"
                  value={von}
                  onChange={(e) => setVon(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bis-urlaub">Bis</Label>
                <Input
                  id="bis-urlaub"
                  type="time"
                  value={bis}
                  onChange={(e) => setBis(e.target.value)}
                />
              </div>
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
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Abbrechen
          </Button>
          <Button onClick={handleSubmit}>Beantragen</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
