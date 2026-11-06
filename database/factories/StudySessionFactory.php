<?php

namespace Database\Factories;

use App\Models\StudySession;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<StudySession>
 */
class StudySessionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'kind' => StudySession::KIND_LESSON,
            'lesson_id' => 'studier-l1',
            'exercises_total' => 12,
            'exercises_correct' => 10,
            'xp' => 15,
            'duration_seconds' => 240,
        ];
    }
}
