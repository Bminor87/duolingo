<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Database\Factories\LessonProgressFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A user's completion record for one lesson on the learning path.
 *
 * @property int $id
 * @property int $user_id
 * @property string $lesson_id
 * @property int $completed_count
 * @property int $best_accuracy
 * @property CarbonImmutable|null $first_completed_at
 * @property CarbonImmutable|null $last_completed_at
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 */
#[Fillable(['user_id', 'lesson_id', 'completed_count', 'best_accuracy', 'first_completed_at', 'last_completed_at'])]
class LessonProgress extends Model
{
    /** @use HasFactory<LessonProgressFactory> */
    use HasFactory;

    protected $table = 'lesson_progress';

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
            'completed_count' => 'integer',
            'best_accuracy' => 'integer',
            'first_completed_at' => 'datetime',
            'last_completed_at' => 'datetime',
        ];
    }
}
