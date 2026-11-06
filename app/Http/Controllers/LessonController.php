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

class LessonController extends Controller
{
    /**
     * Start a lesson session.
     */
    public function show(Request $request, Course $course, SessionBuilder $builder, string $lessonId): Response|RedirectResponse
    {
        $located = $course->lesson($lessonId);
        abort_if($located === null, 404);

        $progress = new LearnerProgress($course, $request->user());

        if (! $progress->isLessonUnlocked($lessonId)) {
            Inertia::flash('toast', ['type' => 'error', 'message' => __('Suorita ensin yksikön edellinen oppitunti.')]);

            return to_route('dashboard');
        }

        ['unit' => $unit, 'lesson' => $lesson] = $located;

        return Inertia::render('learn/session', [
            'session' => [
                'kind' => StudySession::KIND_LESSON,
                'lessonId' => $lesson['id'],
                'title' => $lesson['title'],
                'subtitle' => $unit['title'],
                'intro' => $lesson['intro'] ?? null,
                'color' => $unit['color'],
                'isPractice' => $progress->isLessonCompleted($lessonId),
                ...$builder->forLesson($unit, $lesson, $progress),
            ],
        ]);
    }

    /**
     * Store the results of a finished lesson.
     */
    public function complete(CompleteSessionRequest $request, Course $course, SessionRecorder $recorder, string $lessonId): JsonResponse
    {
        $located = $course->lesson($lessonId);
        abort_if($located === null, 404);

        $progress = new LearnerProgress($course, $request->user());
        abort_unless($progress->isLessonUnlocked($lessonId), 403);

        $unknownItems = array_diff($request->itemIds(), $course->lessonItemIds($located['lesson']));
        abort_unless($unknownItems === [], 422, 'The results contain items that are not part of this lesson.');

        $result = $recorder->record(
            $request->user(),
            StudySession::KIND_LESSON,
            $lessonId,
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
}
