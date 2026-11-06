<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Database\Factories\ItemProgressFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * How well a user knows a single course sentence or word.
 *
 * @property int $id
 * @property int $user_id
 * @property string $item_id
 * @property int $strength
 * @property int $correct_count
 * @property int $incorrect_count
 * @property CarbonImmutable|null $last_reviewed_at
 * @property CarbonImmutable|null $due_at
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 */
#[Fillable(['user_id', 'item_id', 'strength', 'correct_count', 'incorrect_count', 'last_reviewed_at', 'due_at'])]
class ItemProgress extends Model
{
    /** @use HasFactory<ItemProgressFactory> */
    use HasFactory;

    /**
     * The strength at which an item counts as mastered.
     */
    public const int MASTERED_STRENGTH = 3;

    /**
     * The highest strength an item can reach.
     */
    public const int MAX_STRENGTH = 5;

    /**
     * Days until the next review, indexed by strength.
     */
    public const array REVIEW_INTERVAL_DAYS = [0, 1, 2, 4, 8, 16];

    protected $table = 'item_progress';

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'strength' => 'integer',
            'correct_count' => 'integer',
            'incorrect_count' => 'integer',
            'last_reviewed_at' => 'datetime',
            'due_at' => 'datetime',
        ];
    }
}
