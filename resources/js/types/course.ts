export type UnitColor =
    | 'emerald'
    | 'sky'
    | 'violet'
    | 'amber'
    | 'rose'
    | 'teal'
    | 'indigo'
    | 'orange'
    | 'lime'
    | 'cyan'
    | 'fuchsia'
    | 'blue'
    | 'pink'
    | 'green'
    | 'red'
    | 'purple';

export type ExamPart = 'oral' | 'written' | 'assignment';

export type GrammarTopic = {
    title: string;
    body: string;
};

export type Hint = {
    sv: string;
    fi: string;
    note: string | null;
    grammar: string[];
    src: 'm' | 'x';
};

type BaseExercise = {
    id: string;
};

export type LearnExercise = BaseExercise & {
    kind: 'learn';
    itemId: string;
    hint: Hint;
};

export type WordPair = {
    itemId: string;
    sv: string;
    fi: string;
    note?: string | null;
};

export type LearnWordsExercise = BaseExercise & {
    kind: 'learn_words';
    itemIds: string[];
    pairs: WordPair[];
};

export type MatchExercise = BaseExercise & {
    kind: 'match';
    itemIds: string[];
    pairs: WordPair[];
};

export type ChooseExercise = BaseExercise & {
    kind: 'choose_fi' | 'choose_sv';
    itemId: string;
    prompt: string;
    options: string[];
    answer: string;
    hint: Hint;
};

export type ClozeExercise = BaseExercise & {
    kind: 'cloze';
    itemId: string;
    mode: 'choose' | 'type';
    before: string;
    after: string;
    answer: string;
    accepted: string[];
    options: string[];
    prompt: string;
    model: { sv: string; fi: string } | null;
    hint: Hint;
};

export type OrderExercise = BaseExercise & {
    kind: 'order';
    itemId: string;
    prompt: string;
    tiles: string[];
    answer: string[];
    hint: Hint;
};

/**
 * A question the learner answers aloud before revealing the model answers. Never graded.
 */
export type SpeakExercise = BaseExercise & {
    kind: 'speak';
    itemId: string;
    answers: WordPair[];
    hint: Hint;
};

export type Exercise =
    | LearnExercise
    | LearnWordsExercise
    | MatchExercise
    | ChooseExercise
    | ClozeExercise
    | OrderExercise
    | SpeakExercise;

export type GradedExercise = Exclude<
    Exercise,
    LearnExercise | LearnWordsExercise | SpeakExercise
>;

export type SessionData = {
    kind: 'lesson' | 'review';
    lessonId: string | null;
    mode?: 'mixed' | 'written' | 'oral';
    title: string;
    subtitle: string;
    intro: string | null;
    color: UnitColor;
    isPractice: boolean;
    exercises: Exercise[];
    glossary: Record<string, string>;
    grammar: Record<string, GrammarTopic>;
};

export type LearnerHeader = {
    streak: number;
    todayXp: number;
    dailyGoal: number;
    totalXp: number;
    mastery: number;
    dueCount: number;
};

export type SessionSummary = LearnerHeader & {
    xp: number;
    accuracy: number;
    strengthened: number;
    weakened: number;
    firstCompletion: boolean;
    nextLessonId: string | null;
};

export type ItemCounts = {
    total: number;
    learned: number;
    mastered: number;
};

export type PathLesson = {
    id: string;
    title: string;
    itemCount: number;
    state: 'locked' | 'available' | 'completed';
    mastery: number;
    isNext: boolean;
};

export type PathUnit = {
    id: string;
    title: string;
    subtitle: string;
    description: string;
    icon: string;
    color: UnitColor;
    exam: ExamPart[];
    mastery: number;
    items: ItemCounts;
    lessons: PathLesson[];
};

export type Readiness = {
    mastery: number;
    oral: number;
    written: number;
    assignment: number;
    items: ItemCounts;
    lessonsCompleted: number;
    lessonsTotal: number;
    nextLessonId: string | null;
};
