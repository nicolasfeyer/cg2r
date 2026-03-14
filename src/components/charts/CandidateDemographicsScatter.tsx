import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  ZAxis,
  TooltipProps,
} from 'recharts'
import { CandidateScatterData } from '@/lib/types'

type CandidateDemographicsScatterProps = {
  candidateScatterData: CandidateScatterData[]
}

type ScatterShapeProps = {
  cx?: number
  cy?: number
  fill?: string
}

export function CandidateDemographicsScatter({
  candidateScatterData,
}: CandidateDemographicsScatterProps) {
  const { t } = useTranslation()
  const { womenElected, womenNotElected, menElected, menNotElected, haveAgeNullCandidates } =
    useMemo(() => {
      return {
        womenElected: candidateScatterData.filter(
          (d) => d.gender.toLowerCase() === 'f' && d.elected && d.age !== null
        ),
        womenNotElected: candidateScatterData.filter(
          (d) => d.gender.toLowerCase() === 'f' && !d.elected && d.age !== null
        ),
        menElected: candidateScatterData.filter(
          (d) => d.gender.toLowerCase() === 'm' && d.elected && d.age !== null
        ),
        menNotElected: candidateScatterData.filter(
          (d) => d.gender.toLowerCase() === 'm' && !d.elected && d.age !== null
        ),
        haveAgeNullCandidates: candidateScatterData.filter((d) => d.age === null).length > 0,
      }
    }, [candidateScatterData])

  const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      const c = payload[0].payload as CandidateScatterData
      const perfColor = c.relative_performance >= 100 ? 'text-green-600' : 'text-red-500'

      return (
        <div className="bg-white p-4 border border-gray-200 shadow-xl rounded-lg text-sm min-w-[260px] z-50">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="font-bold text-gray-900 text-lg">{c.ballot_name}</p>
              <p className="text-gray-500 font-medium">
                {c.party_name} - {t('scatter.list')} {c.list_number}{' '}
                {c.election_year && '(' + c.election_year + ')'}
              </p>
            </div>
            {c.elected && (
              <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded font-bold border border-yellow-200">
                {t('scatter.electedBadge')}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4 bg-gray-50 p-2 rounded">
            <div>
              <p className="text-xs text-gray-500 uppercase">{t('scatter.age')}</p>
              <p className="font-semibold">
                {c.age} {t('scatter.ageSuffix')}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">{t('scatter.status')}</p>
              <p className="font-semibold">
                {c.incumbent ? t('scatter.incumbentStatus') : t('scatter.newStatus')}
              </p>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">{t('scatter.votesObtained')}</span>
              <span className="font-bold">{c.total_votes.toLocaleString('fr-CH')}</span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-gray-600">{t('scatter.relativePerformance')}</span>
              <span className={`font-bold ${perfColor}`}>{c.relative_performance}%</span>
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  const renderElectedShape = (props: ScatterShapeProps) => {
    // eslint-disable-next-line react/prop-types
    const { cx, cy, fill } = props
    return (
      <circle
        cx={cx}
        cy={cy}
        r={7}
        fill={fill}
        stroke="#ffffff"
        strokeWidth={2}
        style={{ filter: 'drop-shadow(0px 2px 2px rgba(0,0,0,0.2))' }}
      />
    )
  }

  const renderDefeatedShape = (props: ScatterShapeProps) => {
    // eslint-disable-next-line react/prop-types
    const { cx, cy, fill } = props
    return <circle cx={cx} cy={cy} r={4} fill={fill} fillOpacity={0.4} />
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 mt-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('scatter.title')}</h2>
      <p className="text-gray-500 mb-6 text-sm max-w-4xl">
        <span>{t('scatter.descriptionStart')} </span>
        <strong>{t('scatter.descriptionBold')}</strong>
        <span> {t('scatter.descriptionEnd')} </span>
        <br />
        <span className="inline-block w-3 h-3 rounded-full bg-blue-500 mr-1 mt-2"></span>{' '}
        {t('scatter.legendElected')} |{' '}
        <span className="inline-block w-2 h-2 rounded-full bg-blue-300 mr-1 opacity-60"></span>{' '}
        {t('scatter.legendNotElected')}
      </p>

      {haveAgeNullCandidates && (
        <div className="p-4 bg-yellow-100 text-yellow-800 rounded-md">
          {t('scatter.birthYearWarning')}
        </div>
      )}

      <div className="h-[600px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />

            <XAxis
              type="number"
              dataKey="age"
              name={t('scatter.xAxisName')}
              domain={[18, 85]}
              ticks={[20, 30, 40, 50, 60, 70, 80]}
              tick={{ fill: '#6b7280' }}
              label={{
                value: t('scatter.xAxisLabel'),
                position: 'bottom',
                fill: '#4b5563',
                offset: 0,
              }}
            />

            <YAxis
              type="number"
              dataKey="relative_performance"
              name={t('scatter.yAxisName')}
              domain={['dataMin - 5', 'dataMax + 5']} // S'adapte magiquement aux vraies valeurs
              tickFormatter={(v) => `${v.toFixed(0)}%`}
              tick={{ fill: '#6b7280' }}
              label={{
                value: 'Performance vs Moyenne de la Liste',
                angle: -90,
                position: 'insideLeft',
                fill: '#4b5563',
                dy: 100,
              }}
            />

            <ZAxis range={[60, 60]} />

            <Tooltip
              content={<CustomTooltip />}
              cursor={{ strokeDasharray: '3 3', stroke: '#94a3b8', strokeWidth: 1 }}
            />

            <Legend wrapperStyle={{ paddingTop: '20px' }} />

            <ReferenceLine
              y={100}
              stroke="#94a3b8"
              strokeWidth={2}
              label={{
                position: 'right',
                value: 'Moyenne du parti',
                fill: '#64748b',
                fontSize: 12,
                fontWeight: 'bold',
              }}
            />

            <Scatter
              name="Femmes (Non-élues)"
              data={womenNotElected}
              fill="#f472b6"
              shape={renderDefeatedShape}
            />
            <Scatter
              name="Hommes (Non-élus)"
              data={menNotElected}
              fill="#60a5fa"
              shape={renderDefeatedShape}
            />

            <Scatter
              name="Femmes (Élues)"
              data={womenElected}
              fill="#ec4899"
              shape={renderElectedShape}
            />
            <Scatter
              name="Hommes (Élus)"
              data={menElected}
              fill="#3b82f6"
              shape={renderElectedShape}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
