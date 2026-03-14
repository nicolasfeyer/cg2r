import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DownloadSimple } from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { PartyResult } from '@/lib/types'
import { exportChartToImage } from '@/lib/exportUtils'

interface PartyDistributionChartProps {
  data: PartyResult[]
  type: 'votes' | 'seats'
  year?: number
}

const CHART_COLORS = [
  'oklch(0.45 0.15 250)',
  'oklch(0.55 0.18 250)',
  'oklch(0.65 0.12 250)',
  'oklch(0.35 0.15 250)',
  'oklch(0.50 0.20 250)',
  'oklch(0.60 0.15 250)',
  'oklch(0.40 0.18 250)',
  'oklch(0.70 0.10 250)',
  'oklch(0.45 0.22 250)',
]

export function PartyDistributionChart({ data, type, year }: PartyDistributionChartProps) {
  const chartData = data.map(party => ({
    name: party.list_label,
    value: type === 'votes' ? party.party_votes : party.seats_won,
    listNumber: party.list_number
  }))

  const total = chartData.reduce((sum, item) => sum + item.value, 0)
  const chartId = `chart-${type}-${year || 'current'}`

  const handleExport = async () => {
    try {
      await exportChartToImage(chartId, `repartition_${type}_${year || 'current'}.png`)
      toast.success('Graphique exporté avec succès')
    } catch (error) {
      toast.error('Erreur lors de l\'export du graphique')
      console.error(error)
    }
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      const percentage = ((data.value / total) * 100).toFixed(1)
      return (
        <div className="bg-card border border-border rounded-md p-3 shadow-md">
          <p className="font-semibold text-sm mb-1">{data.name}</p>
          <p className="text-xs text-muted-foreground">
            N° {data.listNumber}
          </p>
          <p className="text-sm mt-1">
            {type === 'votes' 
              ? `${data.value.toLocaleString('fr-CH')} voix` 
              : `${data.value} ${data.value === 1 ? 'siège' : 'sièges'}`
            }
          </p>
          <p className="text-xs text-primary font-semibold mt-1">{percentage}%</p>
        </div>
      )
    }
    return null
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <CardTitle>
            {type === 'votes' ? 'Répartition des voix' : 'Répartition des sièges'}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div id={chartId}>
          <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => {
                if (percent > 0.05) {
                  return `${(percent * 100).toFixed(0)}%`
                }
                return ''
              }}
              outerRadius={120}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="bottom"
              formatter={(value, entry: any) => (
                <span className="text-xs">
                  {entry.payload.listNumber}. {value}
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
