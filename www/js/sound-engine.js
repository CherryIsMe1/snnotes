/**
 * SNNOTES // SOUND ENGINE
 * Real-time Web Audio API synthesizer for UI feedback, keystroke typing audio, and alarm alerts.
 * Supports custom keystroke audio file loading (.mp3, .wav) with local storage persistence.
 */
class CyberSoundSynthesizer {
    constructor() {
        this.ctx = null;
        this.enabled = true;
        this.typingEnabled = true;
        this.typingProfile = 'mechanical'; // 'mechanical', 'terminal', 'typewriter', 'bubble', 'custom'
        this.typingVolume = 0.6;
        this.customAudioBuffer = null;
        this.customAudioName = '';
        this.alarmInterval = null;
        this.activeAlarmType = null;
        this.lastTypeTime = 0;

        this.loadSettings();
    }

    init() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioCtx({ latencyHint: 'interactive' });
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    loadSettings() {
        try {
            const savedTyping = localStorage.getItem('snnotes_typing_sfx');
            if (savedTyping !== null) this.typingEnabled = savedTyping === 'true';

            const savedProfile = localStorage.getItem('snnotes_typing_profile');
            if (savedProfile) this.typingProfile = savedProfile;

            const savedVol = localStorage.getItem('snnotes_typing_volume');
            if (savedVol !== null) this.typingVolume = parseFloat(savedVol);

            const savedSfx = localStorage.getItem('snnotes_sfx_enabled');
            if (savedSfx !== null) this.enabled = savedSfx === 'true';

            const customData = localStorage.getItem('snnotes_custom_typing_b64');
            const customName = localStorage.getItem('snnotes_custom_typing_name');
            if (customData) {
                this.customAudioName = customName || 'custom.wav';
                this.decodeBase64Audio(customData);
            }
        } catch (_) {}
    }

    saveSettings() {
        try {
            localStorage.setItem('snnotes_typing_sfx', String(this.typingEnabled));
            localStorage.setItem('snnotes_typing_profile', this.typingProfile);
            localStorage.setItem('snnotes_typing_volume', String(this.typingVolume));
            localStorage.setItem('snnotes_sfx_enabled', String(this.enabled));
        } catch (_) {}
    }

    toggleSFX(force) {
        this.enabled = force !== undefined ? force : !this.enabled;
        this.saveSettings();
        return this.enabled;
    }

    toggleTypingSFX(force) {
        this.typingEnabled = force !== undefined ? force : !this.typingEnabled;
        this.saveSettings();
        return this.typingEnabled;
    }

    setTypingProfile(profile) {
        this.typingProfile = profile;
        this.saveSettings();
        this.playTypingSound(); // preview immediately
    }

    setTypingVolume(vol) {
        this.typingVolume = Math.max(0, Math.min(1, vol));
        this.saveSettings();
    }

    async loadCustomAudioFile(file) {
        this.init();
        try {
            const arrayBuffer = await file.arrayBuffer();
            const decodedBuffer = await this.ctx.decodeAudioData(arrayBuffer);
            this.customAudioBuffer = decodedBuffer;
            this.customAudioName = file.name;
            this.typingProfile = 'custom';

            // Convert to base64 if under 2.5MB to persist in localStorage
            if (file.size < 2.5 * 1024 * 1024) {
                const reader = new FileReader();
                reader.onload = () => {
                    try {
                        localStorage.setItem('snnotes_custom_typing_b64', reader.result);
                        localStorage.setItem('snnotes_custom_typing_name', file.name);
                    } catch (_) {}
                };
                reader.readAsDataURL(file);
            }

            this.saveSettings();
            this.playTypingSound();
            return { success: true, name: file.name };
        } catch (err) {
            console.error("Failed to decode custom audio:", err);
            return { success: false, error: err.message };
        }
    }

    async decodeBase64Audio(dataUrl) {
        try {
            this.init();
            const res = await fetch(dataUrl);
            const arrayBuffer = await res.arrayBuffer();
            this.customAudioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
        } catch (e) {
            console.warn("Could not decode cached custom audio:", e);
        }
    }

    // Keystroke sound synthesizer
    playTypingSound() {
        if (!this.typingEnabled) return;
        const now = performance.now();
        if (now - this.lastTypeTime < 18) return; // Prevent audio overload on key repeat
        this.lastTypeTime = now;

        this.init();
        const time = this.ctx.currentTime;
        const vol = this.typingVolume;

        try {
            if (this.typingProfile === 'custom' && this.customAudioBuffer) {
                const source = this.ctx.createBufferSource();
                const gain = this.ctx.createGain();
                source.buffer = this.customAudioBuffer;
                // Add slight playback rate variance (0.96 to 1.04) for realistic keystrokes
                source.playbackRate.value = 0.96 + Math.random() * 0.08;
                gain.gain.value = vol;
                source.connect(gain);
                gain.connect(this.ctx.destination);
                source.start(time);
                return;
            }

            if (this.typingProfile === 'terminal') {
                // High-tech terminal bleep
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                const baseFreq = 950 + Math.random() * 250;
                osc.frequency.setValueAtTime(baseFreq, time);
                gain.gain.setValueAtTime(0.04 * vol, time);
                gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.025);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(time);
                osc.stop(time + 0.025);
            } else if (this.typingProfile === 'typewriter') {
                // Heavier mechanical typewriter strike
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'triangle';
                const f = 280 + Math.random() * 80;
                osc.frequency.setValueAtTime(f, time);
                osc.frequency.exponentialRampToValueAtTime(60, time + 0.04);
                gain.gain.setValueAtTime(0.22 * vol, time);
                gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(time);
                osc.stop(time + 0.04);
            } else if (this.typingProfile === 'bubble') {
                // Soft popping bubble
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                const startF = 380 + Math.random() * 120;
                osc.frequency.setValueAtTime(startF, time);
                osc.frequency.exponentialRampToValueAtTime(startF * 1.6, time + 0.03);
                gain.gain.setValueAtTime(0.12 * vol, time);
                gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(time);
                osc.stop(time + 0.04);
            } else {
                // Default: Mechanical switch tactile click
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'triangle';
                const clickFreq = 1600 + Math.random() * 300;
                osc.frequency.setValueAtTime(clickFreq, time);
                osc.frequency.exponentialRampToValueAtTime(280, time + 0.028);

                gain.gain.setValueAtTime(0.14 * vol, time);
                gain.gain.exponentialRampToValueAtTime(0.001, time + 0.028);

                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(time);
                osc.stop(time + 0.028);
            }
        } catch (_) {}
    }

    // UI Click
    playClick() {
        if (!this.enabled) return;
        this.init();
        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(1400, now);
            osc.frequency.exponentialRampToValueAtTime(350, now + 0.035);
            gain.gain.setValueAtTime(0.09, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.035);
        } catch (_) {}
    }

    // Success chord
    playSuccess() {
        if (!this.enabled) return;
        this.init();
        try {
            const now = this.ctx.currentTime;
            const freqs = [523.25, 659.25, 783.99, 1046.50];
            freqs.forEach((freq, idx) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                const startTime = now + idx * 0.05;
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(freq, startTime);
                gain.gain.setValueAtTime(0.05, startTime);
                gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.22);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(startTime);
                osc.stop(startTime + 0.22);
            });
        } catch (_) {}
    }

    // Checkbox complete sound
    playCheck() {
        if (!this.enabled) return;
        this.init();
        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(987.77, now);
            osc.frequency.exponentialRampToValueAtTime(1318.51, now + 0.09);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.12);
        } catch (_) {}
    }

    // Neutral subtle click (replaces old harsh buzzer)
    playBuzzer() {
        this.playClick();
    }

    // Alarm synthesis
    startAlarm(type = 'siren') {
        this.stopAlarm();
        this.init();
        this.activeAlarmType = type;

        const pulse = () => {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            if (type === 'siren') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(600, now);
                osc.frequency.linearRampToValueAtTime(1100, now + 0.35);
                osc.frequency.linearRampToValueAtTime(600, now + 0.7);
                gain.gain.setValueAtTime(0.25, now);
                gain.gain.setValueAtTime(0.25, now + 0.65);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.7);
            } else if (type === 'pulse') {
                osc.type = 'square';
                osc.frequency.setValueAtTime(880, now);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.setValueAtTime(0.2, now + 0.1);
                gain.gain.setValueAtTime(0.0, now + 0.15);
                gain.gain.setValueAtTime(0.2, now + 0.2);
                gain.gain.setValueAtTime(0.2, now + 0.3);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.35);
            } else {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(1200, now);
                gain.gain.setValueAtTime(0.3, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.45);
            }
        };

        pulse();
        this.alarmInterval = setInterval(pulse, type === 'siren' ? 850 : 600);
    }

    stopAlarm() {
        if (this.alarmInterval) {
            clearInterval(this.alarmInterval);
            this.alarmInterval = null;
        }
        this.activeAlarmType = null;
    }
}

window.soundEngine = new CyberSoundSynthesizer();
