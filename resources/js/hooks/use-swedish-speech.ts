import { useCallback, useSyncExternalStore } from 'react';

/**
 * Slightly slower than normal speech, so a beginner can hear every syllable.
 */
const SPEECH_RATE = 0.85;

export type SpeechState = 'unsupported' | 'no-swedish-voice' | 'ready';

function synthesis(): SpeechSynthesis | null {
    return typeof window !== 'undefined' && 'speechSynthesis' in window
        ? window.speechSynthesis
        : null;
}

/**
 * Pick a Swedish voice, preferring a Finland-Swedish one when the device has it.
 */
function swedishVoice(): SpeechSynthesisVoice | null {
    const voices = (synthesis()?.getVoices() ?? []).filter((voice) =>
        voice.lang.toLowerCase().startsWith('sv'),
    );

    return (
        voices.find((voice) => voice.lang.toLowerCase().endsWith('fi')) ??
        voices[0] ??
        null
    );
}

function subscribe(onChange: () => void): () => void {
    const speech = synthesis();

    speech?.addEventListener('voiceschanged', onChange);

    return () => speech?.removeEventListener('voiceschanged', onChange);
}

function speechState(): SpeechState {
    const speech = synthesis();

    if (!speech) {
        return 'unsupported';
    }

    // Some browsers load their voices late or never list them; the language tag alone still works there.
    return speech.getVoices().length > 0 && !swedishVoice()
        ? 'no-swedish-voice'
        : 'ready';
}

/**
 * Reads Swedish text aloud with the browser's own speech synthesis.
 */
export function useSwedishSpeech(): {
    state: SpeechState;
    speak: (text: string) => void;
} {
    const state = useSyncExternalStore(
        subscribe,
        speechState,
        (): SpeechState => 'unsupported',
    );

    const speak = useCallback((text: string) => {
        const speech = synthesis();

        if (!speech) {
            return;
        }

        const utterance = new SpeechSynthesisUtterance(text);
        const voice = swedishVoice();

        utterance.lang = voice?.lang ?? 'sv-SE';
        utterance.voice = voice;
        utterance.rate = SPEECH_RATE;

        speech.cancel();
        speech.speak(utterance);
    }, []);

    return { state, speak };
}
