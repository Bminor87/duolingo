<?php

namespace App\Course;

use App\Models\ItemProgress;
use App\Models\LessonProgress;
use App\Models\StudySession;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Stores the outcome of a finished session: item strengths, lesson completion and earned XP.
 */
class SessionRecorder
{
    /**
     * Bonus XP for finishing a session.
     */
    public const int COMPLETION_BONUS = 5;

    /**
     * Extra XP for a session without a single mistake.
     */
    public const int PERFECT_BONUS = 5;

    /**
     * @param  list<array{item_id: string, correct: bool}>  $results
     * @return array{xp: int, accuracy: int, strengthened: int, weakened: int, firstCompletion: bool}
     */
    public function record(
        User $user,
        string $kind,
        ?string $lessonId,
        array $results,
        int $exercisesTotal,
        int $exercisesCorrect,
        int $durationSeconds,
    ): array {
        $accuracy = $exercisesTotal > 0 ? (int) round($exercisesCorrect / $exercisesTotal * 100) : 0;
        $xp = $exercisesCorrect + self::COMPLETION_BONUS + ($exercisesCorrect === $exercisesTotal ? self::PERFECT_BONUS : 0);

        return DB::transaction(function () use ($user, $kind, $lessonId, $results, $exercisesTotal, $exercisesCorrect, $durationSeconds, $accuracy, $xp): array {
            [$strengthened, $weakened] = $this->updateItems($user, $results);
            $firstCompletion = $lessonId !== null && $this->completeLesson($user, $lessonId, $accuracy);

            StudySession::create([
                'user_id' => $user->id,
                'kind' => $kind,
                'lesson_id' => $lessonId,
                'exercises_total' => $exercisesTotal,
                'exercises_correct' => $exercisesCorrect,
                'xp' => $xp,
                'duration_seconds' => $durationSeconds,
            ]);

            return [
                'xp' => $xp,
                'accuracy' => $accuracy,
                'strengthened' => $strengthened,
                'weakened' => $weakened,
                'firstCompletion' => $firstCompletion,
            ];
        });
    }

    /**
     * Raise the strength of items answered without mistakes and lower the others.
     *
     * @param  list<array{item_id: string, correct: bool}>  $results
     * @return array{0: int, 1: int}
     */
    private function updateItems(User $user, array $results): array
    {
        $strengthened = 0;
        $weakened = 0;
        $now = now();

        foreach ($results as $result) {
            $progress = ItemProgress::firstOrNew(['user_id' => $user->id, 'item_id' => $result['item_id']]);
            $previousStrength = $progress->strength ?? 0;

            if ($result['correct']) {
                $progress->strength = min($previousStrength + 1, ItemProgress::MAX_STRENGTH);
                $progress->correct_count = ($progress->correct_count ?? 0) + 1;
            } else {
                $progress->strength = max($previousStrength - 1, 0);
                $progress->incorrect_count = ($progress->incorrect_count ?? 0) + 1;
            }

            $progress->last_reviewed_at = $now;
            $progress->due_at = $now->addDays(ItemProgress::REVIEW_INTERVAL_DAYS[$progress->strength]);
            $progress->save();

            if ($progress->strength > $previousStrength) {
                $strengthened++;
            } elseif ($progress->strength < $previousStrength) {
                $weakened++;
            }
        }

        return [$strengthened, $weakened];
    }

    /**
     * Mark the lesson as completed and report whether this was the first time.
     */
    private function completeLesson(User $user, string $lessonId, int $accuracy): bool
    {
        $progress = LessonProgress::firstOrNew(['user_id' => $user->id, 'lesson_id' => $lessonId]);
        $firstCompletion = ! $progress->exists;

        $progress->completed_count = ($progress->completed_count ?? 0) + 1;
        $progress->best_accuracy = max($progress->best_accuracy ?? 0, $accuracy);
        $progress->first_completed_at ??= now();
        $progress->last_completed_at = now();
        $progress->save();

        return $firstCompletion;
    }
}
