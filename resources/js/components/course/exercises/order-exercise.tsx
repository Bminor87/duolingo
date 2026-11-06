import { useEffect, useState } from 'react';
import type { ExerciseProps } from '@/components/course/exercises/types';
import { cn } from '@/lib/utils';
import type { OrderExercise as OrderExerciseData } from '@/types/course';

/**
 * Build the Swedish sentence by tapping the word tiles in the right order.
 * A tile or two that does not belong to the sentence is mixed in.
 */
export default function OrderExercise({
    exercise,
    verdict,
    onAnswerChange,
}: ExerciseProps<OrderExerciseData>) {
    const [placed, setPlaced] = useState<number[]>([]);
    const solution = exercise.answer.join(' ');

    useEffect(() => {
        if (placed.length === 0) {
            onAnswerChange(null);

            return;
        }

        const built = placed.map((index) => exercise.tiles[index]).join(' ');

        onAnswerChange(() => ({
            correct: built.toLowerCase() === solution.toLowerCase(),
            solution,
        }));
    }, [placed, exercise, solution, onAnswerChange]);

    const tileClasses =
        'rounded-xl border-2 border-b-4 bg-card px-3 py-2 text-base font-semibold active:translate-y-px';

    return (
        <div className="space-y-6">
            <div>
                <p className="text-sm font-semibold text-muted-foreground">
                    Järjestä sanat ruotsiksi
                </p>
                <p
                    className="mt-3 text-lg leading-snug font-semibold"
                    lang="fi"
                >
                    {exercise.prompt}
                </p>
            </div>

            <div
                className={cn(
                    'flex min-h-28 flex-wrap content-start gap-2 border-y-2 py-3',
                    verdict?.correct === true && 'border-emerald-500',
                    verdict?.correct === false && 'border-rose-500',
                )}
                lang="sv"
            >
                {placed.map((tileIndex, position) => (
                    <button
                        key={tileIndex}
                        type="button"
                        disabled={verdict !== null}
                        onClick={() =>
                            setPlaced(placed.filter((_, i) => i !== position))
                        }
                        className={tileClasses}
                    >
                        {exercise.tiles[tileIndex]}
                    </button>
                ))}
            </div>

            <div className="flex flex-wrap justify-center gap-2" lang="sv">
                {exercise.tiles.map((tile, tileIndex) => {
                    const isPlaced = placed.includes(tileIndex);

                    return (
                        <button
                            key={tileIndex}
                            type="button"
                            disabled={isPlaced || verdict !== null}
                            onClick={() => setPlaced([...placed, tileIndex])}
                            className={cn(
                                tileClasses,
                                isPlaced &&
                                    'border-transparent bg-muted text-transparent',
                            )}
                        >
                            {tile}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
