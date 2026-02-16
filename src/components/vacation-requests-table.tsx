'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Check, X, Clock } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

type VacationRequest = {
  id: string
  user_id: string
  start_datum: string
  end_datum: string
  arbeitstage: number
  kommentar: string
  status: 'beantragt' | 'genehmigt' | 'abgelehnt'
  ablehnungsgrund?: string | null
  bearbeitet_von?: string | null
  bearbeitet_am?: string | null
  created_at: string
  profiles: {
    vorname: string | null
    nachname: string | null
  } | null
}

interface VacationRequestsTableProps {
  requests: VacationRequest[]
}

export function VacationRequestsTable({ requests }: VacationRequestsTableProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [filter, setFilter] = useState<'all' | 'beantragt' | 'genehmigt' | 'abgelehnt'>('all')
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<VacationRequest | null>(null)
  const [ablehnungsgrund, setAblehnungsgrund] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const filteredRequests = filter === 'all'
    ? requests
    : requests.filter(r => r.status === filter)

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'beantragt':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
          <Clock className="mr-1 h-3 w-3" />
          Beantragt
        </Badge>
      case 'genehmigt':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
          <Check className="mr-1 h-3 w-3" />
          Genehmigt
        </Badge>
      case 'abgelehnt':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
          <X className="mr-1 h-3 w-3" />
          Abgelehnt
        </Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const handleApprove = async (requestId: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/vacation-requests/${requestId}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'genehmigen' }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Fehler beim Genehmigen')
      }

      toast({
        title: 'Urlaubsantrag genehmigt',
        description: 'Der Urlaubsantrag wurde erfolgreich genehmigt.',
      })

      router.refresh()
    } catch (error) {
      console.error('Error approving request:', error)
      toast({
        title: 'Fehler',
        description: error instanceof Error ? error.message : 'Fehler beim Genehmigen',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRejectClick = (request: VacationRequest) => {
    setSelectedRequest(request)
    setAblehnungsgrund('')
    setRejectDialogOpen(true)
  }

  const handleRejectConfirm = async () => {
    if (!selectedRequest || !ablehnungsgrund.trim()) {
      toast({
        title: 'Fehler',
        description: 'Bitte gib einen Ablehnungsgrund ein',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/vacation-requests/${selectedRequest.id}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ablehnen',
          ablehnungsgrund: ablehnungsgrund.trim(),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Fehler beim Ablehnen')
      }

      toast({
        title: 'Urlaubsantrag abgelehnt',
        description: 'Der Urlaubsantrag wurde abgelehnt.',
      })

      setRejectDialogOpen(false)
      setSelectedRequest(null)
      setAblehnungsgrund('')
      router.refresh()
    } catch (error) {
      console.error('Error rejecting request:', error)
      toast({
        title: 'Fehler',
        description: error instanceof Error ? error.message : 'Fehler beim Ablehnen',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Clock className="mb-4 h-12 w-12 text-muted-foreground" />
        <h3 className="text-lg font-semibold">Keine Urlaubsanträge</h3>
        <p className="text-sm text-muted-foreground">
          Es wurden noch keine Urlaubsanträge gestellt.
        </p>
      </div>
    )
  }

  return (
    <>
      {/* Filter Tabs */}
      <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="mb-4">
        <TabsList>
          <TabsTrigger value="all">
            Alle ({requests.length})
          </TabsTrigger>
          <TabsTrigger value="beantragt">
            Offen ({requests.filter(r => r.status === 'beantragt').length})
          </TabsTrigger>
          <TabsTrigger value="genehmigt">
            Genehmigt ({requests.filter(r => r.status === 'genehmigt').length})
          </TabsTrigger>
          <TabsTrigger value="abgelehnt">
            Abgelehnt ({requests.filter(r => r.status === 'abgelehnt').length})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mitarbeiter</TableHead>
              <TableHead>Zeitraum</TableHead>
              <TableHead className="text-center">Arbeitstage</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Kommentar</TableHead>
              <TableHead>Beantragt am</TableHead>
              <TableHead className="text-right">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRequests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  Keine Anträge mit diesem Status gefunden.
                </TableCell>
              </TableRow>
            ) : (
              filteredRequests.map((request) => {
                const name = request.profiles
                  ? `${request.profiles.vorname ?? ''} ${request.profiles.nachname ?? ''}`.trim()
                  : 'Unbekannt'

                return (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">{name}</TableCell>
                    <TableCell>
                      {formatDate(request.start_datum)} - {formatDate(request.end_datum)}
                    </TableCell>
                    <TableCell className="text-center font-semibold">
                      {request.arbeitstage}
                    </TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {request.status === 'abgelehnt' && request.ablehnungsgrund ? (
                        <span className="text-red-600 font-medium">
                          Grund: {request.ablehnungsgrund}
                        </span>
                      ) : (
                        request.kommentar || '-'
                      )}
                    </TableCell>
                    <TableCell>{formatDate(request.created_at)}</TableCell>
                    <TableCell className="text-right">
                      {request.status === 'beantragt' && (
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600 hover:bg-green-50 hover:text-green-700"
                            onClick={() => handleApprove(request.id)}
                            disabled={isLoading}
                          >
                            <Check className="mr-1 h-4 w-4" />
                            Genehmigen
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() => handleRejectClick(request)}
                            disabled={isLoading}
                          >
                            <X className="mr-1 h-4 w-4" />
                            Ablehnen
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Urlaubsantrag ablehnen</DialogTitle>
            <DialogDescription>
              Bitte gib einen Grund für die Ablehnung an. Dieser wird dem Mitarbeiter angezeigt.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedRequest && (
              <div className="rounded-md bg-muted p-3 text-sm">
                <p><strong>Mitarbeiter:</strong> {
                  selectedRequest.profiles
                    ? `${selectedRequest.profiles.vorname ?? ''} ${selectedRequest.profiles.nachname ?? ''}`.trim()
                    : 'Unbekannt'
                }</p>
                <p><strong>Zeitraum:</strong> {formatDate(selectedRequest.start_datum)} - {formatDate(selectedRequest.end_datum)}</p>
                <p><strong>Arbeitstage:</strong> {selectedRequest.arbeitstage}</p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="ablehnungsgrund">Ablehnungsgrund *</Label>
              <Textarea
                id="ablehnungsgrund"
                placeholder="z.B. In diesem Zeitraum sind bereits zu viele Mitarbeiter im Urlaub..."
                value={ablehnungsgrund}
                onChange={(e) => setAblehnungsgrund(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
              disabled={isLoading}
            >
              Abbrechen
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectConfirm}
              disabled={isLoading || !ablehnungsgrund.trim()}
            >
              {isLoading ? 'Wird abgelehnt...' : 'Ablehnen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
