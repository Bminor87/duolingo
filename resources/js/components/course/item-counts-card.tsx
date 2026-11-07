import { BookCheck, Sprout } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import type { ItemCounts } from '@/types/course';

function CountTile({
    icon,
    label,
    count,
    total,
    description,
}: {
    icon: ReactNode;
    label: string;
    count: number;
    total: number;
    description: string;
}) {
    return (
        <div className="rounded-2xl bg-muted/60 p-3">
            <div className="flex items-center gap-1.5 text-xs font-bold">
                {icon}
                {label}
            </div>
            <p className="mt-1 text-2xl font-extrabold tabular-nums">
                {count}
                <span className="text-sm font-bold text-muted-foreground">
                    {' '}
                    / {total}
                </span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </div>
    );
}

/**
 * How many of the course's sentences and words the learner has practised and mastered,
 * kept apart from the progress percentages so the two are not mistaken for each other.
 */
export default function ItemCountsCard({
    items,
    className,
}: {
    items: ItemCounts;
    className?: string;
}) {
    return (
        <section className={cn('rounded-3xl border-2 p-4', className)}>
            <h2 className="text-sm font-extrabold">Lauseet ja sanat</h2>
            <div className="mt-3 grid grid-cols-2 gap-2">
                <CountTile
                    icon={<Sprout className="size-4 text-emerald-500" />}
                    label="Harjoiteltu"
                    count={items.learned}
                    total={items.total}
                    description="Osattu ainakin kerran ilman virheitä."
                />
                <CountTile
                    icon={<BookCheck className="size-4 text-violet-500" />}
                    label="Hallussa"
                    count={items.mastered}
                    total={items.total}
                    description="Osattu kolmella eri harjoituskerralla ilman virheitä."
                />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
                Lause siirtyy hallussa-kohtaan vasta muutaman päivän kertaamisen
                jälkeen, joten luku pysyy alussa nollassa. Virhe laskee lauseen
                tasoa yhdellä.
            </p>
        </section>
    );
}
