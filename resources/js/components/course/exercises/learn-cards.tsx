import Mascot from '@/components/course/mascot';
import type { LearnExercise, LearnWordsExercise } from '@/types/course';

/**
 * Introduces a new sentence before it is practised.
 */
export function LearnCard({ exercise }: { exercise: LearnExercise }) {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <Mascot mood="happy" className="size-16 shrink-0" />
                <div className="relative rounded-2xl border-2 px-4 py-2 text-sm font-semibold">
                    Uusi lause! Lue se ja paina ? jos haluat selityksen.
                </div>
            </div>

            <div className="rounded-3xl border-2 border-b-4 p-5">
                <p className="text-2xl leading-snug font-bold" lang="sv">
                    {exercise.hint.sv}
                </p>
                <p className="mt-3 text-lg text-muted-foreground" lang="fi">
                    {exercise.hint.fi}
                </p>
            </div>
        </div>
    );
}

/**
 * Introduces a small group of new words before they are matched.
 */
export function LearnWordsCard({ exercise }: { exercise: LearnWordsExercise }) {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <Mascot mood="think" className="size-16 shrink-0" />
                <div className="rounded-2xl border-2 px-4 py-2 text-sm font-semibold">
                    Uusia sanoja. Katso ne läpi, sitten yhdistetään parit.
                </div>
            </div>

            <dl className="divide-y rounded-3xl border-2 border-b-4">
                {exercise.pairs.map((pair) => (
                    <div key={pair.itemId} className="px-4 py-3">
                        <dt className="text-lg font-bold" lang="sv">
                            {pair.sv}
                        </dt>
                        <dd className="text-muted-foreground" lang="fi">
                            {pair.fi}
                        </dd>
                        {pair.note && (
                            <dd className="mt-1 text-xs text-muted-foreground">
                                {pair.note}
                            </dd>
                        )}
                    </div>
                ))}
            </dl>
        </div>
    );
}
