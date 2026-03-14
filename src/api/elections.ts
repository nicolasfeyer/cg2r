import {ElectionCandidateResult, Election, ElectionList, ElectionSummary} from '@/lib/types'

const API_BASE_URL = "https://elections-v2.nicolasfeyer.ch/api/elections"

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

// Example endpoint: adjust to your real route
export function getSummary(): Promise<ElectionSummary> {
    return apiGet<ElectionSummary>('/latest/summary')
}

export function getResultsByYearAndList(
    year: string,
    listNumber: string
): Promise<ElectionCandidateResult[]> {
    const params = new URLSearchParams({
        year,
        list_number: listNumber,
    })

    return apiGet<ElectionCandidateResult[]>(`/results?${params.toString()}`)
}

export function getListsByYear(
    year: string,
): Promise<ElectionList[]>{
    const params = new URLSearchParams({
        year,
    })
    return apiGet<ElectionList[]>(`/lists?${params.toString()}`)
}

export function getElections(): Promise<Election[]>{
    return apiGet<Election[]>('')
}