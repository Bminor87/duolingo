export type Verdict = {
    correct: boolean;
    /** The answer was right except for å/ä/ö written as a/o. */
    accent?: boolean;
    /** The correct answer shown in the feedback footer. */
    solution: string;
};

export type Checker = () => Verdict;

export type ExerciseProps<T> = {
    exercise: T;
    /** The verdict after checking; while null the learner is still answering. */
    verdict: Verdict | null;
    /** Report a function that checks the current answer, or null when nothing is answered yet. */
    onAnswerChange: (checker: Checker | null) => void;
    /** Check right away (e.g. Enter in a text field). */
    onSubmit: () => void;
};
