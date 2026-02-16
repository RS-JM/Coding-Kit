'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Progress } from '@/components/ui/progress'
import { Calendar, ChevronLeft, ChevronRight, Clock, Thermometer, Palmtree, X } from 'lucide-react'
import { WorkTimeDialog, SickLeaveDialog, VacationDialog } from '@/components/calendar-dialogs'
import type { TimeEntry, VacationRequest } from '@/components/calendar-dialogs'
import { SickLeaveDialogNew } from '@/components/sick-leave-dialog-new'
import type { SickLeave } from '@/components/sick-leave-dialog-new'

const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
const MONTHS = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
]

const ORT_LABELS: Record<string, string> = {
  office: 'Office',
  homeoffice: 'HO',
  remote: 'Remote',
  kunde: 'Kunde',
}

const TYP_STYLES: Record<string, { badge: string; dot: string }> = {
  arbeit: {
    badge: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
    dot: 'bg-green-500',
  },
  krank: {
    badge: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
    dot: 'bg-red-500',
  },
  urlaub_beantragt: {
    badge: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
    dot: 'bg-yellow-500',
  },
  urlaub_genehmigt: {
    badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
    dot: 'bg-blue-500',
  },
}

const TYP_LABELS: Record<string, string> = {
  arbeit: '',
  krank: 'Krank',
  urlaub_beantragt: 'Urlaub (beantragt)',
  urlaub_genehmigt: 'Urlaub',
}

// Helper: find vacation request covering a specific date
function getVacationForDate(date: string, requests: VacationRequest[]): VacationRequest | null {
  return requests.find((r) =>
    date >= r.start_datum && date <= r.end_datum && r.status !== 'abgelehnt'
  ) ?? null
}

function getSickLeaveForDate(date: string, sickLeaves: SickLeave[]): SickLeave | null {
  if (!sickLeaves || sickLeaves.length === 0) return null
  return sickLeaves.find((s) =>
    date >= s.start_datum && date <= s.end_datum
  ) ?? null
}

// Helper: build display items for a day (entries + vacation + sick leave)
interface DayDisplayItem {
  id: string
  label: string
  styleKey: string
}

function getDayDisplayItems(
  date: string,
  entries: TimeEntry[],
  vacationRequests: VacationRequest[],
  sickLeaves: SickLeave[],
): DayDisplayItem[] {
  const items: DayDisplayItem[] = []

  // Sick leave from sick_leaves table (takes precedence)
  const sickLeave = getSickLeaveForDate(date, sickLeaves)
  if (sickLeave) {
    items.push({ id: `sl-${sickLeave.id}`, label: 'Krank', styleKey: 'krank' })
    return items // Sick leave takes precedence, don't show other entries
  }

  // Work/sick entries from time_entries (legacy)
  for (const entry of entries) {
    if (entry.typ === 'urlaub') continue // vacation now comes from vacation_requests
    const label = entry.typ === 'arbeit'
      ? `${Number(entry.stunden)}h ${ORT_LABELS[entry.arbeitsort || ''] || entry.arbeitsort || ''}`
      : `${Number(entry.stunden)}h ${TYP_LABELS[entry.typ] || ''}`
    items.push({ id: entry.id, label: label.trim(), styleKey: entry.typ })
  }

  // Vacation from vacation_requests
  const vacation = getVacationForDate(date, vacationRequests)
  if (vacation) {
    const styleKey = vacation.status === 'genehmigt' ? 'urlaub_genehmigt' : 'urlaub_beantragt'
    const label = TYP_LABELS[styleKey] || 'Urlaub'
    items.push({ id: `vr-${vacation.id}`, label, styleKey })
  }

  return items
}

type ViewMode = 'week' | 'month'
type DialogType = 'arbeitszeit' | 'krank' | 'urlaub' | null

interface CalendarDay {
  date: Date
  day: number
  isCurrentMonth: boolean
  isToday: boolean
  isWeekend: boolean
}

// --- Date helpers ---

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

function formatDateISO(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfWeek(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay()
  return day === 0 ? 6 : day - 1
}

function getMondayOfWeek(date: Date): Date {
  const d = new Date(date)
  const dayOfWeek = d.getDay()
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function getDateRange(start: Date, end: Date): Date[] {
  const [first, last] = start <= end ? [start, end] : [end, start]
  const dates: Date[] = []
  const current = new Date(first)
  current.setHours(0, 0, 0, 0)
  const lastNorm = new Date(last)
  lastNorm.setHours(0, 0, 0, 0)
  while (current <= lastNorm) {
    dates.push(new Date(current))
    current.setDate(current.getDate() + 1)
  }
  return dates
}

function getWeekDays(referenceDate: Date): CalendarDay[] {
  const monday = getMondayOfWeek(referenceDate)
  const todayStr = new Date().toDateString()

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return {
      date: d,
      day: d.getDate(),
      isCurrentMonth: true,
      isToday: d.toDateString() === todayStr,
      isWeekend: i >= 5,
    }
  })
}

function getMonthDays(year: number, month: number): CalendarDay[] {
  const todayStr = new Date().toDateString()
  const daysInMonth = getDaysInMonth(year, month)
  const firstDayOfWeek = getFirstDayOfWeek(year, month)
  const days: CalendarDay[] = []

  const prevMonth = month === 0 ? 11 : month - 1
  const prevYear = month === 0 ? year - 1 : year
  const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth)

  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i
    const d = new Date(prevYear, prevMonth, day)
    const colIndex = firstDayOfWeek - 1 - i
    days.push({ date: d, day, isCurrentMonth: false, isToday: d.toDateString() === todayStr, isWeekend: colIndex >= 5 })
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month, day)
    const colIndex = (firstDayOfWeek + day - 1) % 7
    days.push({ date: d, day, isCurrentMonth: true, isToday: d.toDateString() === todayStr, isWeekend: colIndex >= 5 })
  }

  const remaining = 42 - days.length
  const nextMonth = month === 11 ? 0 : month + 1
  const nextYear = month === 11 ? year + 1 : year

  for (let day = 1; day <= remaining; day++) {
    const d = new Date(nextYear, nextMonth, day)
    const colIndex = days.length % 7
    days.push({ date: d, day, isCurrentMonth: false, isToday: false, isWeekend: colIndex >= 5 })
  }

  return days
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString('de-DE', { day: 'numeric', month: 'long' })
}

function formatDateDE(date: Date): string {
  return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// --- Drag handler props ---

interface DragHandlers {
  onMouseDown: (date: Date) => void
  onMouseEnter: (date: Date) => void
  isSelected: (date: Date) => boolean
}

// --- Main Component ---

export function MonthCalendar() {
  const [viewMode, setViewMode] = useState<ViewMode>('week')
  const [currentDate, setCurrentDate] = useState(new Date())

  // Dialog state
  const [dialogType, setDialogType] = useState<DialogType>(null)
  const [dialogDates, setDialogDates] = useState<Date[]>([])

  // Drag selection state
  const [selectedDates, setSelectedDates] = useState<Date[]>([])
  const isDragging = useRef(false)
  const dragStartDate = useRef<Date | null>(null)
  const dragMoved = useRef(false)

  // Time entries from API (grouped by date)
  const [timeEntries, setTimeEntries] = useState<Map<string, TimeEntry[]>>(new Map())
  // Vacation requests from API
  const [vacationRequests, setVacationRequests] = useState<VacationRequest[]>([])
  // Sick leaves from API
  const [sickLeaves, setSickLeaves] = useState<SickLeave[]>([])
  // User profile for vacation quota
  const [urlaubstageGesamt, setUrlaubstageGesamt] = useState(30)

  // Compute visible date range for API query — always covers full month for summary
  const getVisibleRange = useCallback((): { von: string; bis: string } => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const monthStart = new Date(year, month, 1)
    const monthEnd = new Date(year, month + 1, 0)

    if (viewMode === 'week') {
      const monday = getMondayOfWeek(currentDate)
      const sunday = new Date(monday)
      sunday.setDate(monday.getDate() + 6)
      const von = monday < monthStart ? monday : monthStart
      const bis = sunday > monthEnd ? sunday : monthEnd
      return { von: formatDateISO(von), bis: formatDateISO(bis) }
    }

    const firstDayOfWeek = getFirstDayOfWeek(year, month)
    const startDate = new Date(year, month, 1 - firstDayOfWeek)
    const endDate = new Date(startDate)
    endDate.setDate(startDate.getDate() + 41)
    return { von: formatDateISO(startDate), bis: formatDateISO(endDate) }
  }, [viewMode, currentDate])

  const fetchEntries = useCallback(async () => {
    try {
      const { von, bis } = getVisibleRange()
      const res = await fetch(`/api/time-entries?von=${von}&bis=${bis}`)
      if (!res.ok) return
      const data: TimeEntry[] = await res.json()
      const map = new Map<string, TimeEntry[]>()
      for (const entry of data) {
        const existing = map.get(entry.datum) || []
        existing.push(entry)
        map.set(entry.datum, existing)
      }
      setTimeEntries(map)
    } catch {
      // Silently fail
    }
  }, [getVisibleRange])

  const fetchVacationRequests = useCallback(async () => {
    try {
      const { von, bis } = getVisibleRange()
      const res = await fetch(`/api/vacation-requests?von=${von}&bis=${bis}`)
      if (!res.ok) return
      const data: VacationRequest[] = await res.json()
      setVacationRequests(data)
    } catch {
      // Silently fail
    }
  }, [getVisibleRange])

  const fetchSickLeaves = useCallback(async () => {
    try {
      const { von, bis } = getVisibleRange()
      const res = await fetch(`/api/sick-leaves?von=${von}&bis=${bis}`)
      if (!res.ok) return
      const data: SickLeave[] = await res.json()
      setSickLeaves(data)
    } catch {
      // Silently fail
    }
  }, [getVisibleRange])

  const fetchAll = useCallback(async () => {
    await Promise.all([fetchEntries(), fetchVacationRequests(), fetchSickLeaves()])
  }, [fetchEntries, fetchVacationRequests, fetchSickLeaves])

  // Fetch profile once for urlaubstage_gesamt
  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch('/api/profile')
        if (!res.ok) return
        const profile = await res.json()
        if (profile?.urlaubstage_gesamt) setUrlaubstageGesamt(profile.urlaubstage_gesamt)
      } catch {
        // Use default
      }
    }
    loadProfile()
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  function handleMouseDown(date: Date) {
    isDragging.current = true
    dragStartDate.current = date
    dragMoved.current = false
    const alreadySelected = selectedDates.some((d) => dateKey(d) === dateKey(date))
    if (!alreadySelected) {
      setSelectedDates([date])
    }
  }

  function handleMouseEnter(date: Date) {
    if (!isDragging.current || !dragStartDate.current) return
    dragMoved.current = true
    setSelectedDates(getDateRange(dragStartDate.current, date))
  }

  const handleMouseUp = useCallback(() => {
    if (!isDragging.current) return
    isDragging.current = false
    dragStartDate.current = null
  }, [])

  useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp)
    return () => document.removeEventListener('mouseup', handleMouseUp)
  }, [handleMouseUp])

  function isSelected(date: Date): boolean {
    const key = dateKey(date)
    return selectedDates.some((d) => dateKey(d) === key)
  }

  function clearSelection() {
    setSelectedDates([])
  }

  function openDialogForSelection(type: DialogType) {
    if (selectedDates.length === 0) return
    setDialogDates([...selectedDates])
    setDialogType(type)
    setSelectedDates([])
  }

  function closeDialog() {
    setDialogType(null)
    setDialogDates([])
  }

  function handleDayAction(date: Date, action: string) {
    const isInSelection = selectedDates.some((d) => dateKey(d) === dateKey(date))
    if (isInSelection && selectedDates.length > 1) {
      setDialogDates([...selectedDates])
    } else {
      setDialogDates([date])
    }
    setDialogType(action as DialogType)
    setSelectedDates([])
  }

  const dragHandlers: DragHandlers = {
    onMouseDown: handleMouseDown,
    onMouseEnter: handleMouseEnter,
    isSelected,
  }

  // Navigation
  function goToPrevious() {
    setCurrentDate((prev) => {
      const d = new Date(prev)
      if (viewMode === 'week') d.setDate(d.getDate() - 7)
      else d.setMonth(d.getMonth() - 1)
      return d
    })
    clearSelection()
  }

  function goToNext() {
    setCurrentDate((prev) => {
      const d = new Date(prev)
      if (viewMode === 'week') d.setDate(d.getDate() + 7)
      else d.setMonth(d.getMonth() + 1)
      return d
    })
    clearSelection()
  }

  function goToToday() {
    setCurrentDate(new Date())
    clearSelection()
  }

  function getTitle(): string {
    if (viewMode === 'month') {
      return `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`
    }
    const weekDays = getWeekDays(currentDate)
    return `${formatShortDate(weekDays[0].date)} – ${formatShortDate(weekDays[6].date)} ${weekDays[6].date.getFullYear()}`
  }

  return (
    <Card className="xl:col-span-4">
      <CardHeader className="pb-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {getTitle()}
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="flex overflow-hidden rounded-md border">
              <Button
                variant={viewMode === 'week' ? 'default' : 'ghost'}
                size="sm"
                className="h-8 rounded-none"
                onClick={() => { setViewMode('week'); clearSelection() }}
              >
                Woche
              </Button>
              <Button
                variant={viewMode === 'month' ? 'default' : 'ghost'}
                size="sm"
                className="h-8 rounded-none"
                onClick={() => { setViewMode('month'); clearSelection() }}
              >
                Monat
              </Button>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={goToPrevious}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" className="h-8" onClick={goToToday}>
                Heute
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={goToNext}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Selection bar */}
        <SelectionBar
          dates={selectedDates}
          onAction={openDialogForSelection}
          onClear={clearSelection}
        />

        {viewMode === 'week' ? (
          <WeekView
            days={getWeekDays(currentDate)}
            drag={dragHandlers}
            onSingleAction={handleDayAction}
            entries={timeEntries}
            vacationRequests={vacationRequests}
            sickLeaves={sickLeaves}
          />
        ) : (
          <MonthView
            days={getMonthDays(currentDate.getFullYear(), currentDate.getMonth())}
            drag={dragHandlers}
            onSingleAction={handleDayAction}
            entries={timeEntries}
            vacationRequests={vacationRequests}
            sickLeaves={sickLeaves}
          />
        )}
        <MonthSummary currentDate={currentDate} entries={timeEntries} vacationRequests={vacationRequests} />
      </CardContent>

      {/* Entry Dialogs */}
      <WorkTimeDialog
        open={dialogType === 'arbeitszeit'}
        dates={dialogDates}
        entries={timeEntries}
        onClose={closeDialog}
        onSave={fetchAll}
      />
      <SickLeaveDialogNew
        open={dialogType === 'krank'}
        selectedDate={dialogDates[0]}
        existingSickLeave={
          dialogDates[0]
            ? sickLeaves.find((sl) => {
                const dateStr = formatDateISO(dialogDates[0])
                return dateStr >= sl.start_datum && dateStr <= sl.end_datum
              })
            : undefined
        }
        onClose={closeDialog}
        onSave={fetchAll}
      />
      <VacationDialog
        open={dialogType === 'urlaub'}
        dates={dialogDates}
        vacationRequests={vacationRequests}
        urlaubstageGesamt={urlaubstageGesamt}
        onClose={closeDialog}
        onSave={fetchAll}
      />
    </Card>
  )
}

// --- Selection Bar ---

function SelectionBar({
  dates,
  onAction,
  onClear,
}: {
  dates: Date[]
  onAction: (type: DialogType) => void
  onClear: () => void
}) {
  const hasSelection = dates.length > 0
  const label = hasSelection
    ? dates.length === 1
      ? formatDateDE(dates[0])
      : `${formatDateDE(dates[0])} – ${formatDateDE(dates[dates.length - 1])}`
    : null

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/50 px-4 py-2.5">
      <span className="text-sm font-medium">
        {hasSelection ? (
          <>
            {dates.length} {dates.length === 1 ? 'Tag' : 'Tage'} ausgewählt
            <span className="ml-2 text-muted-foreground">({label})</span>
          </>
        ) : (
          <span className="text-muted-foreground">Kein Tag ausgewählt</span>
        )}
      </span>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" className="h-8" disabled={!hasSelection} onClick={() => onAction('arbeitszeit')}>
          <Clock className="mr-1.5 h-3.5 w-3.5" />
          Arbeitszeit
        </Button>
        <Button size="sm" variant="outline" className="h-8" disabled={!hasSelection} onClick={() => onAction('krank')}>
          <Thermometer className="mr-1.5 h-3.5 w-3.5" />
          Krankmeldung
        </Button>
        <Button size="sm" variant="outline" className="h-8" disabled={!hasSelection} onClick={() => onAction('urlaub')}>
          <Palmtree className="mr-1.5 h-3.5 w-3.5" />
          Urlaub
        </Button>
        {hasSelection && (
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={onClear}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}

// --- Week View ---

function WeekView({
  days,
  drag,
  onSingleAction,
  entries,
  vacationRequests,
  sickLeaves,
}: {
  days: CalendarDay[]
  drag: DragHandlers
  onSingleAction: (date: Date, action: string) => void
  entries: Map<string, TimeEntry[]>
  vacationRequests: VacationRequest[]
  sickLeaves: SickLeave[]
}) {
  return (
    <div className="grid grid-cols-7 overflow-hidden rounded-lg border select-none">
      {days.map((d, i) => {
        const selected = drag.isSelected(d.date)
        const dateStr = formatDateISO(d.date)
        const dayEntries = entries.get(dateStr) || []
        const displayItems = getDayDisplayItems(dateStr, dayEntries, vacationRequests, sickLeaves)
        return (
          <div key={i} className={`flex flex-col ${i > 0 ? 'border-l' : ''}`}>
            {/* Day header */}
            <div
              className={`px-2 py-3 text-center ${
                d.isToday
                  ? 'bg-primary/15'
                  : d.isWeekend
                    ? 'bg-muted/80'
                    : 'bg-muted/50'
              }`}
            >
              <p className="text-sm font-bold uppercase tracking-wide">{WEEKDAYS[i]}</p>
              <p className={`mt-0.5 text-lg font-bold ${d.isToday ? 'text-primary' : ''}`}>
                {d.day}.{String(d.date.getMonth() + 1).padStart(2, '0')}.
              </p>
            </div>

            {/* Day body */}
            <DayCell
              date={d.date}
              selected={selected}
              isToday={d.isToday}
              isWeekend={d.isWeekend}
              tall
              drag={drag}
              onSingleAction={onSingleAction}
            >
              {displayItems.length > 0 && (
                <div className="flex flex-col items-center gap-1 text-xs">
                  {displayItems.map((item) => {
                    const style = TYP_STYLES[item.styleKey] || TYP_STYLES.arbeit
                    return (
                      <span key={item.id} className={`rounded px-2 py-0.5 font-semibold ${style.badge}`}>
                        {item.label}
                      </span>
                    )
                  })}
                </div>
              )}
            </DayCell>
          </div>
        )
      })}
    </div>
  )
}

// --- Month View ---

function MonthView({
  days,
  drag,
  onSingleAction,
  entries,
  vacationRequests,
  sickLeaves,
}: {
  days: CalendarDay[]
  drag: DragHandlers
  onSingleAction: (date: Date, action: string) => void
  entries: Map<string, TimeEntry[]>
  vacationRequests: VacationRequest[]
  sickLeaves: SickLeave[]
}) {
  return (
    <div className="overflow-hidden rounded-lg border select-none">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 bg-muted/60">
        {WEEKDAYS.map((wd, i) => (
          <div key={wd} className={`py-2.5 text-center text-sm font-bold ${i > 0 ? 'border-l' : ''}`}>
            {wd}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7">
        {days.map((d, i) => {
          const dateStr = formatDateISO(d.date)
          const dayEntries = d.isCurrentMonth ? (entries.get(dateStr) || []) : []
          const displayItems = d.isCurrentMonth ? getDayDisplayItems(dateStr, dayEntries, vacationRequests, sickLeaves) : []
          return (
            <DayCell
              key={i}
              date={d.date}
              selected={d.isCurrentMonth && drag.isSelected(d.date)}
              isToday={d.isToday}
              isWeekend={d.isWeekend && d.isCurrentMonth}
              isCurrentMonth={d.isCurrentMonth}
              tall={false}
              drag={drag}
              onSingleAction={onSingleAction}
              borderClasses={`${i % 7 > 0 ? 'border-l' : ''} ${i >= 7 ? 'border-t' : ''}`}
            >
              <div className="flex flex-col items-center">
                <span
                  className={
                    d.isToday
                      ? 'flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-xs'
                      : `text-sm ${!d.isCurrentMonth ? 'text-muted-foreground/40' : ''}`
                  }
                >
                  {d.day}
                </span>
                {displayItems.length > 0 && (
                  <div className="mt-0.5 flex gap-0.5">
                    {displayItems.map((item) => {
                      const style = TYP_STYLES[item.styleKey] || TYP_STYLES.arbeit
                      return (
                        <span key={item.id} className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                      )
                    })}
                  </div>
                )}
              </div>
            </DayCell>
          )
        })}
      </div>
    </div>
  )
}

// --- Month Summary ---

function getWeekdaysInMonth(year: number, month: number): number {
  const daysInMonth = getDaysInMonth(year, month)
  let count = 0
  for (let day = 1; day <= daysInMonth; day++) {
    const dow = new Date(year, month, day).getDay()
    if (dow !== 0 && dow !== 6) count++
  }
  return count
}

function MonthSummary({
  currentDate,
  entries,
  vacationRequests,
}: {
  currentDate: Date
  entries: Map<string, TimeEntry[]>
  vacationRequests: VacationRequest[]
}) {
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const weekdays = getWeekdaysInMonth(year, month)
  const expected = weekdays * 8
  const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`

  let arbeitStunden = 0
  let krankTage = 0

  for (const [datum, dayEntries] of entries) {
    if (!datum.startsWith(monthPrefix)) continue
    for (const entry of dayEntries) {
      const h = Number(entry.stunden)
      if (entry.typ === 'arbeit') arbeitStunden += h
      else if (entry.typ === 'krank') krankTage += h >= 8 ? 1 : 0.5
    }
  }

  // Count vacation days from vacation_requests that overlap this month
  let urlaubTageBeantragt = 0
  let urlaubTageGenehmigt = 0
  const daysInMonth = getDaysInMonth(year, month)
  const monthStart = `${monthPrefix}-01`
  const monthEnd = `${monthPrefix}-${String(daysInMonth).padStart(2, '0')}`

  for (const req of vacationRequests) {
    if (req.status === 'abgelehnt') continue
    // Check if request overlaps this month
    if (req.end_datum < monthStart || req.start_datum > monthEnd) continue

    // Count weekdays within this month that are covered by the request
    const overlapStart = req.start_datum > monthStart ? req.start_datum : monthStart
    const overlapEnd = req.end_datum < monthEnd ? req.end_datum : monthEnd
    const start = new Date(overlapStart + 'T00:00:00')
    const end = new Date(overlapEnd + 'T00:00:00')
    const current = new Date(start)
    while (current <= end) {
      const dow = current.getDay()
      if (dow !== 0 && dow !== 6) {
        if (req.status === 'genehmigt') urlaubTageGenehmigt++
        else urlaubTageBeantragt++
      }
      current.setDate(current.getDate() + 1)
    }
  }

  const urlaubTage = urlaubTageGenehmigt + urlaubTageBeantragt
  const pct = expected > 0 ? Math.round((arbeitStunden / expected) * 100) : 0

  return (
    <div className="mt-4 space-y-2 rounded-lg border bg-muted/30 px-4 py-3">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">
          {MONTHS[month]} {year}
        </span>
        <span className="text-muted-foreground">
          {arbeitStunden}h / {expected}h ({pct}%)
        </span>
      </div>
      <Progress value={pct} className="h-2" />
      <div className="flex flex-wrap justify-between gap-x-4 text-xs text-muted-foreground">
        <span>Geleistet: {arbeitStunden}h</span>
        <span>Erwartet: {expected}h ({weekdays} Werktage x 8h)</span>
      </div>
      {(krankTage > 0 || urlaubTage > 0) && (
        <div className="flex gap-4 text-xs">
          {krankTage > 0 && (
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              {krankTage} Krankheitstag{krankTage !== 1 ? 'e' : ''}
            </span>
          )}
          {urlaubTageGenehmigt > 0 && (
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              {urlaubTageGenehmigt} Urlaubstag{urlaubTageGenehmigt !== 1 ? 'e' : ''}
            </span>
          )}
          {urlaubTageBeantragt > 0 && (
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-yellow-500" />
              {urlaubTageBeantragt} Tag{urlaubTageBeantragt !== 1 ? 'e' : ''} beantragt
            </span>
          )}
        </div>
      )}
    </div>
  )
}

// --- Day Cell (supports both click and drag) ---

function DayCell({
  date,
  selected,
  isToday,
  isWeekend,
  isCurrentMonth = true,
  tall,
  drag,
  onSingleAction,
  borderClasses = '',
  children,
}: {
  date: Date
  selected: boolean
  isToday: boolean
  isWeekend: boolean
  isCurrentMonth?: boolean
  tall: boolean
  drag: DragHandlers
  onSingleAction: (date: Date, action: string) => void
  borderClasses?: string
  children?: React.ReactNode
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const didDrag = useRef(false)

  if (!isCurrentMonth) {
    return (
      <div
        className={`flex ${tall ? 'h-36' : 'h-14'} w-full items-center justify-center text-sm ${borderClasses}`}
      >
        {children}
      </div>
    )
  }

  return (
    <div
      className={`relative flex ${tall ? 'h-36' : 'h-14'} w-full items-center justify-center text-sm cursor-pointer transition-colors ${borderClasses} ${
        selected
          ? 'bg-primary/20 ring-1 ring-inset ring-primary/40'
          : isWeekend
            ? 'bg-muted/30 hover:bg-accent/50'
            : isToday && tall
              ? 'bg-primary/5 hover:bg-accent/50'
              : 'hover:bg-accent/50'
      }`}
      onMouseDown={(e) => {
        if (e.button !== 0) return
        e.preventDefault()
        didDrag.current = false
        drag.onMouseDown(date)
      }}
      onMouseEnter={() => {
        didDrag.current = true
        drag.onMouseEnter(date)
      }}
      onMouseUp={() => {
        if (!didDrag.current) {
          setMenuOpen(true)
        }
      }}
    >
      {children}

      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <button className="absolute inset-0 appearance-none opacity-0 pointer-events-none" tabIndex={-1} aria-hidden />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => onSingleAction(date, 'arbeitszeit')}>
            <Clock className="mr-2 h-4 w-4" />
            Arbeitszeit erfassen
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onSingleAction(date, 'krank')}>
            <Thermometer className="mr-2 h-4 w-4" />
            Krankmeldung eintragen
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onSingleAction(date, 'urlaub')}>
            <Palmtree className="mr-2 h-4 w-4" />
            Urlaub beantragen
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
