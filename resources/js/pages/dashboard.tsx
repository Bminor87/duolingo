import { Head, usePage } from '@inertiajs/react';
import { dashboard } from '@/routes';
import type { Auth } from '@/types';

type PageProps = {
    auth: Auth;
};

export default function Dashboard() {
    const { auth } = usePage<PageProps>().props;

    return (
        <>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col items-center justify-center gap-2 p-4 text-center">
                <h1 className="text-2xl font-semibold">
                    Welcome, {auth.user.username}!
                </h1>
                <p className="text-muted-foreground">
                    This is a placeholder page. More coming soon.
                </p>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
