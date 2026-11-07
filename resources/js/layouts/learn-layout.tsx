import { Link, usePage } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import { BarChart3, BookOpen, Flame, Gauge, Route, Zap } from 'lucide-react';
import type { ReactNode } from 'react';
import Mascot from '@/components/course/mascot';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserMenuContent } from '@/components/user-menu-content';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { useInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';
import { dashboard, statistics, vocabulary } from '@/routes';
import type { LearnerHeader } from '@/types/course';

type NavItem = {
    title: string;
    href: ReturnType<typeof dashboard>;
    icon: LucideIcon;
};

const navItems: NavItem[] = [
    { title: 'Polku', href: dashboard(), icon: Route },
    { title: 'Sanasto', href: vocabulary(), icon: BookOpen },
    { title: 'Tilastot', href: statistics(), icon: BarChart3 },
];

/**
 * Mobile-first app shell: a slim status bar on top and tab navigation at the bottom.
 */
export default function LearnLayout({ children }: { children: ReactNode }) {
    const { auth, learner } = usePage<{ learner: LearnerHeader | null }>()
        .props;
    const { isCurrentOrParentUrl } = useCurrentUrl();
    const getInitials = useInitials();

    return (
        <div className="min-h-dvh bg-background">
            <header className="sticky top-0 z-30 border-b-2 bg-background/95 backdrop-blur">
                <div className="mx-auto flex h-14 w-full max-w-2xl items-center gap-2 px-4">
                    <Link
                        href={dashboard()}
                        className="flex items-center gap-1.5 font-extrabold tracking-tight"
                    >
                        <Mascot className="size-9" />
                        <span className="hidden sm:inline">Jobbsvenska</span>
                    </Link>

                    {learner && (
                        <div className="ml-auto flex items-center gap-3 text-sm font-extrabold">
                            <span
                                className="flex items-center gap-1 text-orange-500"
                                title="Päivien putki"
                            >
                                <Flame className="size-5" />
                                {learner.streak}
                            </span>
                            <span
                                className="flex items-center gap-1 text-amber-500"
                                title="XP tänään / päivän tavoite"
                            >
                                <Zap className="size-5" />
                                {learner.todayXp}/{learner.dailyGoal}
                            </span>
                            <span
                                className="flex items-center gap-1 text-violet-500"
                                title="Kurssin edistyminen"
                            >
                                <Gauge className="size-5" />
                                {learner.mastery}%
                            </span>
                        </div>
                    )}

                    <DropdownMenu>
                        <DropdownMenuTrigger
                            className={cn(
                                'flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold',
                                !learner && 'ml-auto',
                            )}
                            aria-label="Käyttäjävalikko"
                        >
                            {getInitials(auth.user.username)}
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <UserMenuContent user={auth.user} />
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </header>

            <main className="mx-auto w-full max-w-2xl px-4 pt-4 pb-28">
                {children}
            </main>

            <nav
                className="fixed inset-x-0 bottom-0 z-30 border-t-2 bg-background pb-[env(safe-area-inset-bottom)]"
                aria-label="Päävalikko"
            >
                <div className="mx-auto grid max-w-2xl grid-cols-3">
                    {navItems.map((item) => {
                        const active = isCurrentOrParentUrl(item.href);

                        return (
                            <Link
                                key={item.title}
                                href={item.href}
                                prefetch
                                className={cn(
                                    'flex flex-col items-center gap-0.5 py-2.5 text-xs font-bold text-muted-foreground',
                                    active && 'text-sky-600 dark:text-sky-400',
                                )}
                            >
                                <span
                                    className={cn(
                                        'rounded-xl border-2 border-transparent p-1',
                                        active &&
                                            'border-sky-300 bg-sky-50 dark:border-sky-800 dark:bg-sky-950/50',
                                    )}
                                >
                                    <item.icon className="size-6" />
                                </span>
                                {item.title}
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
}
