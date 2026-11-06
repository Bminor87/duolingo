import { cn } from '@/lib/utils';
import type { ExamPart } from '@/types/course';

export const examLabels: Record<ExamPart, string> = {
    oral: 'Suullinen koe',
    written: 'Kirjallinen koe',
    assignment: 'Tehtävä',
};

const examClasses: Record<ExamPart, string> = {
    oral: 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300',
    written: 'bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300',
    assignment:
        'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
};

export default function ExamBadge({
    exam,
    className,
}: {
    exam: ExamPart;
    className?: string;
}) {
    return (
        <span
            className={cn(
                'inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold',
                examClasses[exam],
                className,
            )}
        >
            {examLabels[exam]}
        </span>
    );
}
