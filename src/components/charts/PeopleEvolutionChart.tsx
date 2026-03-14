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
import { ListsMetaResponse, PeopleEvolutionData, LineMeta, PartyMeta } from '@/lib/types.ts'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { DataKey } from 'recharts/types/util/types'

type PeopleEvolutionChartProps = {
  data: PeopleEvolutionData | undefined
  listsMeta: ListsMetaResponse | undefined
  getPartyMetaFromYear: (year: number, party_id: number) => PartyMeta | null
}

type PersonTooltipData = {
  id: string
  name: string
  partyId: number | null
}

type ChartDataRow = {
  year: number
  peopleDetails: Record<string, PersonTooltipData[]>
  [key: string]: number | string | Record<string, PersonTooltipData[]>
}

export function PeopleEvolutionChart({
  data,
  listsMeta,
  getPartyMetaFromYear,
}: PeopleEvolutionChartProps) {
  const { t } = useTranslation()
  const { enrichedData, meta, groupToListMap, transitionLines } = useMemo(() => {
    if (!data?.evolution || !listsMeta) {
      return { enrichedData: [], meta: [], groupToListMap: {}, transitionLines: [] }
    }

    const rawData: ChartDataRow[] = []
    const allGroupIds = new Set<string>()
    const groupToListMap: Record<string, Record<number, number>> = {} // map groupId -> year -> listId

    Object.entries(data.evolution).forEach(([yearStr, candidates]) => {
      const year = parseInt(yearStr, 10)
      const row: ChartDataRow = { year, peopleDetails: {} }

      Object.entries(candidates).forEach(([personId, entry]) => {
        if (!entry.elected) return

        const groupId =
          entry.party_ids && entry.party_ids.length > 0
            ? entry.party_ids.join('-')
            : `indep_${entry.list_id}`

        allGroupIds.add(groupId)

        if (!row[groupId]) {
          row[groupId] = 0
        }
        row[groupId] = (row[groupId] as number) + 1

        if (!groupToListMap[groupId]) groupToListMap[groupId] = {}
        groupToListMap[groupId][year] = entry.list_id

        if (!row.peopleDetails[groupId]) {
          row.peopleDetails[groupId] = []
        }
        row.peopleDetails[groupId].push({
          id: personId,
          name: data.people[personId]?.name || personId,
          partyId:
            entry.party_if_alliance !== null
              ? entry.party_if_alliance
              : entry.party_ids.length === 1
                ? entry.party_ids[0]
                : null,
        })
      })

      rawData.push(row)
    })

    rawData.sort((a, b) => a.year - b.year)

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
        const lMeta = listsMeta[listId]
        if (lMeta) {
          name = lMeta.list_label
          color = lMeta.color
          isIndependent = true
        }
      } else {
        if (groupId.includes('-')) {
          isAlliance = true
          const ids = groupId.split('-').map((id) => parseInt(id, 10))
          name = ids.map((id) => getPartyMetaFromYear(year, id)?.name || id.toString()).join(' + ')

          // Determine color for alliance: find latest listId for this group to get the list color
          let latestYear = 0
          let latestListId: number | null = null
          for (const yearStr in groupToListMap[groupId]) {
            const y = parseInt(yearStr, 10)
            if (y > latestYear) {
              latestYear = y
              latestListId = groupToListMap[groupId][y]
            }
          }
          if (latestListId && listsMeta[latestListId]) {
            color = listsMeta[latestListId].color
          } else {
            const firstParty = getPartyMetaFromYear(year, ids[0])
            color = firstParty ? firstParty.color : '#999'
          }
        } else {
          const partyId = parseInt(groupId, 10)
          const pMeta = getPartyMetaFromYear(year, partyId)
          if (pMeta) {
            name = pMeta.name
            color = pMeta.color
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

    const dataCopy = JSON.parse(JSON.stringify(rawData))
    const transLines: { key: string; color: string }[] = []
    const alliances = computedMeta.filter((m) => m.isAlliance)

    alliances.forEach((alliance) => {
      const partyKeys = alliance.key.split('-')

      partyKeys.forEach((partyKey) => {
        const partyMeta = computedMeta.find((m) => m.key === partyKey)
        const color = partyMeta ? partyMeta.color : alliance.color

        for (let i = 0; i < dataCopy.length - 1; i++) {
          const currentYear = dataCopy[i]
          const nextYear = dataCopy[i + 1]

          if (currentYear[partyKey] !== undefined && nextYear[alliance.key] !== undefined) {
            const transKey = `trans_${partyKey}_to_${alliance.key}_${currentYear.year}`
            currentYear[transKey] = currentYear[partyKey]
            nextYear[transKey] = nextYear[alliance.key]
            transLines.push({ key: transKey, color })
          }

          if (currentYear[alliance.key] !== undefined && nextYear[partyKey] !== undefined) {
            const transKey = `trans_${alliance.key}_to_${partyKey}_${currentYear.year}`
            currentYear[transKey] = currentYear[alliance.key]
            nextYear[transKey] = nextYear[partyKey]
            transLines.push({ key: transKey, color })
          }
        }
      })
    })

    return {
      enrichedData: dataCopy,
      meta: computedMeta,
      groupToListMap,
      transitionLines: transLines,
    }
  }, [data, getPartyMetaFromYear, listsMeta])

  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length && meta) {
      const validPayload = payload.filter((p) => !String(p.dataKey).startsWith('trans_'))
      const sortedPayload = [...validPayload].sort(
        (a, b) => (b.value as number) - (a.value as number)
      )

      return (
        <div className="bg-white p-4 border border-gray-200 shadow-xl rounded-lg text-sm min-w-[280px] z-50">
          <p className="font-bold text-gray-800 border-b border-gray-100 pb-2 mb-2 text-lg">
            {t('peopleEvolution.legislature', { label })}
          </p>
          <div className="flex flex-col gap-4">
            {sortedPayload.map((entry, index) => {
              const entryMeta = meta.find((m) => m.key === entry.dataKey)
              const payloadRow = entry.payload as ChartDataRow
              const people = payloadRow.peopleDetails[entry.dataKey as string] || []
              let displayName = entryMeta?.name || entry.name

              // Calculate displayName using groupToListMap if available to get the exact list_label
              if (
                groupToListMap[entry.dataKey as string] &&
                groupToListMap[entry.dataKey as string][payloadRow.year]
              ) {
                const listId = groupToListMap[entry.dataKey as string][payloadRow.year]
                if (listsMeta && listsMeta[listId]) {
                  displayName = listsMeta[listId].list_label
                }
              }

              return (
                <div key={index} className="flex flex-col">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full shadow-sm border border-gray-200"
                        style={{ backgroundColor: entry.color }}
                      ></div>
                      <span className="font-bold text-gray-800">{displayName}</span>
                      {entryMeta?.isAlliance && (
                        <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 rounded font-bold">
                          ALLIANCE
                        </span>
                      )}
                    </div>
                    <span className="font-bold text-gray-900 ml-4">{entry.value}</span>
                  </div>
                  <div className="pl-5 text-xs text-gray-600 space-y-1">
                    {people.map((person) => {
                      const partyMeta = person.partyId
                        ? getPartyMetaFromYear(payloadRow.year, person.partyId)
                        : null
                      const partyName = partyMeta ? partyMeta.short_name || partyMeta.name : ''
                      return (
                        <div key={person.id} className="flex justify-between gap-4">
                          <span>{person.name}</span>
                          {partyName && (
                            <span className="font-medium text-gray-400 whitespace-nowrap">
                              {partyName}
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
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
      <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('peopleEvolution.title')}</h2>
      <p className="text-gray-500 mb-8 text-sm max-w-4xl">{t('peopleEvolution.description')}</p>

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
                value: t('peopleEvolution.yAxisLabel'),
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

            {transitionLines.map((line) => (
              <Line
                key={line.key}
                type="monotone"
                dataKey={line.key}
                stroke={line.color}
                strokeWidth={2}
                strokeOpacity={0.6}
                strokeDasharray="4 4"
                dot={false}
                activeDot={false}
                legendType="none"
              />
            ))}

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
                connectNulls={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
