<?php

namespace App\Course;

use JsonException;

/**
 * Checks the course JSON files for structural mistakes and missing glossary entries.
 */
class CourseValidator
{
    public const array ICONS = [
        'graduation-cap', 'sparkles', 'cpu', 'app-window', 'globe', 'shield-check', 'layers', 'rocket',
        'briefcase', 'megaphone', 'laptop', 'mail', 'map', 'building-2', 'music', 'messages-square', 'mic',
    ];

    public const array COLORS = [
        'emerald', 'sky', 'violet', 'amber', 'rose', 'teal', 'indigo', 'orange', 'lime', 'cyan', 'fuchsia', 'blue', 'pink', 'green', 'red', 'purple',
    ];

    public const array EXAMS = ['oral', 'written', 'assignment'];

    /**
     * @var array<string, string>
     */
    private array $seenIds = [];

    /**
     * @var list<string>
     */
    private array $errors = [];

    public function __construct(private readonly string $path) {}

    /**
     * Validate every unit file and return a list of human readable errors.
     *
     * @return list<string>
     */
    public function validate(): array
    {
        $this->errors = [];
        $this->seenIds = [];

        $grammarIds = $this->grammarIds();
        $files = glob($this->path.'/units/*.json') ?: [];
        sort($files);

        if ($files === []) {
            $this->errors[] = 'No unit files found in '.$this->path.'/units.';
        }

        $glossaries = [];
        $units = [];

        foreach ($files as $file) {
            $name = basename($file);

            try {
                $unit = json_decode((string) file_get_contents($file), true, flags: JSON_THROW_ON_ERROR);
            } catch (JsonException $exception) {
                $this->errors[] = "{$name}: invalid JSON ({$exception->getMessage()}).";

                continue;
            }

            if (! is_array($unit)) {
                $this->errors[] = "{$name}: root must be an object.";

                continue;
            }

            $units[$name] = $unit;
            $glossaries[$name] = $this->validateGlossary($name, $unit['glossary'] ?? null);
        }

        $mergedGlossary = array_merge(...array_values($glossaries ?: [[]]));

        foreach ($units as $name => $unit) {
            $this->validateUnit($name, $unit, $grammarIds, $mergedGlossary);
        }

        return $this->errors;
    }

    /**
     * @return list<string>
     */
    private function grammarIds(): array
    {
        $file = $this->path.'/grammar.json';
        $grammar = is_file($file) ? json_decode((string) file_get_contents($file), true) : null;

        if (! is_array($grammar)) {
            $this->errors[] = 'grammar.json is missing or invalid.';

            return [];
        }

        foreach ($grammar as $id => $topic) {
            if (! is_array($topic) || ! $this->isFilledString($topic['title'] ?? null) || ! $this->isFilledString($topic['body'] ?? null)) {
                $this->errors[] = "grammar.json: topic '{$id}' needs a title and a body.";
            }
        }

        return array_map('strval', array_keys($grammar));
    }

    /**
     * @return array<string, string>
     */
    private function validateGlossary(string $name, mixed $glossary): array
    {
        if (! is_array($glossary)) {
            $this->errors[] = "{$name}: glossary must be an object.";

            return [];
        }

        $normalized = [];

        foreach ($glossary as $key => $meaning) {
            $key = (string) $key;

            if ($key !== mb_strtolower($key)) {
                $this->errors[] = "{$name}: glossary key '{$key}' must be lowercase.";
            }

            if (! $this->isFilledString($meaning)) {
                $this->errors[] = "{$name}: glossary key '{$key}' needs a Finnish explanation.";

                continue;
            }

            $normalized[mb_strtolower($key)] = $meaning;
        }

        return $normalized;
    }

    /**
     * @param  array<mixed>  $unit
     * @param  list<string>  $grammarIds
     * @param  array<string, string>  $glossary
     */
    private function validateUnit(string $name, array $unit, array $grammarIds, array $glossary): void
    {
        foreach (['id', 'title', 'subtitle', 'description', 'source'] as $field) {
            if (! $this->isFilledString($unit[$field] ?? null)) {
                $this->errors[] = "{$name}: unit needs a '{$field}'.";
            }
        }

        $this->registerId($name, $unit['id'] ?? null);

        if (! in_array($unit['icon'] ?? null, self::ICONS, true)) {
            $this->errors[] = "{$name}: icon must be one of ".implode(', ', self::ICONS).'.';
        }

        if (! in_array($unit['color'] ?? null, self::COLORS, true)) {
            $this->errors[] = "{$name}: color must be one of ".implode(', ', self::COLORS).'.';
        }

        $exam = $unit['exam'] ?? null;

        if (! is_array($exam) || $exam === [] || array_diff($exam, self::EXAMS) !== []) {
            $this->errors[] = "{$name}: exam must be a non-empty list of ".implode(', ', self::EXAMS).'.';
        }

        $lessons = $unit['lessons'] ?? null;

        if (! is_array($lessons) || $lessons === []) {
            $this->errors[] = "{$name}: unit needs at least one lesson.";

            return;
        }

        foreach ($lessons as $index => $lesson) {
            $this->validateLesson("{$name} lesson #{$index}", $lesson, $grammarIds, $glossary);
        }
    }

    /**
     * @param  list<string>  $grammarIds
     * @param  array<string, string>  $glossary
     */
    private function validateLesson(string $context, mixed $lesson, array $grammarIds, array $glossary): void
    {
        if (! is_array($lesson)) {
            $this->errors[] = "{$context}: lesson must be an object.";

            return;
        }

        $context = $context.' ('.($lesson['id'] ?? '?').')';
        $this->registerId($context, $lesson['id'] ?? null);

        if (! $this->isFilledString($lesson['title'] ?? null)) {
            $this->errors[] = "{$context}: lesson needs a title.";
        }

        $sentences = $lesson['sentences'] ?? null;
        $words = $lesson['words'] ?? [];

        if (! is_array($sentences) || ! is_array($words)) {
            $this->errors[] = "{$context}: sentences and words must be lists.";

            return;
        }

        if (count($sentences) + count($words) < 3) {
            $this->errors[] = "{$context}: a lesson needs at least 3 sentences or words.";
        }

        foreach ($sentences as $sentence) {
            $this->validateSentence($context, $sentence, $grammarIds, $glossary);
        }

        $this->validateAnswerLinks($context, $sentences);

        foreach ($words as $word) {
            $this->validateWord($context, $word, $glossary);
        }
    }

    /**
     * @param  list<string>  $grammarIds
     * @param  array<string, string>  $glossary
     */
    private function validateSentence(string $context, mixed $sentence, array $grammarIds, array $glossary): void
    {
        if (! is_array($sentence)) {
            $this->errors[] = "{$context}: sentence must be an object.";

            return;
        }

        $id = (string) ($sentence['id'] ?? '?');
        $context = "{$context} sentence {$id}";
        $this->registerId($context, $sentence['id'] ?? null);

        if (! $this->isFilledString($sentence['sv'] ?? null) || ! $this->isFilledString($sentence['fi'] ?? null)) {
            $this->errors[] = "{$context}: needs 'sv' and 'fi'.";

            return;
        }

        $sv = $sentence['sv'];

        if (! in_array($sentence['src'] ?? null, ['m', 'x'], true)) {
            $this->errors[] = "{$context}: src must be 'm' (material) or 'x' (extra).";
        }

        $keys = $sentence['keys'] ?? null;

        if (! is_array($keys) || $keys === []) {
            $this->errors[] = "{$context}: needs at least one key.";
        } else {
            foreach ($keys as $key) {
                $this->validateBlank($context, $sv, $key);
            }
        }

        $grammar = $sentence['grammar'] ?? null;

        if (! is_array($grammar)) {
            $this->errors[] = "{$context}: grammar must be a list.";
        } else {
            foreach (array_diff($grammar, $grammarIds) as $unknown) {
                $this->errors[] = "{$context}: unknown grammar topic '{$unknown}'.";
            }
        }

        foreach ($sentence['wrong'] ?? [] as $wrong) {
            if (! $this->isFilledString($wrong) || $wrong === $sv) {
                $this->errors[] = "{$context}: every 'wrong' sentence must differ from the correct one.";
            }
        }

        $this->assertGlossaryCovers($context, $sv, $glossary);

        foreach ($sentence['variants'] ?? [] as $variant) {
            if (! is_array($variant) || ! $this->isFilledString($variant['sv'] ?? null) || ! $this->isFilledString($variant['fi'] ?? null)) {
                $this->errors[] = "{$context}: variants need 'sv', 'fi', 'w' and 'd'.";

                continue;
            }

            $this->validateBlank("{$context} variant", $variant['sv'], $variant);
            $this->assertGlossaryCovers("{$context} variant", $variant['sv'], $glossary);
        }
    }

    /**
     * An answer must point at a question sentence of the same lesson, and a question can not answer another question.
     *
     * @param  array<mixed>  $sentences
     */
    private function validateAnswerLinks(string $context, array $sentences): void
    {
        $sentencesById = array_column(array_filter($sentences, 'is_array'), null, 'id');

        foreach ($sentencesById as $id => $sentence) {
            if (! array_key_exists('answers', $sentence)) {
                continue;
            }

            $questionId = $sentence['answers'];
            $question = is_string($questionId) ? ($sentencesById[$questionId] ?? null) : null;

            if ($question === null || $questionId === $id || array_key_exists('answers', $question)) {
                $this->errors[] = "{$context} sentence {$id}: 'answers' must be the id of a question sentence in the same lesson.";
            }
        }
    }

    /**
     * @param  array<string, string>  $glossary
     */
    private function validateWord(string $context, mixed $word, array $glossary): void
    {
        if (! is_array($word)) {
            $this->errors[] = "{$context}: word must be an object.";

            return;
        }

        $context = "{$context} word ".($word['id'] ?? '?');
        $this->registerId($context, $word['id'] ?? null);

        if (! $this->isFilledString($word['sv'] ?? null) || ! $this->isFilledString($word['fi'] ?? null)) {
            $this->errors[] = "{$context}: needs 'sv' and 'fi'.";

            return;
        }

        if (! in_array($word['src'] ?? null, ['m', 'x'], true)) {
            $this->errors[] = "{$context}: src must be 'm' (material) or 'x' (extra).";
        }

        $this->assertGlossaryCovers($context, $word['sv'], $glossary);
    }

    /**
     * Check a blank: the answer must be a whole-word part of the sentence and have distinct distractors.
     */
    private function validateBlank(string $context, string $sentence, mixed $blank): void
    {
        if (! is_array($blank) || ! $this->isFilledString($blank['w'] ?? null)) {
            $this->errors[] = "{$context}: every key needs 'w'.";

            return;
        }

        $answer = $blank['w'];
        $pattern = '/(?<![\p{L}\p{N}-])'.preg_quote($answer, '/').'(?![\p{L}\p{N}-])/u';

        if (preg_match($pattern, $sentence) !== 1) {
            $this->errors[] = "{$context}: key '{$answer}' is not a whole-word part of '{$sentence}'.";
        }

        $distractors = $blank['d'] ?? null;

        if (! is_array($distractors) || count($distractors) < 2) {
            $this->errors[] = "{$context}: key '{$answer}' needs at least 2 distractors in 'd'.";

            return;
        }

        $normalizedAnswer = Tokenizer::normalizeAnswer($answer);
        $normalizedDistractors = array_map(fn (mixed $distractor): string => Tokenizer::normalizeAnswer((string) $distractor), $distractors);

        if (in_array($normalizedAnswer, $normalizedDistractors, true) || count(array_unique($normalizedDistractors)) !== count($normalizedDistractors)) {
            $this->errors[] = "{$context}: distractors of '{$answer}' must be unique and differ from the answer.";
        }
    }

    /**
     * @param  array<string, string>  $glossary
     */
    private function assertGlossaryCovers(string $context, string $text, array $glossary): void
    {
        $missing = array_values(array_unique(array_filter(
            Tokenizer::tokens($text),
            fn (string $token): bool => ! array_key_exists($token, $glossary),
        )));

        if ($missing !== []) {
            $this->errors[] = "{$context}: glossary is missing ".implode(', ', array_map(fn (string $token): string => "'{$token}'", $missing)).'.';
        }
    }

    private function registerId(string $context, mixed $id): void
    {
        if (! is_string($id) || preg_match('/^[a-z0-9-]+$/', $id) !== 1) {
            $this->errors[] = "{$context}: id must be a lowercase slug.";

            return;
        }

        if (isset($this->seenIds[$id])) {
            $this->errors[] = "{$context}: id '{$id}' is already used by {$this->seenIds[$id]}.";

            return;
        }

        $this->seenIds[$id] = $context;
    }

    private function isFilledString(mixed $value): bool
    {
        return is_string($value) && trim($value) !== '';
    }
}
