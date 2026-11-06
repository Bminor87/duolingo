<?php

use App\Course\Course;
use App\Models\LessonProgress;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

/**
 * Find the first unit that prepares for the given exam part and is not in the other list.
 *
 * @return array<string, mixed>
 */
function unitForExam(string $exam, string $notExam): array
{
    foreach (app(Course::class)->units() as $unit) {
        if (in_array($exam, $unit['exam'], true) && ! in_array($notExam, $unit['exam'], true)) {
            return $unit;
        }
    }

    throw new RuntimeException("No unit for {$exam}.");
}

test('review is not available before any lesson is completed', function () {
    $this->actingAs(User::factory()->create())
        ->get(route('review.show'))
        ->assertRedirect(route('dashboard'));
});

test('review practises items from completed lessons only', function () {
    $user = User::factory()->create();
    $course = app(Course::class);
    $lesson = $course->units()[0]['lessons'][0];
    LessonProgress::factory()->for($user)->create(['lesson_id' => $lesson['id']]);

    $this->actingAs($user)
        ->get(route('review.show'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('learn/session')
            ->where('session.kind', 'review')
            ->where('session.exercises', function ($exercises) use ($course, $lesson): bool {
                $lessonItemIds = $course->lessonItemIds($lesson);

                return collect($exercises)
                    ->flatMap(fn (array $exercise): array => $exercise['itemIds'] ?? [$exercise['itemId']])
                    ->every(fn (string $itemId): bool => in_array($itemId, $lessonItemIds, true));
            }),
        );
});

test('written exam review only uses units that prepare for the written exam', function () {
    $user = User::factory()->create();
    $oralUnit = unitForExam('oral', 'written');
    LessonProgress::factory()->for($user)->create(['lesson_id' => $oralUnit['lessons'][0]['id']]);

    $this->actingAs($user)
        ->get(route('review.show', ['mode' => 'written']))
        ->assertRedirect(route('dashboard'));

    $this->get(route('review.show', ['mode' => 'oral']))
        ->assertInertia(fn (Assert $page) => $page->where('session.mode', 'oral'));
});

test('review results for items of unfinished lessons are rejected', function () {
    $itemId = app(Course::class)->lessonItemIds(app(Course::class)->units()[0]['lessons'][0])[0];

    $this->actingAs(User::factory()->create())
        ->postJson(route('review.complete'), [
            'results' => [['item_id' => $itemId, 'correct' => true]],
            'exercises_total' => 2,
            'exercises_correct' => 2,
            'duration_seconds' => 30,
        ])
        ->assertUnprocessable();
});

test('completing a review records xp without completing a lesson', function () {
    $user = User::factory()->create();
    $lesson = app(Course::class)->units()[0]['lessons'][0];
    LessonProgress::factory()->for($user)->create(['lesson_id' => $lesson['id'], 'completed_count' => 1]);
    $itemId = app(Course::class)->lessonItemIds($lesson)[0];

    $this->actingAs($user)
        ->postJson(route('review.complete'), [
            'results' => [['item_id' => $itemId, 'correct' => true]],
            'exercises_total' => 2,
            'exercises_correct' => 1,
            'duration_seconds' => 30,
        ])
        ->assertOk()
        ->assertJson(['xp' => 1 + 5, 'firstCompletion' => false]);

    expect(LessonProgress::where('lesson_id', $lesson['id'])->value('completed_count'))->toBe(1);
});
