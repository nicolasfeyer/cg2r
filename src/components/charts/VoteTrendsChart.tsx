import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ElectionSummary } from '@/lib/types'

interface VoteTrendsChartProps {
  historicalData: Record<string, ElectionSummary>
}

const CHART_COLORS = [
  { key: '1', color: 'oklch(0.45 0.15 250)', name: 'Le Centre' },
  { key: '2', color: 'oklch(0.55 0.18 250)', name: 'PS' },
  { key: '3', color: 'oklch(0.65 0.12 250)', name: 'PLR' },
  { key: '4', color: 'oklch(0.35 0.15 250)', name: 'Centre Gauche' },
  { key: '5', color: 'oklch(0.50 0.20 250)', name: 'UDC' },
  { key: '6', color: 'oklch(0.60 0.15 250)', name: 'PVL' },
  { key: '7', color: 'oklch(0.40 0.18 250)', name: 'Verts' },
  { key: '9', color: 'oklch(0.70 0.10 250)', name: 'Artistes' },
  { key: '10', color: 'oklch(0.45 0.22 250)', name: 'DAS' },
]

export function VoteTrendsChart({ historicalData }: VoteTrendsChartProps) {
  const years = Object.keys(historicalData).sort()

  const chartData = years.map(year => {
    const summary = historicalData[year]
    const dataPoint: any = { year }
    
    summary.results.forEach(party => {
      dataPoint[`list_${party.list_number}`] = party.party_votes
    })
    
    return dataPoint
  })

  const chartId = 'chart-vote-trends'

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-md p-3 shadow-md max-h-96 overflow-y-auto">
          <p className="font-semibold mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm mb-1">
              <div 
                className="w-3 h-3 rounded" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-xs">{entry.name}:</span>
              <span className="font-medium text-xs">{entry.value.toLocaleString('fr-CH')}</span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <CardTitle>Évolution des voix par parti (2016-2026)</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div id={chartId}>
          <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="year" />
            <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ fontSize: '12px' }}
              formatter={(value) => {
                const listNumber = value.replace('list_', '')
                const colorConfig = CHART_COLORS.find(c => c.key === listNumber)
                return colorConfig?.name || value
              }}
            />
            {CHART_COLORS.map(({ key, color, name }) => (
              <Bar 
                key={key} 
                dataKey={`list_${key}`} 
                fill={color}
                name={name}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
