import { useMemo } from 'react'
import { useTranslation, Trans } from 'react-i18next'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  TooltipProps,
} from 'recharts'
import { TradeBalanceResult } from '@/lib/types'

type TradeBalanceChartProps = {
  tradeBalanceResult: TradeBalanceResult[]
}

type ChartData = TradeBalanceResult & {
  outgoing_display: number
}

export function TradeBalanceChart({ tradeBalanceResult }: TradeBalanceChartProps) {
  const { t } = useTranslation()
  const data: ChartData[] = useMemo(
    () =>
      tradeBalanceResult.map((party) => ({
        ...party,
        outgoing_display: -Math.abs(party.outgoing_votes),
      })),
    [tradeBalanceResult]
  )

  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      const p = payload[0].payload as ChartData
      const netScore = Number(p.net_score)
      const isPositive = netScore > 0

      return (
        <div className="bg-white p-3 border border-gray-200 shadow-xl rounded-lg text-sm min-w-[220px]">
          <p className="font-bold border-b border-gray-100 pb-2 mb-2 text-gray-800">{label}</p>

          <div className="flex justify-between items-center text-green-600 font-medium py-1">
            <span>{t('tradeBalance.received')} </span>
            <span>+{Number(p.incoming_votes).toLocaleString('fr-CH')}</span>
          </div>

          <div className="flex justify-between items-center text-red-500 font-medium py-1">
            <span>{t('tradeBalance.given')} </span>
            <span>-{Number(p.outgoing_votes).toLocaleString('fr-CH')}</span>
          </div>

          <div
            className={`flex justify-between items-center font-bold mt-2 pt-2 border-t border-gray-100 ${isPositive ? 'text-green-600' : 'text-red-500'}`}
          >
            <span>{t('tradeBalance.netBalance')}</span>
            <span>
              {isPositive ? '+' : ''}
              {netScore.toLocaleString('fr-CH')}
            </span>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('tradeBalance.title')}</h2>
      <p className="text-gray-500 mb-6 text-sm max-w-3xl">
        {t('tradeBalance.descriptionStart')} <br />
        <Trans
          i18nKey="tradeBalance.descriptionLine2"
          components={{
            green: <span className="text-green-500 font-bold" />,
            red: <span className="text-red-400 font-bold" />,
          }}
        />
      </p>

      <div className="h-[450px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          {/* stackOffset="sign" permet de gérer parfaitement l'empilement avec du négatif */}
          <BarChart
            data={data}
            stackOffset="sign"
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="party_name" tick={{ fill: '#4b5563', fontWeight: 600 }} />

            <YAxis
              tickFormatter={(val) => Math.abs(val).toLocaleString('fr-CH')}
              tick={{ fill: '#4b5563' }}
            />

            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />

            <ReferenceLine y={0} stroke="#000" strokeWidth={2} />

            <Bar
              dataKey="incoming_votes"
              name={t('tradeBalance.incomingVotes')}
              fill="#10b981"
              radius={[4, 4, 0, 0]}
              stackId="stack"
            />
            <Bar
              dataKey="outgoing_display"
              name={t('tradeBalance.outgoingVotes')}
              fill="#ef4444"
              radius={[0, 0, 4, 4]}
              stackId="stack"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
