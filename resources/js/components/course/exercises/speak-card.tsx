import { Eye } from 'lucide-react';
import { useState } from 'react';
import Mascot from '@/components/course/mascot';
import SpeakButton from '@/components/course/speak-button';
import type { SpeakExercise } from '@/types/course';

/**
 * Rehearses the oral exam: the learner answers a question aloud from memory
 * and only then reveals the model answers to compare.
 */
export default function SpeakCard({ exercise }: { exercise: SpeakExercise }) {
    const [revealed, setRevealed] = useState(false);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <Mascot mood="think" className="size-16 shrink-0" />
                <div className="rounded-2xl border-2 px-4 py-2 text-sm font-semibold">
                    Kuten kokeessa: vastaa ääneen ruotsiksi, ilman
                    muistiinpanoja. Katso mallivastaus vasta sen jälkeen.
                </div>
            </div>

            <div className="rounded-3xl border-2 border-b-4 p-5">
                <div className="flex items-start gap-3">
                    <p
                        className="flex-1 text-2xl leading-snug font-bold"
                        lang="sv"
                    >
                        {exercise.hint.sv}
                    </p>
                    <SpeakButton text={exercise.hint.sv} />
                </div>
                {revealed && (
                    <p className="mt-3 text-lg text-muted-foreground" lang="fi">
                        {exercise.hint.fi}
                    </p>
                )}
            </div>

            {revealed ? (
                <section className="space-y-2">
                    <h2 className="text-sm font-semibold text-muted-foreground">
                        {exercise.answers.length > 1
                            ? 'Mallivastauksia. Sano ne vielä kerran ääneen.'
                            : 'Mallivastaus. Sano se vielä kerran ääneen.'}
                    </h2>
                    <ul className="divide-y rounded-3xl border-2 border-b-4">
                        {exercise.answers.map((answer) => (
                            <li
                                key={answer.itemId}
                                className="flex items-start gap-3 px-4 py-3"
                            >
                                <div className="flex-1">
                                    <p className="font-bold" lang="sv">
                                        {answer.sv}
                                    </p>
                                    <p
                                        className="text-sm text-muted-foreground"
                                        lang="fi"
                                    >
                                        {answer.fi}
                                    </p>
                                </div>
                                <SpeakButton text={answer.sv} />
                            </li>
                        ))}
                    </ul>
                </section>
            ) : (
                <button
                    type="button"
                    onClick={() => setRevealed(true)}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-b-4 px-4 py-3 font-bold active:translate-y-px"
                >
                    <Eye className="size-5" aria-hidden="true" />
                    Näytä mallivastaus
                </button>
            )}
        </div>
    );
}
