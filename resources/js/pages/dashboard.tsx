import { Head, Link, usePage } from '@inertiajs/react';
import { Check, Lock, Mic, PenLine, RotateCcw, Star } from 'lucide-react';
import LessonController from '@/actions/App/Http/Controllers/LessonController';
import ExamBadge from '@/components/course/exam-badge';
import Mascot from '@/components/course/mascot';
import ProgressRing from '@/components/course/progress-ring';
import UnitIcon from '@/components/course/unit-icon';
import { colorClasses } from '@/lib/course/colors';
import { cn } from '@/lib/utils';
import { show as review } from '@/routes/review';
import type {
    LearnerHeader,
    PathLesson,
    PathUnit,
    Readiness,
} from '@/types/course';

/**
 * Horizontal offsets that make the lessons of a unit snake down the page.
 */
const ZIGZAG = [0, 44, 66, 44, 0, -44, -66, -44];

const TIPS = [
    'Ruotsissa taipuva verbi on aina toisena: "I mitt jobb har jag lärt mig att prioritera."',
    'Kirjallisessa kokeessa ymmärretään ruotsia suomeksi. Artikkeli "Detta krävs av framtidens it-konsult" on kokeen tärkein teksti.',
    'Suullisessa kokeessa riittää aluksi vastata parilla virkkeellä. Opettele esittelylauseet niin, että osaat ne "silmät kiinni".',
    'Opettele substantiivit aina en- tai ett-sanan kanssa: en dator, ett nätverk.',
    'Pieni määrä joka päivä toimii paremmin kuin paljon kerralla. Kertaa erääntyneet lauseet ensin.',
];

function ReadinessBar({
    label,
    value,
    className,
}: {
    label: string;
    value: number;
    className: string;
}) {
    return (
        <div>
            <div className="flex justify-between text-xs font-bold">
                <span>{label}</span>
                <span>{value} %</span>
            </div>
            <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-muted">
                <div
                    className={cn('h-full rounded-full', className)}
                    style={{ width: `${value}%` }}
                />
            </div>
        </div>
    );
}

function LessonNode({
    lesson,
    unit,
    offset,
}: {
    lesson: PathLesson;
    unit: PathUnit;
    offset: number;
}) {
    const colors = colorClasses(unit.color);
    const locked = lesson.state === 'locked';
    const Icon = lesson.state === 'completed' ? Check : locked ? Lock : Star;

    const node = (
        <span
            className={cn(
                'relative flex size-16 items-center justify-center rounded-full border-b-[6px] transition active:translate-y-1 active:border-b-2',
                locked
                    ? 'border-zinc-300 bg-zinc-200 text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800'
                    : [colors.solid, colors.edge],
                lesson.isNext && [
                    'ring-4 ring-offset-4 ring-offset-background',
                    colors.ring,
                ],
            )}
        >
            <Icon className="size-7" strokeWidth={3} />
        </span>
    );

    return (
        <div
            className="flex flex-col items-center"
            style={{ transform: `translateX(${offset}px)` }}
        >
            {lesson.isNext && (
                <span
                    className={cn(
                        'mb-2 animate-bounce rounded-xl border-2 bg-background px-3 py-1 text-xs font-extrabold uppercase',
                        colors.text,
                    )}
                >
                    Aloita tästä
                </span>
            )}
            {locked ? (
                <div
                    aria-disabled="true"
                    title="Suorita ensin edellinen oppitunti"
                >
                    {node}
                </div>
            ) : lesson.state === 'completed' ? (
                <Link
                    href={LessonController.show(lesson.id)}
                    aria-label={`${lesson.title}, suoritettu`}
                >
                    <ProgressRing
                        value={lesson.mastery}
                        size={84}
                        stroke={6}
                        barClassName="stroke-amber-400"
                    >
                        {node}
                    </ProgressRing>
                </Link>
            ) : (
                <Link
                    href={LessonController.show(lesson.id)}
                    aria-label={lesson.title}
                >
                    {node}
                </Link>
            )}
            <span
                className={cn(
                    'mt-2 max-w-36 text-center text-xs font-bold',
                    locked && 'text-muted-foreground',
                )}
            >
                {lesson.title}
            </span>
        </div>
    );
}

function UnitBanner({ unit, index }: { unit: PathUnit; index: number }) {
    const colors = colorClasses(unit.color);

    return (
        <div
            className={cn(
                'rounded-3xl border-b-[6px] p-4',
                colors.solid,
                colors.edge,
            )}
        >
            <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                    <p className="text-xs font-extrabold tracking-wide uppercase opacity-80">
                        Osa {index + 1}
                    </p>
                    <h2 className="text-xl leading-tight font-extrabold">
                        {unit.title}
                    </h2>
                    <p className="mt-0.5 text-sm italic opacity-90" lang="sv">
                        {unit.subtitle}
                    </p>
                </div>
                <div className="rounded-2xl bg-white/20 p-2.5">
                    <UnitIcon name={unit.icon} className="size-7" />
                </div>
            </div>
            <p className="mt-2 text-sm opacity-95">{unit.description}</p>
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
                {unit.exam.map((exam) => (
                    <ExamBadge key={exam} exam={exam} />
                ))}
                <span className="ml-auto text-xs font-bold">
                    {unit.items.mastered}/{unit.items.total} hallussa
                </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/15">
                <div
                    className="h-full rounded-full bg-white"
                    style={{ width: `${unit.mastery}%` }}
                />
            </div>
        </div>
    );
}

export default function Dashboard({
    units,
    readiness,
}: {
    units: PathUnit[];
    readiness: Readiness;
}) {
    const { learner } = usePage<{ learner: LearnerHeader | null }>().props;
    const nextLesson = units
        .flatMap((unit) => unit.lessons)
        .find((lesson) => lesson.isNext);
    const hasCompletedLessons = readiness.lessonsCompleted > 0;

    return (
        <>
            <Head title="Polku" />

            <section className="rounded-3xl border-2 border-b-4 p-4">
                <div className="flex items-center gap-4">
                    <ProgressRing
                        value={readiness.mastery}
                        size={96}
                        stroke={10}
                        barClassName="stroke-violet-500"
                    >
                        <span className="text-xl font-extrabold">
                            {readiness.mastery}%
                        </span>
                    </ProgressRing>
                    <div className="min-w-0 flex-1">
                        <h1 className="text-lg leading-tight font-extrabold">
                            Kurssin hallinta
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {readiness.items.mastered}/{readiness.items.total}{' '}
                            lausetta ja sanaa hallussa ·{' '}
                            {readiness.lessonsCompleted}/
                            {readiness.lessonsTotal} oppituntia
                        </p>
                    </div>
                </div>

                <div className="mt-4 grid gap-2.5">
                    <ReadinessBar
                        label="Suullinen koe (60 %)"
                        value={readiness.oral}
                        className="bg-rose-500"
                    />
                    <ReadinessBar
                        label="Kirjallinen koe (40 %)"
                        value={readiness.written}
                        className="bg-sky-500"
                    />
                    <ReadinessBar
                        label="Kurssitehtävät"
                        value={readiness.assignment}
                        className="bg-amber-500"
                    />
                </div>

                {nextLesson && (
                    <Link
                        href={LessonController.show(nextLesson.id)}
                        className="mt-4 block rounded-2xl border-b-4 border-emerald-700 bg-emerald-500 px-4 py-3 text-center font-extrabold text-white uppercase active:translate-y-0.5"
                    >
                        Jatka: {nextLesson.title}
                    </Link>
                )}
            </section>

            {hasCompletedLessons && (
                <section className="mt-4 grid grid-cols-3 gap-2">
                    <Link
                        href={review()}
                        className="relative flex flex-col items-center gap-1 rounded-2xl border-2 border-b-4 p-3 text-center text-xs font-bold active:translate-y-0.5"
                    >
                        <RotateCcw className="size-6 text-violet-500" />
                        Kertaus
                        {(learner?.dueCount ?? 0) > 0 && (
                            <span className="absolute -top-2 -right-1 rounded-full bg-rose-500 px-1.5 text-[11px] text-white">
                                {learner?.dueCount}
                            </span>
                        )}
                    </Link>
                    <Link
                        href={review({ query: { mode: 'written' } })}
                        className="flex flex-col items-center gap-1 rounded-2xl border-2 border-b-4 p-3 text-center text-xs font-bold active:translate-y-0.5"
                    >
                        <PenLine className="size-6 text-sky-500" />
                        Kirjallinen
                    </Link>
                    <Link
                        href={review({ query: { mode: 'oral' } })}
                        className="flex flex-col items-center gap-1 rounded-2xl border-2 border-b-4 p-3 text-center text-xs font-bold active:translate-y-0.5"
                    >
                        <Mic className="size-6 text-rose-500" />
                        Suullinen
                    </Link>
                </section>
            )}

            <div className="mt-8 space-y-10">
                {units.map((unit, unitIndex) => (
                    <section key={unit.id} aria-labelledby={`unit-${unit.id}`}>
                        <div id={`unit-${unit.id}`}>
                            <UnitBanner unit={unit} index={unitIndex} />
                        </div>

                        <div className="mt-8 flex flex-col items-center gap-6">
                            {unit.lessons.map((lesson, lessonIndex) => (
                                <LessonNode
                                    key={lesson.id}
                                    lesson={lesson}
                                    unit={unit}
                                    offset={ZIGZAG[lessonIndex % ZIGZAG.length]}
                                />
                            ))}
                        </div>

                        {unitIndex % 3 === 1 && (
                            <div
                                className={cn(
                                    'mt-10 flex items-end gap-3',
                                    unitIndex % 2 === 1 && 'flex-row-reverse',
                                )}
                            >
                                <Mascot
                                    mood={
                                        unitIndex % 4 === 1 ? 'think' : 'happy'
                                    }
                                    className="size-20 shrink-0"
                                />
                                <p className="rounded-2xl border-2 bg-card p-3 text-sm">
                                    <span className="font-extrabold">
                                        Vinkki:{' '}
                                    </span>
                                    {
                                        TIPS[
                                            Math.floor(unitIndex / 3) %
                                                TIPS.length
                                        ]
                                    }
                                </p>
                            </div>
                        )}
                    </section>
                ))}
            </div>

            <div className="mt-12 flex flex-col items-center gap-2 text-center">
                <Mascot mood="cheer" className="size-28" />
                <p className="font-extrabold">
                    Polun päässä odottaa koe. Lycka till!
                </p>
            </div>
        </>
    );
}
