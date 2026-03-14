import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ElectionSummary } from '@/lib/types'

type ElectionSummarySectionProps = {
    summary: ElectionSummary
}

function getContrastColor(hex: string): "#000000" | "#FFFFFF" {
    // Remove #
    const cleanHex = hex.replace("#", "");

    // Parse RGB
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);

    // Calculate luminance
    const luminance =
        (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    // Return black for light colors, white for dark
    return luminance > 0.5 ? "#000000" : "#FFFFFF";
}

function getListNoStyle(color:string){
    return {
        backgroundColor: color,
        color: getContrastColor(color),
        borderColor: getContrastColor(color),
        borderStyle: "solid",
        borderWidth: 1,
    }
}

export function ElectionSummarySection({ summary }: ElectionSummarySectionProps) {
    return (
        <section className="space-y-4">
            <div className="flex items-baseline justify-between gap-3 flex-wrap">
                <div className="flex items-baseline gap-3">
                    <h2 className="text-xl md:text-2xl font-semibold">
                        Résultats {summary.election_year}
                    </h2>
                    <Badge variant="secondary" className="text-sm">
                        {summary.total_seats} sieges
                    </Badge>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-5 lg:grid-cols-5">
                {summary.results.map((party) => (
                    <Card key={party.list_number} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                            <div className="flex items-start justify-between gap-2">
                                <CardTitle className="text-base leading-tight">
                                    {party.list_label}
                                </CardTitle>
                                <Badge
                                    style={getListNoStyle(party.color)}
                                    className="shrink-0">N° {party.list_number}</Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div>
                                <div className="text-3xl font-bold text-primary">
                                    {party.seats_won}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {party.seats_won === 1 ? 'siege' : 'sieges'}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </section>
    )
}
