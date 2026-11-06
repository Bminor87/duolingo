<?php

use App\Course\Course;
use App\Course\LearnerProgress;
use App\Course\SessionBuilder;
use App\Models\ItemProgress;
use App\Models\User;

/**
 * @return list<array{unit: array<string, mixed>, lesson: array<string, mixed>}>
 */
function everyLesson(): array
{
    $lessons = [];

    foreach (app(Course::class)->units() as $unit) {
        foreach ($unit['lessons'] as $lesson) {
            $lessons[] = ['unit' => $unit, 'lesson' => $lesson];
        }
    }

    return $lessons;
}

test('every lesson builds a session within the exercise limit that covers all of its items', function () {
    $course = app(Course::class);
    $builder = app(SessionBuilder::class);
    $progress = new LearnerProgress($course, User::factory()->create());

    foreach (everyLesson() as ['unit' => $unit, 'lesson' => $lesson]) {
        $session = $builder->forLesson($unit, $lesson, $progress);
        $graded = array_filter($session['exercises'], fn (array $exercise): bool => ! in_array($exercise['kind'], ['learn', 'learn_words'], true));
        $coveredItemIds = collect($graded)->flatMap(fn (array $exercise): array => $exercise['itemIds'] ?? [$exercise['itemId']])->unique();

        expect(count($graded))->toBeLessThanOrEqual(SessionBuilder::MAX_EXERCISES, $lesson['id'])
            ->and($coveredItemIds->sort()->values()->all())->toEqual(collect($course->lessonItemIds($lesson))->sort()->values()->all());
    }
});

test('every fill-in-the-blank exercise rebuilds its sentence and offers the answer', function () {
    $builder = app(SessionBuilder::class);
    $user = User::factory()->create();
    $course = app(Course::class);

    foreach (array_keys($course->items()) as $itemId) {
        ItemProgress::factory()->for($user)->create(['item_id' => $itemId, 'strength' => 1]);
    }

    $progress = new LearnerProgress($course, $user);

    foreach (everyLesson() as ['unit' => $unit, 'lesson' => $lesson]) {
        foreach ($builder->forLesson($unit, $lesson, $progress)['exercises'] as $exercise) {
            if ($exercise['kind'] === 'cloze' && $exercise['model'] === null && ! str_contains($exercise['hint']['sv'], '/')) {
                expect($exercise['before'].$exercise['answer'].$exercise['after'])->toBe($exercise['hint']['sv']);
            }

            if (in_array($exercise['kind'], ['choose_fi', 'choose_sv'], true) || ($exercise['kind'] === 'cloze' && $exercise['mode'] === 'choose')) {
                expect($exercise['options'])->toContain($exercise['answer'])
                    ->and(count($exercise['options']))->toBeGreaterThanOrEqual(2);
            }
        }
    }
});

test('known sentences skip the learning card and are typed instead of chosen', function () {
    $course = app(Course::class);
    $unit = $course->units()[0];
    $lesson = $unit['lessons'][0];
    $user = User::factory()->create();

    foreach ($course->lessonItemIds($lesson) as $itemId) {
        ItemProgress::factory()->for($user)->create(['item_id' => $itemId, 'strength' => 3]);
    }

    $exercises = app(SessionBuilder::class)->forLesson($unit, $lesson, new LearnerProgress($course, $user))['exercises'];
    $kinds = array_column($exercises, 'kind');

    expect($kinds)->not->toContain('learn')
        ->and($kinds)->not->toContain('learn_words')
        ->and(collect($exercises)->where('kind', 'cloze')->pluck('mode')->all())->toContain('type');
});
