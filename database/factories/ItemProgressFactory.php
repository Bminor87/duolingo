<?php

namespace Database\Factories;

use App\Models\ItemProgress;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ItemProgress>
 */
class ItemProgressFactory extends Factory
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
            'item_id' => 'item-'.fake()->unique()->uuid(),
            'strength' => 1,
            'correct_count' => 1,
            'incorrect_count' => 0,
            'last_reviewed_at' => now(),
            'due_at' => now()->addDay(),
        ];
    }
}
