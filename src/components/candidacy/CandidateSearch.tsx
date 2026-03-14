import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { CandidateInfo } from '@/lib/types'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

export interface ICandidateSearchProps {
  candidatesInfo: CandidateInfo[]
  loading: boolean
  onSearch: (query: string) => void
  onCandidateClick: (person_id: number, name: string) => void
}

export function CandidateSearch({
  candidatesInfo,
  loading,
  onSearch,
  onCandidateClick,
}: ICandidateSearchProps) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query)
    }, 300)
    return () => {
      clearTimeout(handler)
    }
  }, [query])
  useEffect(() => {
    onSearch(debouncedQuery)
  }, [debouncedQuery, onSearch])
  const displayedCandidatesInfo = useMemo(() => {
    return [
      ...candidatesInfo.map((c) => ({
        person_id: c.person_id,
        name: c.known_names.split(' $$$ ')[0],
        last_profession: c.known_professions.split(' $$$ ')[0],
        total_campaigns: c.total_campaigns,
        last_campaign_year: c.last_campaign_year,
      })),
    ]
  }, [candidatesInfo])
  return (
    <div className="relative w-full max-w-xl mx-auto">
      <Input
        type="text"
        placeholder={t('search.placeholder')}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full"
      />
      {debouncedQuery.trim().length >= 3 && (
        <Card className="absolute z-10 w-full mt-1 overflow-hidden shadow-lg border">
          {loading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              {t('search.loading')}
            </div>
          ) : displayedCandidatesInfo.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              {t('search.noResults')}
            </div>
          ) : (
            <div className="max-h-60 overflow-y-auto">
              <ul className="flex flex-col w-full">
                {displayedCandidatesInfo.map((c) => (
                  <li
                    key={c.person_id}
                    className="px-4 py-2 hover:bg-muted cursor-pointer transition-colors border-b last:border-0 w-full overflow-hidden"
                    onClick={() => {
                      onCandidateClick(c.person_id, c.name)
                      setQuery('')
                    }}
                  >
                    <div className="font-medium truncate">{c.name}</div>
                    <div className="text-xs text-muted-foreground truncate w-full">
                      {c.last_profession}
                    </div>
                    <div className="text-xs text-muted-foreground truncate w-full">
                      {c.last_campaign_year}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
