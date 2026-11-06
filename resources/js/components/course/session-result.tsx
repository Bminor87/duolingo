import { Link } from '@inertiajs/react';
import { Flame, Gauge, Target, TrendingUp, Zap } from 'lucide-react';
import type { ReactNode } from 'react';
import LessonController from '@/actions/App/Http/Controllers/LessonController';
import Mascot from '@/components/course/mascot';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';
import type { SessionData, SessionSummary } from '@/types/course';

function StatTile({
    icon,
    label,
    value,
    className,
}: {
    icon: ReactNode;
    label: string;
    value: string;
    className: string;
}) {
    return (
        <div className={cn('rounded-2xl border-2 p-3 text-center', className)}>
            <p className="text-xs font-bold uppercase">{label}</p>
            <p className="mt-1 flex items-center justify-center gap-1.5 text-2xl font-extrabold">
                {icon}
                {value}
            </p>
        </div>
    );
}

/**
 * The celebration screen after a lesson or review, with what to practise next.
 */
export default function SessionResult({
    session,
    summary,
    missedItemIds,
}: {
    session: SessionData;
    summary: SessionSummary;
    missedItemIds: string[];
}) {
    const texts = new Map<string, { sv: string; fi: string }>();

    for (const exercise of session.exercises) {
        if ('hint' in exercise && 'itemId' in exercise) {
            texts.set(exercise.itemId, {
                sv: exercise.hint.sv,
                fi: exercise.hint.fi,
            });
        }

        if ('pairs' in exercise) {
            for (const pair of exercise.pairs) {
                texts.set(pair.itemId, { sv: pair.sv, fi: pair.fi });
            }
        }
    }

    const missed = missedItemIds
        .map((itemId) => texts.get(itemId))
        .filter(
            (text): text is { sv: string; fi: string } => text !== undefined,
        );
    const perfect = summary.accuracy === 100;
    const goalReached = summary.todayXp >= summary.dailyGoal;

    return (
        <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-4 py-8">
            <div className="flex flex-col items-center text-center">
                <div className="relative">
                    <div className="absolute inset-0 -z-10 animate-ping rounded-full bg-amber-300/30" />
                    <Mascot mood="cheer" className="size-36" />
                </div>
                <h1 className="mt-4 text-3xl font-extrabold">
                    {session.kind === 'review'
                        ? 'Kertaus tehty!'
                        : summary.firstCompletion
                          ? 'Oppitunti suoritettu!'
                          : 'Hyvää harjoittelua!'}
                </h1>
                <p className="mt-2 text-muted-foreground">
                    {perfect
                        ? 'Ei yhtään virhettä. Bra jobbat!'
                        : 'Jokainen virhe on oppimista. Kertaa alla olevat lauseet.'}
                </p>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatTile
                    icon={<Zap className="size-5" />}
                    label="XP"
                    value={`+${summary.xp}`}
                    className="border-amber-300 text-amber-600"
                />
                <StatTile
                    icon={<Target className="size-5" />}
                    label="Tarkkuus"
                    value={`${summary.accuracy} %`}
                    className="border-emerald-300 text-emerald-600"
                />
                <StatTile
                    icon={<TrendingUp className="size-5" />}
                    label="Vahvistui"
                    value={`${summary.strengthened}`}
                    className="border-sky-300 text-sky-600"
                />
                <StatTile
                    icon={<Gauge className="size-5" />}
                    label="Kurssi"
                    value={`${summary.mastery} %`}
                    className="border-violet-300 text-violet-600"
                />
            </div>

            <div className="mt-4 flex items-center gap-3 rounded-2xl bg-orange-50 p-4 dark:bg-orange-950/40">
                <Flame className="size-8 text-orange-500" />
                <div className="text-sm">
                    <p className="font-bold">{summary.streak} päivän putki</p>
                    <p className="text-muted-foreground">
                        {goalReached
                            ? `Päivän tavoite saavutettu (${summary.todayXp}/${summary.dailyGoal} XP).`
                            : `Tänään ${summary.todayXp}/${summary.dailyGoal} XP. Vielä ${summary.dailyGoal - summary.todayXp} XP päivän tavoitteeseen.`}
                    </p>
                </div>
            </div>

            {missed.length > 0 && (
                <section className="mt-6">
                    <h2 className="text-sm font-bold text-muted-foreground uppercase">
                        Kertaa nämä
                    </h2>
                    <ul className="mt-2 divide-y rounded-2xl border-2">
                        {missed.map((text) => (
                            <li key={text.sv} className="px-4 py-3">
                                <p className="font-semibold" lang="sv">
                                    {text.sv}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {text.fi}
                                </p>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            <div className="mt-auto grid gap-3 pt-8">
                {summary.nextLessonId &&
                    summary.nextLessonId !== session.lessonId && (
                        <Link
                            href={LessonController.show(summary.nextLessonId)}
                            className="rounded-2xl border-b-4 border-emerald-700 bg-emerald-500 px-6 py-3.5 text-center text-lg font-extrabold text-white uppercase active:translate-y-0.5"
                        >
                            Seuraava oppitunti
                        </Link>
                    )}
                <Link
                    href={dashboard()}
                    className="rounded-2xl border-2 border-b-4 px-6 py-3.5 text-center text-lg font-extrabold uppercase active:translate-y-0.5"
                >
                    Takaisin polulle
                </Link>
            </div>
        </div>
    );
}
