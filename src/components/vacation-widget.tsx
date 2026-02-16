import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Palmtree, XCircle, CheckCircle2 } from 'lucide-react'

interface RejectedVacation {
  id: string
  start_datum: string
  end_datum: string
  ablehnungsgrund: string | null
}

interface ApprovedVacation {
  id: string
  start_datum: string
  end_datum: string
}

interface VacationWidgetProps {
  urlaubstageGesamt: number
  urlaubstageGenommen: number
  urlaubstageBeantragt: number
  rejectedVacations?: RejectedVacation[]
  approvedVacations?: ApprovedVacation[]
}

export function VacationWidget({
  urlaubstageGesamt,
  urlaubstageGenommen,
  urlaubstageBeantragt,
  rejectedVacations = [],
  approvedVacations = [],
}: VacationWidgetProps) {
  const verbleibend = urlaubstageGesamt - urlaubstageGenommen
  const prozent =
    urlaubstageGesamt > 0
      ? Math.round((urlaubstageGenommen / urlaubstageGesamt) * 100)
      : 0

  // Color based on usage percentage
  let barColor = 'bg-green-500'
  if (prozent >= 90) barColor = 'bg-red-500'
  else if (prozent >= 70) barColor = 'bg-orange-500'

  return (
    <Card className="xl:col-span-1">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Palmtree className="h-4 w-4" />
          Urlaub
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Big number */}
        <div className="text-center">
          <p className="text-3xl font-bold">{verbleibend}</p>
          <p className="text-sm text-muted-foreground">Tage verbleibend</p>
        </div>

        {/* Progress bar */}
        <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className={`h-full rounded-full transition-all ${barColor}`}
            style={{ width: `${Math.min(prozent, 100)}%` }}
          />
        </div>

        {/* Details */}
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Genommen</span>
            <span className="font-medium">
              {urlaubstageGenommen} von {urlaubstageGesamt}
            </span>
          </div>
          {urlaubstageBeantragt > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Beantragt</span>
              <span className="font-medium text-amber-600">
                {urlaubstageBeantragt} Tage
              </span>
            </div>
          )}
        </div>

        {/* Warning if over budget */}
        {urlaubstageGenommen + urlaubstageBeantragt > urlaubstageGesamt && (
          <p className="text-xs font-medium text-destructive">
            Achtung: Mehr Urlaubstage beantragt als verfügbar!
          </p>
        )}

        {/* Approved Vacations */}
        {approvedVacations.length > 0 && (
          <>
            <Separator className="my-3" />
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-600">
                  Genehmigte Urlaube
                </span>
              </div>
              {approvedVacations.map((approved) => {
                const startDate = new Date(approved.start_datum).toLocaleDateString('de-DE', {
                  day: '2-digit',
                  month: '2-digit',
                })
                const endDate = new Date(approved.end_datum).toLocaleDateString('de-DE', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })
                const dateRange = `${startDate} - ${endDate}`

                return (
                  <div
                    key={approved.id}
                    className="rounded-md border border-green-600/20 bg-green-600/5 p-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium">{dateRange}</span>
                      <Badge variant="outline" className="border-green-600 text-green-600">
                        Genehmigt
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* Rejected Vacations */}
        {rejectedVacations.length > 0 && (
          <>
            <Separator className="my-3" />
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-destructive" />
                <span className="text-sm font-medium text-destructive">
                  Abgelehnte Anträge
                </span>
              </div>
              {rejectedVacations.map((rejected) => {
                const startDate = new Date(rejected.start_datum).toLocaleDateString('de-DE', {
                  day: '2-digit',
                  month: '2-digit',
                })
                const endDate = new Date(rejected.end_datum).toLocaleDateString('de-DE', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })
                const dateRange = `${startDate} - ${endDate}`

                return (
                  <div
                    key={rejected.id}
                    className="rounded-md border border-destructive/20 bg-destructive/5 p-2 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium">{dateRange}</span>
                      <Badge variant="destructive" className="text-xs">
                        Abgelehnt
                      </Badge>
                    </div>
                    {rejected.ablehnungsgrund && (
                      <p className="text-xs text-muted-foreground">
                        {rejected.ablehnungsgrund}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
