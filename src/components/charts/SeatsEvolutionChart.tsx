import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  TooltipProps,
  XAxis,
  YAxis,
} from 'recharts'
import { ListsMetaResponse, PartyMeta, SeatsEvolutionResponse, LineMeta } from '@/lib/types.ts'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { DataKey } from 'recharts/types/util/types'

type SeatsEvolutionChartProps = {
  evolution: SeatsEvolutionResponse | undefined
  listsMeta: ListsMetaResponse | undefined
  getPartyMetaFromYear: (year: number, party_id: number) => PartyMeta | null
}

type ChartDataRow = {
  year: number
  [key: string]: number | string
}

export function SeatsEvolutionChart({
  evolution,
  listsMeta,
  getPartyMetaFromYear,
}: SeatsEvolutionChartProps) {
  const { t } = useTranslation()
  const { enrichedData, meta, transitionLines } = useMemo(() => {
    if (!evolution || !listsMeta) {
      return { enrichedData: [], meta: [], transitionLines: [] }
    }

    // 1. Transform structure: Record<Year, Record<GroupId, Entry>> -> Array<{year: number, [groupId]: seats}>
    // AND collect all unique groupIds to build meta

    // Use a type that allows dynamic keys for groups
    type ChartDataRow = {
      year: number
      [key: string]: number | string
    }

    const rawData: ChartDataRow[] = []
    const allGroupIds = new Set<string>()

    Object.entries(evolution).forEach(([yearStr, groups]) => {
      const year = parseInt(yearStr, 10)
      const row: ChartDataRow = { year }

      Object.entries(groups).forEach(([groupId, entry]) => {
        row[groupId] = entry.seats
        if (entry.listId && listsMeta) {
          const distinctMeta = listsMeta[entry.listId]
          if (distinctMeta) {
            row[`label_${groupId}`] = distinctMeta.list_label
          }
        }

        allGroupIds.add(groupId)
      })

      rawData.push(row)
    })

    // Sort by year
    rawData.sort((a, b) => a.year - b.year)

    // 2. Build Meta
    const computedMeta: LineMeta[] = []

    allGroupIds.forEach((groupId) => {
      let name = groupId
      let color = '#ccc'
      let isIndependent = false
      let isAlliance = false

      // Find a year where this group existed in the data to fetch its metadata
      const yearRow = rawData.find((row) => row[groupId] !== undefined)
      const year = yearRow ? yearRow.year : new Date().getFullYear()

      if (groupId.startsWith('indep_')) {
        const listId = parseInt(groupId.replace('indep_', ''), 10)
        const meta = listsMeta[listId]
        if (meta) {
          name = meta.list_label
          color = meta.color
          isIndependent = true
        }
      } else {
        // CHANGED: Handle standard parties and alliances (keys are just "1", "2", "1-6", etc.)
        // No 'party_' prefix check needed.

        // Check if it's an alliance
        if (groupId.includes('-')) {
          isAlliance = true

          // Split directly, no replace needed
          const ids = groupId.split('-').map((id) => parseInt(id, 10))
          const names = ids
            .map((id) => getPartyMetaFromYear(year, id)?.name || id.toString())
            .join(' + ')
          const firstParty = getPartyMetaFromYear(year, ids[0])
          color = firstParty ? firstParty.color : '#999'
          name = names
        } else {
          // Standard party
          const meta = getPartyMetaFromYear(year, parseInt(groupId, 10))
          if (meta) {
            name = meta.name
            color = meta.color
          }
        }
      }

      computedMeta.push({
        key: groupId,
        name,
        color,
        isIndependent,
        isAlliance,
      })
    })

    // 3. Logic "transitionLines"
    const dataCopy = JSON.parse(JSON.stringify(rawData))
    const transLines: { key: string; color: string }[] = []

    // On isole les alliances
    const alliances = computedMeta.filter((m) => m.isAlliance)

    alliances.forEach((alliance) => {
      const partyKeys = alliance.key
        // CHANGED: No replace needed, just split
        .split('-')
        // CHANGED: Don't add 'party_' prefix back, use simple ID
        .map((id) => id)

      partyKeys.forEach((partyKey) => {
        const partyMeta = computedMeta.find((m) => m.key === partyKey)
        const color = partyMeta ? partyMeta.color : alliance.color

        for (let i = 0; i < dataCopy.length - 1; i++) {
          const currentYear = dataCopy[i]
          const nextYear = dataCopy[i + 1]

          // CAS 1 : FUSION
          if (currentYear[partyKey] !== undefined && nextYear[alliance.key] !== undefined) {
            const transKey = `trans_${partyKey}_to_${alliance.key}_${currentYear.year}`
            currentYear[transKey] = currentYear[partyKey]
            nextYear[transKey] = nextYear[alliance.key]
            transLines.push({ key: transKey, color })
          }

          // CAS 2 : SCISSION
          if (currentYear[alliance.key] !== undefined && nextYear[partyKey] !== undefined) {
            const transKey = `trans_${alliance.key}_to_${partyKey}_${currentYear.year}`
            currentYear[transKey] = currentYear[alliance.key]
            nextYear[transKey] = nextYear[partyKey]
            transLines.push({ key: transKey, color })
          }
        }
      })
    })

    return { enrichedData: dataCopy, meta: computedMeta, transitionLines: transLines }
  }, [evolution, getPartyMetaFromYear, listsMeta])

  // L'infobulle modifiée pour IGNORER nos lignes fantômes
  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length && meta) {
      const validPayload = payload.filter((p) => !String(p.dataKey).startsWith('trans_'))
      const sortedPayload = [...validPayload].sort(
        (a, b) => (b.value as number) - (a.value as number)
      )

      return (
        <div className="bg-white p-4 border border-gray-200 shadow-xl rounded-lg text-sm min-w-[220px] z-50">
          <p className="font-bold text-gray-800 border-b border-gray-100 pb-2 mb-2 text-lg">
            {t('seatsEvolution.legislature', { label })}
          </p>
          <div className="flex flex-col gap-2">
            {sortedPayload.map((entry, index) => {
              const entryMeta = meta.find((m) => m.key === entry.dataKey)

              const payloadRow = entry.payload as ChartDataRow
              const specificLabel = payloadRow[`label_${entry.dataKey}`]

              const displayName = specificLabel || entryMeta?.name || entry.name

              return (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full shadow-sm border border-gray-200"
                      style={{ backgroundColor: entry.color }}
                    ></div>
                    <span className="font-medium text-gray-700">{displayName}</span>

                    {entryMeta?.isAlliance && (
                      <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 rounded font-bold">
                        ALLIANCE
                      </span>
                    )}
                    {entryMeta?.isIndependent && (
                      <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 rounded font-bold">
                        IND
                      </span>
                    )}
                  </div>
                  <span className="font-bold text-gray-900 ml-4">{entry.value}</span>
                </div>
              )
            })}
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 mt-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('seatsEvolution.title')}</h2>
      <p className="text-gray-500 mb-8 text-sm max-w-4xl">
        {t('seatsEvolution.description')} <strong>{t('seatsEvolution.alliancesBold')}</strong>{' '}
        {t('seatsEvolution.descriptionMiddle')}{' '}
        <strong>{t('seatsEvolution.independentBold')}</strong> {t('seatsEvolution.descriptionEnd')}
      </p>

      <div className="h-[650px] md:h-[500px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={enrichedData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
            <XAxis
              dataKey="year"
              tick={{ fill: '#4b5563', fontWeight: 'bold' }}
              padding={{ left: 30, right: 30 }}
            />
            <YAxis
              tick={{ fill: '#4b5563' }}
              label={{
                value: t('seatsEvolution.yAxisLabel'),
                angle: -90,
                position: 'insideLeft',
                fill: '#6b7280',
              }}
            />

            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 2 }} />

            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              formatter={(value, entry: { dataKey?: DataKey<string> }) => {
                const entryMeta = meta.find((m) => m.key === entry.dataKey)
                return <span className="text-gray-700 font-medium">{entryMeta?.name || value}</span>
              }}
            />

            {/* 1. ON DESSINE D'ABORD LES LIGNES DE TRANSITION (Au fond) */}
            {transitionLines.map((line) => (
              <Line
                key={line.key}
                type="monotone"
                dataKey={line.key}
                stroke={line.color}
                strokeWidth={2}
                strokeOpacity={0.6} // Légèrement transparent pour ne pas voler la vedette
                strokeDasharray="4 4" // Bien en pointillé
                dot={false} // Pas de point sur les transitions
                activeDot={false} // Ne réagit pas à la souris
                legendType="none" // N'apparaît pas dans la légende en bas
              />
            ))}

            {/* 2. ON DESSINE ENSUITE LES VRAIS PARTIS (Par dessus) */}
            {meta.map((lineMeta) => (
              <Line
                key={lineMeta.key}
                type="monotone"
                dataKey={lineMeta.key}
                name={lineMeta.key}
                stroke={lineMeta.color}
                strokeWidth={lineMeta.isIndependent ? 0 : 3}
                dot={{
                  r: lineMeta.isIndependent ? 6 : 4,
                  strokeWidth: 2,
                  fill: '#fff',
                  stroke: lineMeta.color,
                }}
                activeDot={{ r: 7, strokeWidth: 0, fill: lineMeta.color }}
                connectNulls={false} // Ultra important pour que les alliances cassent la courbe !
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
