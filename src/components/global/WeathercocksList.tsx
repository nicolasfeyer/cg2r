import { ListsMetaResponse, WeathercockPerson } from '@/lib/types.ts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.tsx'
import { Fragment } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table.tsx'
import { Badge } from '@/components/ui/badge.tsx'
import { ArrowRight } from 'lucide-react'
import { getContrastColor } from '@/helpers/colors.ts'

interface WeathercockListProps {
  candidates: WeathercockPerson[]
  listsMeta: ListsMetaResponse
}

export function WeathercocksList({ candidates, listsMeta }: WeathercockListProps) {
  const { t } = useTranslation()
  const PartyBadge = ({ listId }: { listId: number }) => {
    const listMeta = listsMeta[listId]
    const color = listMeta ? listMeta.color : '#94a3b8'
    const label = listMeta ? listMeta.short_label : listId
    return (
      <Badge
        variant="secondary"
        className="font-mono text-xs"
        style={{ backgroundColor: color, color: getContrastColor(color) }}
      >
        {label}
      </Badge>
    )
  }

  if (!candidates || candidates.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6 text-center text-muted-foreground">
          {t('weathercocks.noChanges')}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full shadow-sm">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-gray-800 mb-2">
          {t('weathercocks.title')}
        </CardTitle>
        <CardDescription>{t('weathercocks.description')}</CardDescription>
      </CardHeader>

      <CardContent className="overflow-x-auto">
        <Table className="min-w-full">
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-[250px]">{t('weathercocks.candidateHeader')}</TableHead>
              <TableHead>{t('weathercocks.politicalPath')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {candidates.map((candidate) => (
              <TableRow key={candidate.person_id} className="hover:bg-transparent">
                <TableCell className="font-bold whitespace-nowrap">
                  {candidate.known_names[0]}
                </TableCell>

                <TableCell>
                  <div className="flex flex-wrap items-center gap-2">
                    {candidate.history.map((step, index) => (
                      <Fragment key={`${candidate.person_id}-${step.year}`}>
                        <div className="flex flex-col items-center space-y-1 bg-muted/30 p-2 rounded-md border border-muted">
                          <span className="text-xs font-bold text-muted-foreground">
                            {step.year}
                          </span>
                          <PartyBadge listId={step.list_id} />
                          {step.elected && (
                            <span className="ml-1" title={t('weathercocks.elected')}>
                              {t('weathercocks.elected')}
                            </span>
                          )}
                        </div>

                        {index < candidate.history.length - 1 && (
                          <ArrowRight className="w-4 h-4 text-muted-foreground/50 mx-1" />
                        )}
                      </Fragment>
                    ))}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
