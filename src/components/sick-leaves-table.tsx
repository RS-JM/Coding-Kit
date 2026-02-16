'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Thermometer } from 'lucide-react'

interface SickLeave {
  id: string
  user_id: string
  start_datum: string
  end_datum: string
  kommentar: string
  created_at: string
  updated_at: string
  profiles: {
    vorname: string
    nachname: string
  } | null
}

interface SickLeavesTableProps {
  sickLeaves: SickLeave[]
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function calculateDays(start: string, end: string): number {
  const startDate = new Date(start)
  const endDate = new Date(end)
  return Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
}

function isCurrentlySick(start: string, end: string): boolean {
  const today = new Date().toISOString().split('T')[0]
  return start <= today && end >= today
}

export function SickLeavesTable({ sickLeaves }: SickLeavesTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Mitarbeiter</TableHead>
            <TableHead>Von</TableHead>
            <TableHead>Bis</TableHead>
            <TableHead className="text-center">Tage</TableHead>
            <TableHead>Kommentar</TableHead>
            <TableHead className="text-center">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sickLeaves.map((leave) => {
            const days = calculateDays(leave.start_datum, leave.end_datum)
            const isCurrent = isCurrentlySick(leave.start_datum, leave.end_datum)
            const name = leave.profiles
              ? `${leave.profiles.vorname} ${leave.profiles.nachname}`
              : 'Unbekannt'

            return (
              <TableRow key={leave.id}>
                <TableCell className="font-medium">{name}</TableCell>
                <TableCell>{formatDate(leave.start_datum)}</TableCell>
                <TableCell>{formatDate(leave.end_datum)}</TableCell>
                <TableCell className="text-center">{days}</TableCell>
                <TableCell className="text-muted-foreground">
                  {leave.kommentar || '-'}
                </TableCell>
                <TableCell className="text-center">
                  {isCurrent ? (
                    <Badge variant="destructive" className="gap-1">
                      <Thermometer className="h-3 w-3" />
                      Krank
                    </Badge>
                  ) : (
                    <Badge variant="outline">Vergangen</Badge>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
