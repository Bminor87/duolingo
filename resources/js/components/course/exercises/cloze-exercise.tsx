import { useEffect, useRef, useState } from 'react';
import type { ExerciseProps } from '@/components/course/exercises/types';
import { checkTypedAnswer } from '@/lib/course/text';
import { cn } from '@/lib/utils';
import type { ClozeExercise as ClozeExerciseData } from '@/types/course';

const NORDIC_LETTERS = ['å', 'ä', 'ö'];

/**
 * Fill in one missing word, by choosing it from a word bank or typing it.
 * With a model sentence it becomes a pattern exercise: the learned sentence is shown
 * next to a new sentence where one word changed.
 */
export default function ClozeExercise({
    exercise,
    verdict,
    onAnswerChange,
    onSubmit,
}: ExerciseProps<ClozeExerciseData>) {
    const [answer, setAnswer] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const isTyping = exercise.mode === 'type';
    const solution = `${exercise.before}${exercise.answer}${exercise.after}`;

    useEffect(() => {
        if (answer.trim() === '') {
            onAnswerChange(null);

            return;
        }

        onAnswerChange(() => {
            const result = isTyping
                ? checkTypedAnswer(answer, exercise.accepted)
                : answer === exercise.answer
                  ? 'correct'
                  : 'wrong';

            return {
                correct: result !== 'wrong',
                accent: result === 'accent',
                solution,
            };
        });
    }, [answer, exercise, isTyping, solution, onAnswerChange]);

    const insertLetter = (letter: string) => {
        const input = inputRef.current;

        if (!input) {
            setAnswer((current) => current + letter);

            return;
        }

        const start = input.selectionStart ?? answer.length;
        const end = input.selectionEnd ?? answer.length;
        setAnswer(answer.slice(0, start) + letter + answer.slice(end));
        requestAnimationFrame(() => {
            input.focus();
            input.setSelectionRange(start + 1, start + 1);
        });
    };

    const blankState =
        verdict === null
            ? 'border-sky-400'
            : verdict.correct
              ? 'border-emerald-500 text-emerald-700 dark:text-emerald-300'
              : 'border-rose-500 text-rose-700 dark:text-rose-300';

    return (
        <div className="space-y-6">
            <p className="text-sm font-semibold text-muted-foreground">
                {exercise.model
                    ? 'Sama rakenne, yksi sana vaihtuu'
                    : isTyping
                      ? 'Kirjoita puuttuva sana'
                      : 'Valitse puuttuva sana'}
            </p>

            {exercise.model && (
                <div className="rounded-2xl border-2 border-dashed p-3 text-sm">
                    <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                        Malli
                    </p>
                    <p className="mt-1 font-semibold" lang="sv">
                        {exercise.model.sv}
                    </p>
                    <p className="text-muted-foreground">{exercise.model.fi}</p>
                </div>
            )}

            <div className="space-y-3">
                <p className="text-muted-foreground" lang="fi">
                    {exercise.prompt}
                </p>
                <p className="text-xl leading-loose font-semibold" lang="sv">
                    {exercise.before}
                    {isTyping ? (
                        <input
                            ref={inputRef}
                            value={answer}
                            onChange={(event) => setAnswer(event.target.value)}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                    event.preventDefault();
                                    onSubmit();
                                }
                            }}
                            disabled={verdict !== null}
                            autoFocus
                            autoCapitalize="off"
                            autoComplete="off"
                            autoCorrect="off"
                            spellCheck={false}
                            aria-label="Puuttuva sana"
                            placeholder={`${exercise.answer.charAt(0)}…`}
                            size={Math.max(exercise.answer.length + 1, 4)}
                            className={cn(
                                'mx-1 inline-block max-w-full border-b-4 bg-transparent px-1 text-center outline-none placeholder:text-muted-foreground/50',
                                blankState,
                            )}
                        />
                    ) : (
                        <span
                            className={cn(
                                'mx-1 inline-block min-w-16 border-b-4 px-1 text-center',
                                blankState,
                            )}
                        >
                            {answer || ' '}
                        </span>
                    )}
                    {exercise.after}
                </p>
            </div>

            {isTyping ? (
                <div className="flex gap-2">
                    {NORDIC_LETTERS.map((letter) => (
                        <button
                            key={letter}
                            type="button"
                            onClick={() => insertLetter(letter)}
                            disabled={verdict !== null}
                            className="size-11 rounded-xl border-2 border-b-4 text-lg font-semibold active:translate-y-px"
                        >
                            {letter}
                        </button>
                    ))}
                </div>
            ) : (
                <div className="flex flex-wrap gap-2">
                    {exercise.options.map((option) => (
                        <button
                            key={option}
                            type="button"
                            disabled={verdict !== null}
                            onClick={() =>
                                setAnswer((current) =>
                                    current === option ? '' : option,
                                )
                            }
                            lang="sv"
                            className={cn(
                                'rounded-xl border-2 border-b-4 px-4 py-2.5 text-base font-semibold transition-colors active:translate-y-px',
                                answer === option &&
                                    'border-sky-400 bg-sky-50 dark:bg-sky-950/40',
                            )}
                        >
                            {option}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
