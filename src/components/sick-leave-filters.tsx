'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'

interface Manager {
  id: string
  vorname: string
  nachname: string
}

interface SickLeaveFiltersProps {
  managers: Manager[]
  currentManagerId?: string
}

export function SickLeaveFilters({ managers, currentManagerId }: SickLeaveFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleManagerChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())

    if (value === 'all') {
      params.delete('manager_id')
    } else {
      params.set('manager_id', value)
    }

    router.push(`?${params.toString()}`)
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-end gap-4">
          <div className="flex-1 space-y-2">
            <Label htmlFor="manager-filter">Team / Manager</Label>
            <Select
              value={currentManagerId || 'all'}
              onValueChange={handleManagerChange}
            >
              <SelectTrigger id="manager-filter">
                <SelectValue placeholder="Alle Mitarbeiter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Mitarbeiter</SelectItem>
                {managers.map((manager) => (
                  <SelectItem key={manager.id} value={manager.id}>
                    Team von {manager.vorname} {manager.nachname}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
