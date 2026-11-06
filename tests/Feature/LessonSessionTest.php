<?php

use App\Course\Course;
use App\Models\ItemProgress;
use App\Models\LessonProgress;
use App\Models\StudySession;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

/**
 * Build a completion payload for the given items, all answered correctly unless listed as wrong.
 *
 * @param  list<string>  $itemIds
 * @param  list<string>  $wrongItemIds
 * @return array<string, mixed>
 */
function lessonResults(array $itemIds, array $wrongItemIds = []): array
{
    return [
        'results' => array_map(fn (string $itemId): array => [
            'item_id' => $itemId,
            'correct' => ! in_array($itemId, $wrongItemIds, true),
        ], $itemIds),
        'exercises_total' => 10,
        'exercises_correct' => 8,
        'duration_seconds' => 180,
    ];
}

/**
 * @return array{first: array<string, mixed>, second: array<string, mixed>, itemIds: list<string>}
 */
function firstUnitLessons(): array
{
    $course = app(Course::class);
    $unit = $course->units()[0];

    return [
        'first' => $unit['lessons'][0],
        'second' => $unit['lessons'][1],
        'itemIds' => $course->lessonItemIds($unit['lessons'][0]),
    ];
}

test('guests can not start a lesson', function () {
    $lessons = firstUnitLessons();

    $this->get(route('lessons.show', $lessons['first']['id']))
        ->assertRedirect(route('login'));
});

test('the first lesson of a unit starts with learning cards for new sentences', function () {
    $lessons = firstUnitLessons();

    $this->actingAs(User::factory()->create())
        ->get(route('lessons.show', $lessons['first']['id']))
        ->assertInertia(fn (Assert $page) => $page
            ->component('learn/session')
            ->where('session.lessonId', $lessons['first']['id'])
            ->where('session.isPractice', false)
            ->where('session.exercises.0.kind', fn (string $kind): bool => in_array($kind, ['learn', 'learn_words'], true))
            ->has('session.glossary')
            ->has('session.grammar'),
        );
});

test('a lesson is locked until the previous lesson of its unit is completed', function () {
    $lessons = firstUnitLessons();

    $this->actingAs(User::factory()->create())
        ->get(route('lessons.show', $lessons['second']['id']))
        ->assertRedirect(route('dashboard'));
});

test('an unknown lesson returns not found', function () {
    $this->actingAs(User::factory()->create())
        ->get(route('lessons.show', 'no-such-lesson'))
        ->assertNotFound();
});

test('completing a lesson strengthens correct items, records the session and unlocks the next lesson', function () {
    $user = User::factory()->create();
    $lessons = firstUnitLessons();
    [$correctItem, $wrongItem] = $lessons['itemIds'];

    ItemProgress::factory()->for($user)->create(['item_id' => $wrongItem, 'strength' => 2]);

    $this->actingAs($user)
        ->postJson(route('lessons.complete', $lessons['first']['id']), lessonResults($lessons['itemIds'], [$wrongItem]))
        ->assertOk()
        ->assertJson([
            'xp' => 8 + 5,
            'accuracy' => 80,
            'firstCompletion' => true,
            'nextLessonId' => $lessons['second']['id'],
        ]);

    expect(ItemProgress::where('item_id', $correctItem)->value('strength'))->toBe(1)
        ->and(ItemProgress::where('item_id', $wrongItem)->value('strength'))->toBe(1)
        ->and(LessonProgress::where('lesson_id', $lessons['first']['id'])->value('completed_count'))->toBe(1)
        ->and(StudySession::where('user_id', $user->id)->value('xp'))->toBe(13);

    $this->get(route('lessons.show', $lessons['second']['id']))
        ->assertInertia(fn (Assert $page) => $page->component('learn/session'));
});

test('a perfect lesson earns the perfect bonus', function () {
    $lessons = firstUnitLessons();
    $payload = [...lessonResults($lessons['itemIds']), 'exercises_correct' => 10];

    $this->actingAs(User::factory()->create())
        ->postJson(route('lessons.complete', $lessons['first']['id']), $payload)
        ->assertOk()
        ->assertJson(['xp' => 10 + 5 + 5, 'accuracy' => 100]);
});

test('results with items from another lesson are rejected', function () {
    $lessons = firstUnitLessons();
    $foreignItem = app(Course::class)->lessonItemIds($lessons['second'])[0];

    $this->actingAs(User::factory()->create())
        ->postJson(route('lessons.complete', $lessons['first']['id']), lessonResults([$foreignItem]))
        ->assertUnprocessable();

    expect(StudySession::count())->toBe(0);
});

test('a locked lesson can not be completed', function () {
    $lessons = firstUnitLessons();
    $itemIds = app(Course::class)->lessonItemIds($lessons['second']);

    $this->actingAs(User::factory()->create())
        ->postJson(route('lessons.complete', $lessons['second']['id']), lessonResults($itemIds))
        ->assertForbidden();
});

test('more correct exercises than exercises in total is rejected', function () {
    $lessons = firstUnitLessons();
    $payload = [...lessonResults($lessons['itemIds']), 'exercises_correct' => 11];

    $this->actingAs(User::factory()->create())
        ->postJson(route('lessons.complete', $lessons['first']['id']), $payload)
        ->assertJsonValidationErrors(['exercises_correct']);
});
