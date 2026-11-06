import { Fragment } from 'react';
import { cn } from '@/lib/utils';

function renderInline(text: string) {
    return text.split(/(\*\*[^*]+\*\*)/gu).map((part, index) =>
        part.startsWith('**') && part.endsWith('**') ? (
            <strong key={index} className="font-semibold text-foreground">
                {part.slice(2, -2)}
            </strong>
        ) : (
            <Fragment key={index}>{part}</Fragment>
        ),
    );
}

/**
 * Renders the small markdown subset used in grammar explanations: paragraphs, "- " bullets and **bold**.
 */
export default function RichText({
    text,
    className,
}: {
    text: string;
    className?: string;
}) {
    const blocks: { type: 'p' | 'ul'; lines: string[] }[] = [];

    for (const line of text.split('\n')) {
        const isBullet = line.startsWith('- ');
        const content = isBullet ? line.slice(2) : line;
        const last = blocks[blocks.length - 1];

        if (isBullet && last?.type === 'ul') {
            last.lines.push(content);
        } else {
            blocks.push({ type: isBullet ? 'ul' : 'p', lines: [content] });
        }
    }

    return (
        <div className={cn('space-y-2 text-sm leading-relaxed', className)}>
            {blocks.map((block, index) =>
                block.type === 'ul' ? (
                    <ul key={index} className="list-disc space-y-1 pl-5">
                        {block.lines.map((line, lineIndex) => (
                            <li key={lineIndex}>{renderInline(line)}</li>
                        ))}
                    </ul>
                ) : (
                    <p key={index}>{renderInline(block.lines[0])}</p>
                ),
            )}
        </div>
    );
}
