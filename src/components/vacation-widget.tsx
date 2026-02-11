import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Palmtree } from 'lucide-react'

interface VacationWidgetProps {
  urlaubstageGesamt: number
  urlaubstageGenommen: number
  urlaubstageBeantragt: number
}

export function VacationWidget({
  urlaubstageGesamt,
  urlaubstageGenommen,
  urlaubstageBeantragt,
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
      </CardContent>
    </Card>
  )
}
