export interface ElectionSummary {
  election_year: number
  total_seats: number
  results: PartyResult[]
}

export interface PartyResult {
  list_number: number
  list_label: string
  short_label: string
  party_votes: number
  seats_won: number
  positioning: number
  color: string
}

export interface ElectionCandidateResult {
  no_candidate: string
  name: string
  incumbent: boolean
  party_if_alliance: number | null
  list_votes: { [key: number]: number }
  without_header: number
  compact: number
  total: number
}

export interface ElectionList {
  list_number: number
  list_label: string
  short_label: string
  color: string
}

export interface Election {
  election_date: string
  election_year: number
  label: string
  available: boolean
  info: string | null
  warning: string | null
  seats: number
}

export interface VotingDetails {
  list_number: number
  list_label: string
  short_label: string
  nomin_modified: number
  nomin_without_header: number
  nomin_compact: number
  compl_compact: number
  compl_modified: number
}

export interface ExternalSupportData {
  list_number: number
  total_external: number
  [sourceKey: string]: number
}

export interface ExternalSupportResponse {
  data: ExternalSupportData[]
  sources: (number | null)[]
}

export interface TradeBalanceResult {
  list_number: number
  party_name: string
  incoming_votes: number
  outgoing_votes: number
  net_score: number
}

export interface CandidateInfo {
  person_id: number
  known_names: string
  known_professions: string
  total_campaigns: number
  last_campaign_year: number
}

export interface CandidateScatterData {
  election_year?: number
  candidacy_id: number
  ballot_name: string
  list_number: number
  party_name: string
  gender: 'm' | 'f' | 'M' | 'F'
  age: number | null
  elected: boolean
  incumbent: boolean
  total_votes: number
  relative_performance: number
}

export interface PartyMeta {
  id: number
  party_id: number
  name: string
  short_name: string
  color: string
  valid_from: string
  valid_to: string
}

export interface ListsMeta {
  list_number: number
  list_label: string
  short_label: string
  color: string
}

export type ListsMetaResponse = Record<number, ListsMeta>

export interface LineMeta {
  key: string
  name: string
  color: string
  isIndependent: boolean
  isAlliance: boolean
}

export interface SeatsEvolutionEntry {
  seats: number
  votes: number
  listId: number
}

export type SeatsEvolutionResponse = Record<string, Record<string, SeatsEvolutionEntry>>

export interface VoteScore {
  votes: number
  score: number
}

export interface CandidatePanachageData {
  election_name: string
  headers: string[]
  candidate: {
    number: string
    name: string
    profession: string
    elected: boolean
    incumbent: boolean
    party_group: string
    compact: number
    panachage: Record<string, VoteScore>
    sans_entete: VoteScore
    total: number
  }
}

export type CandidateEvolutionPanachage = Record<string, CandidatePanachageData>

export interface ElectionHistory {
  year: number
  name: string
  list_id: number
  elected: boolean
}

export interface WeathercockPerson {
  person_id: number
  known_names: string[]
  total_elections: number
  history: ElectionHistory[]
}

export type PersonEvolutionEntry = {
  votes: number
  elected: boolean
  incumbent: boolean
  party_ids: number[]
  party_if_alliance: number | null
  list_id: number
  list_number: number
}

export type PersonInfo = {
  name: string
  gender: string
  age: number
}

export type PeopleEvolutionData = {
  evolution: Record<string, Record<string, PersonEvolutionEntry>>
  people: Record<string, PersonInfo>
}
