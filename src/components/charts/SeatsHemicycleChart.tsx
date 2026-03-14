import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { PartyResult } from '@/lib/types'
import { getContrastColor } from '@/helpers/colors.ts'
import type { TooltipProps } from 'recharts'
import { useTranslation } from 'react-i18next'

type SeatsChartDatum = {
  name: string
  value: number
  listNumber: number
  color: string
  positioning: number
}

interface SeatsHemicycleChartProps {
  data: PartyResult[]
  year?: number
}

export function SeatsHemicycleChart({ data, year }: SeatsHemicycleChartProps) {
  const { t } = useTranslation()
  const votes_sum = data.map((r) => r.party_votes).reduce((a, b) => a + b, 0)
  const party_votes_by_list_not = data.reduce(
    (acc, party) => {
      acc[party.list_number] = party.party_votes
      return acc
    },
    {} as Record<number, number>
  )
  const chartData = data
    .filter((party) => party.seats_won > 0)
    .map((party) => ({
      name: party.list_label,
      value: party.seats_won,
      listNumber: party.list_number,
      color: party.color,
      positioning: party.positioning,
    }))
    .sort((a, b) => a.positioning - b.positioning)

  const totalSeats = chartData.reduce((sum, item) => sum + item.value, 0)

  const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
    if (!active || !payload || payload.length === 0) return null
    const item = payload[0].payload as SeatsChartDatum

    return (
      <div className="bg-card border border-border rounded-md p-3 shadow-md">
        <p className="font-semibold text-sm">{item.name}</p>
        <p className="text-xs text-muted-foreground">
          {t('hemicycle.listNumber', { number: item.listNumber })}
        </p>
        <p className="text-sm mt-1">
          {item.value} {item.value === 1 ? t('hemicycle.seat') : t('hemicycle.seats')}
        </p>
        <p className="text-xs text-primary font-semibold mt-1">
          {((party_votes_by_list_not[item.listNumber] / votes_sum) * 100).toFixed(2)}%
        </p>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {year ? t('hemicycle.titleWithYear', { year }) : t('hemicycle.title')}
          </h2>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative" style={{ width: '100%', height: 170 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 12, right: 16, left: 16, bottom: 0 }}>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="95%"
                startAngle={180}
                endAngle={0}
                innerRadius={90}
                outerRadius={150}
                paddingAngle={1}
                stroke="hsl(var(--background))"
              >
                {chartData.map((entry) => (
                  <Cell key={`seat-cell-${entry.listNumber}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip wrapperStyle={{ zIndex: 1 }} content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          <div className="pointer-events-none absolute inset-x-0 top-[80%] -translate-y-1/2 text-center">
            <div className="text-2xl font-bold text-primary">{totalSeats}</div>
            <div className="text-xs text-muted-foreground">
              {totalSeats === 1 ? t('hemicycle.totalSeat') : t('hemicycle.totalSeats')}
            </div>
          </div>
        </div>

        <ul className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          {chartData.map((entry, index) => (
            <li
              key={`legend-${index}-${entry.listNumber}`}
              className="flex items-center gap-1.5 text-xs text-foreground"
            >
              <span
                className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                style={{
                  backgroundColor: entry.color,
                  borderColor: getContrastColor(entry.color),
                  borderStyle: 'solid',
                  borderWidth: 1,
                }}
              />
              <span>
                {entry.listNumber}. {entry.name}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
