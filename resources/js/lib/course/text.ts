const TRIM_CHARACTERS = '.,!?:;"\'”“«»()[]–—…';

function trimCharacters(value: string, characters: string): string {
    let start = 0;
    let end = value.length;

    while (start < end && characters.includes(value[start])) {
        start++;
    }

    while (end > start && characters.includes(value[end - 1])) {
        end--;
    }

    return value.slice(start, end);
}

/**
 * Split Swedish text into lowercase glossary lookup tokens.
 * Mirrors App\Course\Tokenizer::tokens() on the server.
 */
export function tokenize(text: string): string[] {
    return text
        .split(/[\s/]+/u)
        .map((raw) => trimCharacters(raw, TRIM_CHARACTERS).toLowerCase())
        .filter(
            (token) =>
                token !== '' && token !== '-' && !/^[\d.,:%]+$/u.test(token),
        );
}

export type GlossedPart = {
    text: string;
    meaning: string | null;
};

/**
 * Split a sentence into display parts, attaching the glossary meaning to each word.
 * Multi-word glossary entries (e.g. "på grund av") are matched first.
 */
export function glossSentence(
    sentence: string,
    glossary: Record<string, string>,
): GlossedPart[] {
    const words = sentence.split(/\s+/u).filter((word) => word !== '');
    const parts: GlossedPart[] = [];
    let index = 0;

    while (index < words.length) {
        let matched = false;

        for (
            let length = Math.min(4, words.length - index);
            length > 1;
            length--
        ) {
            const phraseWords = words.slice(index, index + length);
            const key = tokenize(phraseWords.join(' ')).join(' ');

            if (glossary[key]) {
                parts.push({
                    text: phraseWords.join(' ').replace(/[.,!?:;]+$/u, ''),
                    meaning: glossary[key],
                });
                index += length;
                matched = true;

                break;
            }
        }

        if (matched) {
            continue;
        }

        const word = words[index];
        const key = tokenize(word).join(' ');
        parts.push({
            text: word.replace(/[.,!?:;]+$/u, ''),
            meaning: key ? (glossary[key] ?? null) : null,
        });
        index++;
    }

    return parts;
}

/**
 * Normalize an answer for comparison: lowercase, single spaces, no surrounding punctuation.
 */
export function normalizeAnswer(answer: string): string {
    return trimCharacters(
        answer.replace(/\s+/gu, ' ').trim().toLowerCase(),
        `${TRIM_CHARACTERS} `,
    );
}

function foldNordicLetters(value: string): string {
    return value.replace(/[åä]/gu, 'a').replace(/ö/gu, 'o');
}

export type TypedAnswerResult = 'correct' | 'accent' | 'wrong';

/**
 * Check a typed answer. Writing a/o instead of å/ä/ö is accepted but pointed out,
 * because a phone keyboard may not offer the letters. Any other difference is wrong,
 * so grammar endings (trådlös / trådlöst) are never accepted as typos.
 */
export function checkTypedAnswer(
    typed: string,
    accepted: string[],
): TypedAnswerResult {
    const normalized = normalizeAnswer(typed);
    const candidates = accepted.map(normalizeAnswer);

    if (candidates.includes(normalized)) {
        return 'correct';
    }

    if (
        candidates
            .map(foldNordicLetters)
            .includes(foldNordicLetters(normalized))
    ) {
        return 'accent';
    }

    return 'wrong';
}
