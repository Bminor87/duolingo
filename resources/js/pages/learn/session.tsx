import { Head, Link, useHttp } from '@inertiajs/react';
import { CircleHelp, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import LessonController from '@/actions/App/Http/Controllers/LessonController';
import ReviewController from '@/actions/App/Http/Controllers/ReviewController';
import ChoiceExercise from '@/components/course/exercises/choice-exercise';
import ClozeExercise from '@/components/course/exercises/cloze-exercise';
import {
    LearnCard,
    LearnWordsCard,
} from '@/components/course/exercises/learn-cards';
import MatchExercise from '@/components/course/exercises/match-exercise';
import OrderExercise from '@/components/course/exercises/order-exercise';
import type { Checker, Verdict } from '@/components/course/exercises/types';
import HintPanel from '@/components/course/hint-panel';
import type { HintVariant } from '@/components/course/hint-panel';
import Mascot from '@/components/course/mascot';
import SessionResult from '@/components/course/session-result';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { colorClasses } from '@/lib/course/colors';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';
import type {
    Exercise,
    GradedExercise,
    SessionData,
    SessionSummary,
} from '@/types/course';

/**
 * A wrong answer is asked again at the end of the session, at most this many times in total.
 */
const MAX_ATTEMPTS = 2;

type QueueEntry = { exercise: Exercise; attempt: number };

type Phase = 'intro' | 'play' | 'saving' | 'done' | 'error';

type ResultPayload = {
    results: { item_id: string; correct: boolean }[];
    exercises_total: number;
    exercises_correct: number;
    duration_seconds: number;
};

function isGraded(exercise: Exercise): exercise is GradedExercise {
    return exercise.kind !== 'learn' && exercise.kind !== 'learn_words';
}

function itemIdsOf(exercise: GradedExercise): string[] {
    return exercise.kind === 'match' ? exercise.itemIds : [exercise.itemId];
}

function hintVariant(exercise: Exercise, answered: boolean): HintVariant {
    if (answered || exercise.kind === 'learn') {
        return 'full';
    }

    switch (exercise.kind) {
        case 'choose_fi':
            return 'no-translation';
        case 'cloze':
            return 'masked';
        case 'order':
            return 'scrambled';
        default:
            return 'grammar-only';
    }
}

const PRAISE = [
    'Hienoa!',
    'Oikein!',
    'Mahtavaa!',
    'Juuri niin!',
    'Bra jobbat!',
];

export default function Session({ session }: { session: SessionData }) {
    const colors = colorClasses(session.color);
    const originalGradedCount = useMemo(
        () => session.exercises.filter(isGraded).length,
        [session.exercises],
    );

    const [phase, setPhase] = useState<Phase>(
        session.intro || session.kind === 'review' ? 'intro' : 'play',
    );
    const [queue, setQueue] = useState<QueueEntry[]>(() =>
        session.exercises.map((exercise) => ({ exercise, attempt: 1 })),
    );
    const [position, setPosition] = useState(0);
    const [checker, setChecker] = useState<Checker | null>(null);
    const [verdict, setVerdict] = useState<Verdict | null>(null);
    const [finishedIds, setFinishedIds] = useState<Set<string>>(new Set());
    const [hintOpen, setHintOpen] = useState(false);
    const [exitOpen, setExitOpen] = useState(false);
    const [summary, setSummary] = useState<SessionSummary | null>(null);

    const firstTryCorrect = useRef(new Map<string, boolean>());
    const itemMistakes = useRef(new Map<string, boolean>());
    const missedItemIds = useRef(new Set<string>());
    const startedAt = useRef(Date.now());

    const http = useHttp<ResultPayload, SessionSummary>({
        results: [],
        exercises_total: 0,
        exercises_correct: 0,
        duration_seconds: 0,
    });

    const current = queue[position] as QueueEntry | undefined;
    const exercise = current?.exercise;
    const progress = Math.round(
        (finishedIds.size / Math.max(session.exercises.length, 1)) * 100,
    );

    const registerAnswer = useCallback((next: Checker | null) => {
        setChecker(() => next);
    }, []);

    const recordAnswer = useCallback(
        (graded: GradedExercise, correct: boolean, missed: string[] = []) => {
            if (!firstTryCorrect.current.has(graded.id)) {
                firstTryCorrect.current.set(graded.id, correct);
            }

            for (const itemId of itemIdsOf(graded)) {
                const hadMistake =
                    graded.kind === 'match'
                        ? missed.includes(itemId)
                        : !correct;
                itemMistakes.current.set(
                    itemId,
                    (itemMistakes.current.get(itemId) ?? false) || hadMistake,
                );

                if (hadMistake) {
                    missedItemIds.current.add(itemId);
                }
            }
        },
        [],
    );

    const save = useCallback(() => {
        setPhase('saving');

        const payload: ResultPayload = {
            results: [...itemMistakes.current.entries()].map(
                ([itemId, hadMistake]) => ({
                    item_id: itemId,
                    correct: !hadMistake,
                }),
            ),
            exercises_total: originalGradedCount,
            exercises_correct: [...firstTryCorrect.current.values()].filter(
                Boolean,
            ).length,
            duration_seconds: Math.round(
                (Date.now() - startedAt.current) / 1000,
            ),
        };

        const url =
            session.kind === 'lesson' && session.lessonId
                ? LessonController.complete.url(session.lessonId)
                : ReviewController.complete.url();

        http.transform(() => payload);
        http.post(url)
            .then((response) => {
                setSummary(response);
                setPhase('done');
            })
            .catch(() => setPhase('error'));
    }, [http, originalGradedCount, session.kind, session.lessonId]);

    const advance = useCallback(
        (requeue: boolean) => {
            if (!current) {
                return;
            }

            let nextQueue = queue;

            if (requeue) {
                nextQueue = [
                    ...queue,
                    {
                        exercise: current.exercise,
                        attempt: current.attempt + 1,
                    },
                ];
                setQueue(nextQueue);
            } else {
                setFinishedIds((ids) => new Set(ids).add(current.exercise.id));
            }

            setVerdict(null);
            setChecker(null);
            setHintOpen(false);

            if (position + 1 >= nextQueue.length) {
                save();
            } else {
                setPosition(position + 1);
            }
        },
        [current, position, queue, save],
    );

    const check = useCallback(() => {
        if (!exercise || !isGraded(exercise) || !checker || verdict) {
            return;
        }

        const result = checker();
        setVerdict(result);
        recordAnswer(exercise, result.correct);
    }, [checker, exercise, recordAnswer, verdict]);

    const continueAfterVerdict = useCallback(() => {
        if (!current || !verdict) {
            return;
        }

        const retry =
            !verdict.correct &&
            current.exercise.kind !== 'match' &&
            current.attempt < MAX_ATTEMPTS;
        advance(retry);
    }, [advance, current, verdict]);

    const completeMatch = useCallback(
        (missed: string[]) => {
            if (!exercise || exercise.kind !== 'match') {
                return;
            }

            recordAnswer(exercise, missed.length === 0, missed);
            setVerdict({ correct: missed.length === 0, solution: '' });
        },
        [exercise, recordAnswer],
    );

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key !== 'Enter' || phase !== 'play' || hintOpen) {
                return;
            }

            if (event.target instanceof HTMLInputElement && !verdict) {
                return;
            }

            event.preventDefault();

            if (verdict) {
                continueAfterVerdict();
            } else if (exercise && !isGraded(exercise)) {
                advance(false);
            } else {
                check();
            }
        };

        window.addEventListener('keydown', onKeyDown);

        return () => window.removeEventListener('keydown', onKeyDown);
    }, [
        advance,
        check,
        continueAfterVerdict,
        exercise,
        hintOpen,
        phase,
        verdict,
    ]);

    const praise = useMemo(() => PRAISE[position % PRAISE.length], [position]);

    if (phase === 'done' && summary) {
        return (
            <>
                <Head title={session.title} />
                <SessionResult
                    session={session}
                    summary={summary}
                    missedItemIds={[...missedItemIds.current]}
                />
            </>
        );
    }

    const hint = exercise && 'hint' in exercise ? exercise.hint : null;

    return (
        <>
            <Head title={session.title} />

            <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col">
                <header className="sticky top-0 z-10 flex items-center gap-3 bg-background/95 px-4 py-3 backdrop-blur">
                    <button
                        type="button"
                        onClick={() => setExitOpen(true)}
                        className="rounded-full p-1.5 text-muted-foreground hover:bg-muted"
                        aria-label="Lopeta"
                    >
                        <X className="size-6" />
                    </button>
                    <div
                        className="h-4 flex-1 overflow-hidden rounded-full bg-muted"
                        role="progressbar"
                        aria-valuenow={progress}
                        aria-valuemin={0}
                        aria-valuemax={100}
                    >
                        <div
                            className={cn(
                                'h-full rounded-full transition-all duration-500',
                                colors.bar,
                            )}
                            style={{ width: `${Math.max(progress, 3)}%` }}
                        />
                    </div>
                    <button
                        type="button"
                        onClick={() => setHintOpen(true)}
                        disabled={!hint || phase !== 'play'}
                        className="rounded-full p-1.5 text-sky-600 hover:bg-sky-50 disabled:opacity-30 dark:hover:bg-sky-950/40"
                        aria-label="Vihje"
                    >
                        <CircleHelp className="size-7" />
                    </button>
                </header>

                <main className="flex-1 px-4 pt-4 pb-48">
                    {phase === 'intro' && (
                        <div className="flex flex-col items-center gap-5 pt-8 text-center">
                            <Mascot mood="happy" className="size-32" />
                            <div>
                                <p
                                    className={cn(
                                        'text-sm font-bold uppercase',
                                        colors.text,
                                    )}
                                >
                                    {session.subtitle}
                                </p>
                                <h1 className="mt-1 text-2xl font-extrabold">
                                    {session.title}
                                </h1>
                            </div>
                            {session.intro && (
                                <p className="max-w-md text-muted-foreground">
                                    {session.intro}
                                </p>
                            )}
                            {session.kind === 'review' && (
                                <p className="max-w-md text-muted-foreground">
                                    Kerrataan lauseita ja sanoja, joita et vielä
                                    hallitse tai joiden kertaus on
                                    ajankohtainen.
                                </p>
                            )}
                        </div>
                    )}

                    {(phase === 'saving' || phase === 'error') && (
                        <div className="flex flex-col items-center gap-4 pt-16 text-center">
                            <Mascot
                                mood={phase === 'error' ? 'sad' : 'think'}
                                className="size-32"
                            />
                            <p className="text-lg font-semibold">
                                {phase === 'error'
                                    ? 'Tallennus epäonnistui. Tarkista yhteys ja yritä uudelleen.'
                                    : 'Tallennetaan…'}
                            </p>
                        </div>
                    )}

                    {phase === 'play' && current && exercise && (
                        <div key={`${exercise.id}-${current.attempt}`}>
                            {current.attempt > 1 && (
                                <p className="mb-3 text-xs font-bold text-orange-600 uppercase">
                                    Uusi yritys
                                </p>
                            )}
                            {exercise.kind === 'learn' && (
                                <LearnCard exercise={exercise} />
                            )}
                            {exercise.kind === 'learn_words' && (
                                <LearnWordsCard exercise={exercise} />
                            )}
                            {(exercise.kind === 'choose_fi' ||
                                exercise.kind === 'choose_sv') && (
                                <ChoiceExercise
                                    exercise={exercise}
                                    verdict={verdict}
                                    onAnswerChange={registerAnswer}
                                    onSubmit={check}
                                />
                            )}
                            {exercise.kind === 'cloze' && (
                                <ClozeExercise
                                    exercise={exercise}
                                    verdict={verdict}
                                    onAnswerChange={registerAnswer}
                                    onSubmit={check}
                                />
                            )}
                            {exercise.kind === 'order' && (
                                <OrderExercise
                                    exercise={exercise}
                                    verdict={verdict}
                                    onAnswerChange={registerAnswer}
                                    onSubmit={check}
                                />
                            )}
                            {exercise.kind === 'match' && (
                                <MatchExercise
                                    exercise={exercise}
                                    onComplete={completeMatch}
                                />
                            )}
                        </div>
                    )}
                </main>

                <footer
                    className={cn(
                        'fixed inset-x-0 bottom-0 z-20 border-t-2 bg-background pb-[env(safe-area-inset-bottom)]',
                        verdict?.correct === true &&
                            'border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950',
                        verdict?.correct === false &&
                            'border-rose-200 bg-rose-50 dark:border-rose-900 dark:bg-rose-950',
                    )}
                >
                    <div className="mx-auto w-full max-w-2xl space-y-3 px-4 py-4">
                        {verdict && (
                            <div
                                className={cn(
                                    'space-y-1',
                                    verdict.correct
                                        ? 'text-emerald-800 dark:text-emerald-200'
                                        : 'text-rose-800 dark:text-rose-200',
                                )}
                                role="status"
                            >
                                <p className="text-xl font-extrabold">
                                    {verdict.correct
                                        ? praise
                                        : exercise?.kind === 'match'
                                          ? 'Kaikki parit löytyivät, pari virhettä matkalla.'
                                          : 'Ei aivan.'}
                                </p>
                                {verdict.accent && (
                                    <p className="text-sm font-semibold">
                                        Huomaa kirjaimet å, ä ja ö:{' '}
                                        {verdict.solution}
                                    </p>
                                )}
                                {!verdict.correct && verdict.solution && (
                                    <p className="text-sm">
                                        <span className="font-semibold">
                                            Oikea vastaus:
                                        </span>{' '}
                                        {verdict.solution}
                                    </p>
                                )}
                                {hint && (
                                    <button
                                        type="button"
                                        onClick={() => setHintOpen(true)}
                                        className="text-sm font-bold underline underline-offset-4"
                                    >
                                        Miksi? Näytä selitys
                                    </button>
                                )}
                            </div>
                        )}

                        <FooterButton
                            phase={phase}
                            exercise={exercise}
                            verdict={verdict}
                            canCheck={checker !== null}
                            onStart={() => setPhase('play')}
                            onCheck={check}
                            onContinue={() =>
                                verdict
                                    ? continueAfterVerdict()
                                    : advance(false)
                            }
                            onRetrySave={save}
                        />
                    </div>
                </footer>
            </div>

            <Sheet open={hintOpen} onOpenChange={setHintOpen}>
                <SheetContent
                    side="bottom"
                    className="max-h-[85dvh] overflow-y-auto rounded-t-3xl"
                >
                    <SheetHeader>
                        <SheetTitle>Selitys</SheetTitle>
                    </SheetHeader>
                    <div className="mx-auto w-full max-w-2xl px-4 pb-8">
                        {hint && exercise && (
                            <HintPanel
                                hint={hint}
                                glossary={session.glossary}
                                grammar={session.grammar}
                                variant={hintVariant(
                                    exercise,
                                    verdict !== null,
                                )}
                                mask={
                                    exercise.kind === 'cloze'
                                        ? exercise.answer
                                        : undefined
                                }
                            />
                        )}
                    </div>
                </SheetContent>
            </Sheet>

            <Dialog open={exitOpen} onOpenChange={setExitOpen}>
                <DialogContent>
                    <DialogTitle>Lopetetaanko?</DialogTitle>
                    <DialogDescription>
                        Tämän kerran edistystä ei tallenneta, jos lopetat nyt.
                    </DialogDescription>
                    <DialogFooter className="gap-2">
                        <button
                            type="button"
                            onClick={() => setExitOpen(false)}
                            className="rounded-2xl border-2 border-b-4 px-4 py-2.5 font-bold"
                        >
                            Jatka harjoittelua
                        </button>
                        <Link
                            href={dashboard()}
                            className="rounded-2xl bg-rose-500 px-4 py-2.5 text-center font-bold text-white"
                        >
                            Lopeta
                        </Link>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

function FooterButton({
    phase,
    exercise,
    verdict,
    canCheck,
    onStart,
    onCheck,
    onContinue,
    onRetrySave,
}: {
    phase: Phase;
    exercise: Exercise | undefined;
    verdict: Verdict | null;
    canCheck: boolean;
    onStart: () => void;
    onCheck: () => void;
    onContinue: () => void;
    onRetrySave: () => void;
}) {
    const base =
        'w-full rounded-2xl border-b-4 px-6 py-3.5 text-lg font-extrabold tracking-wide uppercase transition active:translate-y-0.5 active:border-b-2 disabled:border-b-4 disabled:opacity-40';

    if (phase === 'intro') {
        return (
            <button
                type="button"
                onClick={onStart}
                className={cn(
                    base,
                    'border-emerald-700 bg-emerald-500 text-white',
                )}
            >
                Aloita
            </button>
        );
    }

    if (phase === 'saving') {
        return (
            <button
                type="button"
                disabled
                className={cn(base, 'border-muted bg-muted')}
            >
                Tallennetaan…
            </button>
        );
    }

    if (phase === 'error') {
        return (
            <button
                type="button"
                onClick={onRetrySave}
                className={cn(
                    base,
                    'border-orange-700 bg-orange-500 text-white',
                )}
            >
                Yritä uudelleen
            </button>
        );
    }

    if (verdict || (exercise && !isGraded(exercise))) {
        return (
            <button
                type="button"
                onClick={onContinue}
                autoFocus
                className={cn(
                    base,
                    verdict?.correct === false
                        ? 'border-rose-700 bg-rose-500 text-white'
                        : 'border-emerald-700 bg-emerald-500 text-white',
                )}
            >
                Jatka
            </button>
        );
    }

    if (exercise?.kind === 'match') {
        return (
            <p className="py-3.5 text-center text-sm font-semibold text-muted-foreground">
                Napauta ruotsinkielistä sanaa ja sitten sen merkitystä.
            </p>
        );
    }

    return (
        <button
            type="button"
            onClick={onCheck}
            disabled={!canCheck}
            className={cn(base, 'border-emerald-700 bg-emerald-500 text-white')}
        >
            Tarkista
        </button>
    );
}

Session.layout = null;
