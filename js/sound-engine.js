/**
 * CYBERDECK // NEURAL SOUND SYNTHESIZER
 * Synthesizes 100% of interface SFX and loud cyber alarm sirens using Web Audio API.
 * No external media files required.
 */
class CyberSoundSynthesizer {
    constructor() {
        this.ctx = null;
        this.enabled = true;
        this.alarmInterval = null;
        this.activeAlarmType = null;
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

    toggle(force) {
        this.enabled = force !== undefined ? force : !this.enabled;
        return this.enabled;
    }

    // Quick mechanical switch click
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

    // Terminal keystroke blip
    playKey() {
        if (!this.enabled) return;
        this.init();
        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(800 + Math.random() * 200, now);

            gain.gain.setValueAtTime(0.03, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.02);
        } catch (_) {}
    }

    // Success chord (mission accomplished / saved)
    playSuccess() {
        if (!this.enabled) return;
        this.init();
        try {
            const now = this.ctx.currentTime;
            const freqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
            freqs.forEach((freq, idx) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                const startTime = now + idx * 0.06;

                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(freq, startTime);

                gain.gain.setValueAtTime(0.06, startTime);
                gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);

                osc.connect(gain);
                gain.connect(this.ctx.destination);

                osc.start(startTime);
                osc.stop(startTime + 0.25);
            });
        } catch (_) {}
    }

    // Checkbox complete sound (sharp cyber ping)
    playCheck() {
        if (!this.enabled) return;
        this.init();
        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(987.77, now); // B5
            osc.frequency.exponentialRampToValueAtTime(1318.51, now + 0.09); // E6

            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.12);
        } catch (_) {}
    }

    // Error / Buzzer
    playBuzzer() {
        if (!this.enabled) return;
        this.init();
        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(160, now);
            osc.frequency.setValueAtTime(130, now + 0.1);

            gain.gain.setValueAtTime(0.12, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.28);
        } catch (_) {}
    }

    // Start continuous, impossible-to-miss Cyberpunk Alarm sound
    startAlarm(type = 'siren') {
        this.init();
        this.stopAlarm();
        this.activeAlarmType = type;

        const pulseOnce = () => {
            if (!this.ctx) return;
            const now = this.ctx.currentTime;

            if (type === 'pulse') {
                // Tactical rapid pulse: 3 high beeps
                for (let i = 0; i < 3; i++) {
                    const t = now + i * 0.12;
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();

                    osc.type = 'square';
                    osc.frequency.setValueAtTime(1760, t); // A6

                    gain.gain.setValueAtTime(0.18, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

                    osc.connect(gain);
                    gain.connect(this.ctx.destination);

                    osc.start(t);
                    osc.stop(t + 0.08);
                }
            } else if (type === 'ping') {
                // High-tech sonar ping
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'sine';
                osc.frequency.setValueAtTime(2400, now);
                osc.frequency.exponentialRampToValueAtTime(1200, now + 0.35);

                gain.gain.setValueAtTime(0.25, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

                osc.connect(gain);
                gain.connect(this.ctx.destination);

                osc.start(now);
                osc.stop(now + 0.45);
            } else if (type === 'cyber') {
                // Pitch sweep alarm
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(400, now);
                osc.frequency.linearRampToValueAtTime(1100, now + 0.28);

                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

                osc.connect(gain);
                gain.connect(this.ctx.destination);

                osc.start(now);
                osc.stop(now + 0.35);
            } else {
                // Classic Cyber Siren / Klaxon (two-tone wail)
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(750, now);
                osc.frequency.linearRampToValueAtTime(1250, now + 0.22);
                osc.frequency.linearRampToValueAtTime(750, now + 0.44);

                gain.gain.setValueAtTime(0.22, now);
                gain.gain.exponentialRampToValueAtTime(0.05, now + 0.44);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.48);

                osc.connect(gain);
                gain.connect(this.ctx.destination);

                osc.start(now);
                osc.stop(now + 0.48);
            }
        };

        pulseOnce();
        this.alarmInterval = setInterval(pulseOnce, type === 'pulse' ? 900 : (type === 'ping' ? 800 : 700));
    }

    stopAlarm() {
        if (this.alarmInterval) {
            clearInterval(this.alarmInterval);
            this.alarmInterval = null;
        }
        this.activeAlarmType = null;
    }

    isAlarmActive() {
        return this.alarmInterval !== null;
    }
}

window.CyberSound = new CyberSoundSynthesizer();
