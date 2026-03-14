import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useTranslation } from 'react-i18next'
import { SeatsEvolutionChart } from '@/components/charts/SeatsEvolutionChart.tsx'
import { CandidateDemographicsScatter } from '@/components/charts/CandidateDemographicsScatter.tsx'
import { AverageAgeEvolutionChart } from '@/components/charts/AverageAgeEvolutionChart.tsx'
import {
  SeatsEvolutionResponse,
  PartyMeta,
  CandidateScatterData,
  WeathercockPerson,
  PeopleEvolutionData,
  ListsMetaResponse,
} from '@/lib/types'
import { WeathercocksList } from '@/components/global/WeathercocksList.tsx'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import {
  getSeatsHistory,
  getCandidateScatter,
  getPeopleWeathercocks,
  PowerType,
  getCandidatesHistory,
} from '@/api/elections.ts'
import { PeopleEvolutionChart } from '@/components/charts/PeopleEvolutionChart.tsx'

interface GlobalTabContentProps {
  selectedPower: PowerType
  getPartyMetaFromYear: (year: number, party_id: number) => PartyMeta | null
  listsMeta: ListsMetaResponse
}

export function GlobalTabContent({
  selectedPower,
  getPartyMetaFromYear,
  listsMeta,
}: GlobalTabContentProps) {
  const { t } = useTranslation()
  const [seatsEvolution, setSeatsEvolution] = useState<SeatsEvolutionResponse>()
  const [candidatesEvolution, setCandidatesEvolution] = useState<PeopleEvolutionData>()
  const [candidateScatterData, setCandidateScatterData] = useState<CandidateScatterData[]>()
  const [weathercocks, setWeathercocks] = useState<WeathercockPerson[]>([])

  const [seatsEvolutionLoading, setSeatsEvolutionLoading] = useState(true)
  const [listsMetaLoading, setListsMetaLoading] = useState(true)
  const [candidateScatterLoading, setCandidateScatterLoading] = useState(true)
  const [weathercocksLoading, setWeathercocksLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const fetchData = async () => {
      try {
        const [
          seatsEvolutionData,
          candidatesEvolutionData,
          candidateScatterDataData,
          weathercocksData,
        ] = await Promise.all([
          selectedPower === 'legislative' ? getSeatsHistory(selectedPower) : undefined,
          selectedPower === 'executive' ? getCandidatesHistory(selectedPower) : undefined,
          getCandidateScatter(selectedPower),
          getPeopleWeathercocks(),
        ])

        if (cancelled) return

        setSeatsEvolution(seatsEvolutionData)
        setCandidatesEvolution(candidatesEvolutionData)
        setCandidateScatterData(candidateScatterDataData)
        setWeathercocks(weathercocksData)
      } catch (error) {
        toast.error(t('error.loadingGlobalStats'))
        if (import.meta.env.DEV) console.error(error)
      } finally {
        if (!cancelled) {
          setSeatsEvolutionLoading(false)
          setListsMetaLoading(false)
          setCandidateScatterLoading(false)
          setWeathercocksLoading(false)
        }
      }
    }

    void fetchData()

    return () => {
      cancelled = true
    }
  }, [selectedPower, t])

  return (
    <div className="space-y-6">
      {seatsEvolutionLoading || listsMetaLoading ? (
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-[460px] w-full" />
          </CardContent>
        </Card>
      ) : (seatsEvolution && Object.keys(seatsEvolution).length > 0) || candidatesEvolution ? (
        selectedPower === 'legislative' ? (
          <SeatsEvolutionChart
            evolution={seatsEvolution}
            getPartyMetaFromYear={getPartyMetaFromYear}
            listsMeta={listsMeta}
          />
        ) : (
          <PeopleEvolutionChart
            data={candidatesEvolution}
            getPartyMetaFromYear={getPartyMetaFromYear}
            listsMeta={listsMeta}
          />
        )
      ) : (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            {t('global.seatsProgressionUnavailable')}
          </CardContent>
        </Card>
      )}

      {candidateScatterLoading ? (
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-[620px] w-full" />
          </CardContent>
        </Card>
      ) : candidateScatterData && candidateScatterData.length > 0 ? (
        <CandidateDemographicsScatter candidateScatterData={candidateScatterData} />
      ) : (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            {t('global.candidateMatrixUnavailable')}
          </CardContent>
        </Card>
      )}

      {candidateScatterLoading ? (
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-[460px] w-full" />
          </CardContent>
        </Card>
      ) : candidateScatterData && candidateScatterData.length > 0 ? (
        <AverageAgeEvolutionChart candidateScatterData={candidateScatterData} />
      ) : null}

      {weathercocksLoading || listsMetaLoading ? (
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-[460px] w-full" />
          </CardContent>
        </Card>
      ) : weathercocks &&
        listsMeta &&
        weathercocks.length > 0 &&
        selectedPower === 'legislative' ? (
        <WeathercocksList candidates={weathercocks} listsMeta={listsMeta} />
      ) : null}
    </div>
  )
}
