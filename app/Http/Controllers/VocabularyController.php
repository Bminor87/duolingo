<?php

namespace App\Http\Controllers;

use App\Course\Course;
use App\Course\LearnerProgress;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class VocabularyController extends Controller
{
    /**
     * Show every sentence and word of the course with the learner's strength, plus the grammar topics.
     */
    public function index(Request $request, Course $course): Response
    {
        $progress = new LearnerProgress($course, $request->user());

        return Inertia::render('vocabulary', [
            'units' => array_map(fn (array $unit): array => [
                'id' => $unit['id'],
                'title' => $unit['title'],
                'subtitle' => $unit['subtitle'],
                'color' => $unit['color'],
                'icon' => $unit['icon'],
                'exam' => $unit['exam'],
                'source' => $unit['source'],
                'lessons' => array_map(fn (array $lesson): array => [
                    'id' => $lesson['id'],
                    'title' => $lesson['title'],
                    'sentences' => array_map(fn (array $sentence): array => [
                        'id' => $sentence['id'],
                        'sv' => $sentence['sv'],
                        'fi' => $sentence['fi'],
                        'note' => $sentence['note'] ?? null,
                        'grammar' => $sentence['grammar'],
                        'src' => $sentence['src'],
                        'strength' => $progress->strength($sentence['id']),
                    ], $lesson['sentences']),
                    'words' => array_map(fn (array $word): array => [
                        'id' => $word['id'],
                        'sv' => $word['sv'],
                        'fi' => $word['fi'],
                        'note' => $word['note'] ?? null,
                        'src' => $word['src'],
                        'strength' => $progress->strength($word['id']),
                    ], $lesson['words'] ?? []),
                ], $unit['lessons']),
            ], $course->units()),
            'grammar' => $course->grammar(),
            'glossary' => $course->glossary(),
        ]);
    }
}
