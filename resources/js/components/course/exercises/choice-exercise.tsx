import { useEffect, useState } from 'react';
import type { ExerciseProps } from '@/components/course/exercises/types';
import { cn } from '@/lib/utils';
import type { ChooseExercise } from '@/types/course';

/**
 * Pick the right Finnish meaning for a Swedish sentence (choose_fi),
 * or the right Swedish sentence for a Finnish meaning (choose_sv).
 */
export default function ChoiceExercise({
    exercise,
    verdict,
    onAnswerChange,
}: ExerciseProps<ChooseExercise>) {
    const [selected, setSelected] = useState<string | null>(null);
    const showsSwedishPrompt = exercise.kind === 'choose_fi';

    useEffect(() => {
        onAnswerChange(
            selected === null
                ? null
                : () => ({
                      correct: selected === exercise.answer,
                      solution: exercise.answer,
                  }),
        );
    }, [selected, exercise, onAnswerChange]);

    return (
        <div className="space-y-6">
            <div>
                <p className="text-sm font-semibold text-muted-foreground">
                    {showsSwedishPrompt
                        ? 'Mitä tämä tarkoittaa?'
                        : 'Valitse oikea ruotsinkielinen lause'}
                </p>
                <p
                    className={cn(
                        'mt-3 rounded-2xl border-2 p-4 text-lg leading-snug font-semibold',
                        showsSwedishPrompt && 'text-xl',
                    )}
                    lang={showsSwedishPrompt ? 'sv' : 'fi'}
                >
                    {exercise.prompt}
                </p>
            </div>

            <div className="grid gap-3" role="radiogroup">
                {exercise.options.map((option, index) => {
                    const isSelected = selected === option;
                    const isAnswer = option === exercise.answer;

                    return (
                        <button
                            key={option}
                            type="button"
                            role="radio"
                            aria-checked={isSelected}
                            disabled={verdict !== null}
                            onClick={() => setSelected(option)}
                            lang={showsSwedishPrompt ? 'fi' : 'sv'}
                            className={cn(
                                'flex items-start gap-3 rounded-2xl border-2 border-b-4 bg-card p-3.5 text-left text-base leading-snug transition-colors active:translate-y-px',
                                isSelected &&
                                    verdict === null &&
                                    'border-sky-400 bg-sky-50 dark:bg-sky-950/40',
                                verdict !== null &&
                                    isAnswer &&
                                    'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40',
                                verdict !== null &&
                                    isSelected &&
                                    !isAnswer &&
                                    'border-rose-500 bg-rose-50 dark:bg-rose-950/40',
                            )}
                        >
                            <span className="flex size-6 shrink-0 items-center justify-center rounded-md border text-xs font-bold text-muted-foreground">
                                {index + 1}
                            </span>
                            <span>{option}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
