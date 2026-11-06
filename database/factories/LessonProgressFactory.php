<?php

namespace Database\Factories;

use App\Models\LessonProgress;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<LessonProgress>
 */
class LessonProgressFactory extends Factory
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
            'lesson_id' => 'studier-l1',
            'completed_count' => 1,
            'best_accuracy' => 100,
            'first_completed_at' => now(),
            'last_completed_at' => now(),
        ];
    }
}
