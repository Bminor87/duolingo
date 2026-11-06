<?php

namespace App\Course;

use App\Models\ItemProgress;
use App\Models\LessonProgress;
use App\Models\User;
use Illuminate\Support\Collection;

/**
 * A user's progress through the course: item strengths, completed lessons and mastery.
 *
 * @phpstan-import-type Unit from Course
 * @phpstan-import-type Lesson from Course
 */
class LearnerProgress
{
    /**
     * @var Collection<string, ItemProgress>|null
     */
    private ?Collection $itemProgress = null;

    /**
     * @var Collection<string, LessonProgress>|null
     */
    private ?Collection $lessonProgress = null;

    public function __construct(
        private readonly Course $course,
        private readonly User $user,
    ) {}

    /**
     * Get the user's progress rows for every item they have practised, keyed by item id.
     *
     * @return Collection<string, ItemProgress>
     */
    public function itemProgress(): Collection
    {
        return $this->itemProgress ??= $this->user->itemProgress()->get()->keyBy('item_id');
    }

    /**
     * Get the user's progress rows for completed lessons, keyed by lesson id.
     *
     * @return Collection<string, LessonProgress>
     */
    public function lessonProgress(): Collection
    {
        return $this->lessonProgress ??= $this->user->lessonProgress()->get()->keyBy('lesson_id');
    }

    /**
     * Forget the loaded progress so it is read again from the database.
     */
    public function refresh(): void
    {
        $this->itemProgress = null;
        $this->lessonProgress = null;
    }

    public function strength(string $itemId): int
    {
        return $this->itemProgress()->get($itemId)->strength ?? 0;
    }

    public function isLessonCompleted(string $lessonId): bool
    {
        return $this->lessonProgress()->has($lessonId);
    }

    /**
     * The first lesson of every unit is open; later lessons open when the previous lesson of the unit is done.
     */
    public function isLessonUnlocked(string $lessonId): bool
    {
        foreach ($this->course->units() as $unit) {
            foreach ($unit['lessons'] as $index => $lesson) {
                if ($lesson['id'] === $lessonId) {
                    return $index === 0 || $this->isLessonCompleted($unit['lessons'][$index - 1]['id']);
                }
            }
        }

        return false;
    }

    /**
     * Get the first lesson on the path that has not been completed yet.
     */
    public function nextLessonId(): ?string
    {
        foreach ($this->course->lessonIds() as $lessonId) {
            if (! $this->isLessonCompleted($lessonId)) {
                return $lessonId;
            }
        }

        return null;
    }

    /**
     * Get the mastery (0–1) of the given items. An item is fully mastered at MASTERED_STRENGTH.
     *
     * @param  list<string>  $itemIds
     */
    public function mastery(array $itemIds): float
    {
        if ($itemIds === []) {
            return 0.0;
        }

        $points = array_sum(array_map(
            fn (string $itemId): int => min($this->strength($itemId), ItemProgress::MASTERED_STRENGTH),
            $itemIds,
        ));

        return $points / (count($itemIds) * ItemProgress::MASTERED_STRENGTH);
    }

    /**
     * @param  Lesson  $lesson
     */
    public function lessonMastery(array $lesson): float
    {
        return $this->mastery($this->course->lessonItemIds($lesson));
    }

    /**
     * @param  Unit  $unit
     */
    public function unitMastery(array $unit): float
    {
        return $this->mastery($this->unitItemIds($unit));
    }

    public function courseMastery(): float
    {
        return $this->mastery(array_keys($this->course->items()));
    }

    /**
     * Get the mastery of the units that prepare for the given exam part (oral, written or assignment).
     */
    public function examMastery(string $exam): float
    {
        $itemIds = [];

        foreach ($this->course->units() as $unit) {
            if (in_array($exam, $unit['exam'], true)) {
                array_push($itemIds, ...$this->unitItemIds($unit));
            }
        }

        return $this->mastery($itemIds);
    }

    /**
     * Count the items the user has started (strength >= 1) and mastered.
     *
     * @param  list<string>|null  $itemIds
     * @return array{total: int, learned: int, mastered: int}
     */
    public function itemCounts(?array $itemIds = null): array
    {
        $itemIds ??= array_keys($this->course->items());
        $strengths = array_map(fn (string $itemId): int => $this->strength($itemId), $itemIds);

        return [
            'total' => count($itemIds),
            'learned' => count(array_filter($strengths, fn (int $strength): bool => $strength >= 1)),
            'mastered' => count(array_filter($strengths, fn (int $strength): bool => $strength >= ItemProgress::MASTERED_STRENGTH)),
        ];
    }

    /**
     * Get the items that can be reviewed: items from completed lessons, most urgent first.
     *
     * @param  list<string>|null  $unitIds  Restrict to these units.
     * @return list<string>
     */
    public function reviewableItemIds(?array $unitIds = null): array
    {
        $candidates = [];

        foreach ($this->course->items() as $itemId => $item) {
            if (! $this->isLessonCompleted($item['lesson_id'])) {
                continue;
            }

            if ($unitIds !== null && ! in_array($item['unit_id'], $unitIds, true)) {
                continue;
            }

            $progress = $this->itemProgress()->get($itemId);

            $candidates[] = [
                'id' => (string) $itemId,
                'due' => $progress?->due_at?->getTimestamp() ?? 0,
                'strength' => $progress->strength ?? 0,
            ];
        }

        usort($candidates, fn (array $a, array $b): int => [$a['due'], $a['strength']] <=> [$b['due'], $b['strength']]);

        return array_column($candidates, 'id');
    }

    /**
     * Count the reviewable items whose review date has passed.
     */
    public function dueItemCount(): int
    {
        $now = now();

        return count(array_filter(
            $this->reviewableItemIds(),
            fn (string $itemId): bool => ($this->itemProgress()->get($itemId)->due_at ?? $now)->lte($now),
        ));
    }

    /**
     * @param  Unit  $unit
     * @return list<string>
     */
    public function unitItemIds(array $unit): array
    {
        $itemIds = [];

        foreach ($unit['lessons'] as $lesson) {
            array_push($itemIds, ...$this->course->lessonItemIds($lesson));
        }

        return $itemIds;
    }
}
