import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '@/components/ui/card'
import {
  CandidateEvolutionPanachage,
  CandidateInfo,
  ListsMetaResponse,
  PartyMeta,
} from '@/lib/types'
import { getPeopleResults, searchCandidacies } from '@/api/elections.ts'
import { PersonResultsDisplay } from '@/components/candidacy/PersonResultsDisplay'
import { CandidateSearch } from '@/components/candidacy/CandidateSearch'
import { toast } from 'sonner'

interface CandidacyTabContentProps {
  listsMeta: ListsMetaResponse
  getPartyMetaFromYear: (year: number, party_id: number) => PartyMeta | null
}

export function CandidacyTabContent({ listsMeta, getPartyMetaFromYear }: CandidacyTabContentProps) {
  const { t } = useTranslation()
  const [candidatesInfo, setCandidatesInfo] = useState<CandidateInfo[]>([])
  const [candidatesInfoLoading, setCandidatesInfoLoading] = useState(false)
  const [selectedPersonResults, setSelectedPersonResults] =
    useState<CandidateEvolutionPanachage | null>(null)
  const [selectedPersonName, setSelectedPersonName] = useState('')
  const [personResultsLoading, setPersonResultsLoading] = useState(false)

  const handleSearch = useCallback(
    async (query: string) => {
      if (query.trim().length < 3) {
        setCandidatesInfo([])
        return
      }

      try {
        setCandidatesInfoLoading(true)
        const data = await searchCandidacies(query)
        setCandidatesInfo(data)
      } catch (error) {
        toast.error(t('error.loadingCandidatesInfo'))
        if (import.meta.env.DEV) console.error(error)
        setCandidatesInfo([])
      } finally {
        setCandidatesInfoLoading(false)
      }
    },
    [t]
  )

  const handleCandidateClick = async (person_id: number, name: string) => {
    try {
      setPersonResultsLoading(true)
      setSelectedPersonName(name)
      const data = await getPeopleResults(person_id)
      setSelectedPersonResults(data)
    } catch (error) {
      toast.error(t('error.loadingCandidateResults'))
      if (import.meta.env.DEV) console.error(error)
      setSelectedPersonResults(null)
    } finally {
      setPersonResultsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <CandidateSearch
        candidatesInfo={candidatesInfo}
        loading={candidatesInfoLoading}
        onSearch={handleSearch}
        onCandidateClick={handleCandidateClick}
      />

      {personResultsLoading ? (
        <Card>
          <CardContent className="pt-10 pb-10 text-center">
            <div className="animate-pulse space-y-4">
              <div className="h-6 w-48 bg-muted rounded mx-auto mb-4"></div>
              <div className="h-40 w-full bg-muted rounded"></div>
            </div>
          </CardContent>
        </Card>
      ) : (
        selectedPersonResults && (
          <PersonResultsDisplay
            listsMeta={listsMeta}
            getPartyMetaFromYear={getPartyMetaFromYear}
            data={selectedPersonResults}
            name={selectedPersonName}
          />
        )
      )}

      {!selectedPersonResults && !personResultsLoading && (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            {t('search.emptyState')}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
