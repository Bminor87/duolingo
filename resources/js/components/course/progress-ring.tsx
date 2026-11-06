import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * A circular progress indicator drawn with SVG. Value is 0–100.
 */
export default function ProgressRing({
    value,
    size = 72,
    stroke = 8,
    className,
    trackClassName = 'stroke-muted',
    barClassName = 'stroke-emerald-500',
    children,
}: {
    value: number;
    size?: number;
    stroke?: number;
    className?: string;
    trackClassName?: string;
    barClassName?: string;
    children?: ReactNode;
}) {
    const radius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const clamped = Math.min(Math.max(value, 0), 100);

    return (
        <div
            className={cn(
                'relative inline-flex items-center justify-center',
                className,
            )}
            style={{ width: size, height: size }}
        >
            <svg
                width={size}
                height={size}
                className="-rotate-90"
                aria-hidden="true"
            >
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    strokeWidth={stroke}
                    className={trackClassName}
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    strokeWidth={stroke}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference * (1 - clamped / 100)}
                    className={cn(
                        'transition-[stroke-dashoffset] duration-700',
                        barClassName,
                    )}
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                {children}
            </div>
        </div>
    );
}
