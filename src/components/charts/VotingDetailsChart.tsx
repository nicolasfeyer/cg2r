import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps,
} from 'recharts'
import { VotingDetails } from '@/lib/types'

type VotingDetailsChartProps = {
  votingDetails: VotingDetails[]
}

type EnrichedPartyData = VotingDetails & {
  total: number
  pct_nomin_modified: number
  pct_nomin_without_header: number
  pct_nomin_compact: number
  pct_compl_compact: number
  pct_compl_modified: number
}

export function VotingDetailsChart({ votingDetails }: VotingDetailsChartProps) {
  const { t } = useTranslation()
  const [viewMode, setViewMode] = useState<'proportional' | 'absolute'>('proportional')

  const enrichedData: EnrichedPartyData[] = useMemo(() => {
    return votingDetails.map((party) => {
      const nomin_modified = Number(party.nomin_modified) || 0
      const nomin_without_header = Number(party.nomin_without_header) || 0
      const nomin_compact = Number(party.nomin_compact) || 0
      const compl_compact = Number(party.compl_compact) || 0
      const compl_modified = Number(party.compl_modified) || 0

      const total =
        nomin_modified + nomin_without_header + nomin_compact + compl_compact + compl_modified

      return {
        ...party,
        total,
        pct_nomin_modified: total > 0 ? (nomin_modified / total) * 100 : 0,
        pct_nomin_without_header: total > 0 ? (nomin_without_header / total) * 100 : 0,
        pct_nomin_compact: total > 0 ? (nomin_compact / total) * 100 : 0,
        pct_compl_compact: total > 0 ? (compl_compact / total) * 100 : 0,
        pct_compl_modified: total > 0 ? (compl_modified / total) * 100 : 0,
      }
    })
  }, [votingDetails])

  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      const partyData = payload[0].payload as EnrichedPartyData

      return (
        <div className="bg-white p-3 border border-gray-200 shadow-lg rounded-lg text-sm">
          <p className="font-bold border-b border-gray-100 pb-2 mb-2">
            {label}{' '}
            <span className="font-normal text-gray-500 text-xs ml-1">
              ({partyData.total.toLocaleString('fr-CH')} {t('votingDetails.votesCount')})
            </span>
          </p>

          {payload.map((entry, index) => {
            let absVal = 0,
              pctVal = 0

            // Adaptation here: map the dataKey to the correct fields in EnrichedPartyData
            if (entry.dataKey) {
              const key = String(entry.dataKey)
              if (key.includes('nomin_compact')) {
                absVal = partyData.nomin_compact
                pctVal = partyData.pct_nomin_compact
              } else if (key.includes('compl_compact')) {
                absVal = partyData.compl_compact
                pctVal = partyData.pct_compl_compact
              } else if (key.includes('nomin_modified')) {
                absVal = partyData.nomin_modified
                pctVal = partyData.pct_nomin_modified
              } else if (key.includes('compl_modified')) {
                absVal = partyData.compl_modified
                pctVal = partyData.pct_compl_modified
              } else if (key.includes('without_header')) {
                absVal = partyData.nomin_without_header
                pctVal = partyData.pct_nomin_without_header
              }
            }

            return (
              <div
                key={index}
                className="flex items-center justify-between gap-6 py-1"
                style={{ color: entry.color }}
              >
                <span className="font-medium">{entry.name}</span>
                <div className="text-right">
                  <span className="font-bold text-gray-800">{pctVal.toFixed(1)}%</span>
                  <span className="text-gray-500 text-xs ml-2">
                    ({absVal.toLocaleString('fr-CH')})
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )
    }
    return null
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div className="mb-4 md:mb-0">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('votingDetails.title')}</h2>
          <p className="text-gray-500 text-sm max-w-2xl">{t('votingDetails.description')}</p>
        </div>

        <div className="flex bg-gray-100 p-1 rounded-lg shrink-0">
          <button
            onClick={() => setViewMode('proportional')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              viewMode === 'proportional'
                ? 'bg-white shadow text-blue-700'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {t('votingDetails.proportional')}
          </button>
          <button
            onClick={() => setViewMode('absolute')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              viewMode === 'absolute'
                ? 'bg-white shadow text-blue-700'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {t('votingDetails.absolute')}
          </button>
        </div>
      </div>

      <div className="h-96 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={enrichedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="short_label" tick={{ fill: '#4b5563' }} />{' '}
            {/* Use short_label instead of party_name */}
            <YAxis
              tick={{ fill: '#4b5563' }}
              tickFormatter={(val) =>
                viewMode === 'proportional' ? `${val}%` : val.toLocaleString('fr-CH')
              }
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f3f4f6' }} />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            <Bar
              dataKey={
                viewMode === 'proportional' ? 'pct_nomin_without_header' : 'nomin_without_header'
              }
              name={t('votingDetails.legendNominWithoutHeader')}
              stackId="a"
              fill="#10b981"
              radius={viewMode === 'absolute' ? [4, 4, 0, 0] : [0, 0, 0, 0]}
            />
            <Bar
              dataKey={viewMode === 'proportional' ? 'pct_nomin_compact' : 'nomin_compact'}
              name={t('votingDetails.legendNominModified')}
              stackId="a"
              fill="#93c5fd"
            />
            <Bar
              dataKey={viewMode === 'proportional' ? 'pct_nomin_modified' : 'nomin_modified'}
              name={t('votingDetails.legendNominCompact')}
              stackId="a"
              fill="#60a5fa"
            />
            <Bar
              dataKey={viewMode === 'proportional' ? 'pct_compl_modified' : 'compl_modified'}
              name={t('votingDetails.legendComplModified')}
              stackId="a"
              fill="#3b82f6"
            />
            <Bar
              dataKey={viewMode === 'proportional' ? 'pct_compl_compact' : 'compl_compact'}
              name={t('votingDetails.legendComplCompact')}
              stackId="a"
              fill="#1e3a8a"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
