<?php

use App\Course\CourseValidator;
use Illuminate\Support\Facades\File;

/**
 * Write a one-lesson course whose second and third sentences answer the given sentence ids, and validate it.
 *
 * @param  array{0: string, 1: string}  $answers
 * @return list<string>
 */
function validateCourseWithAnswers(array $answers): array
{
    $path = storage_path('framework/testing/course-'.uniqid());
    $sentence = fn (string $id, string $sv, array $extra = []): array => [
        'id' => $id,
        'sv' => $sv,
        'fi' => 'Suomennos.',
        'src' => 'x',
        'keys' => [['w' => 'du', 'd' => ['dig', 'din']]],
        'grammar' => [],
        ...$extra,
    ];

    File::ensureDirectoryExists($path.'/units');
    File::put($path.'/grammar.json', '{}');
    File::put($path.'/units/01-test.json', json_encode([
        'id' => 'test',
        'title' => 'Testi',
        'subtitle' => 'Test',
        'description' => 'Testikurssi.',
        'source' => 'Testi.',
        'icon' => 'mic',
        'color' => 'purple',
        'exam' => ['oral'],
        'lessons' => [[
            'id' => 'test-l1',
            'title' => 'Testi',
            'sentences' => [
                $sentence('test-s01', 'Vad studerar du?'),
                $sentence('test-s02', 'Studerar du?', ['answers' => $answers[0]]),
                $sentence('test-s03', 'Vad studerar du nu?', ['answers' => $answers[1]]),
            ],
        ]],
        'glossary' => ['vad' => 'mitä', 'studerar' => 'opiskelee', 'du' => 'sinä', 'nu' => 'nyt'],
    ]));

    try {
        return (new CourseValidator($path))->validate();
    } finally {
        File::deleteDirectory($path);
    }
}

test('answers that point at a question of the same lesson are valid', function () {
    expect(validateCourseWithAnswers(['test-s01', 'test-s01']))->toBe([]);
});

test('an answer is rejected when its question is missing, is the answer itself, or is another answer', function (array $answers, string $rejectedSentenceId) {
    $errors = validateCourseWithAnswers($answers);

    expect($errors)->toHaveCount(1)
        ->and($errors[0])->toContain("sentence {$rejectedSentenceId}: 'answers' must be the id of a question sentence in the same lesson.");
})->with([
    'missing question' => [['test-s01', 'test-s99'], 'test-s03'],
    'answers itself' => [['test-s02', 'test-s01'], 'test-s02'],
    'answers another answer' => [['test-s01', 'test-s02'], 'test-s03'],
]);
