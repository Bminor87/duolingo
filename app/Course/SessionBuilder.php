<?php

namespace App\Course;

use Random\Randomizer;

/**
 * Builds the list of exercises for a lesson or review session.
 *
 * Every item gets a short "ladder" of exercises that gets harder as the item's strength grows:
 * recognising the meaning, choosing the missing word, ordering words, and finally typing the missing word.
 *
 * @phpstan-import-type Unit from Course
 * @phpstan-import-type Lesson from Course
 * @phpstan-import-type Sentence from Course
 * @phpstan-import-type Word from Course
 * @phpstan-import-type Key from Course
 *
 * @phpstan-type Hint array{sv: string, fi: string, note: string|null, grammar: list<string>, src: string}
 * @phpstan-type Exercise array<string, mixed>
 * @phpstan-type Pools array{sentenceFi: list<string>, wordFi: list<string>, wordSv: list<string>}
 */
class SessionBuilder
{
    /**
     * The most graded exercises one session may contain (learning cards are not counted).
     */
    public const int MAX_EXERCISES = 24;

    /**
     * How many words one matching exercise contains.
     */
    public const int MATCH_GROUP_SIZE = 5;

    /**
     * The longest sentence (in words) used in a word ordering exercise.
     */
    public const int MAX_ORDER_TOKENS = 12;

    /**
     * Exercise ladders for sentences, indexed by item strength.
     */
    private const array SENTENCE_LADDERS = [
        0 => ['choose_fi', 'cloze_choose', 'order_or_sv'],
        1 => ['cloze_choose', 'choose_sv', 'pattern_or_type'],
        2 => ['cloze_type', 'pattern_or_order', 'choose_fi'],
        3 => ['cloze_type', 'order_or_sv', 'choose_fi'],
    ];

    /**
     * Review modes target one exam: the written exam is about understanding, the oral exam about producing.
     */
    private const array MODE_LADDERS = [
        'written' => ['choose_fi', 'cloze_choose'],
        'oral' => ['order_or_sv', 'cloze_type'],
    ];

    private int $exerciseCounter = 0;

    public function __construct(
        private readonly Course $course,
        private readonly Randomizer $randomizer = new Randomizer,
    ) {}

    /**
     * Build the exercises for one lesson.
     *
     * @param  Unit  $unit
     * @param  Lesson  $lesson
     * @return array{exercises: list<Exercise>, glossary: array<string, string>, grammar: array<string, array{title: string, body: string}>}
     */
    public function forLesson(array $unit, array $lesson, LearnerProgress $progress): array
    {
        $this->exerciseCounter = 0;
        $pools = $this->pools([$unit]);
        $sentences = $lesson['sentences'];
        $words = $lesson['words'] ?? [];
        $exercisesPerSentence = count($sentences) <= 6 ? 3 : 2;

        $plans = [];

        foreach ($sentences as $sentence) {
            $strength = $progress->strength($sentence['id']);
            $ladder = array_slice($this->sentenceLadder($strength), 0, $exercisesPerSentence);
            $plan = $this->sentencePlan($sentence, $ladder, $pools);

            if ($strength === 0) {
                array_unshift($plan[0], $this->learnCard($sentence));
            }

            $plans[] = $plan;
        }

        $newWords = array_values(array_filter($words, fn (array $word): bool => $progress->strength($word['id']) === 0));
        $matchedWordIds = [];

        foreach ($this->evenGroups($newWords) as $group) {
            $steps = [$this->wordListCard($group)];

            if (count($group) >= 3) {
                $steps[] = $this->matchExercise($group);
                array_push($matchedWordIds, ...array_column($group, 'id'));
            }

            $plans[] = [$steps];
        }

        $optionalPlans = [];

        foreach ($words as $word) {
            $strength = $progress->strength($word['id']);
            $exercise = $this->wordExercise($word, $strength, $pools);

            // New words are introduced on a word list card first, so their own exercise waits for the next round.
            // A word that is already practised in a matching exercise may be dropped when the session is too long.
            if (in_array($word['id'], $matchedWordIds, true)) {
                $optionalPlans[count($plans)] = true;
            }

            $plans[] = $strength === 0 ? [[], [$exercise]] : [[$exercise]];
        }

        return $this->finish($plans, $optionalPlans);
    }

    /**
     * Build a review session for the given items.
     *
     * @param  list<string>  $itemIds
     * @param  'mixed'|'written'|'oral'  $mode
     * @return array{exercises: list<Exercise>, glossary: array<string, string>, grammar: array<string, array{title: string, body: string}>}
     */
    public function forReview(array $itemIds, string $mode, LearnerProgress $progress): array
    {
        $this->exerciseCounter = 0;
        $pools = $this->pools($this->course->units());
        $plans = [];
        $words = [];

        foreach ($itemIds as $itemId) {
            $strength = $progress->strength($itemId);
            $word = $this->findWord($itemId);

            if ($word !== null) {
                $words[] = $word;
                $plans[] = [[$this->wordExercise($word, $this->reviewWordStrength($mode, $strength), $pools)]];

                continue;
            }

            $sentence = $this->findSentence($itemId);

            if ($sentence !== null) {
                $ladder = self::MODE_LADDERS[$mode] ?? array_slice($this->sentenceLadder(max($strength, 1)), 0, 2);
                $plans[] = $this->sentencePlan($sentence, $ladder, $pools);
            }
        }

        foreach ($this->evenGroups($words) as $group) {
            if (count($group) >= 3) {
                $plans[] = [[$this->matchExercise($group)]];
            }
        }

        return $this->finish($plans);
    }

    /**
     * @return list<string>
     */
    private function sentenceLadder(int $strength): array
    {
        return self::SENTENCE_LADDERS[min($strength, 3)];
    }

    /**
     * Words get easier exercises in written mode (recognition) and harder ones in oral mode (production).
     */
    private function reviewWordStrength(string $mode, int $strength): int
    {
        return match ($mode) {
            'written' => 0,
            'oral' => 2,
            default => $strength,
        };
    }

    /**
     * @param  Sentence  $sentence
     * @param  list<string>  $ladder
     * @param  Pools  $pools
     * @return list<list<Exercise>>
     */
    private function sentencePlan(array $sentence, array $ladder, array $pools): array
    {
        $plan = [];

        foreach ($ladder as $step => $exerciseType) {
            $plan[] = [$this->sentenceExercise($sentence, $exerciseType, $step, $pools)];
        }

        return $plan;
    }

    /**
     * @param  Sentence  $sentence
     * @param  Pools  $pools
     * @return Exercise
     */
    private function sentenceExercise(array $sentence, string $exerciseType, int $step, array $pools): array
    {
        $variants = $sentence['variants'] ?? [];

        return match ($exerciseType) {
            'choose_fi' => $this->chooseMeaning($sentence, $pools['sentenceFi']),
            'choose_sv' => $this->chooseSentence($sentence),
            'cloze_choose' => $this->cloze($sentence, 'choose', $step),
            'cloze_type' => $this->cloze($sentence, 'type', $step),
            'order_or_sv' => $this->orderWords($sentence) ?? $this->chooseSentence($sentence),
            'pattern_or_type' => $variants !== [] ? $this->pattern($sentence, 'choose') : $this->cloze($sentence, 'type', $step),
            'pattern_or_order' => $variants !== []
                ? $this->pattern($sentence, 'type')
                : ($this->orderWords($sentence) ?? $this->cloze($sentence, 'choose', $step + 1)),
            default => $this->cloze($sentence, 'choose', $step),
        };
    }

    /**
     * @param  Sentence  $sentence
     * @return Exercise
     */
    private function learnCard(array $sentence): array
    {
        return [
            'kind' => 'learn',
            'itemId' => $sentence['id'],
            'hint' => $this->sentenceHint($sentence),
        ];
    }

    /**
     * @param  list<Word>  $words
     * @return Exercise
     */
    private function wordListCard(array $words): array
    {
        return [
            'kind' => 'learn_words',
            'itemIds' => array_column($words, 'id'),
            'pairs' => array_map(fn (array $word): array => ['itemId' => $word['id'], 'sv' => $word['sv'], 'fi' => $word['fi'], 'note' => $word['note'] ?? null], $words),
        ];
    }

    /**
     * @param  list<Word>  $words
     * @return Exercise
     */
    private function matchExercise(array $words): array
    {
        return [
            'kind' => 'match',
            'itemIds' => array_column($words, 'id'),
            'pairs' => array_map(fn (array $word): array => ['itemId' => $word['id'], 'sv' => $word['sv'], 'fi' => $word['fi']], $words),
        ];
    }

    /**
     * Show a Swedish sentence and choose its Finnish meaning (the written exam skill).
     *
     * @param  Sentence  $sentence
     * @param  list<string>  $finnishPool
     * @return Exercise
     */
    private function chooseMeaning(array $sentence, array $finnishPool): array
    {
        return [
            'kind' => 'choose_fi',
            'itemId' => $sentence['id'],
            'prompt' => $sentence['sv'],
            'options' => $this->optionsWithAnswer($sentence['fi'], $finnishPool),
            'answer' => $sentence['fi'],
            'hint' => $this->sentenceHint($sentence),
        ];
    }

    /**
     * Show the Finnish meaning and choose the correct Swedish sentence among near-misses.
     *
     * @param  Sentence  $sentence
     * @return Exercise
     */
    private function chooseSentence(array $sentence): array
    {
        $candidates = $sentence['wrong'] ?? [];

        foreach ($sentence['keys'] as $key) {
            foreach ($key['d'] as $distractor) {
                $candidates[] = $this->replaceWord($sentence['sv'], $key['w'], $distractor);
            }
        }

        $candidates = array_values(array_unique(array_filter(
            $candidates,
            fn (string $candidate): bool => $candidate !== $sentence['sv'],
        )));

        $wrong = array_slice($sentence['wrong'] ?? [], 0, 2);
        $swaps = array_values(array_diff($candidates, $wrong));
        $picked = [...$wrong, ...array_slice($this->randomizer->shuffleArray($swaps), 0, 3 - count($wrong))];

        return [
            'kind' => 'choose_sv',
            'itemId' => $sentence['id'],
            'prompt' => $sentence['fi'],
            'options' => $this->randomizer->shuffleArray([$sentence['sv'], ...$picked]),
            'answer' => $sentence['sv'],
            'hint' => $this->sentenceHint($sentence),
        ];
    }

    /**
     * Fill in one missing word, either by choosing it or by typing it.
     *
     * @param  Sentence  $sentence
     * @param  'choose'|'type'  $mode
     * @return Exercise
     */
    private function cloze(array $sentence, string $mode, int $step): array
    {
        $keys = $sentence['keys'];

        if ($mode === 'type') {
            $typeable = array_values(array_filter($keys, fn (array $key): bool => ! str_contains($key['w'], ' ')));
            $keys = $typeable !== [] ? $typeable : $keys;
            $mode = $typeable !== [] ? 'type' : 'choose';
        }

        $key = $keys[$step % count($keys)];

        return [
            'kind' => 'cloze',
            'itemId' => $sentence['id'],
            ...$this->blank($sentence['sv'], $key, $mode),
            'prompt' => $sentence['fi'],
            'model' => null,
            'hint' => $this->sentenceHint($sentence),
        ];
    }

    /**
     * Show a learned sentence next to a variant where one word changed, and fill in the changed word.
     *
     * @param  Sentence  $sentence
     * @param  'choose'|'type'  $mode
     * @return Exercise
     */
    private function pattern(array $sentence, string $mode): array
    {
        $variants = $sentence['variants'] ?? [];
        $variant = $variants[$this->randomizer->getInt(0, count($variants) - 1)];

        return [
            'kind' => 'cloze',
            'itemId' => $sentence['id'],
            ...$this->blank($variant['sv'], ['w' => $variant['w'], 'd' => $variant['d']], str_contains($variant['w'], ' ') ? 'choose' : $mode),
            'prompt' => $variant['fi'],
            'model' => ['sv' => $sentence['sv'], 'fi' => $sentence['fi']],
            'hint' => [
                'sv' => $variant['sv'],
                'fi' => $variant['fi'],
                'note' => $sentence['note'] ?? null,
                'grammar' => $sentence['grammar'],
                'src' => $sentence['src'],
            ],
        ];
    }

    /**
     * Put the Swedish words of the sentence in the right order.
     *
     * @param  Sentence  $sentence
     * @return Exercise|null
     */
    private function orderWords(array $sentence): ?array
    {
        $answer = array_values(array_filter(array_map(
            fn (string $token): string => rtrim($token, '.,!?:;'),
            explode(' ', $sentence['sv']),
        ), fn (string $token): bool => $token !== ''));

        if (count($answer) < 3 || count($answer) > self::MAX_ORDER_TOKENS) {
            return null;
        }

        $extraTiles = [];

        foreach ($sentence['keys'] as $key) {
            $distractor = $key['d'][0] ?? null;

            if ($distractor !== null && ! str_contains($distractor, ' ') && ! in_array($distractor, $answer, true)) {
                $extraTiles[] = $distractor;
            }
        }

        $tiles = [...$answer, ...array_slice($extraTiles, 0, 2)];

        do {
            $shuffled = $this->randomizer->shuffleArray($tiles);
        } while ($shuffled === $tiles && count(array_unique($tiles)) > 1);

        return [
            'kind' => 'order',
            'itemId' => $sentence['id'],
            'prompt' => $sentence['fi'],
            'tiles' => $shuffled,
            'answer' => $answer,
            'hint' => $this->sentenceHint($sentence),
        ];
    }

    /**
     * @param  Word  $word
     * @param  Pools  $pools
     * @return Exercise
     */
    private function wordExercise(array $word, int $strength, array $pools): array
    {
        $hint = ['sv' => $word['sv'], 'fi' => $word['fi'], 'note' => $word['note'] ?? null, 'grammar' => [], 'src' => $word['src']];

        if ($strength === 0) {
            return [
                'kind' => 'choose_fi',
                'itemId' => $word['id'],
                'prompt' => $word['sv'],
                'options' => $this->optionsWithAnswer($word['fi'], $pools['wordFi']),
                'answer' => $word['fi'],
                'hint' => $hint,
            ];
        }

        if ($strength === 1) {
            return [
                'kind' => 'choose_sv',
                'itemId' => $word['id'],
                'prompt' => $word['fi'],
                'options' => $this->optionsWithAnswer($word['sv'], $pools['wordSv']),
                'answer' => $word['sv'],
                'hint' => $hint,
            ];
        }

        [$article, $core] = $this->splitArticle($word['sv']);
        $alternatives = array_map(fn (string $part): string => $this->splitArticle(trim($part))[1], explode('/', $core));

        return [
            'kind' => 'cloze',
            'itemId' => $word['id'],
            'mode' => 'type',
            'before' => $article === '' ? '' : "{$article} ",
            'after' => '',
            'answer' => trim($alternatives[0]),
            'accepted' => array_values(array_unique([...$alternatives, $core])),
            'options' => [],
            'prompt' => $word['fi'],
            'model' => null,
            'hint' => $hint,
        ];
    }

    /**
     * Split "en molntjänst" into the article and the word.
     *
     * @return array{0: string, 1: string}
     */
    private function splitArticle(string $swedish): array
    {
        if (preg_match('/^(en|ett)\s+(.+)$/u', $swedish, $matches) === 1) {
            return [$matches[1], $matches[2]];
        }

        return ['', $swedish];
    }

    /**
     * Split a sentence around a blank and prepare the answer options.
     *
     * @param  Key  $key
     * @param  'choose'|'type'  $mode
     * @return array{mode: 'choose'|'type', before: string, after: string, answer: string, accepted: list<string>, options: list<string>}
     */
    private function blank(string $sentence, array $key, string $mode): array
    {
        $parts = preg_split($this->wholeWordPattern($key['w']), $sentence, 2) ?: [$sentence, ''];

        return [
            'mode' => $mode,
            'before' => $parts[0],
            'after' => $parts[1] ?? '',
            'answer' => $key['w'],
            'accepted' => array_values(array_unique([$key['w'], ...($key['a'] ?? [])])),
            'options' => $mode === 'choose'
                ? $this->randomizer->shuffleArray([$key['w'], ...array_slice($this->randomizer->shuffleArray($key['d']), 0, 3)])
                : [],
        ];
    }

    private function replaceWord(string $sentence, string $word, string $replacement): string
    {
        return preg_replace($this->wholeWordPattern($word), $replacement, $sentence, 1) ?? $sentence;
    }

    private function wholeWordPattern(string $word): string
    {
        return '/(?<![\p{L}\p{N}-])'.preg_quote($word, '/').'(?![\p{L}\p{N}-])/u';
    }

    /**
     * Pick three distractors from the pool and mix them with the answer.
     *
     * @param  list<string>  $pool
     * @return list<string>
     */
    private function optionsWithAnswer(string $answer, array $pool): array
    {
        $distractors = array_values(array_unique(array_filter($pool, fn (string $option): bool => $option !== $answer)));

        return $this->randomizer->shuffleArray([
            $answer,
            ...array_slice($this->randomizer->shuffleArray($distractors), 0, 3),
        ]);
    }

    /**
     * Collect the texts used as distractors in multiple choice exercises.
     *
     * @param  list<Unit>  $units
     * @return Pools
     */
    private function pools(array $units): array
    {
        $pools = ['sentenceFi' => [], 'wordFi' => [], 'wordSv' => []];

        foreach ($units as $unit) {
            foreach ($unit['lessons'] as $lesson) {
                foreach ($lesson['sentences'] as $sentence) {
                    $pools['sentenceFi'][] = $sentence['fi'];
                }

                foreach ($lesson['words'] ?? [] as $word) {
                    $pools['wordFi'][] = $word['fi'];
                    $pools['wordSv'][] = $word['sv'];
                }
            }
        }

        if (count($pools['wordFi']) < 4) {
            $courseWords = array_filter($this->course->items(), fn (array $item): bool => $item['type'] === 'word');
            $pools['wordFi'] = array_values(array_unique([...$pools['wordFi'], ...array_column($courseWords, 'fi')]));
            $pools['wordSv'] = array_values(array_unique([...$pools['wordSv'], ...array_column($courseWords, 'sv')]));
        }

        return $pools;
    }

    /**
     * @return Sentence|null
     */
    private function findSentence(string $itemId): ?array
    {
        $lesson = $this->lessonOfItem($itemId);

        foreach ($lesson['sentences'] ?? [] as $sentence) {
            if ($sentence['id'] === $itemId) {
                return $sentence;
            }
        }

        return null;
    }

    /**
     * @return Word|null
     */
    private function findWord(string $itemId): ?array
    {
        $lesson = $this->lessonOfItem($itemId);

        foreach ($lesson['words'] ?? [] as $word) {
            if ($word['id'] === $itemId) {
                return $word;
            }
        }

        return null;
    }

    /**
     * @return Lesson|null
     */
    private function lessonOfItem(string $itemId): ?array
    {
        $item = $this->course->items()[$itemId] ?? null;

        return $item === null ? null : ($this->course->lesson($item['lesson_id'])['lesson'] ?? null);
    }

    /**
     * @param  Sentence  $sentence
     * @return Hint
     */
    private function sentenceHint(array $sentence): array
    {
        return [
            'sv' => $sentence['sv'],
            'fi' => $sentence['fi'],
            'note' => $sentence['note'] ?? null,
            'grammar' => $sentence['grammar'],
            'src' => $sentence['src'],
        ];
    }

    /**
     * Interleave the item plans round by round, trim the session and attach the glossary it needs.
     *
     * @param  list<list<list<Exercise>>>  $plans
     * @param  array<int, true>  $optionalPlans  Indexes of plans that may be dropped entirely.
     * @return array{exercises: list<Exercise>, glossary: array<string, string>, grammar: array<string, array{title: string, body: string}>}
     */
    private function finish(array $plans, array $optionalPlans = []): array
    {
        $plans = $this->trimToLimit($plans, $optionalPlans);
        $exercises = [];
        $rounds = max(array_map('count', $plans) ?: [0]);

        for ($round = 0; $round < $rounds; $round++) {
            $roundPlans = array_values(array_filter($plans, fn (array $plan): bool => isset($plan[$round])));

            foreach ($this->randomizer->shuffleArray($roundPlans) as $plan) {
                foreach ($plan[$round] as $exercise) {
                    $exercises[] = ['id' => 'e'.(++$this->exerciseCounter), ...$exercise];
                }
            }
        }

        return [
            'exercises' => $exercises,
            ...$this->references($exercises),
        ];
    }

    /**
     * Drop exercises until the session fits MAX_EXERCISES: first optional plans, then the last
     * exercises of the longest plans. Every other item keeps at least one graded exercise.
     *
     * @param  list<list<list<Exercise>>>  $plans
     * @param  array<int, true>  $optionalPlans
     * @return list<list<list<Exercise>>>
     */
    private function trimToLimit(array $plans, array $optionalPlans): array
    {
        $gradedCounts = array_map(fn (array $plan): int => $this->gradedCount($plan), $plans);

        foreach (array_reverse(array_keys($optionalPlans)) as $index) {
            if (array_sum($gradedCounts) <= self::MAX_EXERCISES) {
                break;
            }

            $plans[$index] = [];
            $gradedCounts[$index] = 0;
        }

        while ($gradedCounts !== [] && array_sum($gradedCounts) > self::MAX_EXERCISES) {
            $longest = array_search(max($gradedCounts), $gradedCounts, true);

            if ($longest === false || $gradedCounts[$longest] <= 1) {
                break;
            }

            array_pop($plans[$longest]);
            $gradedCounts[$longest] = $this->gradedCount($plans[$longest]);
        }

        return $plans;
    }

    /**
     * @param  list<list<Exercise>>  $plan
     */
    private function gradedCount(array $plan): int
    {
        $count = 0;

        foreach ($plan as $step) {
            foreach ($step as $exercise) {
                if (! in_array($exercise['kind'], ['learn', 'learn_words'], true)) {
                    $count++;
                }
            }
        }

        return $count;
    }

    /**
     * Split words into groups of at most MATCH_GROUP_SIZE with sizes as even as possible (7 words → 4 + 3).
     *
     * @param  list<Word>  $words
     * @return list<list<Word>>
     */
    private function evenGroups(array $words): array
    {
        if ($words === []) {
            return [];
        }

        $groupCount = intdiv(count($words) + self::MATCH_GROUP_SIZE - 1, self::MATCH_GROUP_SIZE);
        $groupSize = max(1, intdiv(count($words) + $groupCount - 1, $groupCount));

        return array_chunk($words, $groupSize);
    }

    /**
     * Collect the glossary entries and grammar topics the session's hints refer to.
     *
     * @param  list<Exercise>  $exercises
     * @return array{glossary: array<string, string>, grammar: array<string, array{title: string, body: string}>}
     */
    private function references(array $exercises): array
    {
        $texts = [];
        $grammarIds = [];

        foreach ($exercises as $exercise) {
            if (isset($exercise['hint']) && is_array($exercise['hint'])) {
                $texts[] = (string) $exercise['hint']['sv'];
                array_push($grammarIds, ...$exercise['hint']['grammar']);
            }

            if (isset($exercise['model']) && is_array($exercise['model'])) {
                $texts[] = (string) $exercise['model']['sv'];
            }

            foreach ($exercise['pairs'] ?? [] as $pair) {
                $texts[] = (string) $pair['sv'];
            }
        }

        $fullGlossary = $this->course->glossary();
        $glossary = [];
        $lowercaseTexts = array_map(fn (string $text): string => ' '.implode(' ', Tokenizer::tokens($text)).' ', $texts);

        foreach ($texts as $text) {
            foreach (Tokenizer::tokens($text) as $token) {
                if (isset($fullGlossary[$token])) {
                    $glossary[$token] = $fullGlossary[$token];
                }
            }
        }

        foreach ($fullGlossary as $key => $meaning) {
            if (str_contains($key, ' ') && array_filter($lowercaseTexts, fn (string $text): bool => str_contains($text, " {$key} ")) !== []) {
                $glossary[$key] = $meaning;
            }
        }

        $allGrammar = $this->course->grammar();

        return [
            'glossary' => $glossary,
            'grammar' => array_intersect_key($allGrammar, array_flip(array_unique($grammarIds))),
        ];
    }
}
