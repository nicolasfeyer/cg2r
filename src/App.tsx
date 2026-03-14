import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { ChartBar, CaretUp, CaretDown, ArrowsLeftRight, Plus, Trash } from '@phosphor-icons/react'
import {ElectionSummary, ElectionCandidateResult, ElectionList, Election} from '@/lib/types'
import { CandidateComparisonChart } from '@/components/charts/CandidateComparisonChart'
import { CrossComparisonChart } from '@/components/charts/CrossComparisonChart'
import {getElections, getListsByYear, getResultsByYearAndList, getSummary} from "@/api/elections.ts";
import {ElectionSummarySection} from "@/components/ElectionSummarySection.tsx";
import {Tooltip, TooltipContent, TooltipTrigger} from "@/components/ui/tooltip.tsx";

function App() {
  const [summary, setSummary] = useState<ElectionSummary | null>(null)
  const [candidates, setCandidates] = useState<ElectionCandidateResult[]>([])
  const [lists, setLists] = useState<ElectionList[]>([])
  const [elections, setElections] = useState<Election[]>([])
  const [selectedYear, setSelectedYear] = useState<string>('2026')
  const [selectedList, setSelectedList] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [candidatesLoading, setCandidatesLoading] = useState(false)
  const [listsLoading, setListsLoading] = useState(false)
  const [sortColumn, setSortColumn] = useState<string>('total')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [showComparison, setShowComparison] = useState(false)
  const [crossComparisons, setCrossComparisons] = useState<Array<{
    candidate: ElectionCandidateResult
    year: string
    listNumber: string
    listLabel: string
  }>>([])

  useEffect(() => {
    fetchElectionsAndSummary()
  }, [])

  const fetchElectionsAndSummary = async () => {
    try {
      setLoading(true)
      const dataElections = await getElections()
      setElections(dataElections)
      const dataSummary = await getSummary()
      setSummary(dataSummary)
      fetchLists(dataSummary.election_year.toString())
      setLoading(false)
    } catch (error) {
      toast.error('Erreur lors du chargement des élections et du résumé')
      console.error(error)
      setLoading(false)
    } finally {
      setLoading(false)
    }
  }

  const fetchCandidates = async (year: string, listNumber: string) => {
    try {
      setCandidatesLoading(true)
      const data = await getResultsByYearAndList(year, listNumber)
      setCandidates(data)
    } catch (error) {
      toast.error('Erreur lors du chargement des candidats')
      console.error(error)
      setCandidates([])
    } finally {
      setCandidatesLoading(false)
    }
  }

  const fetchLists = async (year: string) => {
    try {
      setListsLoading(true)
      const data = await getListsByYear(year)
      setLists(data)
    } catch (error) {
      toast.error('Erreur lors du chargement des listes')
      console.error(error)
      setLists([])
    } finally {
      setListsLoading(false)
    }
  }

  const handleYearChange = (year: string) => {
    setSelectedYear(year)
    setSelectedList('')
    setCandidates([])
    setLists([])
    setShowComparison(false)
    fetchLists(year)
  }

  const handleListChange = (listNumber: string) => {
    setSelectedList(listNumber)
    setShowComparison(false)
    fetchCandidates(selectedYear, listNumber)
  }

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('desc')
    }
  }

  const sortedCandidates = [...candidates].sort((a, b) => {
    const aValue = a[sortColumn]
    const bValue = b[sortColumn]
    
    const aNum = typeof aValue === 'number' ? aValue : parseFloat(String(aValue)) || 0
    const bNum = typeof bValue === 'number' ? bValue : parseFloat(String(bValue)) || 0
    
    return sortDirection === 'asc' ? aNum - bNum : bNum - aNum
  })

  const getTableColumns = ():[{id:string, label:string,name:string}] => {
    if (candidates.length === 0) return []
    const firstRow = candidates[0]
    const dynamic_lists_no =  Object.keys(firstRow.list_votes)
    const dynamic_list_columns = dynamic_lists_no.map((list_no) => {
      return {
        "id": list_no,
        "name": lists.filter(l => l.list_number.toString() === list_no)[0]?.short_label || `Liste ${list_no}`,
        "label": lists.filter(l => l.list_number.toString() === list_no)[0]?.list_label || `Liste ${list_no}`,
      }
    })
    const fixed_columns = [{"id":"without_header", "name":"s/en-t. ", "label":"Sans en-tête"}, {"id":"compact", "name":"comp.", "label":"Listes compactes"}, {"id":"total", name:"Total", label:"Total"}]
    return [...dynamic_list_columns, ...fixed_columns]
  }

  const handleAddToCrossComparison = () => {
    if (selectedCandidates.length === 0) {
      toast.error('Sélectionnez au moins un candidat à ajouter')
      return
    }

    const newComparisons = selectedCandidates.map(candidateNo => {
      const candidate = candidates.find(c => c.no_candidate === candidateNo)
      if (!candidate) return null

      return {
        candidate,
        year: selectedYear,
        listNumber: selectedList,
        listLabel: currentListLabel
      }
    }).filter(Boolean) as Array<{
      candidate: ElectionCandidateResult
      year: string
      listNumber: string
      listLabel: string
    }>

    const totalComparisons = crossComparisons.length + newComparisons.length

    if (totalComparisons > 6) {
      toast.error('Maximum 6 candidats peuvent être comparés au total')
      return
    }

    setCrossComparisons(prev => [...prev, ...newComparisons])
    setSelectedCandidates([])
    toast.success(`${newComparisons.length} candidat${newComparisons.length > 1 ? 's' : ''} ajouté${newComparisons.length > 1 ? 's' : ''} à la comparaison`)
  }

  const handleRemoveFromCrossComparison = (index: number) => {
    setCrossComparisons(prev => prev.filter((_, i) => i !== index))
  }

  const handleClearCrossComparisons = () => {
    setCrossComparisons([])
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6 md:space-y-8">
        <header className="space-y-2">
          <div className="flex items-center gap-3">
            <ChartBar size={32} weight="duotone" className="text-primary" />
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Elections du Conseil général de la Ville de Fribourg
            </h1>
          </div>
          <p className="text-muted-foreground">
            Résultats et statistiques des élections du Conseil général de 2016 à 2026
          </p>
        </header>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
            {[1, 2, 3, 4].map(i => (
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
        ) : summary && elections ? (
          <>
            <ElectionSummarySection summary={summary} />

            <Separator className="my-8" />

            {/*<section className="space-y-6">*/}
            {/*  <h2 className="text-xl md:text-2xl font-semibold">*/}
            {/*    Visualisations*/}
            {/*  </h2>*/}

            {/*  <div className="grid gap-6 lg:grid-cols-2">*/}
            {/*    <PartyDistributionChart data={summary.results} type="seats" year={summary.election_year} />*/}
            {/*    <PartyDistributionChart data={summary.results} type="votes" year={summary.election_year} />*/}
            {/*  </div>*/}

            {/*  <VoteTrendsChart historicalData={historicalSummaries} />*/}
            {/*</section>*/}

            {/*<Separator className="my-8" />*/}

            <section className="space-y-4">
              <h2 className="text-xl md:text-2xl font-semibold">
                Résultats détaillés par liste
              </h2>

              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1 space-y-2">
                  <label className="text-sm font-medium">Année</label>
                  <Select value={selectedYear} onValueChange={handleYearChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une année" />
                    </SelectTrigger>
                    <SelectContent>
                      {elections.map(election => {
                        const year = election.id
                        return <SelectItem key={year} value={year+""}>
                          {year}
                        </SelectItem>
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1 space-y-2">
                  <label className="text-sm font-medium">Liste</label>
                  <Select value={selectedList} onValueChange={handleListChange}>
                    <SelectTrigger disabled={listsLoading}>
                      <SelectValue placeholder="Sélectionner une liste" />
                    </SelectTrigger>
                    <SelectContent>
                      {lists.map(party => (
                        <SelectItem key={party.list_number} value={party.list_number.toString()}>
                          {party.list_number}. {party.list_label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {candidatesLoading ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      {[1, 2, 3, 4, 5].map(i => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : candidates.length > 0 ? (
                <>
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {selectedCandidates.length} candidat{selectedCandidates.length !== 1 ? 's' : ''} sélectionné{selectedCandidates.length !== 1 ? 's' : ''}
                      </span>
                      {selectedCandidates.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedCandidates([])}
                          className="h-7 text-xs"
                        >
                          Tout désélectionner
                        </Button>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {selectedCandidates.length >= 2 && (
                        <Button
                          onClick={handleShowComparison}
                          size="sm"
                          className="gap-2"
                        >
                          <ArrowsLeftRight size={16} weight="bold" />
                          Comparer par liste
                        </Button>
                      )}
                      {selectedCandidates.length > 0 && (
                        <>
                          <Button
                            onClick={handleAddToCrossComparison}
                            size="sm"
                            variant="secondary"
                            className="gap-2"
                            disabled={crossComparisons.length + selectedCandidates.length > 6}
                          >
                            <Plus size={16} weight="bold" />
                            Ajouter à la comparaison globale
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="rounded-lg border bg-card">
                    <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-secondary/80 sticky top-0 z-10">
                          <tr>
                            <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-xs">
                              N°
                            </th>
                            <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-xs sticky left-0 bg-secondary/80">
                              Candidat
                            </th>
                            {getTableColumns().map(col => (
                              <th
                                key={col.id}
                                className="px-4 py-3 text-right font-semibold uppercase tracking-wide text-xs cursor-pointer hover:bg-accent/20 transition-colors select-none"
                                onClick={() => handleSort(col.id)}
                              >
                                <div className="flex items-center justify-end gap-1">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="cursor-help underline decoration-dotted">{col.name}</span>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom">
                                      {col.label}
                                    </TooltipContent>
                                  </Tooltip>
                                  {sortColumn === col.id && (
                                    sortDirection === 'asc' ?
                                      <CaretUp size={14} weight="bold" className="text-primary" /> :
                                      <CaretDown size={14} weight="bold" className="text-primary" />
                                  )}
                                </div>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {sortedCandidates.map((candidate, idx) => (
                            <tr
                              key={candidate.no_candidate}
                              className={`border-t hover:bg-accent/10 transition-colors ${
                                idx % 2 === 0 ? 'bg-background' : 'bg-secondary/30'
                              } ${selectedCandidates.includes(candidate.no_candidate) ? 'bg-accent/20' : ''}`}
                            >
                              <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                                {candidate.no_candidate}
                              </td>
                              <td className="px-4 py-3 font-medium sticky left-0 bg-inherit">
                                {candidate.name}
                              </td>
                              {getTableColumns().map(col => (
                                <td key={col.id} className="px-4 py-3 text-right tabular-nums">
                                  {candidate.list_votes[col.id] ?? candidate[col.id] ?? '—'}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {showComparison && selectedCandidates.length >= 2 && (
                    <div className="mt-6">
                      <CandidateComparisonChart
                        candidates={candidates}
                        selectedCandidates={selectedCandidates}
                      />
                    </div>
                  )}
                </>
              ) : selectedList ? (
                <Card>
                  <CardContent className="pt-6 text-center text-muted-foreground">
                    Aucun résultat disponible pour cette sélection
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="pt-6 text-center text-muted-foreground">
                    Sélectionnez une liste pour afficher les résultats détaillés
                  </CardContent>
                </Card>
              )}
            </section>

            {crossComparisons.length > 0 && (
              <>
                <Separator className="my-8" />

                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl md:text-2xl font-semibold">
                      Comparaison globale
                    </h2>
                    <Button
                      onClick={handleClearCrossComparisons}
                      size="sm"
                      variant="destructive"
                      className="gap-2"
                    >
                      <Trash size={16} weight="bold" />
                      Tout effacer
                    </Button>
                  </div>

                  <Card className="bg-secondary/30">
                    <CardContent className="pt-6">
                      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                        {crossComparisons.map((comp, idx) => (
                          <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-background border border-border">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{comp.candidate.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {comp.listLabel}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Année {comp.year} • {comp.candidate.total} voix
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRemoveFromCrossComparison(idx)}
                              className="shrink-0 h-8 w-8 p-0"
                            >
                              <Trash size={16} />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <CrossComparisonChart comparisons={crossComparisons} />
                </section>
              </>
            )}
          </>
        ) : (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              Aucune donnée disponible
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default App