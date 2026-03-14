import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CandidateScatterData } from '@/lib/types'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

type AverageAgeEvolutionChartProps = {
  candidateScatterData: CandidateScatterData[]
}

export function AverageAgeEvolutionChart({ candidateScatterData }: AverageAgeEvolutionChartProps) {
  const { t } = useTranslation()
  const chartData = useMemo(() => {
    const dataByYear: Record<
      number,
      {
        women: number[]
        men: number[]
        electedWomen: number[]
        electedMen: number[]
      }
    > = {}

    candidateScatterData.forEach((candidate) => {
      const year = candidate.election_year
      const age = candidate.age
      if (!year || age === null || age === undefined) return

      if (!dataByYear[year]) {
        dataByYear[year] = {
          women: [],
          men: [],
          electedWomen: [],
          electedMen: [],
        }
      }

      const isWoman = candidate.gender === 'f' || candidate.gender === 'F'
      const isMan = candidate.gender === 'm' || candidate.gender === 'M'

      if (isWoman) dataByYear[year].women.push(age)
      if (isMan) dataByYear[year].men.push(age)

      if (candidate.elected) {
        if (isWoman) dataByYear[year].electedWomen.push(age)
        if (isMan) dataByYear[year].electedMen.push(age)
      }
    })

    const calculateAverage = (arr: number[]) => {
      if (arr.length === 0) return 0
      const sum = arr.reduce((a, b) => a + b, 0)
      return Number((sum / arr.length).toFixed(1))
    }

    const aggregated = Object.keys(dataByYear)
      .map((yearStr) => {
        const year = parseInt(yearStr, 10)
        const yearData = dataByYear[year]
        return {
          year,
          women: calculateAverage(yearData.women),
          men: calculateAverage(yearData.men),
          electedWomen: calculateAverage(yearData.electedWomen),
          electedMen: calculateAverage(yearData.electedMen),
        }
      })
      .sort((a, b) => a.year - b.year)

    return aggregated
  }, [candidateScatterData])

  if (!chartData || chartData.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-gray-800 mb-2">
          {t('averageAge.title')}
        </CardTitle>
        <CardDescription>{t('averageAge.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[460px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 20,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="year" tickLine={false} tickMargin={10} minTickGap={20} />
              <YAxis
                domain={['dataMin - 2', 'dataMax + 2']}
                tickFormatter={(value) => `${value} ${t('averageAge.ageSuffix')}`}
              />
              <Tooltip
                formatter={(value: number, name: string) => {
                  const labels: Record<string, string> = {
                    women: t('averageAge.allFemaleCandidates'),
                    men: t('averageAge.allMaleCandidates'),
                    electedWomen: t('averageAge.electedFemale'),
                    electedMen: t('averageAge.electedMale'),
                  }
                  return [`${value} ${t('averageAge.ageSuffix')}`, labels[name] || name]
                }}
                labelFormatter={(label) => t('averageAge.yearLabel', { label })}
              />
              <Legend
                formatter={(value) => {
                  const labels: Record<string, string> = {
                    women: t('averageAge.allFemaleCandidates'),
                    men: t('averageAge.allMaleCandidates'),
                    electedWomen: t('averageAge.electedFemale'),
                    electedMen: t('averageAge.electedMale'),
                  }
                  return labels[value] || value
                }}
              />
              <Line
                type="monotone"
                dataKey="women"
                stroke="#f9c0dd"
                strokeDasharray="5 5"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="men"
                stroke="#82bfe9"
                strokeDasharray="5 5"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="electedWomen"
                stroke="#ed3491"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="electedMen"
                stroke="#1f77b4"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
