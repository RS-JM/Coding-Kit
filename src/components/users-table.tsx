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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Pencil, Users as UsersIcon } from 'lucide-react'
import { toast } from 'sonner'
import { UserDialog, type User } from '@/components/user-dialog'

interface UsersTableProps {
  users: User[]
}

export function UsersTable({ users }: UsersTableProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | undefined>()
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false)
  const [userToToggle, setUserToToggle] = useState<User | undefined>()

  const adminCount = users.filter((u) => u.rolle === 'admin').length

  function getRolleBadgeVariant(rolle: string) {
    switch (rolle) {
      case 'admin':
        return 'destructive'
      case 'manager':
        return 'default'
      default:
        return 'secondary'
    }
  }

  function getRolleLabel(rolle: string) {
    switch (rolle) {
      case 'admin':
        return 'Administrator'
      case 'manager':
        return 'Manager'
      default:
        return 'Mitarbeiter'
    }
  }

  function handleEdit(user: User) {
    setSelectedUser(user)
    setShowEditDialog(true)
  }

  function handleToggleStatus(user: User) {
    // Deactivating requires confirmation
    if (user.ist_aktiv) {
      setUserToToggle(user)
      setShowDeactivateConfirm(true)
    } else {
      // Activating doesn't require confirmation
      performToggle(user)
    }
  }

  async function performToggle(user: User) {
    const newStatus = !user.ist_aktiv
    setIsLoading(true)

    try {
      const res = await fetch(`/api/profiles/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ist_aktiv: newStatus,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || 'Fehler beim Aktualisieren des Status')
        setIsLoading(false)
        return
      }

      toast.success(
        newStatus
          ? 'Benutzer wurde aktiviert'
          : 'Benutzer wurde deaktiviert'
      )
      router.refresh()
    } catch (error) {
      console.error('Error:', error)
      toast.error('Ein unerwarteter Fehler ist aufgetreten')
    } finally {
      setIsLoading(false)
      setShowDeactivateConfirm(false)
      setUserToToggle(undefined)
    }
  }

  function handleConfirmDeactivate() {
    if (userToToggle) {
      performToggle(userToToggle)
    }
  }

  function handleSave() {
    setShowEditDialog(false)
    setSelectedUser(undefined)
    router.refresh()
  }

  function isLastAdmin(user: User): boolean {
    return user.rolle === 'admin' && adminCount === 1
  }

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <UsersIcon className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-lg font-medium text-muted-foreground">Keine Benutzer gefunden</p>
        <p className="text-sm text-muted-foreground">
          Erstelle einen neuen Benutzer, um zu beginnen.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>E-Mail</TableHead>
              <TableHead>Job-Titel</TableHead>
              <TableHead>Rolle</TableHead>
              <TableHead className="text-right">Urlaubstage</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => {
              const lastAdmin = isLastAdmin(user)

              return (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.vorname} {user.nachname}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell>{user.job_titel || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={getRolleBadgeVariant(user.rolle)}>
                      {getRolleLabel(user.rolle)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{user.urlaubstage_gesamt} Tage</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div>
                              <Switch
                                checked={user.ist_aktiv}
                                disabled={lastAdmin || isLoading}
                                onCheckedChange={() => handleToggleStatus(user)}
                              />
                            </div>
                          </TooltipTrigger>
                          {lastAdmin && (
                            <TooltipContent>
                              <p>Der letzte Admin kann nicht deaktiviert werden</p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                      <Badge
                        variant="outline"
                        className={
                          user.ist_aktiv
                            ? 'border-green-600 text-green-600'
                            : 'border-gray-400 text-gray-400'
                        }
                      >
                        {user.ist_aktiv ? 'Aktiv' : 'Inaktiv'}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(user)}
                      disabled={isLoading}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      <UserDialog
        open={showEditDialog}
        existingUser={selectedUser}
        onClose={() => {
          setShowEditDialog(false)
          setSelectedUser(undefined)
        }}
        onSave={handleSave}
      />

      {/* Deactivate Confirmation */}
      <AlertDialog open={showDeactivateConfirm} onOpenChange={setShowDeactivateConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Benutzer deaktivieren?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchtest du den Benutzer{' '}
              <span className="font-medium">
                {userToToggle?.vorname} {userToToggle?.nachname}
              </span>{' '}
              wirklich deaktivieren? Der Benutzer kann sich nicht mehr einloggen, bis er wieder
              aktiviert wird.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUserToToggle(undefined)}>
              Abbrechen
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDeactivate}>Deaktivieren</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
