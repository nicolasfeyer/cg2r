export interface ElectionSummary {
  election_year: number
  total_seats: number
  results: PartyResult[]
}

export interface PartyResult {
  list_number: number
  list_label: string
  party_votes: number
  seats_won: number
  color: string
}

export interface ElectionCandidateResult {
  no_candidate: string
  name: string
  list_votes: {[key: number]: number}
  without_header:number
  compact: number
  total: number
}

export interface ElectionList {
  list_number: number
  list_label: string
  short_label: string
  color: string
}

export interface Election{
  id: number
  election_date:string
  label:string
}