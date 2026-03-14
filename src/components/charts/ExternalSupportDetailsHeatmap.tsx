import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ElectionSummary, ExternalSupportResponse } from '@/lib/types.ts'

type ExternalSupportDetailsHeatmapProps = {
  externalSupport: ExternalSupportResponse
  summary: ElectionSummary
}

type EnrichedExternalData = Record<string, number | string> & {
  list_number: number
  total_external: number
  party_name: string
}

export function ExternalSupportDetailsHeatmap({
  externalSupport,
  summary,
}: ExternalSupportDetailsHeatmapProps) {
  const { t } = useTranslation()
  const [viewMode, setViewMode] = useState<'proportional' | 'absolute'>('proportional')

  const [tooltip, setTooltip] = useState<{
    visible: boolean
    x: number
    y: number
    source: string
    target: string
    absVal: number
    pctVal: number
    totalTarget: number
  } | null>(null)

  const shortLabelByParty = summary.results.map((result) => ({
    list_number: result.list_number,
    short_label: result.short_label,
  }))

  const getSourceKey = (source: number | null): string => (source === null ? '' : String(source))

  const getSourceLabel = (source: number | null): string => {
    if (source === null) return 's/en-tête'
    return shortLabelByParty.find((p) => p.list_number === source)?.short_label ?? String(source)
  }

  const sources = useMemo(() => {
    return [...((externalSupport.sources as (number | null)[]) ?? [])].sort((a, b) =>
      a === null ? 1 : b === null ? -1 : Number(a) - Number(b)
    )
  }, [externalSupport.sources])

  const data: EnrichedExternalData[] = useMemo(() => {
    return (externalSupport.data ?? []).map((item) => {
      const enriched: EnrichedExternalData = {
        ...item,
        party_name:
          shortLabelByParty.find((p) => p.list_number === item.list_number)?.short_label ??
          String(item.list_number),
      }

      if (item.total_external > 0) {
        sources.forEach((source) => {
          const key = getSourceKey(source)
          const absValue = Number(item[key] ?? 0)
          enriched[`${key}_pct`] = (absValue / item.total_external) * 100
        })
      }
      return enriched
    })
  }, [externalSupport, shortLabelByParty, sources])

  const { maxAbs, maxPct } = useMemo(() => {
    let mAbs = 0
    let mPct = 0
    data.forEach((row) => {
      sources.forEach((s) => {
        const key = getSourceKey(s)
        const absValue = Number(row[key] ?? 0)
        const pctValue = Number(row[`${key}_pct`] ?? 0)
        if (absValue > mAbs) mAbs = absValue
        if (pctValue > mPct) mPct = pctValue
      })
    })
    return { maxAbs: mAbs || 1, maxPct: mPct || 100 }
  }, [data, sources])

  const handleMouseEnter = (
    e: React.MouseEvent,
    row: EnrichedExternalData,
    source: number | null
  ) => {
    const key = getSourceKey(source)
    const safeX = Math.min(e.clientX + 15, window.innerWidth - 260)

    setTooltip({
      visible: true,
      x: safeX,
      y: e.clientY + 15,
      target: row.party_name,
      source: getSourceLabel(source),
      absVal: Number(row[key] ?? 0),
      pctVal: Number(row[`${key}_pct`] ?? 0),
      totalTarget: row.total_external,
    })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    const safeX = Math.min(e.clientX + 15, window.innerWidth - 260)

    setTooltip((prev) => {
      if (!prev) return null // Si le tooltip n'existe pas encore, on ne fait rien

      return { ...prev, x: safeX, y: e.clientY + 15 }
    })
  }

  const handleMouseLeave = () => setTooltip(null)

  return (
    <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 mt-8 relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('heatmap.title')}</h2>
          <p className="text-gray-500 mb-2 text-sm max-w-3xl">
            {t('heatmap.description')} <strong>{t('heatmap.descriptionQuote')}</strong>.
          </p>
        </div>

        <div className="flex bg-gray-100 p-1 rounded-lg shrink-0 mt-4 md:mt-0">
          <button
            onClick={() => setViewMode('proportional')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              viewMode === 'proportional'
                ? 'bg-white shadow text-blue-700'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {t('heatmap.proportional')}
          </button>
          <button
            onClick={() => setViewMode('absolute')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              viewMode === 'absolute'
                ? 'bg-white shadow text-blue-700'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {t('heatmap.absolute')}
          </button>
        </div>
      </div>

      <div className="w-full overflow-x-auto pb-4">
        <table className="w-full border-collapse min-w-[600px]">
          <thead>
            <tr>
              <th className="p-2 border-none"></th>

              <th
                colSpan={sources.length}
                className="text-center pb-2 text-sm font-bold text-gray-600 uppercase tracking-wider"
              >
                {t('heatmap.listUsed')}
              </th>
            </tr>
            <tr>
              <th className="text-right pr-4 align-bottom text-sm font-bold text-gray-600 uppercase tracking-wider w-40">
                {t('heatmap.receivingLists')}
              </th>

              {sources.map((source, i) => (
                <th
                  key={i}
                  className="p-2 h-20 text-center text-xs font-semibold text-gray-700 border-b-2 border-gray-200"
                >
                  <div className="mx-auto h-24 w-6 flex items-end justify-center">
                    <span className="[writing-mode:vertical-rl] rotate-180 text-xs leading-none">
                      {getSourceLabel(source)}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody onMouseLeave={handleMouseLeave}>
            {data.map((row, rowIndex) => (
              <tr key={rowIndex}>
                <th className="text-right pr-4 py-3 text-sm font-semibold text-gray-800 whitespace-nowrap border-r-2 border-gray-200">
                  {row.party_name}
                </th>

                {sources.map((source, colIndex) => {
                  const key = getSourceKey(source)
                  const absValue = Number(row[key] ?? 0)
                  const pctValue = Number(row[`${key}_pct`] ?? 0)

                  const displayValue =
                    viewMode === 'proportional'
                      ? pctValue > 0
                        ? `${pctValue.toFixed(0)}%`
                        : ''
                      : absValue > 0
                        ? absValue.toLocaleString('fr-CH')
                        : ''

                  let intensity = 0
                  if (viewMode === 'proportional' && maxPct > 0) {
                    intensity = pctValue / maxPct
                  } else if (viewMode === 'absolute' && maxAbs > 0) {
                    intensity = absValue / maxAbs
                  }

                  if (intensity > 0 && intensity < 0.1) intensity = 0.1

                  const isDark = intensity > 0.5

                  return (
                    <td
                      key={colIndex}
                      className="relative p-0 border border-white cursor-pointer transition-all hover:scale-[1.05] hover:z-10 hover:shadow-lg"
                      onMouseEnter={(e) => handleMouseEnter(e, row, source)}
                      onMouseMove={handleMouseMove}
                    >
                      <div
                        className="absolute inset-0 bg-blue-600 pointer-events-none rounded-sm"
                        style={{ opacity: intensity }}
                      ></div>

                      <div
                        className={`relative z-10 py-3 px-1 text-center text-xs font-medium ${isDark ? 'text-white' : 'text-gray-700'}`}
                      >
                        {displayValue || <span className="text-gray-300">-</span>}
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {tooltip && tooltip.visible && (
        <div
          className="fixed z-50 bg-white p-4 border border-gray-200 shadow-xl rounded-lg text-sm min-w-[250px] pointer-events-none"
          style={{ top: tooltip.y, left: tooltip.x }}
        >
          <div className="mb-3 pb-3 border-b border-gray-100">
            <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">
              {t('heatmap.tooltipLists')}
            </p>
            <p className="font-bold text-gray-800 text-base">{tooltip.target}</p>
          </div>

          <div className="mb-3">
            <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">
              {t('heatmap.tooltipHeaderUsed')}
            </p>
            <p className="font-bold text-blue-600 text-base">{tooltip.source}</p>
          </div>

          <div className="bg-gray-50 p-2 rounded flex justify-between items-center">
            <div>
              <p className="font-bold text-gray-900 text-lg">
                {tooltip.absVal.toLocaleString('fr-CH')}{' '}
                <span className="text-xs font-normal text-gray-500">
                  {t('heatmap.tooltipVotes')}
                </span>
              </p>
            </div>
            <div className="text-right">
              <p className="font-bold text-blue-600 text-lg">{tooltip.pctVal.toFixed(1)}%</p>
              <p className="text-xs text-gray-500">{t('heatmap.tooltipExternalSupport')}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
