'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { UserPlus } from 'lucide-react'
import { UserDialog } from '@/components/user-dialog'
import { useRouter } from 'next/navigation'

export function AdminUsersHeader() {
  const router = useRouter()
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  function handleSave() {
    setShowCreateDialog(false)
    router.refresh()
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Benutzerverwaltung</h1>
          <p className="text-muted-foreground">
            Verwalte Benutzerkonten, Rollen und Urlaubskontingente
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Neuer Benutzer
        </Button>
      </div>

      {/* Create User Dialog */}
      <UserDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSave={handleSave}
      />
    </>
  )
}
