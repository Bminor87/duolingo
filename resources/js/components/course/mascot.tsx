import { cn } from '@/lib/utils';

export type MascotMood = 'happy' | 'cheer' | 'think' | 'sad';

/**
 * Älgis, the course mascot: a friendly moose in a scarf.
 */
export default function Mascot({
    mood = 'happy',
    className,
}: {
    mood?: MascotMood;
    className?: string;
}) {
    return (
        <svg
            viewBox="0 0 120 120"
            className={cn('size-24', className)}
            role="img"
            aria-label="Älgis-hirvi"
        >
            {mood === 'cheer' && (
                <g className="animate-pulse" fill="#facc15">
                    <path d="M14 22 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z" />
                    <path d="M104 14 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z" />
                    <path d="M108 70 l2 4 4 2 -4 2 -2 4 -2 -4 -4 -2 4 -2z" />
                </g>
            )}

            {/* Antlers */}
            <g
                fill="#d9b382"
                stroke="#b08550"
                strokeWidth="2"
                strokeLinejoin="round"
            >
                <path d="M40 40 C30 36 22 30 18 20 C24 24 26 18 24 10 C30 16 32 12 32 6 C36 14 40 18 40 28 C44 26 46 30 44 40 Z" />
                <path d="M80 40 C90 36 98 30 102 20 C96 24 94 18 96 10 C90 16 88 12 88 6 C84 14 80 18 80 28 C76 26 74 30 76 40 Z" />
            </g>

            {/* Ears */}
            <ellipse
                cx="31"
                cy="52"
                rx="9"
                ry="5"
                fill="#7a4a2e"
                transform="rotate(-25 31 52)"
            />
            <ellipse
                cx="89"
                cy="52"
                rx="9"
                ry="5"
                fill="#7a4a2e"
                transform="rotate(25 89 52)"
            />

            {/* Head */}
            <ellipse cx="60" cy="66" rx="28" ry="32" fill="#8b5a3c" />

            {/* Scarf */}
            <path
                d="M34 92 C46 100 74 100 86 92 L88 102 C74 110 46 110 32 102 Z"
                fill="#0ea5e9"
            />
            <path
                d="M36 97 C48 104 72 104 84 97"
                stroke="#fde047"
                strokeWidth="3"
                fill="none"
            />
            <path d="M78 100 L84 116 L74 114 Z" fill="#0284c7" />

            {/* Muzzle */}
            <ellipse cx="60" cy="82" rx="20" ry="14" fill="#b07a55" />
            <ellipse cx="53" cy="80" rx="2.5" ry="3.5" fill="#3b2416" />
            <ellipse cx="67" cy="80" rx="2.5" ry="3.5" fill="#3b2416" />

            {/* Cheeks */}
            <circle cx="40" cy="74" r="4" fill="#f9a8d4" opacity="0.7" />
            <circle cx="80" cy="74" r="4" fill="#f9a8d4" opacity="0.7" />

            {/* Eyes */}
            {mood === 'cheer' ? (
                <g
                    stroke="#1f130b"
                    strokeWidth="3"
                    strokeLinecap="round"
                    fill="none"
                >
                    <path d="M42 60 Q47 53 52 60" />
                    <path d="M68 60 Q73 53 78 60" />
                </g>
            ) : (
                <g>
                    <circle cx="47" cy="60" r="7" fill="white" />
                    <circle cx="73" cy="60" r="7" fill="white" />
                    <circle
                        cx={mood === 'think' ? 49 : 47}
                        cy={mood === 'think' ? 56 : 61}
                        r="3.5"
                        fill="#1f130b"
                    />
                    <circle
                        cx={mood === 'think' ? 75 : 73}
                        cy={mood === 'think' ? 56 : 61}
                        r="3.5"
                        fill="#1f130b"
                    />
                </g>
            )}

            {mood === 'sad' && (
                <g stroke="#3b2416" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M40 50 L52 54" />
                    <path d="M80 50 L68 54" />
                </g>
            )}

            {/* Mouth */}
            {mood === 'sad' ? (
                <path
                    d="M54 92 Q60 88 66 92"
                    stroke="#3b2416"
                    strokeWidth="2.5"
                    fill="none"
                    strokeLinecap="round"
                />
            ) : mood === 'think' ? (
                <path
                    d="M56 91 L64 90"
                    stroke="#3b2416"
                    strokeWidth="2.5"
                    fill="none"
                    strokeLinecap="round"
                />
            ) : (
                <path
                    d="M52 89 Q60 96 68 89"
                    stroke="#3b2416"
                    strokeWidth="2.5"
                    fill="none"
                    strokeLinecap="round"
                />
            )}
        </svg>
    );
}
