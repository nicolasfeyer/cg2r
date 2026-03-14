import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { ChartBarIcon } from '@phosphor-icons/react'
import { ElectionSummary, Election, PartyMeta, ListsMetaResponse } from '@/lib/types'
import { getElections, getListsMeta, getParties, getSummaryByYear } from '@/api/elections.ts'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { YearlyTabContent } from '@/components/tabs/YearlyTabContent.tsx'
import { CandidacyTabContent } from '@/components/tabs/CandidacyTabContent.tsx'
import { GlobalTabContent } from '@/components/tabs/GlobalTabContent.tsx'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.tsx'

const DEFAULT_YEAR = '2026'

function App() {
  const { t } = useTranslation()
  const [summary, setSummary] = useState<ElectionSummary | null>(null)
  const [elections, setElections] = useState<Election[]>([])
  const [selectedYear, setSelectedYear] = useState<string>(DEFAULT_YEAR)
  const [loading, setLoading] = useState(true)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [selectedPower, setSelectedPower] = useState<'legislative' | 'executive'>('legislative')
  const [partiesMeta, setPartiesMeta] = useState<PartyMeta[]>()
  const [listsMeta, setListsMeta] = useState<ListsMetaResponse>()

  useEffect(() => {
    let cancelled = false

    const fetchInitialData = async () => {
      try {
        setLoading(true)

        const [dataElections, listsMetaData, partiesMetaData] = await Promise.all([
          getElections(selectedPower),
          getListsMeta(selectedPower),
          getParties(),
        ])

        if (cancelled) return

        setElections(dataElections)
        setListsMeta(listsMetaData)
        setPartiesMeta(partiesMetaData)
        if (dataElections.length > 0) {
          setSelectedYear(DEFAULT_YEAR)
        }
      } catch (error) {
        toast.error(t('error.loadingElections'))
        if (import.meta.env.DEV) console.error(error)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void fetchInitialData()

    return () => {
      cancelled = true
    }
  }, [selectedPower, t])

  const fetchSummary = useCallback(
    async (power: 'legislative' | 'executive', year: string) => {
      try {
        setSummaryLoading(true)
        const data = await getSummaryByYear(power, year)
        setSummary(data)
      } catch (error) {
        toast.error(t('error.loadingSummary'))
        if (import.meta.env.DEV) console.error(error)
      } finally {
        setSummaryLoading(false)
      }
    },
    [t]
  )

  useEffect(() => {
    if (!selectedYear) return
    void fetchSummary(selectedPower, selectedYear)
  }, [selectedYear, selectedPower, fetchSummary])

  const getPartyMetaFromYear = (year: number, party_id: number): PartyMeta | null => {
    if (!partiesMeta) return null
    const partyData = Object.values(partiesMeta).filter((p) => p.party_id === party_id)
    if (!partyData.length) return null

    const match = partyData.find((party) => {
      const validFromYear = party.valid_from ? new Date(party.valid_from).getFullYear() : -Infinity
      const validToYear = party.valid_to ? new Date(party.valid_to).getFullYear() : Infinity
      return year >= validFromYear && year <= validToYear
    })

    return match || partyData[0] || null
  }

  const getPartyMetaFromSelectedYear = (party_id: number): PartyMeta | null => {
    return getPartyMetaFromYear(Number(selectedYear), party_id)
  }

  const handleYearChange = (year: string) => {
    setSelectedYear(year)
  }

  const handlePowerChange = (newPower: 'legislative' | 'executive') => {
    if (newPower === selectedPower) return

    setSelectedYear('')
    setSelectedPower(newPower)
    setSummary(null)
    setLoading(true)
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="container mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6 md:space-y-8 flex-1">
        <header className="space-y-2">
          <div className="flex items-center gap-3">
            <ChartBarIcon size={32} weight="duotone" className="text-primary" />
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t('app.title')}</h1>
          </div>
          <p className="text-muted-foreground">{t('app.subtitle')}</p>
        </header>

        <Card className="bg-muted/30 border-primary/20 shadow-sm">
          <CardContent>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <label className="text-base font-semibold flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                    ·
                  </span>
                  {t('app.selectPowerLabel')}
                </label>
                <p className="text-sm text-muted-foreground">{t('app.selectPowerDescription')}</p>
              </div>

              <Select value={selectedPower} onValueChange={handlePowerChange}>
                <SelectTrigger className="h-12 text-lg font-medium border-primary/50 hover:border-primary transition-colors">
                  <SelectValue placeholder={t('app.selectPowerPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key="legislative" value="legislative">
                    <span className="text-base font-medium">{t('app.legislativeCouncil')}</span>
                  </SelectItem>
                  <SelectItem key="executive" value="executive">
                    <span className="text-base font-medium">{t('app.executiveCouncil')}</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {loading || (!summary && summaryLoading) ? (
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-5 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !summary || !partiesMeta || !listsMeta ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              {t('app.noDataAvailable')}
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="yearly" className="space-y-6">
            <div className="w-full overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
              <TabsList className="inline-flex w-max min-w-full sm:w-full sm:grid sm:grid-cols-3 max-w-2xl mx-auto h-auto">
                <TabsTrigger value="yearly" className="px-4 py-2">
                  {t('app.tabLegislatures')}
                </TabsTrigger>
                <TabsTrigger value="candidacy" className="px-4 py-2">
                  {t('app.tabCandidacies')}
                </TabsTrigger>
                <TabsTrigger value="global" className="px-4 py-2">
                  {t('app.tabGlobal')}
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="yearly" className="space-y-6 mt-0">
              <YearlyTabContent
                getPartyMetaFromSelectedYear={getPartyMetaFromSelectedYear}
                selectedPower={selectedPower}
                selectedYear={selectedYear}
                handleYearChange={handleYearChange}
                elections={elections}
                summaryLoading={summaryLoading}
                summary={summary as ElectionSummary}
              />
            </TabsContent>

            <TabsContent value="candidacy" className="space-y-6">
              <CandidacyTabContent
                listsMeta={listsMeta}
                getPartyMetaFromYear={getPartyMetaFromYear}
              />
            </TabsContent>

            <TabsContent value="global" className="space-y-6">
              <GlobalTabContent
                listsMeta={listsMeta}
                selectedPower={selectedPower}
                getPartyMetaFromYear={getPartyMetaFromYear}
              />
            </TabsContent>
          </Tabs>
        )}
      </div>

      <footer className="border-t">
        <div className="container mx-auto px-4 md:px-6 py-4 text-xs text-muted-foreground flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <p>
            {t('app.footerLegal')} ·{' '}
            <a href="mailto:nicolas.feyer@hotmail.com" className="underline">
              {t('app.footerAuthor')}
            </a>
            {' · '}
            {t('app.footerVersion', { version: __APP_VERSION__ })}
          </p>
          <p>
            {t('app.footerDataSources')}{' '}
            <a className="underline" target="_blank" rel="noreferrer" href="https://fr.ch">
              {t('app.cantonFribourg')}
            </a>
            {t('app.footerDataSourcesSeparator1')}{' '}
            <a
              className="underline"
              target="_blank"
              rel="noreferrer"
              href="https://ville-fribourg.ch"
            >
              {t('app.villeFribourg')}
            </a>{' '}
            {t('app.footerDataSourcesSeparator2')}{' '}
            <a
              className="underline"
              target="_blank"
              rel="noreferrer"
              href="https://www.e-newspaperarchives.ch"
            >
              {t('app.eNewspaperArchives')}
            </a>
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App
