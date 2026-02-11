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
import { Calendar, ChevronLeft, ChevronRight, Clock, Thermometer, Palmtree, X } from 'lucide-react'
import { WorkTimeDialog, SickLeaveDialog, VacationDialog } from '@/components/calendar-dialogs'

const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
const MONTHS = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
]

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

  function handleMouseDown(date: Date) {
    isDragging.current = true
    dragStartDate.current = date
    dragMoved.current = false
    // Keep existing selection if clicking on an already-selected date
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
    // Selection stays visible — user picks action from bar
  }, [])

  // Listen for mouseup on document (in case mouse leaves calendar)
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

  // Single-click handler (for DropdownMenu on individual day)
  function handleDayAction(date: Date, action: string) {
    // If the day is part of a multi-day selection, use all selected dates
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
        {selectedDates.length > 0 && (
          <SelectionBar
            dates={selectedDates}
            onAction={openDialogForSelection}
            onClear={clearSelection}
          />
        )}

        {viewMode === 'week' ? (
          <WeekView
            days={getWeekDays(currentDate)}
            drag={dragHandlers}
            onSingleAction={handleDayAction}
          />
        ) : (
          <MonthView
            days={getMonthDays(currentDate.getFullYear(), currentDate.getMonth())}
            drag={dragHandlers}
            onSingleAction={handleDayAction}
          />
        )}
      </CardContent>

      {/* Entry Dialogs */}
      <WorkTimeDialog open={dialogType === 'arbeitszeit'} dates={dialogDates} onClose={closeDialog} />
      <SickLeaveDialog open={dialogType === 'krank'} dates={dialogDates} onClose={closeDialog} />
      <VacationDialog open={dialogType === 'urlaub'} dates={dialogDates} onClose={closeDialog} />
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
  const label =
    dates.length === 1
      ? formatDateDE(dates[0])
      : `${formatDateDE(dates[0])} – ${formatDateDE(dates[dates.length - 1])}`

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/50 px-4 py-2.5">
      <span className="text-sm font-medium">
        {dates.length} {dates.length === 1 ? 'Tag' : 'Tage'} ausgewählt
        <span className="ml-2 text-muted-foreground">({label})</span>
      </span>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" className="h-8" onClick={() => onAction('arbeitszeit')}>
          <Clock className="mr-1.5 h-3.5 w-3.5" />
          Arbeitszeit
        </Button>
        <Button size="sm" variant="outline" className="h-8" onClick={() => onAction('krank')}>
          <Thermometer className="mr-1.5 h-3.5 w-3.5" />
          Krankmeldung
        </Button>
        <Button size="sm" variant="outline" className="h-8" onClick={() => onAction('urlaub')}>
          <Palmtree className="mr-1.5 h-3.5 w-3.5" />
          Urlaub
        </Button>
        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={onClear}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

// --- Week View ---

function WeekView({
  days,
  drag,
  onSingleAction,
}: {
  days: CalendarDay[]
  drag: DragHandlers
  onSingleAction: (date: Date, action: string) => void
}) {
  return (
    <div className="grid grid-cols-7 overflow-hidden rounded-lg border select-none">
      {days.map((d, i) => {
        const selected = drag.isSelected(d.date)
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
            />
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
}: {
  days: CalendarDay[]
  drag: DragHandlers
  onSingleAction: (date: Date, action: string) => void
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
        {days.map((d, i) => (
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
            <span
              className={
                d.isToday
                  ? 'flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold'
                  : `${!d.isCurrentMonth ? 'text-muted-foreground/40' : ''}`
              }
            >
              {d.day}
            </span>
          </DayCell>
        ))}
      </div>
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
