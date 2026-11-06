import { useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import type { MatchExercise as MatchExerciseData } from '@/types/course';

function shuffle<T>(items: T[]): T[] {
    const copy = [...items];

    for (let index = copy.length - 1; index > 0; index--) {
        const swap = Math.floor(Math.random() * (index + 1));
        [copy[index], copy[swap]] = [copy[swap], copy[index]];
    }

    return copy;
}

/**
 * Match Swedish words to their Finnish meanings. Finishes by itself once every pair is found.
 */
export default function MatchExercise({
    exercise,
    onComplete,
}: {
    exercise: MatchExerciseData;
    /** Called with the ids of the items that were mismatched at least once. */
    onComplete: (missedItemIds: string[]) => void;
}) {
    const swedish = useMemo(() => shuffle(exercise.pairs), [exercise]);
    const finnish = useMemo(() => shuffle(exercise.pairs), [exercise]);
    const [selectedSwedish, setSelectedSwedish] = useState<string | null>(null);
    const [matched, setMatched] = useState<string[]>([]);
    const [flash, setFlash] = useState<string | null>(null);
    const missed = useRef(new Set<string>());

    useEffect(() => {
        if (matched.length !== exercise.pairs.length) {
            return;
        }

        const timeout = window.setTimeout(
            () => onComplete([...missed.current]),
            450,
        );

        return () => window.clearTimeout(timeout);
    }, [matched, exercise, onComplete]);

    const chooseFinnish = (itemId: string) => {
        if (selectedSwedish === null) {
            return;
        }

        if (itemId === selectedSwedish) {
            setMatched([...matched, itemId]);
        } else {
            missed.current.add(selectedSwedish);
            setFlash(itemId);
            window.setTimeout(() => setFlash(null), 400);
        }

        setSelectedSwedish(null);
    };

    const cell =
        'min-h-14 rounded-2xl border-2 border-b-4 bg-card px-2 py-2 text-sm leading-tight font-semibold transition-all active:translate-y-px';

    return (
        <div className="space-y-6">
            <p className="text-sm font-semibold text-muted-foreground">
                Yhdistä parit
            </p>

            <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-3" lang="sv">
                    {swedish.map((pair) => (
                        <button
                            key={pair.itemId}
                            type="button"
                            disabled={matched.includes(pair.itemId)}
                            onClick={() => setSelectedSwedish(pair.itemId)}
                            className={cn(
                                cell,
                                selectedSwedish === pair.itemId &&
                                    'border-sky-400 bg-sky-50 dark:bg-sky-950/40',
                                matched.includes(pair.itemId) &&
                                    'border-emerald-300 bg-emerald-50 text-emerald-700 opacity-60 dark:bg-emerald-950/40',
                            )}
                        >
                            {pair.sv}
                        </button>
                    ))}
                </div>
                <div className="grid gap-3" lang="fi">
                    {finnish.map((pair) => (
                        <button
                            key={pair.itemId}
                            type="button"
                            disabled={matched.includes(pair.itemId)}
                            onClick={() => chooseFinnish(pair.itemId)}
                            className={cn(
                                cell,
                                flash === pair.itemId &&
                                    'border-rose-500 bg-rose-50 dark:bg-rose-950/40',
                                matched.includes(pair.itemId) &&
                                    'border-emerald-300 bg-emerald-50 text-emerald-700 opacity-60 dark:bg-emerald-950/40',
                            )}
                        >
                            {pair.fi}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
