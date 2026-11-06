<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Database\Factories\StudySessionFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One finished lesson or review session, used for XP and statistics.
 *
 * @property int $id
 * @property int $user_id
 * @property string $kind
 * @property string|null $lesson_id
 * @property int $exercises_total
 * @property int $exercises_correct
 * @property int $xp
 * @property int $duration_seconds
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 */
#[Fillable(['user_id', 'kind', 'lesson_id', 'exercises_total', 'exercises_correct', 'xp', 'duration_seconds'])]
class StudySession extends Model
{
    /** @use HasFactory<StudySessionFactory> */
    use HasFactory;

    public const string KIND_LESSON = 'lesson';

    public const string KIND_REVIEW = 'review';

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
            'exercises_total' => 'integer',
            'exercises_correct' => 'integer',
            'xp' => 'integer',
            'duration_seconds' => 'integer',
        ];
    }
}
