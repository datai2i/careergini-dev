/**
 * Utility for showing browser-native notifications with a soft sound.
 * Falls back gracefully if the Notifications API is unavailable.
 */

let _permissionGranted = false;

/** Request notification permission on first call — call this when the user first enters the resume builder. */
export async function requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') {
        _permissionGranted = true;
        return true;
    }
    if (Notification.permission === 'denied') return false;
    const result = await Notification.requestPermission();
    _permissionGranted = result === 'granted';
    return _permissionGranted;
}

/**
 * Play a soft notification chime using the Web Audio API.
 * No external audio files needed — generated entirely in-browser.
 */
function playSoftChime(): void {
    try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5 - pleasant major chord arpegio

        frequencies.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.type = 'sine';
            osc.frequency.value = freq;

            const startTime = ctx.currentTime + i * 0.12;
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.18, startTime + 0.04);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.45);

            osc.start(startTime);
            osc.stop(startTime + 0.5);
        });
    } catch {
        // AudioContext not available — skip sound gracefully
    }
}

/**
 * Show a browser-native notification with a soft sound.
 * If permission is not granted, this silently does nothing.
 */
export function notifyStep(title: string, body: string): void {
    playSoftChime();

    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    const notification = new Notification(title, {
        body,
        icon: '/favicon.ico',
        silent: true, // we play our own sound above
        badge: '/favicon.ico',
    });

    // Auto-close after 6 seconds
    setTimeout(() => notification.close(), 6000);
}
