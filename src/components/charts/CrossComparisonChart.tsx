import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { CandidateResult } from '@/lib/types'

interface CrossComparisonChartProps {
  comparisons: Array<{
    candidate: CandidateResult
    year: string
    listLabel: string
  }>
}

export function CrossComparisonChart({ comparisons }: CrossComparisonChartProps) {
  const districtColumns = comparisons.length > 0 
    ? Object.keys(comparisons[0].candidate).filter(
        key => key !== 'no_candidate' && key !== 'name' && key !== 'total' && key !== 'without_header' && key !== 'compact'
      )
    : []

  const chartData = districtColumns.map(district => {
    const dataPoint: any = { district }
    comparisons.forEach((comp, idx) => {
      const key = `${comp.candidate.name} (${comp.listLabel}, ${comp.year})`
      dataPoint[key] = comp.candidate[district] || 0
    })
    return dataPoint
  })

  const colors = [
    'oklch(0.45 0.15 250)',
    'oklch(0.55 0.18 250)',
    'oklch(0.65 0.12 270)',
    'oklch(0.50 0.20 230)',
    'oklch(0.60 0.15 290)',
    'oklch(0.55 0.22 210)'
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comparaison inter-années et inter-listes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[500px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.90 0.005 250)" />
              <XAxis 
                dataKey="district" 
                tick={{ fill: 'oklch(0.5 0.01 250)', fontSize: 12 }}
                label={{ value: 'District', position: 'insideBottom', offset: -5, fill: 'oklch(0.5 0.01 250)' }}
              />
              <YAxis 
                tick={{ fill: 'oklch(0.5 0.01 250)', fontSize: 12 }}
                label={{ value: 'Voix', angle: -90, position: 'insideLeft', fill: 'oklch(0.5 0.01 250)' }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'oklch(1 0 0)',
                  border: '1px solid oklch(0.90 0.005 250)',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
              <Legend 
                wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }}
                formatter={(value) => value.length > 40 ? value.substring(0, 37) + '...' : value}
              />
              {comparisons.map((comp, idx) => (
                <Bar
                  key={idx}
                  dataKey={`${comp.candidate.name} (${comp.listLabel}, ${comp.year})`}
                  fill={colors[idx % colors.length]}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-6 space-y-3">
          <h4 className="text-sm font-semibold">Candidats comparés :</h4>
          <div className="grid gap-3 md:grid-cols-2">
            {comparisons.map((comp, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
                <div 
                  className="w-4 h-4 rounded mt-0.5 shrink-0"
                  style={{ backgroundColor: colors[idx % colors.length] }}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{comp.candidate.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {comp.listLabel} • {comp.year} • {comp.candidate.total} voix
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
