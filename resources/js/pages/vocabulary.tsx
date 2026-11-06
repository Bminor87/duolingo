import { Head } from '@inertiajs/react';
import { ChevronDown, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import ExamBadge from '@/components/course/exam-badge';
import HintPanel from '@/components/course/hint-panel';
import RichText from '@/components/course/rich-text';
import UnitIcon from '@/components/course/unit-icon';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import type { ExamPart, GrammarTopic, Hint } from '@/types/course';

type VocabularySentence = {
    id: string;
    sv: string;
    fi: string;
    note: string | null;
    grammar: string[];
    src: 'm' | 'x';
    strength: number;
};

type VocabularyWord = {
    id: string;
    sv: string;
    fi: string;
    note: string | null;
    src: 'm' | 'x';
    strength: number;
};

type VocabularyUnit = {
    id: string;
    title: string;
    subtitle: string;
    color: string;
    icon: string;
    exam: ExamPart[];
    source: string;
    lessons: {
        id: string;
        title: string;
        sentences: VocabularySentence[];
        words: VocabularyWord[];
    }[];
};

function StrengthDots({ strength }: { strength: number }) {
    return (
        <span
            className="flex shrink-0 gap-0.5"
            title={`Vahvuus ${Math.min(strength, 3)}/3`}
        >
            {[1, 2, 3].map((level) => (
                <span
                    key={level}
                    className={cn(
                        'size-2 rounded-full',
                        strength >= level ? 'bg-amber-400' : 'bg-muted',
                    )}
                />
            ))}
        </span>
    );
}

function matches(text: string, query: string): boolean {
    return text.toLowerCase().includes(query);
}

export default function Vocabulary({
    units,
    grammar,
    glossary,
}: {
    units: VocabularyUnit[];
    grammar: Record<string, GrammarTopic>;
    glossary: Record<string, string>;
}) {
    const [tab, setTab] = useState<'items' | 'grammar'>('items');
    const [query, setQuery] = useState('');
    const [onlyWeak, setOnlyWeak] = useState(false);
    const [selected, setSelected] = useState<Hint | null>(null);
    const normalizedQuery = query.trim().toLowerCase();

    const filteredUnits = useMemo(
        () =>
            units
                .map((unit) => ({
                    ...unit,
                    lessons: unit.lessons
                        .map((lesson) => ({
                            ...lesson,
                            sentences: lesson.sentences.filter(
                                (item) =>
                                    (!onlyWeak || item.strength < 3) &&
                                    (normalizedQuery === '' ||
                                        matches(item.sv, normalizedQuery) ||
                                        matches(item.fi, normalizedQuery)),
                            ),
                            words: lesson.words.filter(
                                (item) =>
                                    (!onlyWeak || item.strength < 3) &&
                                    (normalizedQuery === '' ||
                                        matches(item.sv, normalizedQuery) ||
                                        matches(item.fi, normalizedQuery)),
                            ),
                        }))
                        .filter(
                            (lesson) =>
                                lesson.sentences.length + lesson.words.length >
                                0,
                        ),
                }))
                .filter((unit) => unit.lessons.length > 0),
        [units, onlyWeak, normalizedQuery],
    );

    const totals = useMemo(() => {
        const items = units.flatMap((unit) =>
            unit.lessons.flatMap((lesson) => [
                ...lesson.sentences,
                ...lesson.words,
            ]),
        );

        return {
            sentences: units.reduce(
                (sum, unit) =>
                    sum +
                    unit.lessons.reduce(
                        (s, lesson) => s + lesson.sentences.length,
                        0,
                    ),
                0,
            ),
            words: units.reduce(
                (sum, unit) =>
                    sum +
                    unit.lessons.reduce(
                        (s, lesson) => s + lesson.words.length,
                        0,
                    ),
                0,
            ),
            fromMaterial: items.filter((item) => item.src === 'm').length,
            all: items.length,
        };
    }, [units]);

    return (
        <>
            <Head title="Sanasto" />

            <h1 className="text-2xl font-extrabold">Sanasto</h1>
            <p className="mt-1 text-sm text-muted-foreground">
                Kaikki kurssilla opeteltavat {totals.sentences} lausetta ja{' '}
                {totals.words} sanaa. {totals.fromMaterial}/{totals.all} on
                suoraan kurssimateriaalista, loput ovat suomenruotsalaisia
                lisälauseita tehtäviä varten. Napauta lausetta nähdäksesi
                selityksen.
            </p>

            <div className="mt-4 grid grid-cols-2 rounded-2xl bg-muted p-1 text-sm font-bold">
                {(['items', 'grammar'] as const).map((value) => (
                    <button
                        key={value}
                        type="button"
                        onClick={() => setTab(value)}
                        className={cn(
                            'rounded-xl py-2',
                            tab === value && 'bg-background shadow-sm',
                        )}
                    >
                        {value === 'items' ? 'Lauseet ja sanat' : 'Kielioppi'}
                    </button>
                ))}
            </div>

            {tab === 'grammar' ? (
                <div className="mt-4 space-y-2">
                    {Object.entries(grammar).map(([id, topic]) => (
                        <Collapsible key={id} className="rounded-2xl border-2">
                            <CollapsibleTrigger className="group flex w-full items-center justify-between px-4 py-3 text-left font-bold">
                                {topic.title}
                                <ChevronDown className="size-4 transition-transform group-data-[state=open]:rotate-180" />
                            </CollapsibleTrigger>
                            <CollapsibleContent className="px-4 pb-4 text-muted-foreground">
                                <RichText text={topic.body} />
                            </CollapsibleContent>
                        </Collapsible>
                    ))}
                </div>
            ) : (
                <>
                    <div className="mt-4 flex items-center gap-2 rounded-2xl border-2 px-3">
                        <Search className="size-4 text-muted-foreground" />
                        <input
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Hae ruotsiksi tai suomeksi"
                            className="h-11 flex-1 bg-transparent outline-none"
                            aria-label="Hae sanastosta"
                        />
                    </div>
                    <label className="mt-3 flex items-center gap-2 text-sm font-semibold">
                        <input
                            type="checkbox"
                            checked={onlyWeak}
                            onChange={(event) =>
                                setOnlyWeak(event.target.checked)
                            }
                            className="size-4"
                        />
                        Näytä vain ne, joita en vielä hallitse
                    </label>

                    <div className="mt-4 space-y-3">
                        {filteredUnits.map((unit) => (
                            <Collapsible
                                key={unit.id}
                                defaultOpen={normalizedQuery !== ''}
                                className="rounded-2xl border-2"
                            >
                                <CollapsibleTrigger className="group flex w-full items-center gap-3 px-4 py-3 text-left">
                                    <UnitIcon
                                        name={unit.icon}
                                        className="size-5 shrink-0 text-muted-foreground"
                                    />
                                    <div className="min-w-0 flex-1">
                                        <p className="font-extrabold">
                                            {unit.title}
                                        </p>
                                        <p
                                            className="truncate text-xs text-muted-foreground italic"
                                            lang="sv"
                                        >
                                            {unit.subtitle}
                                        </p>
                                    </div>
                                    <ChevronDown className="size-4 shrink-0 transition-transform group-data-[state=open]:rotate-180" />
                                </CollapsibleTrigger>
                                <CollapsibleContent className="px-4 pb-4">
                                    <div className="flex flex-wrap gap-1.5">
                                        {unit.exam.map((exam) => (
                                            <ExamBadge key={exam} exam={exam} />
                                        ))}
                                    </div>
                                    <p className="mt-2 text-xs text-muted-foreground">
                                        Lähde: {unit.source}
                                    </p>

                                    {unit.lessons.map((lesson) => (
                                        <div key={lesson.id} className="mt-4">
                                            <h3 className="text-xs font-extrabold text-muted-foreground uppercase">
                                                {lesson.title}
                                            </h3>
                                            <ul className="mt-1 divide-y">
                                                {lesson.sentences.map(
                                                    (sentence) => (
                                                        <li key={sentence.id}>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    setSelected(
                                                                        sentence,
                                                                    )
                                                                }
                                                                className="flex w-full items-start gap-3 py-2.5 text-left"
                                                            >
                                                                <div className="min-w-0 flex-1">
                                                                    <p
                                                                        className="font-semibold"
                                                                        lang="sv"
                                                                    >
                                                                        {
                                                                            sentence.sv
                                                                        }
                                                                    </p>
                                                                    <p className="text-sm text-muted-foreground">
                                                                        {
                                                                            sentence.fi
                                                                        }
                                                                    </p>
                                                                </div>
                                                                <div className="flex flex-col items-end gap-1 pt-1">
                                                                    <StrengthDots
                                                                        strength={
                                                                            sentence.strength
                                                                        }
                                                                    />
                                                                    {sentence.src ===
                                                                        'x' && (
                                                                        <span className="text-[10px] font-bold text-muted-foreground">
                                                                            LISÄ
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </button>
                                                        </li>
                                                    ),
                                                )}
                                                {lesson.words.map((word) => (
                                                    <li key={word.id}>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setSelected({
                                                                    sv: word.sv,
                                                                    fi: word.fi,
                                                                    note: word.note,
                                                                    grammar: [],
                                                                    src: word.src,
                                                                })
                                                            }
                                                            className="flex w-full items-center gap-3 py-2 text-left text-sm"
                                                        >
                                                            <span className="min-w-0 flex-1">
                                                                <span
                                                                    className="font-semibold"
                                                                    lang="sv"
                                                                >
                                                                    {word.sv}
                                                                </span>
                                                                <span className="text-muted-foreground">
                                                                    {' '}
                                                                    = {word.fi}
                                                                </span>
                                                            </span>
                                                            <StrengthDots
                                                                strength={
                                                                    word.strength
                                                                }
                                                            />
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                </CollapsibleContent>
                            </Collapsible>
                        ))}
                        {filteredUnits.length === 0 && (
                            <p className="py-8 text-center text-sm text-muted-foreground">
                                Ei osumia.
                            </p>
                        )}
                    </div>
                </>
            )}

            <Sheet
                open={selected !== null}
                onOpenChange={(open) => !open && setSelected(null)}
            >
                <SheetContent
                    side="bottom"
                    className="max-h-[85dvh] overflow-y-auto rounded-t-3xl"
                >
                    <SheetHeader>
                        <SheetTitle>Selitys</SheetTitle>
                    </SheetHeader>
                    <div className="mx-auto w-full max-w-2xl px-4 pb-8">
                        {selected && (
                            <HintPanel
                                hint={selected}
                                glossary={glossary}
                                grammar={grammar}
                            />
                        )}
                    </div>
                </SheetContent>
            </Sheet>
        </>
    );
}
