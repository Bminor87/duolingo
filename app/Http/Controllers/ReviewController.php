<?php

namespace App\Http\Controllers;

use App\Course\Course;
use App\Course\LearnerOverview;
use App\Course\LearnerProgress;
use App\Course\SessionBuilder;
use App\Course\SessionRecorder;
use App\Http\Requests\CompleteSessionRequest;
use App\Models\StudySession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReviewController extends Controller
{
    /**
     * How many items one review session practises.
     */
    public const int ITEMS_PER_REVIEW = 10;

    /**
     * Titles of the review modes. Written and oral modes only use units that prepare for that exam.
     */
    private const array MODES = [
        'mixed' => ['title' => 'Kertaus', 'subtitle' => 'Heikoimmat ja erääntyneet', 'exam' => null],
        'written' => ['title' => 'Kirjallinen koe', 'subtitle' => 'Ymmärrä ruotsista suomeksi', 'exam' => 'written'],
        'oral' => ['title' => 'Suullinen koe', 'subtitle' => 'Tuota ruotsia itse', 'exam' => 'oral'],
    ];

    /**
     * Start a review session with the items that need practice the most.
     */
    public function show(Request $request, Course $course, SessionBuilder $builder): Response|RedirectResponse
    {
        $mode = $this->mode($request->query('mode'));
        $progress = new LearnerProgress($course, $request->user());
        $itemIds = array_slice($progress->reviewableItemIds($this->unitIdsForExam($course, self::MODES[$mode]['exam'])), 0, self::ITEMS_PER_REVIEW);

        if ($itemIds === []) {
            Inertia::flash('toast', ['type' => 'error', 'message' => __('Kerrattavaa ei vielä ole. Suorita ensin oppitunteja tältä alueelta.')]);

            return to_route('dashboard');
        }

        return Inertia::render('learn/session', [
            'session' => [
                'kind' => StudySession::KIND_REVIEW,
                'lessonId' => null,
                'mode' => $mode,
                'title' => self::MODES[$mode]['title'],
                'subtitle' => self::MODES[$mode]['subtitle'],
                'intro' => null,
                'color' => 'violet',
                'isPractice' => true,
                ...$builder->forReview($itemIds, $mode, $progress),
            ],
        ]);
    }

    /**
     * Store the results of a finished review session.
     */
    public function complete(CompleteSessionRequest $request, Course $course, SessionRecorder $recorder): JsonResponse
    {
        $progress = new LearnerProgress($course, $request->user());
        $unknownItems = array_diff($request->itemIds(), $progress->reviewableItemIds());
        abort_unless($unknownItems === [], 422, 'The results contain items that cannot be reviewed yet.');

        $result = $recorder->record(
            $request->user(),
            StudySession::KIND_REVIEW,
            null,
            $request->results(),
            $request->integer('exercises_total'),
            $request->integer('exercises_correct'),
            $request->integer('duration_seconds'),
        );

        $overview = new LearnerOverview($course, $request->user());

        return response()->json([
            ...$result,
            ...$overview->header(),
            'nextLessonId' => $overview->progress->nextLessonId(),
        ]);
    }

    /**
     * @return 'mixed'|'written'|'oral'
     */
    private function mode(mixed $mode): string
    {
        return match ($mode) {
            'written' => 'written',
            'oral' => 'oral',
            default => 'mixed',
        };
    }

    /**
     * @return list<string>|null
     */
    private function unitIdsForExam(Course $course, ?string $exam): ?array
    {
        if ($exam === null) {
            return null;
        }

        return array_values(array_map(
            fn (array $unit): string => $unit['id'],
            array_filter($course->units(), fn (array $unit): bool => in_array($exam, $unit['exam'], true)),
        ));
    }
}
