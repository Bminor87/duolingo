<?php

namespace App\Http\Controllers;

use App\Course\Course;
use App\Course\LearnerOverview;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StatisticsController extends Controller
{
    /**
     * Show the learner's statistics and how far they are from mastering the course.
     */
    public function index(Request $request, Course $course): Response
    {
        $overview = new LearnerOverview($course, $request->user());

        return Inertia::render('statistics', [
            'readiness' => $overview->readiness(),
            'dailyXp' => $overview->statistics->dailyXp(14),
            'totals' => $overview->statistics->totals(),
            'units' => array_map(fn (array $unit): array => [
                'id' => $unit['id'],
                'title' => $unit['title'],
                'color' => $unit['color'],
                'icon' => $unit['icon'],
                'mastery' => $unit['mastery'],
                'items' => $unit['items'],
            ], $overview->path()),
        ]);
    }
}
