import { Head, usePage } from '@inertiajs/react';
import { Clock, Flame, Gauge, Target, Zap } from 'lucide-react';
import type { ReactNode } from 'react';
import Mascot from '@/components/course/mascot';
import ProgressRing from '@/components/course/progress-ring';
import UnitIcon from '@/components/course/unit-icon';
import type { ItemCounts, LearnerHeader, Readiness } from '@/types/course';

type DailyXp = { date: string; xp: number };

type UnitStat = {
    id: string;
    title: string;
    icon: string;
    mastery: number;
    items: ItemCounts;
};

type Totals = {
    sessions: number;
    minutes: number;
    exercises: number;
    accuracy: number;
};

const weekdayFormatter = new Intl.DateTimeFormat('fi-FI', { weekday: 'short' });
const dateFormatter = new Intl.DateTimeFormat('fi-FI', {
    day: 'numeric',
    month: 'numeric',
});

function StatTile({
    icon,
    label,
    value,
}: {
    icon: ReactNode;
    label: string;
    value: string;
}) {
    return (
        <div className="rounded-2xl border-2 p-3">
            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                {icon}
                {label}
            </div>
            <p className="mt-1 text-2xl font-extrabold tabular-nums">{value}</p>
        </div>
    );
}

function DailyXpChart({ days, goal }: { days: DailyXp[]; goal: number }) {
    const max = Math.max(goal, ...days.map((day) => day.xp), 1);
    const goalPosition = (goal / max) * 100;

    return (
        <figure>
            <figcaption className="text-sm font-extrabold">
                XP päivittäin, 14 päivää
            </figcaption>
            <div className="relative mt-4 h-40">
                <div
                    className="absolute inset-x-0 border-t-2 border-dashed border-muted-foreground/30"
                    style={{ bottom: `${goalPosition}%` }}
                    aria-hidden="true"
                >
                    <span className="absolute -top-5 right-0 text-[11px] font-semibold text-muted-foreground">
                        tavoite {goal} XP
                    </span>
                </div>
                <div
                    className="absolute inset-0 flex items-end gap-0.5 border-b border-muted-foreground/30"
                    aria-hidden="true"
                >
                    {days.map((day) => (
                        <div
                            key={day.date}
                            className="group relative flex h-full flex-1 items-end justify-center"
                        >
                            <div
                                className="w-full max-w-5 rounded-t-[4px] bg-amber-500"
                                style={{
                                    height:
                                        day.xp > 0
                                            ? `${Math.max((day.xp / max) * 100, 2)}%`
                                            : 0,
                                }}
                            />
                            <div className="pointer-events-none absolute bottom-full mb-1 hidden rounded-lg border bg-popover px-2 py-1 text-xs whitespace-nowrap shadow-sm group-hover:block">
                                {dateFormatter.format(new Date(day.date))}:{' '}
                                <strong>{day.xp} XP</strong>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div
                className="mt-1 flex gap-0.5 text-center text-[10px] text-muted-foreground"
                aria-hidden="true"
            >
                {days.map((day, index) => (
                    <span key={day.date} className="flex-1">
                        {index % 2 === 1
                            ? weekdayFormatter.format(new Date(day.date))
                            : ''}
                    </span>
                ))}
            </div>
            <table className="sr-only">
                <caption>XP päivittäin</caption>
                <tbody>
                    {days.map((day) => (
                        <tr key={day.date}>
                            <th scope="row">{day.date}</th>
                            <td>{day.xp} XP</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </figure>
    );
}

export default function Statistics({
    readiness,
    dailyXp,
    totals,
    units,
}: {
    readiness: Readiness;
    dailyXp: DailyXp[];
    totals: Totals;
    units: UnitStat[];
}) {
    const { learner } = usePage<{ learner: LearnerHeader | null }>().props;
    const remaining = readiness.items.total - readiness.items.mastered;

    return (
        <>
            <Head title="Tilastot" />

            <section className="flex items-center gap-4 rounded-3xl border-2 border-b-4 p-4">
                <ProgressRing
                    value={readiness.mastery}
                    size={112}
                    stroke={12}
                    barClassName="stroke-violet-500"
                >
                    <span className="text-2xl font-extrabold">
                        {readiness.mastery}%
                    </span>
                </ProgressRing>
                <div className="min-w-0 flex-1">
                    <h1 className="text-xl font-extrabold">
                        Kuinka lähellä olet?
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {remaining === 0
                            ? 'Koko kurssi on hallussa. Jatka kertaamista, niin se pysyy muistissa.'
                            : `Vielä ${remaining} lausetta tai sanaa ennen kuin koko kurssi on hallussa. Lause on hallussa, kun olet osannut sen kolmella harjoituskerralla ilman virheitä. Virhe laskee tasoa yhdellä.`}
                    </p>
                </div>
            </section>

            <section className="mt-4 grid grid-cols-3 gap-2 text-center">
                {[
                    {
                        label: 'Suullinen',
                        value: readiness.oral,
                        bar: 'stroke-rose-500',
                    },
                    {
                        label: 'Kirjallinen',
                        value: readiness.written,
                        bar: 'stroke-sky-500',
                    },
                    {
                        label: 'Tehtävät',
                        value: readiness.assignment,
                        bar: 'stroke-amber-500',
                    },
                ].map((exam) => (
                    <div
                        key={exam.label}
                        className="flex flex-col items-center rounded-2xl border-2 p-3"
                    >
                        <ProgressRing
                            value={exam.value}
                            size={64}
                            stroke={7}
                            barClassName={exam.bar}
                        >
                            <span className="text-sm font-extrabold">
                                {exam.value}%
                            </span>
                        </ProgressRing>
                        <span className="mt-1 text-xs font-bold">
                            {exam.label}
                        </span>
                    </div>
                ))}
            </section>

            <section className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                <StatTile
                    icon={<Flame className="size-4 text-orange-500" />}
                    label="Putki"
                    value={`${learner?.streak ?? 0} pv`}
                />
                <StatTile
                    icon={<Zap className="size-4 text-amber-500" />}
                    label="XP yhteensä"
                    value={`${learner?.totalXp ?? 0}`}
                />
                <StatTile
                    icon={<Target className="size-4 text-emerald-500" />}
                    label="Tarkkuus"
                    value={`${totals.accuracy} %`}
                />
                <StatTile
                    icon={<Gauge className="size-4 text-violet-500" />}
                    label="Opittu"
                    value={`${readiness.items.learned}/${readiness.items.total}`}
                />
                <StatTile
                    icon={<Clock className="size-4 text-sky-500" />}
                    label="Opiskeltu"
                    value={`${totals.minutes} min`}
                />
                <StatTile
                    icon={<Target className="size-4 text-muted-foreground" />}
                    label="Harjoituksia"
                    value={`${totals.exercises}`}
                />
            </section>

            <section className="mt-4 rounded-3xl border-2 p-4">
                <DailyXpChart days={dailyXp} goal={learner?.dailyGoal ?? 30} />
            </section>

            <section className="mt-4 rounded-3xl border-2 p-4">
                <h2 className="text-sm font-extrabold">Hallinta osittain</h2>
                <ul className="mt-3 space-y-3">
                    {units.map((unit) => (
                        <li key={unit.id} className="flex items-center gap-3">
                            <UnitIcon
                                name={unit.icon}
                                className="size-5 shrink-0 text-muted-foreground"
                            />
                            <div className="min-w-0 flex-1">
                                <div className="flex justify-between gap-2 text-xs">
                                    <span className="truncate font-bold">
                                        {unit.title}
                                    </span>
                                    <span className="shrink-0 text-muted-foreground tabular-nums">
                                        {unit.items.mastered}/{unit.items.total}{' '}
                                        · {unit.mastery} %
                                    </span>
                                </div>
                                <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                                    <div
                                        className="h-full rounded-full bg-violet-500"
                                        style={{ width: `${unit.mastery}%` }}
                                    />
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            </section>

            {totals.sessions === 0 && (
                <div className="mt-6 flex items-center gap-3">
                    <Mascot mood="think" className="size-16 shrink-0" />
                    <p className="text-sm text-muted-foreground">
                        Tilastot täyttyvät, kun teet ensimmäisen oppitunnin.
                    </p>
                </div>
            )}
        </>
    );
}
