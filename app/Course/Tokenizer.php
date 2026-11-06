<?php

namespace App\Course;

class Tokenizer
{
    /**
     * Characters stripped from the start and end of every token, as a regex character class body.
     */
    private const string TRIM_CHARACTERS = '.,!?:;"\'”“«»()\[\]–—…';

    /**
     * Split a Swedish text into lowercase glossary lookup tokens.
     *
     * Mirrors resources/js/lib/course/text.ts so hints look up the same keys.
     *
     * @return list<string>
     */
    public static function tokens(string $text): array
    {
        $tokens = [];

        foreach (preg_split('/[\s\/]+/u', $text) ?: [] as $rawToken) {
            $token = mb_strtolower(self::trimPunctuation($rawToken));

            if ($token === '' || $token === '-' || preg_match('/^[\d.,:%]+$/u', $token) === 1) {
                continue;
            }

            $tokens[] = $token;
        }

        return $tokens;
    }

    /**
     * Normalize a typed answer for comparison.
     */
    public static function normalizeAnswer(string $answer): string
    {
        $collapsed = trim(preg_replace('/\s+/u', ' ', $answer) ?? '');

        return mb_strtolower(trim(self::trimPunctuation($collapsed)));
    }

    /**
     * Strip punctuation from both ends of a string, treating multibyte characters as whole characters.
     */
    private static function trimPunctuation(string $value): string
    {
        $pattern = '/^['.self::TRIM_CHARACTERS.']+|['.self::TRIM_CHARACTERS.']+$/u';

        return preg_replace($pattern, '', $value) ?? $value;
    }
}
