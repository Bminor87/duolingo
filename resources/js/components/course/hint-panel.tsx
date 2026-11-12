import { BookOpen, ChevronDown, Lightbulb } from 'lucide-react';
import RichText from '@/components/course/rich-text';
import SpeakButton from '@/components/course/speak-button';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import type { GlossedPart } from '@/lib/course/text';
import { glossSentence, tokenize } from '@/lib/course/text';
import type { GrammarTopic, Hint } from '@/types/course';

/**
 * How much of the sentence a hint may reveal before the learner has answered:
 * - full: everything (learning cards, and any exercise after checking)
 * - no-translation: no Finnish translation (the task is to find the meaning)
 * - masked: the missing word is hidden, only its meaning is shown
 * - scrambled: word meanings in alphabetical order, so the word order is not revealed
 * - grammar-only: just the note and grammar (the task is to pick the right sentence)
 */
export type HintVariant =
    | 'full'
    | 'no-translation'
    | 'masked'
    | 'scrambled'
    | 'grammar-only';

const BLANK = '_____';

function maskedParts(
    sentence: string,
    mask: string,
    glossary: Record<string, string>,
): { sentence: string; parts: GlossedPart[] } {
    const maskedSentence = sentence.replace(mask, BLANK);
    const maskKey = tokenize(mask).join(' ');
    const maskMeaning =
        glossary[maskKey] ??
        (tokenize(mask)
            .map((token) => glossary[token])
            .filter(Boolean)
            .join(' + ') ||
            null);

    return {
        sentence: maskedSentence,
        parts: glossSentence(maskedSentence, glossary).map((part) =>
            part.text.includes(BLANK)
                ? { text: BLANK, meaning: maskMeaning }
                : part,
        ),
    };
}

/**
 * Explains a sentence for a beginner: a word-by-word breakdown, a note, and the grammar behind it.
 */
export default function HintPanel({
    hint,
    glossary,
    grammar,
    variant = 'full',
    mask,
}: {
    hint: Hint;
    glossary: Record<string, string>;
    grammar: Record<string, GrammarTopic>;
    variant?: HintVariant;
    mask?: string;
}) {
    let sentence: string | null = hint.sv;
    let parts = glossSentence(hint.sv, glossary);

    if (variant === 'masked' && mask) {
        ({ sentence, parts } = maskedParts(hint.sv, mask, glossary));
    }

    if (variant === 'scrambled') {
        sentence = null;
        parts = [
            ...new Map(
                parts.map((part) => [part.text.toLowerCase(), part]),
            ).values(),
        ]
            .map((part) => ({
                ...part,
                text: part.text.replace(/[.,!?:;]+$/u, ''),
            }))
            .sort((a, b) => a.text.localeCompare(b.text, 'sv'));
    }

    const showBreakdown = variant !== 'grammar-only';
    const showTranslation = variant !== 'no-translation';
    const topics = hint.grammar
        .map((id) => ({ id, topic: grammar[id] }))
        .filter(
            (entry): entry is { id: string; topic: GrammarTopic } =>
                entry.topic !== undefined,
        );

    return (
        <div className="space-y-5">
            <div>
                {sentence !== null && variant !== 'grammar-only' && (
                    <div className="flex items-start gap-3">
                        <p className="flex-1 text-lg font-semibold" lang="sv">
                            {sentence}
                        </p>
                        {(variant === 'full' ||
                            variant === 'no-translation') && (
                            <SpeakButton text={hint.sv} />
                        )}
                    </div>
                )}
                {showTranslation && (
                    <p className="mt-1 text-muted-foreground">{hint.fi}</p>
                )}
                <p className="mt-2 text-xs text-muted-foreground">
                    {hint.src === 'm'
                        ? 'Kurssimateriaalista'
                        : 'Lisälause (suomenruotsi), ei suoraan materiaalista'}
                </p>
            </div>

            {showBreakdown && (
                <section>
                    <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                        <BookOpen className="size-4" />
                        {variant === 'scrambled'
                            ? 'Sanat aakkosjärjestyksessä'
                            : 'Sana sanalta'}
                    </h3>
                    <dl className="divide-y rounded-xl border">
                        {parts.map((part, index) => (
                            <div
                                key={`${part.text}-${index}`}
                                className="grid grid-cols-[minmax(6rem,auto)_1fr] gap-3 px-3 py-2 text-sm"
                            >
                                <dt className="font-semibold" lang="sv">
                                    {part.text}
                                </dt>
                                <dd className="text-muted-foreground">
                                    {part.meaning ?? '–'}
                                </dd>
                            </div>
                        ))}
                    </dl>
                </section>
            )}

            {hint.note && (
                <section className="flex gap-3 rounded-xl bg-amber-50 p-3 text-sm dark:bg-amber-950/40">
                    <Lightbulb className="mt-0.5 size-4 shrink-0 text-amber-600" />
                    <p>{hint.note}</p>
                </section>
            )}

            {topics.length > 0 && (
                <section className="space-y-2">
                    <h3 className="text-sm font-semibold">Kielioppi</h3>
                    {topics.map(({ id, topic }) => (
                        <Collapsible key={id} className="rounded-xl border">
                            <CollapsibleTrigger className="group flex w-full items-center justify-between px-3 py-2.5 text-left text-sm font-medium">
                                {topic.title}
                                <ChevronDown className="size-4 transition-transform group-data-[state=open]:rotate-180" />
                            </CollapsibleTrigger>
                            <CollapsibleContent className="px-3 pb-3 text-muted-foreground">
                                <RichText text={topic.body} />
                            </CollapsibleContent>
                        </Collapsible>
                    ))}
                </section>
            )}

            {variant !== 'full' && (
                <p className="text-xs text-muted-foreground">
                    Koko selitys näkyy, kun olet vastannut.
                </p>
            )}
        </div>
    );
}
