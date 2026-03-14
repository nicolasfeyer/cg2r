import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip.tsx'
import { CaretDownIcon, CaretUpIcon } from '@phosphor-icons/react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '@/components/ui/card.tsx'
import { Skeleton } from '@/components/ui/skeleton.tsx'
import { ElectionCandidateResult, ElectionList, PartyMeta } from '@/lib/types.ts'
import { cn } from '@/lib/utils'

type DetailsResultsProps = {
  candidates: ElectionCandidateResult[]
  lists: ElectionList[]
  candidatesLoading: boolean
  selectedList: string
  electedSeats: number
  getPartyMetaFromSelectedYear: (party_id: number) => PartyMeta | null
}

type TableColumn = { id: string; label: string; name: string }

export function DetailsResults({
  candidates,
  lists,
  candidatesLoading,
  selectedList,
  electedSeats,
  getPartyMetaFromSelectedYear,
}: DetailsResultsProps) {
  const { t } = useTranslation()
  const [sortColumn, setSortColumn] = useState<string>('total')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('desc')
    }
  }

  const getNumericValue = (candidate: ElectionCandidateResult, colId: string): number | null => {
    const listValue = candidate.list_votes?.[Number(colId)]
    if (typeof listValue === 'number' && Number.isFinite(listValue)) return listValue

    const fixedValue = (candidate as unknown as Record<string, unknown>)[colId]
    if (typeof fixedValue === 'number' && Number.isFinite(fixedValue)) return fixedValue

    const parsed = Number(fixedValue)
    return Number.isFinite(parsed) ? parsed : null
  }

  const tableColumns = useMemo<TableColumn[]>(() => {
    if (candidates.length === 0) return []

    const firstRow = candidates[0]
    const dynamicListsNo = Object.keys(firstRow.list_votes)

    const dynamicListColumns = dynamicListsNo.map((listNo) => {
      const list = lists.find((l) => l.list_number.toString() === listNo)
      return {
        id: listNo,
        name: list?.short_label || `Liste ${listNo}`,
        label: list?.list_label || `Liste ${listNo}`,
      }
    })

    const fixedColumns: TableColumn[] = [
      { id: 'without_header', name: 's/en-t. ', label: 'Sans en-tête' },
      { id: 'total', name: 'Total', label: 'Total' },
    ]

    return [
      { id: 'compact', name: 'comp.', label: 'Listes compactes' },
      ...dynamicListColumns,
      ...fixedColumns,
    ]
  }, [candidates, lists])

  const columnStats = useMemo(() => {
    const stats: Record<string, { min: number; max: number; median: number }> = {}

    const getMedian = (values: number[]) => {
      if (values.length === 0) return 0
      const sorted = [...values].sort((a, b) => a - b)
      const mid = Math.floor(sorted.length / 2)
      return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
    }

    for (const col of tableColumns) {
      const values = candidates
        .map((candidate) => getNumericValue(candidate, col.id))
        .filter((v): v is number => v !== null)

      if (values.length > 0) {
        stats[col.id] = {
          min: Math.min(...values),
          max: Math.max(...values),
          median: getMedian(values),
        }
      }
    }

    return stats
  }, [candidates, tableColumns])

  const rowStats = useMemo(() => {
    const stats: Record<string, { min: number; max: number }> = {}
    const statCols = tableColumns.filter(
      (c) => c.id !== 'total' && c.id !== 'compact' && c.id !== selectedList
    )

    for (const candidate of candidates) {
      const values = statCols
        .map((col) => getNumericValue(candidate, col.id))
        .filter((v): v is number => v !== null)

      if (values.length > 0) {
        stats[candidate.no_candidate] = {
          min: Math.min(...values),
          max: Math.max(...values),
        }
      }
    }

    return stats
  }, [candidates, tableColumns, selectedList])

  const BLUE = '#60A5FA' // Tailwind blue-400
  const WHITE = '#FFFFFF'

  const hexToRgb = (hex: string) => {
    const clean = hex.replace('#', '')
    return {
      r: parseInt(clean.slice(0, 2), 16),
      g: parseInt(clean.slice(2, 4), 16),
      b: parseInt(clean.slice(4, 6), 16),
    }
  }

  const rgbToHex = (r: number, g: number, b: number) =>
    `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`

  const lerp = (a: number, b: number, t: number) => a + (b - a) * t

  const lerpColor = (fromHex: string, toHex: string, t: number) => {
    const from = hexToRgb(fromHex)
    const to = hexToRgb(toHex)
    return rgbToHex(lerp(from.r, to.r, t), lerp(from.g, to.g, t), lerp(from.b, to.b, t))
  }

  const getCellBgColor = (
    value: number | null,
    colId: string,
    candidateNo: string
  ): string | undefined => {
    if (value === null) return undefined
    if (colId === 'total' || colId === 'compact') return undefined

    const cStats = columnStats[colId]
    if (!cStats) return undefined

    const colSpan = cStats.max - cStats.min
    const colScore = colSpan > 0 ? Math.max(0, Math.min(1, (value - cStats.min) / colSpan)) : 0

    if (colId === selectedList) {
      return lerpColor(WHITE, BLUE, colScore)
    }

    const rStats = rowStats[candidateNo]
    let rowScore = 0
    if (rStats) {
      const rowSpan = rStats.max - rStats.min
      rowScore = rowSpan > 0 ? Math.max(0, Math.min(1, (value - rStats.min) / rowSpan)) : 0
    }

    // Combine both scores, weighting them equally
    const score = rStats ? (colScore + rowScore) / 2 : colScore

    return lerpColor(WHITE, BLUE, score)
  }

  const sortedCandidates = useMemo(() => {
    return [...candidates].sort((a, b) => {
      const aNum = getNumericValue(a, sortColumn) ?? 0
      const bNum = getNumericValue(b, sortColumn) ?? 0
      return sortDirection === 'asc' ? aNum - bNum : bNum - aNum
    })
  }, [candidates, sortColumn, sortDirection])

  const listAverages = useMemo(() => {
    const avgs: Record<string, number> = {}
    if (candidates.length === 0) return avgs

    tableColumns.forEach((col) => {
      let sum = 0
      let count = 0
      candidates.forEach((c) => {
        const v = getNumericValue(c, col.id)
        if (v !== null) {
          sum += v
          count += 1
        }
      })
      avgs[col.id] = count > 0 ? sum / count : 0
    })
    return avgs
  }, [candidates, tableColumns])

  const { lastElectedVotes, lastElectedCandidateNo, electedCandidateIds } = useMemo(() => {
    if (electedSeats <= 0 || candidates.length === 0) {
      return {
        lastElectedVotes: null,
        lastElectedCandidateNo: null,
        electedCandidateIds: new Set<string>(),
      }
    }

    const rankedByTotal = [...candidates].sort((a, b) => b.total - a.total)

    const lastElected = rankedByTotal[electedSeats - 1]
    const electedIds = new Set(rankedByTotal.slice(0, electedSeats).map((c) => c.no_candidate))

    return {
      lastElectedVotes: lastElected?.total ?? null,
      lastElectedCandidateNo: lastElected?.no_candidate ?? null,
      electedCandidateIds: electedIds,
    }
  }, [candidates, electedSeats])

  return candidatesLoading ? (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  ) : candidates.length > 0 ? (
    <div className="rounded-lg border bg-card">
      <div className="relative w-full overflow-visible">
        <table className="w-full text-sm">
          <thead className="bg-secondary backdrop-blur-sm sticky top-0 z-20 border-b shadow-sm">
            <tr>
              <th
                className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-xs cursor-pointer select-none"
                onClick={() => handleSort('no_candidate')}
              >
                <div className="flex items-center gap-1">
                  <span>{t('details.candidateNumber')}</span>
                  {sortColumn === 'no_candidate' &&
                    (sortDirection === 'asc' ? (
                      <CaretUpIcon size={14} weight="bold" className="text-primary" />
                    ) : (
                      <CaretDownIcon size={14} weight="bold" className="text-primary" />
                    ))}
                </div>
              </th>
              <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-xs sticky left-0 bg-secondary">
                {t('details.candidateHeader')}
              </th>
              {tableColumns.map((col) => (
                <th
                  key={col.id}
                  className="px-4 py-3 text-right font-semibold uppercase tracking-wide text-xs cursor-pointer select-none"
                  onClick={() => handleSort(col.id)}
                >
                  <div className="flex items-center justify-end gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-help underline decoration-dotted">{col.name}</span>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">{col.label}</TooltipContent>
                    </Tooltip>
                    {sortColumn === col.id &&
                      (sortDirection === 'asc' ? (
                        <CaretUpIcon size={14} weight="bold" className="text-primary" />
                      ) : (
                        <CaretDownIcon size={14} weight="bold" className="text-primary" />
                      ))}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedCandidates.map((candidate) => {
              const isLastElected = candidate.no_candidate === lastElectedCandidateNo
              const isElected = electedCandidateIds.has(candidate.no_candidate)
              const partyShortName = candidate.party_if_alliance
                ? getPartyMetaFromSelectedYear(candidate.party_if_alliance)?.short_name
                : ''

              const missingVotesTotal =
                !isElected && lastElectedVotes !== null && candidate.total < lastElectedVotes
                  ? Math.round(lastElectedVotes - candidate.total)
                  : 0

              let totalShortfalls = 0
              const shortfalls: Record<string, number> = {}
              let totalBaseForFallback = 0

              if (missingVotesTotal > 0) {
                tableColumns.forEach((col) => {
                  if (col.id === 'total' || col.id === 'compact') return
                  const cVal = getNumericValue(candidate, col.id) ?? 0

                  const avgRefVal = listAverages[col.id] ?? 0

                  const diff = Math.max(0, avgRefVal - cVal)
                  shortfalls[col.id] = diff
                  totalShortfalls += diff
                  totalBaseForFallback += cVal
                })
              }

              return (
                <tr
                  key={candidate.no_candidate}
                  className={cn(
                    `border-t transition-colors`,
                    isLastElected && 'border-b-2 border-b-primary'
                  )}
                >
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                    {candidate.no_candidate}
                  </td>
                  <td className="px-4 py-3 font-medium sticky bg-white left-0">
                    {candidate.name}{' '}
                    {candidate.incumbent && (
                      <span className="text-sm px-2 py-1 rounded bg-blue-100 text-blue-800">
                        {t('details.incumbent')}
                      </span>
                    )}{' '}
                    {candidate.party_if_alliance !== null && (
                      <span className="text-sm px-2 py-1 rounded bg-gray-100 text-gray-800">
                        {partyShortName}
                      </span>
                    )}
                  </td>
                  {tableColumns.map((col) => {
                    const value = getNumericValue(candidate, col.id)

                    let columnMissingVotes = 0
                    if (
                      missingVotesTotal > 0 &&
                      col.id !== 'total' &&
                      col.id !== 'compact' &&
                      value !== null
                    ) {
                      if (totalShortfalls > 0) {
                        const proportion = shortfalls[col.id] / totalShortfalls
                        columnMissingVotes = Math.round(missingVotesTotal * proportion)
                      } else if (totalBaseForFallback > 0) {
                        const proportion = value / totalBaseForFallback
                        columnMissingVotes = Math.round(missingVotesTotal * proportion)
                      }
                    }

                    const targetValue = value !== null ? value + columnMissingVotes : null
                    const showTarget = columnMissingVotes > 0 && value !== null

                    return (
                      <td
                        key={col.id}
                        className="px-4 py-3 text-right tabular-nums"
                        style={{
                          backgroundColor: getCellBgColor(value, col.id, candidate.no_candidate),
                        }}
                      >
                        <div className="flex flex-col items-end leading-tight gap-0.5">
                          <span>{value ?? '—'}</span>
                          {showTarget && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="text-[10px] text-muted-foreground/80 font-medium cursor-help">
                                  ({targetValue})
                                </span>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-[250px] text-center">
                                {t('details.missingVotesTooltip', {
                                  missingVotesTotal,
                                  columnMissingVotes,
                                })}
                                <br />
                                <span className="text-[10px] opacity-75 mt-1 block">
                                  {t('details.missingVotesNote')}
                                </span>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
          <tfoot className="sticky bottom-0 z-20 bg-muted/95 backdrop-blur-sm font-medium border-t border-t-primary/20 shadow-[0_-1px_3px_rgba(0,0,0,0.05)]">
            <tr>
              <td className="px-4 py-3 text-muted-foreground font-mono text-xs">—</td>
              <td className="px-4 py-3 sticky left-0 bg-muted/95 backdrop-blur-sm">
                {t('details.listAverage')}
              </td>
              {tableColumns.map((col) => {
                const avg = listAverages[col.id]
                return (
                  <td
                    key={col.id}
                    className="px-4 py-3 text-right tabular-nums text-muted-foreground"
                  >
                    {avg !== undefined ? Math.round(avg) : '—'}
                  </td>
                )
              })}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  ) : selectedList ? (
    <Card>
      <CardContent className="pt-6 text-center text-muted-foreground">
        {t('details.noResults')}
      </CardContent>
    </Card>
  ) : (
    <Card>
      <CardContent className="pt-6 text-center text-muted-foreground">
        {t('details.selectList')}
      </CardContent>
    </Card>
  )
}
