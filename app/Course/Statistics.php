<?php

namespace App\Course;

use App\Models\StudySession;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;

/**
 * XP, streak and activity statistics for a user. Days are counted in Finnish time.
 */
class Statistics
{
    public const string TIMEZONE = 'Europe/Helsinki';

    /**
     * The daily XP goal shown on the path and statistics pages.
     */
    public const int DAILY_GOAL = 30;

    /**
     * @var Collection<int, StudySession>|null
     */
    private ?Collection $sessions = null;

    public function __construct(private readonly User $user) {}

    public function totalXp(): int
    {
        return (int) $this->sessions()->sum('xp');
    }

    public function todayXp(): int
    {
        return $this->xpByDate()[$this->today()->toDateString()] ?? 0;
    }

    /**
     * Count consecutive study days ending today, or yesterday when nothing was studied yet today.
     */
    public function streak(): int
    {
        $studyDates = $this->xpByDate();
        $day = $this->today();

        if (! isset($studyDates[$day->toDateString()])) {
            $day = $day->subDay();
        }

        $streak = 0;

        while (isset($studyDates[$day->toDateString()])) {
            $streak++;
            $day = $day->subDay();
        }

        return $streak;
    }

    /**
     * Get the XP earned on each of the last days, oldest first.
     *
     * @return list<array{date: string, xp: int}>
     */
    public function dailyXp(int $days = 14): array
    {
        $xpByDate = $this->xpByDate();
        $daily = [];

        for ($offset = $days - 1; $offset >= 0; $offset--) {
            $date = $this->today()->subDays($offset)->toDateString();
            $daily[] = ['date' => $date, 'xp' => $xpByDate[$date] ?? 0];
        }

        return $daily;
    }

    /**
     * @return array{sessions: int, minutes: int, exercises: int, accuracy: int}
     */
    public function totals(): array
    {
        $exercises = (int) $this->sessions()->sum('exercises_total');
        $correct = (int) $this->sessions()->sum('exercises_correct');

        return [
            'sessions' => $this->sessions()->count(),
            'minutes' => (int) round($this->sessions()->sum('duration_seconds') / 60),
            'exercises' => $exercises,
            'accuracy' => $exercises > 0 ? (int) round($correct / $exercises * 100) : 0,
        ];
    }

    /**
     * @return array<string, int>
     */
    private function xpByDate(): array
    {
        $xpByDate = [];

        foreach ($this->sessions() as $session) {
            $date = $session->created_at?->setTimezone(self::TIMEZONE)->toDateString();

            if ($date !== null) {
                $xpByDate[$date] = ($xpByDate[$date] ?? 0) + $session->xp;
            }
        }

        return $xpByDate;
    }

    /**
     * @return Collection<int, StudySession>
     */
    private function sessions(): Collection
    {
        return $this->sessions ??= $this->user->studySessions()->get(['xp', 'exercises_total', 'exercises_correct', 'duration_seconds', 'created_at']);
    }

    private function today(): CarbonImmutable
    {
        return CarbonImmutable::now(self::TIMEZONE)->startOfDay();
    }
}
