import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { CandidateResult } from '@/lib/types'

interface CandidateComparisonChartProps {
  candidates: CandidateResult[]
  selectedCandidates: string[]
}

const DISTRICT_COLORS: Record<string, string> = {
  '01': 'oklch(0.45 0.15 250)',
  '02': 'oklch(0.55 0.18 250)',
  '03': 'oklch(0.35 0.15 250)',
  '04': 'oklch(0.50 0.20 250)',
  '05': 'oklch(0.60 0.15 250)',
  '06': 'oklch(0.40 0.18 250)',
  '07': 'oklch(0.65 0.12 250)',
  '09': 'oklch(0.70 0.10 250)',
  '0': 'oklch(0.45 0.22 250)',
}

const DISTRICT_NAMES: Record<string, string> = {
  '01': 'District 01',
  '02': 'District 02',
  '03': 'District 03',
  '04': 'District 04',
  '05': 'District 05',
  '06': 'District 06',
  '07': 'District 07',
  '09': 'District 09',
  '0': 'District 0',
  'without_header': 'Sans en-tête',
  'compact': 'Compact',
}

export function CandidateComparisonChart({ candidates, selectedCandidates }: CandidateComparisonChartProps) {
  const filteredCandidates = candidates.filter(c => selectedCandidates.includes(c.no_candidate))

  if (filteredCandidates.length === 0) {
    return null
  }

  const districtKeys = Object.keys(filteredCandidates[0] || {}).filter(
    key => key !== 'no_candidate' && key !== 'name' && key !== 'total' && key !== 'without_header' && key !== 'compact'
  )

  const chartData = districtKeys.map(district => {
    const dataPoint: any = { district: DISTRICT_NAMES[district] || district }
    filteredCandidates.forEach(candidate => {
      dataPoint[candidate.name] = candidate[district] || 0
    })
    return dataPoint
  })

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-md p-3 shadow-md">
          <p className="font-semibold text-sm mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4 text-xs mb-1">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-sm" 
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-foreground">{entry.name}</span>
              </div>
              <span className="font-semibold text-primary">{entry.value} voix</span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  const colors = [
    'oklch(0.45 0.15 250)',
    'oklch(0.55 0.18 250)',
    'oklch(0.65 0.12 250)',
    'oklch(0.35 0.15 250)',
    'oklch(0.50 0.20 250)',
    'oklch(0.60 0.15 250)',
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comparaison par district</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis 
              dataKey="district" 
              className="text-xs"
              tick={{ fill: 'oklch(0.5 0.01 250)' }}
            />
            <YAxis 
              className="text-xs"
              tick={{ fill: 'oklch(0.5 0.01 250)' }}
              label={{ value: 'Voix', angle: -90, position: 'insideLeft', style: { fill: 'oklch(0.5 0.01 250)' } }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="square"
            />
            {filteredCandidates.map((candidate, index) => (
              <Bar 
                key={candidate.no_candidate} 
                dataKey={candidate.name} 
                fill={colors[index % colors.length]}
                radius={[4, 4, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
