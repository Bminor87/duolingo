import type { Auth } from '@/types/auth';
import type { LearnerHeader } from '@/types/course';

declare module 'react' {
    interface InputHTMLAttributes<T> {
        passwordrules?: string;
    }
}

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            auth: Auth;
            sidebarOpen: boolean;
            learner: LearnerHeader | null;
            [key: string]: unknown;
        };
    }
}
