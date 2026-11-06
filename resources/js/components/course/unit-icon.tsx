import type { LucideIcon } from 'lucide-react';
import {
    AppWindow,
    Briefcase,
    Building2,
    Cpu,
    Globe,
    GraduationCap,
    Laptop,
    Layers,
    Mail,
    Map,
    Megaphone,
    Music,
    Rocket,
    ShieldCheck,
    Sparkles,
} from 'lucide-react';

const icons: Record<string, LucideIcon> = {
    'graduation-cap': GraduationCap,
    sparkles: Sparkles,
    cpu: Cpu,
    'app-window': AppWindow,
    globe: Globe,
    'shield-check': ShieldCheck,
    layers: Layers,
    rocket: Rocket,
    briefcase: Briefcase,
    megaphone: Megaphone,
    laptop: Laptop,
    mail: Mail,
    map: Map,
    'building-2': Building2,
    music: Music,
};

export default function UnitIcon({
    name,
    className,
}: {
    name: string;
    className?: string;
}) {
    const Icon = icons[name] ?? Sparkles;

    return <Icon className={className} aria-hidden="true" />;
}
