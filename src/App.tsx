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
        <div className="container mx-auto px-4 md:px-6 py-4 text-xs text-muted-foreground space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <a href="mailto:nicolas.feyer@hotmail.com" className="underline font-medium">
                {t('app.footerAuthor')}
              </a>
              <span>·</span>
              <span>{t('app.footerVersion', { version: __APP_VERSION__ })}</span>
              <span>·</span>
              <a
                href="https://github.com/nicolasfeyer/cg2r"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                aria-label="GitHub"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width={16}
                  height={16}
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                </svg>
                <span className="underline">{t('app.footerGithub')}</span>
              </a>
            </div>
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
          <p className="text-[10px] text-muted-foreground/70">{t('app.footerLegal')}</p>
        </div>
      </footer>
    </div>
  )
}

export default App
