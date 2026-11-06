<?php

namespace App\Course;

use App\Models\User;

/**
 * Builds the progress data shown on the path, the statistics page and the top bar.
 */
class LearnerOverview
{
    public readonly LearnerProgress $progress;

    public readonly Statistics $statistics;

    public function __construct(
        private readonly Course $course,
        User $user,
    ) {
        $this->progress = new LearnerProgress($course, $user);
        $this->statistics = new Statistics($user);
    }

    /**
     * The numbers shown in the top bar of every learning page.
     *
     * @return array{streak: int, todayXp: int, dailyGoal: int, totalXp: int, mastery: float, dueCount: int}
     */
    public function header(): array
    {
        return [
            'streak' => $this->statistics->streak(),
            'todayXp' => $this->statistics->todayXp(),
            'dailyGoal' => Statistics::DAILY_GOAL,
            'totalXp' => $this->statistics->totalXp(),
            'mastery' => $this->percent($this->progress->courseMastery()),
            'dueCount' => $this->progress->dueItemCount(),
        ];
    }

    /**
     * Every unit with the state of its lessons, in path order.
     *
     * @return list<array<string, mixed>>
     */
    public function path(): array
    {
        $nextLessonId = $this->progress->nextLessonId();

        return array_map(fn (array $unit): array => [
            'id' => $unit['id'],
            'title' => $unit['title'],
            'subtitle' => $unit['subtitle'],
            'description' => $unit['description'],
            'icon' => $unit['icon'],
            'color' => $unit['color'],
            'exam' => $unit['exam'],
            'mastery' => $this->percent($this->progress->unitMastery($unit)),
            'items' => $this->progress->itemCounts($this->progress->unitItemIds($unit)),
            'lessons' => array_map(fn (array $lesson): array => [
                'id' => $lesson['id'],
                'title' => $lesson['title'],
                'itemCount' => count($this->course->lessonItemIds($lesson)),
                'state' => match (true) {
                    $this->progress->isLessonCompleted($lesson['id']) => 'completed',
                    $this->progress->isLessonUnlocked($lesson['id']) => 'available',
                    default => 'locked',
                },
                'mastery' => $this->percent($this->progress->lessonMastery($lesson)),
                'isNext' => $lesson['id'] === $nextLessonId,
            ], $unit['lessons']),
        ], $this->course->units());
    }

    /**
     * How far the learner is from mastering the course, overall and per exam part.
     *
     * @return array{mastery: float, oral: float, written: float, assignment: float, items: array{total: int, learned: int, mastered: int}, lessonsCompleted: int, lessonsTotal: int, nextLessonId: string|null}
     */
    public function readiness(): array
    {
        $lessonIds = $this->course->lessonIds();

        return [
            'mastery' => $this->percent($this->progress->courseMastery()),
            'oral' => $this->percent($this->progress->examMastery('oral')),
            'written' => $this->percent($this->progress->examMastery('written')),
            'assignment' => $this->percent($this->progress->examMastery('assignment')),
            'items' => $this->progress->itemCounts(),
            'lessonsCompleted' => count(array_filter($lessonIds, fn (string $lessonId): bool => $this->progress->isLessonCompleted($lessonId))),
            'lessonsTotal' => count($lessonIds),
            'nextLessonId' => $this->progress->nextLessonId(),
        ];
    }

    /**
     * Convert a fraction to a percentage with one decimal, so early progress is visible on a large course.
     */
    private function percent(float $fraction): float
    {
        return floor($fraction * 1000) / 10;
    }
}
