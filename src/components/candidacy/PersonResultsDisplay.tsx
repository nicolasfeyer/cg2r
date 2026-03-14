import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CandidateEvolutionPanachage, ListsMetaResponse, PartyMeta } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
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
import { DataKey } from 'recharts/types/util/types'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

interface PersonResultsDisplayProps {
  data: CandidateEvolutionPanachage
  name: string
  listsMeta: ListsMetaResponse
  getPartyMetaFromYear: (year: number, party_id: number) => PartyMeta | null
}

type ChartDataRow = {
  year: number
  [key: string]: number | string | undefined
}

interface CustomizedDotProps {
  cx?: number
  cy?: number
  payload?: { year: number; [key: string]: unknown }
  dataKey?: string
  getGroupInfoByYear: (
    year: number,
    groupId: string
  ) => { name: string; color: string; isAlliance: boolean }
  value?: number | null
}

// 1. COMPOSANT POUR COLORER LES POINTS DYNAMIQUEMENT SELON L'ANNÉE
const CustomizedDot = (props: CustomizedDotProps) => {
  const { cx, cy, payload, dataKey, getGroupInfoByYear, value } = props
  // LE FIX : Si la valeur est absente (null ou undefined), on ne rend RIEN
  if (value === null || value === undefined || !payload) {
    return null
  }
  const year = payload.year
  const info = getGroupInfoByYear(year, dataKey!)

  return <circle cx={cx} cy={cy} r={4} stroke={info.color} strokeWidth={2} fill="#fff" />
}

export function PersonResultsDisplay({
  data,
  name,
  getPartyMetaFromYear,
}: PersonResultsDisplayProps) {
  const { t } = useTranslation()
  const [showOwnParty, setShowOwnParty] = useState(false)
  const yearsDesc = Object.keys(data).sort((a, b) => b.localeCompare(a))

  // 2. LA FONCTION MAGIQUE : Calcule le nom et la couleur exacts à une année précise (Évite les NaN et les anachronismes)
  const getGroupInfoByYear = useCallback(
    (year: number, groupId: string) => {
      if (groupId === 'S/EN-T.') {
        return { name: 'Sans en-tête', color: '#94a3b8', isAlliance: false }
      }

      if (groupId.includes('-')) {
        const ids = groupId.split('-').map((id) => parseInt(id, 10))

        const names = ids.map((id) => {
          const meta = getPartyMetaFromYear(year, id)
          // Fallback ultra-sécurisé pour éviter les NaN
          return meta?.short_name || meta?.name || `Parti ${id}`
        })

        const firstParty = getPartyMetaFromYear(year, ids[0])
        return {
          name: names.join(' + '),
          color: firstParty?.color || '#999',
          isAlliance: true,
        }
      }

      const party = getPartyMetaFromYear(year, parseInt(groupId, 10))
      return {
        name: party?.short_name || party?.name || `Parti ${groupId}`,
        color: party?.color || '#ccc',
        isAlliance: false,
      }
    },
    [getPartyMetaFromYear]
  )

  // 3. Préparation des données pour le graphique (Aplatissement)
  const { chartData, meta, transitionLines } = useMemo(() => {
    const rawData: ChartDataRow[] = []
    const allGroupIds = new Set<string>()
    const yearsAsc = Object.keys(data).sort((a, b) => a.localeCompare(b))

    yearsAsc.forEach((yearStr) => {
      const year = parseInt(yearStr, 10)
      const candidate = data[yearStr].candidate
      const row: ChartDataRow = { year }

      Object.entries(candidate.panachage).forEach(([groupId, voteData]) => {
        if (voteData && voteData.votes > 0) {
          // Filtre du propre parti
          if (!showOwnParty && groupId === candidate.party_group) return

          row[groupId] = voteData.score
          row[`${groupId}_votes`] = voteData.votes
          allGroupIds.add(groupId)
        }
      })

      if (candidate.sans_entete && candidate.sans_entete.votes > 0) {
        row['S/EN-T.'] = candidate.sans_entete.score
        row[`S/EN-T._votes`] = candidate.sans_entete.votes
        allGroupIds.add('S/EN-T.')
      }

      rawData.push(row)
    })

    // On génère la méta globale pour les LIGNES (On prend l'info de l'année la plus récente pour la légende)
    const computedMeta: { key: string; name: string; color: string; isAlliance: boolean }[] = []
    allGroupIds.forEach((groupId) => {
      const yearRow = [...rawData].reverse().find((row) => row[groupId] !== undefined)
      const year = yearRow ? yearRow.year : new Date().getFullYear()
      const info = getGroupInfoByYear(year, groupId)
      computedMeta.push({
        key: groupId,
        name: info.name,
        color: info.color,
        isAlliance: info.isAlliance,
      })
    })

    // Lignes de transition d'alliance (Les pointillés)
    const dataCopy = JSON.parse(JSON.stringify(rawData))
    const transLines: { key: string; color: string }[] = []
    const alliances = computedMeta.filter((m) => m.isAlliance)

    alliances.forEach((alliance) => {
      const partyKeys = alliance.key.split('-')

      partyKeys.forEach((partyKey: string) => {
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

    return { chartData: dataCopy, meta: computedMeta, transitionLines: transLines }
  }, [data, getGroupInfoByYear, showOwnParty])

  // 4. L'INFOBULLE 100% DYNAMIQUE
  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      const year = Number(label)
      const validPayload = payload.filter((p) => !String(p.dataKey).startsWith('trans_'))
      const sortedPayload = [...validPayload].sort(
        (a, b) => (b.value as number) - (a.value as number)
      )

      return (
        <div className="bg-white p-4 border border-gray-200 shadow-xl rounded-lg text-sm min-w-[240px] z-50">
          <p className="font-bold text-gray-800 border-b border-gray-100 pb-2 mb-2 text-lg">
            {t('person.electionOf', { year })}
          </p>
          <div className="flex flex-col gap-2">
            {sortedPayload.map((entry, index) => {
              const groupId = String(entry.dataKey)

              // C'EST ICI LA MAGIE : On recalcule le nom et la couleur pour CETTE année précise survolée
              const info = getGroupInfoByYear(year, groupId)

              const payloadRow = entry.payload as ChartDataRow
              const absoluteVotes = payloadRow[`${groupId}_votes`]

              return (
                <div key={index} className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full shadow-sm"
                      style={{ backgroundColor: info.color }}
                    />
                    <span className="font-medium text-gray-700">{info.name}</span>
                    {info.isAlliance && (
                      <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 rounded font-bold">
                        ALLIANCE
                      </span>
                    )}
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                      {absoluteVotes} {t('person.votes')}
                    </span>
                    <span className="font-bold text-gray-900 min-w-[3rem]">
                      {Number(entry.value).toFixed(2)}%
                    </span>
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

  if (yearsDesc.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6 text-center text-muted-foreground">
          {t('person.noHistoryFound', { name })}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="w-full space-y-6">
      {yearsDesc.length > 1 && (
        <Card className="w-full shadow-sm">
          <CardHeader className="flex flex-row items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl text-primary">
                {t('person.electoralAttractiveness')}
              </CardTitle>
              <p className="text-muted-foreground">
                {t('person.electoralAttractivenessDesc', { name })}
              </p>
            </div>
            <div className="flex items-center space-x-2 bg-muted/50 p-2 rounded-lg border">
              <Switch
                id="toggle-own-party"
                checked={showOwnParty}
                onCheckedChange={setShowOwnParty}
              />
              <Label htmlFor="toggle-own-party" className="cursor-pointer">
                {t('person.showOwnList')}
              </Label>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                  {/* 5. SVG GRADIENTS : Permet à la ligne de changer de couleur doucement entre deux élections */}
                  <defs>
                    {meta.map((m) => (
                      <linearGradient
                        key={`grad-${m.key}`}
                        id={`color-${m.key}`}
                        x1="0"
                        y1="0"
                        x2="1"
                        y2="0"
                      >
                        {chartData.map((entry: ChartDataRow, index: number) => {
                          const info = getGroupInfoByYear(entry.year, m.key)
                          const offset =
                            chartData.length > 1 ? (index / (chartData.length - 1)) * 100 : 0
                          return <stop key={index} offset={`${offset}%`} stopColor={info.color} />
                        })}
                      </linearGradient>
                    ))}
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis
                    dataKey="year"
                    tick={{ fill: '#4b5563', fontWeight: 'bold' }}
                    padding={{ left: 30, right: 30 }}
                  />
                  <YAxis tick={{ fill: '#4b5563' }} tickFormatter={(val) => `${val}%`} />

                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ stroke: '#cbd5e1', strokeWidth: 2 }}
                  />

                  <Legend
                    wrapperStyle={{ paddingTop: '20px' }}
                    formatter={(value, entry: { dataKey?: DataKey<string> }) => {
                      const entryMeta = meta.find((m) => m.key === entry.dataKey)
                      return (
                        <span className="text-gray-700 font-medium">
                          {entryMeta?.name || value}
                        </span>
                      )
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
                      // On applique le dégradé dynamique défini dans <defs>
                      stroke={`url(#color-${lineMeta.key})`}
                      strokeWidth={3}
                      // Le point est rendu par notre composant custom pour avoir la couleur exacte de l'année
                      dot={
                        <CustomizedDot
                          getGroupInfoByYear={getGroupInfoByYear}
                          dataKey={lineMeta.key}
                        />
                      }
                      activeDot={{ r: 7, strokeWidth: 0 }}
                      connectNulls={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* SECTION HISTORIQUE DÉTAILLÉ (Tableaux) */}
      <div className="space-y-8">
        <Card className="w-full shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl text-primary">{t('person.candidacyHistory')}</CardTitle>
            <p className="text-muted-foreground">{t('person.candidacyHistoryDesc')}</p>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {yearsDesc.map((yearStr, index) => {
              const year = parseInt(yearStr, 10)
              const election = data[yearStr]
              const candidate = election.candidate

              return (
                <React.Fragment key={yearStr}>
                  <p className="font-semibold flex items-center gap-2">
                    <span className="text-lg">{election.election_name}</span>
                    {candidate.incumbent && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        {t('person.incumbent')}
                      </Badge>
                    )}
                    {candidate.elected && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        {t('person.elected')}
                      </Badge>
                    )}
                    {(candidate as { performance_score?: number }).performance_score !==
                      undefined && (
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                        {(
                          (candidate as { performance_score?: number }).performance_score! * 100
                        ).toFixed(1)}
                        %
                      </Badge>
                    )}
                  </p>
                  <p className="text-muted-foreground text-sm mb-4">{candidate.profession}</p>

                  <Table className="min-w-full">
                    <TableHeader>
                      <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <TableHead className="w-[60px]">{t('person.candidateNumber')}</TableHead>
                        <TableHead className="min-w-[150px]">
                          {t('person.candidateHeader')}
                        </TableHead>
                        <TableHead className="text-right font-semibold">
                          {t('person.compactHeader')}
                        </TableHead>

                        {/* Rendu des colonnes : on génère le nom correct pour CETTE année */}
                        {election.headers.map((groupId) => {
                          const info = getGroupInfoByYear(year, groupId)
                          return (
                            <TableHead key={groupId} className="text-right whitespace-nowrap">
                              {info.name.toUpperCase()}
                            </TableHead>
                          )
                        })}

                        <TableHead className="text-right whitespace-nowrap text-muted-foreground">
                          {t('person.withoutHeader')}
                        </TableHead>
                        <TableHead className="text-right font-bold text-primary">TOTAL</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow className="hover:bg-transparent">
                        <TableCell className="font-medium text-muted-foreground">
                          {candidate.number}
                        </TableCell>
                        <TableCell className="font-bold whitespace-nowrap">
                          {candidate.name}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {candidate.compact}
                        </TableCell>

                        {election.headers.map((party) => {
                          const panachageData = candidate.panachage[party]
                          const votes = panachageData?.votes ?? 0
                          return (
                            <TableCell
                              key={party}
                              className={`text-right ${votes !== 0 ? 'font-medium' : 'text-muted-foreground/40'}`}
                            >
                              {votes}
                            </TableCell>
                          )
                        })}

                        <TableCell className="text-right text-muted-foreground font-medium">
                          {candidate.sans_entete?.votes ?? 0}
                        </TableCell>

                        <TableCell className="text-right">
                          <Badge variant="default" className="text-sm px-3 py-1">
                            {candidate.total}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                  {index < yearsDesc.length - 1 && <Separator className="my-8" />}
                </React.Fragment>
              )
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
