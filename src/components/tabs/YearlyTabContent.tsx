import { ElectionSummarySection } from '@/components/yearly/ElectionSummarySection.tsx'
import { DetailsResults } from '@/components/yearly/DetailsResults.tsx'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { InfoIcon } from '@phosphor-icons/react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip.tsx'
import { VotingDetailsChart } from '@/components/charts/VotingDetailsChart.tsx'
import { TradeBalanceChart } from '@/components/charts/TradeBalanceChart.tsx'
import { ExternalSupportDetailsHeatmap } from '@/components/charts/ExternalSupportDetailsHeatmap.tsx'
import { CandidateDemographicsScatter } from '@/components/charts/CandidateDemographicsScatter.tsx'
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  getVotes,
  getTradeBalance,
  getExternalSupport,
  getCandidateScatterForYear,
  getListsByYear,
  getResultsByYearAndList,
} from '@/api/elections.ts'

import {
  Election,
  ElectionSummary,
  VotingDetails,
  TradeBalanceResult,
  ExternalSupportResponse,
  ElectionList,
  ElectionCandidateResult,
  CandidateScatterData,
  PartyMeta,
} from '@/lib/types'

interface YearlyTabContentProps {
  selectedYear: string
  selectedPower: 'legislative' | 'executive'
  handleYearChange: (year: string) => void
  elections: Election[]
  summaryLoading: boolean
  summary: ElectionSummary
  getPartyMetaFromSelectedYear: (party_id: number) => PartyMeta | null
}

export function YearlyTabContent({
  selectedYear,
  selectedPower,
  handleYearChange,
  elections,
  summaryLoading,
  summary,
  getPartyMetaFromSelectedYear,
}: YearlyTabContentProps) {
  const { t } = useTranslation()
  const [votingDetails, setVotingDetails] = useState<VotingDetails[]>([])
  const [tradeBalance, setTradeBalance] = useState<TradeBalanceResult[]>()
  const [externalSupports, setExternalSupports] = useState<ExternalSupportResponse>()
  const [candidateScatterForYearData, setCandidateScatterForYearData] =
    useState<CandidateScatterData[]>()
  const [lists, setLists] = useState<ElectionList[]>([])
  const [candidates, setCandidates] = useState<ElectionCandidateResult[]>([])
  const [selectedList, setSelectedList] = useState<string>('')

  const [votingDetailsLoading, setVotingDetailsLoading] = useState(false)
  const [tradeBalanceLoading, setTradeBalanceLoading] = useState(false)
  const [externalSupportsLoading, setExternalSupportsLoading] = useState(false)
  const [candidateScatterForYearLoading, setCandidateScatterForYearLoading] = useState(false)
  const [listsLoading, setListsLoading] = useState(false)
  const [candidatesLoading, setCandidatesLoading] = useState(false)

  useEffect(() => {
    setSelectedList('')
    setCandidates([])
    if (!selectedYear) return

    let cancelled = false

    const fetchYearData = async () => {
      try {
        setVotingDetailsLoading(true)
        setTradeBalanceLoading(true)
        setExternalSupportsLoading(true)
        setCandidateScatterForYearLoading(true)
        setListsLoading(true)

        const [attr, trade, ext, scatter, lst] = await Promise.all([
          getVotes(selectedPower, selectedYear),
          getTradeBalance(selectedPower, selectedYear),
          getExternalSupport(selectedPower, selectedYear),
          getCandidateScatterForYear(selectedPower, selectedYear),
          getListsByYear(selectedPower, selectedYear),
        ])

        if (cancelled) return

        setVotingDetails(attr)
        setTradeBalance(trade)
        setExternalSupports(ext)
        setCandidateScatterForYearData(scatter)
        setLists(lst)
      } catch (err) {
        if (import.meta.env.DEV) console.error(err)
        toast.error(t('error.loadingYearlyData'))
      } finally {
        if (!cancelled) {
          setVotingDetailsLoading(false)
          setTradeBalanceLoading(false)
          setExternalSupportsLoading(false)
          setCandidateScatterForYearLoading(false)
          setListsLoading(false)
        }
      }
    }

    void fetchYearData()

    return () => {
      cancelled = true
    }
  }, [selectedYear, selectedPower, t])

  const handleListChange = async (listNumber: string) => {
    setSelectedList(listNumber)
    if (!listNumber || !selectedYear || !selectedPower) return
    try {
      setCandidatesLoading(true)
      const data = await getResultsByYearAndList(selectedPower, selectedYear, listNumber)
      setCandidates(data)
    } catch (err) {
      if (import.meta.env.DEV) console.error(err)
      toast.error(t('error.loadingCandidates'))
      setCandidates([])
    } finally {
      setCandidatesLoading(false)
    }
  }

  const electedSeatsForSelectedList =
    summary?.results.find((result) => result.list_number.toString() === selectedList)?.seats_won ??
    0

  return (
    <div className="space-y-6">
      <Card className="bg-muted/30 border-primary/20 shadow-sm">
        <CardContent>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <label className="text-base font-semibold flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                  ·
                </span>
                {t('yearly.selectYearLabel')}
              </label>
              <p className="text-sm text-muted-foreground">{t('yearly.selectYearDescription')}</p>
            </div>

            <Select value={selectedYear} onValueChange={handleYearChange}>
              <SelectTrigger className="h-12 text-lg font-medium border-primary/50 hover:border-primary transition-colors">
                <SelectValue placeholder={t('yearly.selectYearPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {elections.map((election) => {
                  const year = election.election_date.split('-')[0]
                  return (
                    <SelectItem key={year} value={year} disabled={!election.available}>
                      {election.available ? (
                        <span className="text-base font-medium">{year}</span>
                      ) : (
                        <span className="text-muted-foreground italic">
                          {year} {t('yearly.comingSoon')}
                        </span>
                      )}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {summaryLoading && (
        <div className="flex justify-center py-2">
          <p className="text-xs font-medium animate-pulse text-primary">
            {t('yearly.dataUpdating')}
          </p>
        </div>
      )}

      {elections.find((e) => String(e.election_year) === selectedYear && e.warning !== null) && (
        <div
          className="p-4 bg-yellow-100 text-yellow-800 rounded-md"
          dangerouslySetInnerHTML={{
            __html: elections.find((e) => String(e.election_year) === selectedYear)?.warning || '',
          }}
        />
      )}

      {elections.find((e) => String(e.election_year) === selectedYear && e.info !== null) && (
        <div
          className="p-4 bg-blue-100 text-blue-800 rounded-md"
          dangerouslySetInnerHTML={{
            __html: elections.find((e) => String(e.election_year) === selectedYear)?.info || '',
          }}
        />
      )}

      <ElectionSummarySection summary={summary} />

      <div className="grid gap-2 md:grid-cols-1 lg:grid-cols-2">
        {votingDetailsLoading ? (
          <Card>
            <CardContent className="pt-6">
              <Skeleton className="h-[420px] w-full" />
            </CardContent>
          </Card>
        ) : votingDetails.length > 0 ? (
          <VotingDetailsChart votingDetails={votingDetails} />
        ) : (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              {t('yearly.votingDetailsUnavailable')}
            </CardContent>
          </Card>
        )}

        {tradeBalanceLoading ? (
          <Card>
            <CardContent className="pt-6">
              <Skeleton className="h-[420px] w-full" />
            </CardContent>
          </Card>
        ) : tradeBalance && tradeBalance.length > 0 ? (
          <TradeBalanceChart tradeBalanceResult={tradeBalance} />
        ) : (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              {t('yearly.tradeBalanceUnavailable')}
            </CardContent>
          </Card>
        )}
      </div>

      {externalSupportsLoading ? (
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-[480px] w-full" />
          </CardContent>
        </Card>
      ) : externalSupports ? (
        <ExternalSupportDetailsHeatmap externalSupport={externalSupports} summary={summary} />
      ) : (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            {t('yearly.externalSupportUnavailable')}
          </CardContent>
        </Card>
      )}

      {candidateScatterForYearLoading ? (
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-[620px] w-full" />
          </CardContent>
        </Card>
      ) : candidateScatterForYearData && candidateScatterForYearData.length > 0 ? (
        <CandidateDemographicsScatter candidateScatterData={candidateScatterForYearData} />
      ) : (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            {t('yearly.candidateMatrixUnavailable')}
          </CardContent>
        </Card>
      )}

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl md:text-2xl font-semibold">{t('yearly.detailedResultsByList')}</h2>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                aria-label={t('yearly.colorExplanation')}
              >
                <InfoIcon size={18} weight="duotone" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-md leading-relaxed">
              {t('yearly.colorExplanation')}
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 space-y-2">
            <label className="text-sm font-medium">{t('yearly.listLabel')}</label>
            <Select value={selectedList} onValueChange={handleListChange}>
              <SelectTrigger disabled={listsLoading || lists.length === 0}>
                <SelectValue placeholder={t('yearly.selectListPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {lists.map((party) => (
                  <SelectItem key={party.list_number} value={party.list_number.toString()}>
                    {party.list_number}. {party.list_label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DetailsResults
          getPartyMetaFromSelectedYear={getPartyMetaFromSelectedYear}
          candidates={candidates}
          lists={lists}
          selectedList={selectedList}
          candidatesLoading={candidatesLoading}
          electedSeats={electedSeatsForSelectedList}
        />
      </section>
    </div>
  )
}
