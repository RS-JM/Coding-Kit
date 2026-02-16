'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

interface UserFiltersProps {
  currentSearch?: string
  currentRolle?: string
  currentStatus?: string
}

export function UserFilters({ currentSearch, currentRolle, currentStatus }: UserFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchInput, setSearchInput] = useState(currentSearch || '')

  // Sync search input with current search param
  useEffect(() => {
    setSearchInput(currentSearch || '')
  }, [currentSearch])

  // Debounce search input
  useEffect(() => {
    // Only update if search input is different from current search param
    if (searchInput === (currentSearch || '')) return

    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())

      if (searchInput) {
        params.set('search', searchInput)
      } else {
        params.delete('search')
      }

      router.push(`?${params.toString()}`)
    }, 300)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput])

  const handleRolleChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())

    if (value === 'all') {
      params.delete('rolle')
    } else {
      params.set('rolle', value)
    }

    router.push(`?${params.toString()}`)
  }

  const handleStatusChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())

    if (value === 'all') {
      params.delete('status')
    } else {
      params.set('status', value)
    }

    router.push(`?${params.toString()}`)
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid gap-4 md:grid-cols-3">
          {/* Search Input */}
          <div className="space-y-2">
            <Label htmlFor="search-filter">Suchen</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="search-filter"
                type="text"
                placeholder="Name oder E-Mail..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Role Filter */}
          <div className="space-y-2">
            <Label htmlFor="rolle-filter">Rolle</Label>
            <Select value={currentRolle || 'all'} onValueChange={handleRolleChange}>
              <SelectTrigger id="rolle-filter">
                <SelectValue placeholder="Alle Rollen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Rollen</SelectItem>
                <SelectItem value="admin">Administrator</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="mitarbeiter">Mitarbeiter</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <Label htmlFor="status-filter">Status</Label>
            <Select value={currentStatus || 'all'} onValueChange={handleStatusChange}>
              <SelectTrigger id="status-filter">
                <SelectValue placeholder="Alle Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Status</SelectItem>
                <SelectItem value="aktiv">Aktiv</SelectItem>
                <SelectItem value="inaktiv">Inaktiv</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
