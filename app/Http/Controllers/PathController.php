<?php

namespace App\Http\Controllers;

use App\Course\Course;
use App\Course\LearnerOverview;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PathController extends Controller
{
    /**
     * Show the learning path.
     */
    public function index(Request $request, Course $course): Response
    {
        $overview = new LearnerOverview($course, $request->user());

        return Inertia::render('dashboard', [
            'units' => $overview->path(),
            'readiness' => $overview->readiness(),
        ]);
    }
}
