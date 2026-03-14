import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ElectionSummary } from '@/lib/types'
import { SeatsHemicycleChart } from '@/components/charts/SeatsHemicycleChart.tsx'
import { getContrastColor } from '@/helpers/colors.ts'
import { useTranslation } from 'react-i18next'

type ElectionSummarySectionProps = {
  summary: ElectionSummary
}

function getListNoStyle(color: string) {
  return {
    backgroundColor: color,
    color: getContrastColor(color),
    borderColor: getContrastColor(color),
    borderStyle: 'solid',
    borderWidth: 1,
  }
}

export function ElectionSummarySection({ summary }: ElectionSummarySectionProps) {
  const { t } = useTranslation()
  const votes_sum = summary.results.map((r) => r.party_votes).reduce((a, b) => a + b, 0)

  return (
    <section className="space-y-4">
      <div className="flex justify-between gap-3 flex-wrap items-baseline">
        <div className="flex  gap-3 items-center">
          <h2 className="text-xl md:text-2xl font-semibold">
            {t('summary.results', { year: summary.election_year })}
          </h2>
          <Badge variant="secondary" className="text-sm">
            {summary.total_seats} {t('summary.seats')}
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
        {summary.results.map((party) => (
          <Card
            key={party.list_number}
            className="gap-1 justify-between hover:shadow-md transition-shadow"
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-base leading-tight">{party.list_label}</CardTitle>
                <Badge style={getListNoStyle(party.color)} className="shrink-0">
                  {t('summary.listNumber', { number: party.list_number })}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div>
                <div className="text-3xl font-bold text-primary">{party.seats_won}</div>
                <div className="text-sm text-muted-foreground">
                  <span>
                    {party.seats_won === 1 ? t('summary.seatSingular') : t('summary.seatPlural')}
                  </span>
                  <span className="mx-1">•</span>
                  <span>{((party.party_votes / votes_sum) * 100).toFixed(2)}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="mt-6">
        <SeatsHemicycleChart data={summary.results} year={summary.election_year} />
      </div>
    </section>
  )
}
