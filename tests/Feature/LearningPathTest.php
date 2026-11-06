<?php

use App\Course\Course;
use App\Models\ItemProgress;
use App\Models\LessonProgress;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('a new learner starts at the first lesson with later lessons locked', function () {
    $course = app(Course::class);

    $this->actingAs(User::factory()->create())
        ->get(route('dashboard'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('dashboard')
            ->has('units', count($course->units()))
            ->where('units.0.lessons.0.state', 'available')
            ->where('units.0.lessons.0.isNext', true)
            ->where('units.0.lessons.1.state', 'locked')
            ->where('units.1.lessons.0.state', 'available')
            ->where('readiness.mastery', 0)
            ->where('readiness.nextLessonId', $course->units()[0]['lessons'][0]['id']),
        );
});

test('mastery grows with item strength and caps at the mastered strength', function () {
    $user = User::factory()->create();
    $course = app(Course::class);
    $lesson = $course->units()[0]['lessons'][0];
    $itemIds = $course->lessonItemIds($lesson);

    LessonProgress::factory()->for($user)->create(['lesson_id' => $lesson['id']]);

    foreach ($itemIds as $itemId) {
        ItemProgress::factory()->for($user)->create(['item_id' => $itemId, 'strength' => ItemProgress::MAX_STRENGTH]);
    }

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('units.0.lessons.0.state', 'completed')
            ->where('units.0.lessons.0.mastery', 100)
            ->where('units.0.lessons.1.isNext', true)
            ->where('readiness.items.mastered', count($itemIds))
            ->where('readiness.lessonsCompleted', 1),
        );
});
