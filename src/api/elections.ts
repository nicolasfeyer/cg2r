import {
  ElectionCandidateResult,
  Election,
  ElectionList,
  ElectionSummary,
  VotingDetails,
  ExternalSupportResponse,
  TradeBalanceResult,
  CandidateScatterData,
  SeatsEvolutionResponse,
  ListsMetaResponse,
  CandidateInfo,
  CandidateEvolutionPanachage,
  WeathercockPerson,
  PeopleEvolutionData,
  PartyMeta,
} from '@/lib/types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://elections.nicolasfeyer.ch/api'
export type PowerType = 'legislative' | 'executive'

async function apiGet<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      ...init?.headers,
    },
    ...init,
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`GET ${path} failed (${response.status}): ${body || response.statusText}`)
  }

  return response.json() as Promise<T>
}

export function getElections(power: PowerType): Promise<Election[]> {
  return apiGet<Election[]>(`/elections/${power}`)
}

export function getListsMeta(power: PowerType): Promise<ListsMetaResponse> {
  return apiGet<ListsMetaResponse>(`/elections/${power}/lists`)
}

export function getSummaryByYear(
  power: PowerType,
  year: string | number
): Promise<ElectionSummary> {
  return apiGet<ElectionSummary>(`/elections/${power}/${year}/summary`)
}

export function getListsByYear(power: PowerType, year: string): Promise<ElectionList[]> {
  return apiGet<ElectionList[]>(`/elections/${power}/${year}/lists`)
}

export function getResultsByYearAndList(
  power: PowerType,
  year: string,
  listNumber: string
): Promise<ElectionCandidateResult[]> {
  return apiGet<ElectionCandidateResult[]>(`/elections/${power}/${year}/${listNumber}/results`)
}

export function getVotes(power: PowerType, year: string): Promise<VotingDetails[]> {
  return apiGet<VotingDetails[]>(`/elections/${power}/${year}/votes`)
}

export function getExternalSupport(
  power: PowerType,
  year: string
): Promise<ExternalSupportResponse> {
  return apiGet<ExternalSupportResponse>(`/elections/${power}/${year}/external-support`)
}

export function getTradeBalance(power: PowerType, year: string): Promise<TradeBalanceResult[]> {
  return apiGet<TradeBalanceResult[]>(`/elections/${power}/${year}/trade-balance`)
}

export function getSeatsHistory(power: PowerType): Promise<SeatsEvolutionResponse> {
  return apiGet<SeatsEvolutionResponse>(`/elections/${power}/seats/history`)
}

export function getCandidatesHistory(power: PowerType): Promise<PeopleEvolutionData> {
  return apiGet<PeopleEvolutionData>(`/elections/${power}/candidates/history`)
}

export function getParties(): Promise<PartyMeta[]> {
  return apiGet<PartyMeta[]>(`/parties`)
}

export function getCandidateScatterForYear(
  power: PowerType,
  year: string | number
): Promise<CandidateScatterData[]> {
  return apiGet<CandidateScatterData[]>(`/candidacies/${power}/${year}/scatter`)
}

export function getCandidateScatter(power: PowerType): Promise<CandidateScatterData[]> {
  return apiGet<CandidateScatterData[]>(`/candidacies/${power}/scatter`)
}

export function searchCandidacies(q: string): Promise<CandidateInfo[]> {
  const params = new URLSearchParams()
  if (q?.trim()) {
    params.append('q', q.trim())
  }
  return apiGet<CandidateInfo[]>(`/candidacies?${params.toString()}`)
}

export function getPeopleResults(person_id: number): Promise<CandidateEvolutionPanachage> {
  return apiGet<CandidateEvolutionPanachage>(`/people/results?id=${person_id}`)
}

export function getPeopleWeathercocks(): Promise<WeathercockPerson[]> {
  return apiGet<WeathercockPerson[]>(`/people/weathercocks`)
}
