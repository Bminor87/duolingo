import { Volume2, VolumeX } from 'lucide-react';
import { toast } from 'sonner';
import { useSwedishSpeech } from '@/hooks/use-swedish-speech';
import { cn } from '@/lib/utils';

/**
 * Reads a Swedish sentence aloud. When the browser has no Swedish voice, the button explains how to get one.
 */
export default function SpeakButton({
    text,
    className,
}: {
    text: string;
    className?: string;
}) {
    const { state, speak } = useSwedishSpeech();

    if (state === 'unsupported') {
        return null;
    }

    const hasVoice = state === 'ready';
    const Icon = hasVoice ? Volume2 : VolumeX;

    return (
        <button
            type="button"
            onClick={() =>
                hasVoice
                    ? speak(text)
                    : toast.info(
                          'Tässä selaimessa ei ole ruotsinkielistä puheääntä. Kokeile puhelinta tai Edge-selainta, tai lisää ruotsin puheääni laitteen asetuksista.',
                      )
            }
            className={cn(
                'inline-flex size-9 shrink-0 items-center justify-center rounded-full transition-colors active:translate-y-px',
                hasVoice
                    ? 'bg-sky-100 text-sky-700 hover:bg-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:hover:bg-sky-900/60'
                    : 'bg-muted text-muted-foreground',
                className,
            )}
            aria-label="Kuuntele ruotsiksi"
            title="Kuuntele ruotsiksi"
        >
            <Icon className="size-5" aria-hidden="true" />
        </button>
    );
}
