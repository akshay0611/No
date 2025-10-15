/**
 * Voice Notification Service
 * Uses Web Speech API to speak notifications out loud
 */

class VoiceNotificationService {
    private synthesis: SpeechSynthesis | null = null;
    private isEnabled: boolean = false;
    private voice: SpeechSynthesisVoice | null = null;
    private volume: number = 1.0;
    private rate: number = 1.0;
    private pitch: number = 1.0;

    constructor() {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            this.synthesis = window.speechSynthesis;
            this.loadSettings();
            this.loadVoices();
            this.setupSpeechUnlock();
        } else {
            console.warn('Speech Synthesis API not supported in this browser');
        }
    }

    /**
     * Setup speech unlock on first user interaction
     * Required by browsers to prevent auto-playing audio
     */
    private setupSpeechUnlock() {
        const unlockSpeech = () => {
            if (!this.synthesis) return;
            
            // Speak an empty utterance to unlock the API
            const utterance = new SpeechSynthesisUtterance('');
            utterance.volume = 0;
            this.synthesis.speak(utterance);
            
            console.log('🔓 Speech synthesis unlocked on user interaction');
            
            // Remove listeners after first interaction
            document.removeEventListener('click', unlockSpeech);
            document.removeEventListener('touchstart', unlockSpeech);
            document.removeEventListener('keydown', unlockSpeech);
        };
        
        // Listen for any user interaction
        document.addEventListener('click', unlockSpeech, { once: true });
        document.addEventListener('touchstart', unlockSpeech, { once: true });
        document.addEventListener('keydown', unlockSpeech, { once: true });
    }

    /**
     * Load voices when they become available
     */
    private loadVoices() {
        if (!this.synthesis) return;

        const loadVoiceList = () => {
            const voices = this.synthesis!.getVoices();

            // Try to find a good English voice
            const preferredVoice = voices.find(v =>
                v.lang.startsWith('en') && v.name.includes('Google')
            ) || voices.find(v =>
                v.lang.startsWith('en')
            ) || voices[0];

            if (preferredVoice) {
                this.voice = preferredVoice;
                console.log('Voice loaded:', preferredVoice.name);
            }
        };

        // Load voices immediately if available
        loadVoiceList();

        // Also listen for voiceschanged event (some browsers need this)
        if (this.synthesis.onvoiceschanged !== undefined) {
            this.synthesis.onvoiceschanged = loadVoiceList;
        }
    }

    /**
     * Load settings from localStorage
     */
    private loadSettings() {
        try {
            const settings = localStorage.getItem('voice_notification_settings');
            if (settings) {
                const parsed = JSON.parse(settings);
                this.isEnabled = parsed.enabled ?? false;
                this.volume = parsed.volume ?? 1.0;
                this.rate = parsed.rate ?? 1.0;
                this.pitch = parsed.pitch ?? 1.0;
            }
        } catch (error) {
            console.error('Failed to load voice settings:', error);
        }
    }

    /**
     * Save settings to localStorage
     */
    private saveSettings() {
        try {
            const settings = {
                enabled: this.isEnabled,
                volume: this.volume,
                rate: this.rate,
                pitch: this.pitch,
            };
            localStorage.setItem('voice_notification_settings', JSON.stringify(settings));
        } catch (error) {
            console.error('Failed to save voice settings:', error);
        }
    }

    /**
     * Enable voice notifications
     */
    enable() {
        this.isEnabled = true;
        this.saveSettings();
        console.log('Voice notifications enabled');
    }

    /**
     * Disable voice notifications
     */
    disable() {
        this.isEnabled = false;
        this.saveSettings();
        console.log('Voice notifications disabled');
    }

    /**
     * Check if voice notifications are enabled
     */
    isVoiceEnabled(): boolean {
        return this.isEnabled && this.synthesis !== null;
    }

    /**
     * Set volume (0.0 to 1.0)
     */
    setVolume(volume: number) {
        this.volume = Math.max(0, Math.min(1, volume));
        this.saveSettings();
    }

    /**
     * Set speech rate (0.1 to 10)
     */
    setRate(rate: number) {
        this.rate = Math.max(0.1, Math.min(10, rate));
        this.saveSettings();
    }

    /**
     * Set pitch (0 to 2)
     */
    setPitch(pitch: number) {
        this.pitch = Math.max(0, Math.min(2, pitch));
        this.saveSettings();
    }

    /**
     * Get available voices
     */
    getAvailableVoices(): SpeechSynthesisVoice[] {
        if (!this.synthesis) return [];
        return this.synthesis.getVoices();
    }

    /**
     * Set voice by name
     */
    setVoice(voiceName: string) {
        const voices = this.getAvailableVoices();
        const selectedVoice = voices.find(v => v.name === voiceName);
        if (selectedVoice) {
            this.voice = selectedVoice;
            console.log('Voice changed to:', voiceName);
        }
    }

    /**
     * Speak a message
     */
    speak(text: string, options?: {
        onStart?: () => void;
        onEnd?: () => void;
        onError?: (error: any) => void;
    }) {
        if (!this.synthesis) {
            console.warn('Speech synthesis not available');
            options?.onError?.(new Error('Speech synthesis not available'));
            return;
        }

        if (!this.isEnabled) {
            console.log('Voice notifications disabled, skipping:', text);
            return;
        }

        // Cancel any ongoing speech
        this.synthesis.cancel();

        // Create utterance
        const utterance = new SpeechSynthesisUtterance(text);

        // Set properties
        utterance.volume = this.volume;
        utterance.rate = this.rate;
        utterance.pitch = this.pitch;

        if (this.voice) {
            utterance.voice = this.voice;
        }

        // Set callbacks
        utterance.onstart = () => {
            console.log('Speaking:', text);
            options?.onStart?.();
        };

        utterance.onend = () => {
            console.log('Finished speaking');
            options?.onEnd?.();
        };

        utterance.onerror = (event) => {
            console.error('Speech error:', event);
            options?.onError?.(event);
        };

        // Speak
        this.synthesis.speak(utterance);
    }

    /**
     * Stop current speech
     */
    stop() {
        if (this.synthesis) {
            this.synthesis.cancel();
        }
    }

    /**
     * Speak queue join notification
     */
    speakQueueJoin(customerName: string, serviceName?: string) {
        let message = `Hello admin, ${customerName} has joined the queue`;
        if (serviceName) {
            message += ` for ${serviceName}`;
        }
        this.speak(message);
    }

    /**
     * Speak customer arrival notification
     */
    speakCustomerArrival(customerName: string, verificationStatus?: string) {
        let message = `${customerName} has arrived at the salon`;
        if (verificationStatus === 'pending verification') {
            message += ', verification needed';
        }
        this.speak(message);
    }

    /**
     * Speak check-in verification needed
     */
    speakVerificationNeeded(customerName: string) {
        this.speak(`${customerName} needs arrival verification`);
    }

    /**
     * Speak general notification
     */
    speakNotification(message: string) {
        this.speak(message);
    }

    /**
     * Test voice with sample message
     */
    testVoice() {
        this.speak('Hello admin, this is a test notification. Voice notifications are working correctly.');
    }
}

// Export singleton instance
export const voiceNotificationService = new VoiceNotificationService();
export default voiceNotificationService;
