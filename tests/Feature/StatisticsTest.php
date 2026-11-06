<?php

use App\Models\StudySession;
use App\Models\User;
use Carbon\CarbonImmutable;
use Inertia\Testing\AssertableInertia as Assert;

test('the streak counts consecutive study days in finnish time', function () {
    $this->travelTo(CarbonImmutable::parse('2026-03-10 12:00', 'Europe/Helsinki'));
    $user = User::factory()->create();

    foreach (['2026-03-10 09:00', '2026-03-09 23:30', '2026-03-08 08:00', '2026-03-06 10:00'] as $time) {
        StudySession::factory()->for($user)->create([
            'xp' => 10,
            'created_at' => CarbonImmutable::parse($time, 'Europe/Helsinki')->utc(),
        ]);
    }

    $this->actingAs($user)
        ->get(route('statistics'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('statistics')
            ->where('learner.streak', 3)
            ->where('learner.todayXp', 10)
            ->where('learner.totalXp', 40)
            ->where('dailyXp.13', ['date' => '2026-03-10', 'xp' => 10])
            ->where('dailyXp.12', ['date' => '2026-03-09', 'xp' => 10]),
        );
});

test('the streak survives until the end of the next day', function () {
    $this->travelTo(CarbonImmutable::parse('2026-03-10 20:00', 'Europe/Helsinki'));
    $user = User::factory()->create();
    StudySession::factory()->for($user)->create(['created_at' => CarbonImmutable::parse('2026-03-09 10:00', 'Europe/Helsinki')->utc()]);

    $this->actingAs($user)
        ->get(route('statistics'))
        ->assertInertia(fn (Assert $page) => $page->where('learner.streak', 1));
});

test('the vocabulary page lists the course with the learner strengths', function () {
    $this->actingAs(User::factory()->create())
        ->get(route('vocabulary'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('vocabulary')
            ->has('units.0.lessons.0.sentences.0', fn (Assert $sentence) => $sentence
                ->where('strength', 0)
                ->etc(),
            )
            ->has('grammar.v2'),
        );
});
