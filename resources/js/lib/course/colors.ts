import type { UnitColor } from '@/types/course';

export type UnitColorClasses = {
    /** Solid background for buttons and lesson nodes. */
    solid: string;
    /** Darker bottom edge that gives buttons their pressable look. */
    edge: string;
    /** Soft tinted background for cards and banners. */
    soft: string;
    /** Accent text colour. */
    text: string;
    /** Progress bar fill. */
    bar: string;
    /** Focus and selection ring. */
    ring: string;
};

/**
 * Full class names per unit colour. They are written out so Tailwind can find them.
 */
export const unitColors: Record<UnitColor, UnitColorClasses> = {
    emerald: {
        solid: 'bg-emerald-500 text-white',
        edge: 'border-emerald-700',
        soft: 'bg-emerald-50 dark:bg-emerald-950/40',
        text: 'text-emerald-700 dark:text-emerald-300',
        bar: 'bg-emerald-500',
        ring: 'ring-emerald-400',
    },
    sky: {
        solid: 'bg-sky-500 text-white',
        edge: 'border-sky-700',
        soft: 'bg-sky-50 dark:bg-sky-950/40',
        text: 'text-sky-700 dark:text-sky-300',
        bar: 'bg-sky-500',
        ring: 'ring-sky-400',
    },
    violet: {
        solid: 'bg-violet-500 text-white',
        edge: 'border-violet-700',
        soft: 'bg-violet-50 dark:bg-violet-950/40',
        text: 'text-violet-700 dark:text-violet-300',
        bar: 'bg-violet-500',
        ring: 'ring-violet-400',
    },
    amber: {
        solid: 'bg-amber-500 text-white',
        edge: 'border-amber-700',
        soft: 'bg-amber-50 dark:bg-amber-950/40',
        text: 'text-amber-700 dark:text-amber-300',
        bar: 'bg-amber-500',
        ring: 'ring-amber-400',
    },
    rose: {
        solid: 'bg-rose-500 text-white',
        edge: 'border-rose-700',
        soft: 'bg-rose-50 dark:bg-rose-950/40',
        text: 'text-rose-700 dark:text-rose-300',
        bar: 'bg-rose-500',
        ring: 'ring-rose-400',
    },
    teal: {
        solid: 'bg-teal-500 text-white',
        edge: 'border-teal-700',
        soft: 'bg-teal-50 dark:bg-teal-950/40',
        text: 'text-teal-700 dark:text-teal-300',
        bar: 'bg-teal-500',
        ring: 'ring-teal-400',
    },
    indigo: {
        solid: 'bg-indigo-500 text-white',
        edge: 'border-indigo-700',
        soft: 'bg-indigo-50 dark:bg-indigo-950/40',
        text: 'text-indigo-700 dark:text-indigo-300',
        bar: 'bg-indigo-500',
        ring: 'ring-indigo-400',
    },
    orange: {
        solid: 'bg-orange-500 text-white',
        edge: 'border-orange-700',
        soft: 'bg-orange-50 dark:bg-orange-950/40',
        text: 'text-orange-700 dark:text-orange-300',
        bar: 'bg-orange-500',
        ring: 'ring-orange-400',
    },
    lime: {
        solid: 'bg-lime-500 text-white',
        edge: 'border-lime-700',
        soft: 'bg-lime-50 dark:bg-lime-950/40',
        text: 'text-lime-700 dark:text-lime-300',
        bar: 'bg-lime-500',
        ring: 'ring-lime-400',
    },
    cyan: {
        solid: 'bg-cyan-500 text-white',
        edge: 'border-cyan-700',
        soft: 'bg-cyan-50 dark:bg-cyan-950/40',
        text: 'text-cyan-700 dark:text-cyan-300',
        bar: 'bg-cyan-500',
        ring: 'ring-cyan-400',
    },
    fuchsia: {
        solid: 'bg-fuchsia-500 text-white',
        edge: 'border-fuchsia-700',
        soft: 'bg-fuchsia-50 dark:bg-fuchsia-950/40',
        text: 'text-fuchsia-700 dark:text-fuchsia-300',
        bar: 'bg-fuchsia-500',
        ring: 'ring-fuchsia-400',
    },
    blue: {
        solid: 'bg-blue-500 text-white',
        edge: 'border-blue-700',
        soft: 'bg-blue-50 dark:bg-blue-950/40',
        text: 'text-blue-700 dark:text-blue-300',
        bar: 'bg-blue-500',
        ring: 'ring-blue-400',
    },
    pink: {
        solid: 'bg-pink-500 text-white',
        edge: 'border-pink-700',
        soft: 'bg-pink-50 dark:bg-pink-950/40',
        text: 'text-pink-700 dark:text-pink-300',
        bar: 'bg-pink-500',
        ring: 'ring-pink-400',
    },
    green: {
        solid: 'bg-green-500 text-white',
        edge: 'border-green-700',
        soft: 'bg-green-50 dark:bg-green-950/40',
        text: 'text-green-700 dark:text-green-300',
        bar: 'bg-green-500',
        ring: 'ring-green-400',
    },
    red: {
        solid: 'bg-red-500 text-white',
        edge: 'border-red-700',
        soft: 'bg-red-50 dark:bg-red-950/40',
        text: 'text-red-700 dark:text-red-300',
        bar: 'bg-red-500',
        ring: 'ring-red-400',
    },
    purple: {
        solid: 'bg-purple-500 text-white',
        edge: 'border-purple-700',
        soft: 'bg-purple-50 dark:bg-purple-950/40',
        text: 'text-purple-700 dark:text-purple-300',
        bar: 'bg-purple-500',
        ring: 'ring-purple-400',
    },
};

export function colorClasses(color: string): UnitColorClasses {
    return unitColors[color as UnitColor] ?? unitColors.emerald;
}
