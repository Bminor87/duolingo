<?php

namespace App\Course;

use JsonException;
use RuntimeException;

/**
 * Read-only access to the course content stored as JSON in resources/course.
 *
 * @phpstan-type Key array{w: string, d: list<string>, a?: list<string>}
 * @phpstan-type Variant array{sv: string, fi: string, w: string, d: list<string>}
 * @phpstan-type Sentence array{id: string, sv: string, fi: string, keys: list<Key>, grammar: list<string>, note?: string, wrong?: list<string>, variants?: list<Variant>, src: string}
 * @phpstan-type Word array{id: string, sv: string, fi: string, note?: string, src: string}
 * @phpstan-type Lesson array{id: string, title: string, intro?: string, sentences: list<Sentence>, words?: list<Word>}
 * @phpstan-type Unit array{id: string, title: string, subtitle: string, description: string, icon: string, color: string, exam: list<string>, source: string, lessons: list<Lesson>, glossary: array<string, string>}
 * @phpstan-type GrammarTopic array{title: string, body: string}
 * @phpstan-type Item array{id: string, type: 'sentence'|'word', unit_id: string, lesson_id: string, sv: string, fi: string}
 */
class Course
{
    /**
     * @var list<Unit>|null
     */
    private ?array $units = null;

    /**
     * @var array<string, GrammarTopic>|null
     */
    private ?array $grammar = null;

    /**
     * @var array<string, Item>|null
     */
    private ?array $items = null;

    public function __construct(private readonly string $path) {}

    /**
     * Get every unit in path order.
     *
     * @return list<Unit>
     */
    public function units(): array
    {
        if ($this->units !== null) {
            return $this->units;
        }

        $files = glob($this->path.'/units/*.json') ?: [];
        sort($files);

        /** @var list<Unit> $units */
        $units = array_map(fn (string $file): array => $this->readJson($file), $files);

        return $this->units = $units;
    }

    /**
     * Find a unit by its id.
     *
     * @return Unit|null
     */
    public function unit(string $unitId): ?array
    {
        foreach ($this->units() as $unit) {
            if ($unit['id'] === $unitId) {
                return $unit;
            }
        }

        return null;
    }

    /**
     * Find a lesson and the unit it belongs to.
     *
     * @return array{unit: Unit, lesson: Lesson}|null
     */
    public function lesson(string $lessonId): ?array
    {
        foreach ($this->units() as $unit) {
            foreach ($unit['lessons'] as $lesson) {
                if ($lesson['id'] === $lessonId) {
                    return ['unit' => $unit, 'lesson' => $lesson];
                }
            }
        }

        return null;
    }

    /**
     * Get every lesson id in path order.
     *
     * @return list<string>
     */
    public function lessonIds(): array
    {
        $lessonIds = [];

        foreach ($this->units() as $unit) {
            foreach ($unit['lessons'] as $lesson) {
                $lessonIds[] = $lesson['id'];
            }
        }

        return $lessonIds;
    }

    /**
     * Get every learnable item (sentences and words) keyed by id.
     *
     * @return array<string, Item>
     */
    public function items(): array
    {
        if ($this->items !== null) {
            return $this->items;
        }

        $items = [];

        foreach ($this->units() as $unit) {
            foreach ($unit['lessons'] as $lesson) {
                foreach ($lesson['sentences'] as $sentence) {
                    $items[$sentence['id']] = [
                        'id' => $sentence['id'],
                        'type' => 'sentence',
                        'unit_id' => $unit['id'],
                        'lesson_id' => $lesson['id'],
                        'sv' => $sentence['sv'],
                        'fi' => $sentence['fi'],
                    ];
                }

                foreach ($lesson['words'] ?? [] as $word) {
                    $items[$word['id']] = [
                        'id' => $word['id'],
                        'type' => 'word',
                        'unit_id' => $unit['id'],
                        'lesson_id' => $lesson['id'],
                        'sv' => $word['sv'],
                        'fi' => $word['fi'],
                    ];
                }
            }
        }

        return $this->items = $items;
    }

    /**
     * Get the ids of every item taught in the given lesson.
     *
     * @param  Lesson  $lesson
     * @return list<string>
     */
    public function lessonItemIds(array $lesson): array
    {
        return [
            ...array_column($lesson['sentences'], 'id'),
            ...array_column($lesson['words'] ?? [], 'id'),
        ];
    }

    /**
     * Get the glossary of every unit merged together. The first definition of a key wins.
     *
     * @return array<string, string>
     */
    public function glossary(): array
    {
        $glossary = [];

        foreach ($this->units() as $unit) {
            foreach ($unit['glossary'] as $key => $meaning) {
                $glossary[mb_strtolower((string) $key)] ??= $meaning;
            }
        }

        return $glossary;
    }

    /**
     * Get the grammar topics keyed by id.
     *
     * @return array<string, GrammarTopic>
     */
    public function grammar(): array
    {
        /** @var array<string, GrammarTopic> $grammar */
        $grammar = $this->grammar ??= $this->readJson($this->path.'/grammar.json');

        return $grammar;
    }

    /**
     * Decode a JSON file into an array.
     *
     * @return array<mixed>
     */
    private function readJson(string $file): array
    {
        try {
            $decoded = json_decode((string) file_get_contents($file), true, flags: JSON_THROW_ON_ERROR);
        } catch (JsonException $exception) {
            throw new RuntimeException("Invalid course JSON in {$file}: {$exception->getMessage()}", previous: $exception);
        }

        if (! is_array($decoded)) {
            throw new RuntimeException("Course JSON in {$file} must be an object.");
        }

        return $decoded;
    }
}
