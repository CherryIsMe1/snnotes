/**
 * CYBERDECK // CHRONO ALARM & REMINDER MATRIX
 * Accurate timer engine, notification dispatch, snooze protocols, and countdown calculation.
 */
class CyberAlarmManager {
    constructor() {
        this.activeAlarmNote = null;
        this.onAlarmTriggered = null;
        this.onAlarmDismissed = null;
        this.onTick = null;
        this.tickerId = null;
        this.requestNotificationPermission();
        this.startTicker();
    }

    async requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            try {
                await Notification.requestPermission();
            } catch (_) {}
        }
    }

    startTicker() {
        if (this.tickerId) clearInterval(this.tickerId);
        this.tickerId = setInterval(() => this.checkAlarms(), 1000);
    }

    checkAlarms() {
        const now = Date.now();
        if (!window.NotesManager) return;

        const notes = window.NotesManager.getAllNotes();
        let nearestDiff = Infinity;
        let nearestNote = null;

        for (const note of notes) {
            if (!note.alarm || !note.alarm.enabled || !note.alarm.timestamp) continue;

            const target = Number(note.alarm.timestamp);
            const diff = target - now;

            // Trigger if due (within a 5-second window and not yet triggered)
            if (diff <= 1000 && !note.alarm.triggered) {
                this.triggerAlarm(note);
            } else if (diff > 0 && diff < nearestDiff) {
                nearestDiff = diff;
                nearestNote = note;
            }
        }

        if (this.onTick) {
            this.onTick(nearestNote, nearestDiff === Infinity ? null : nearestDiff);
        }
    }

    triggerAlarm(note) {
        // Mark as triggered so it doesn't fire again immediately
        note.alarm.triggered = true;
        window.NotesManager.updateNote(note.id, { alarm: note.alarm }, false);

        this.activeAlarmNote = note;

        // Start siren sound loop
        const soundType = (note.alarm && note.alarm.sound) || 'siren';
        if (window.CyberSound) {
            window.CyberSound.startAlarm(soundType);
        }

        // Native Tauri notification or Web Notification API
        this.dispatchNotification(note);

        // Bring Tauri window to focus if supported
        if (window.__TAURI__ && window.__TAURI__.core) {
            window.__TAURI__.core.invoke('trigger_system_alarm', {
                title: note.title || 'REMINDER ALERT',
                message: note.alarm.label || note.content || 'A scheduled reminder is due.'
            }).catch(() => {});
        }

        if (this.onAlarmTriggered) {
            this.onAlarmTriggered(note);
        }
    }

    dispatchNotification(note) {
        const title = `⚠️ [CYBER ALARM] ${note.title || 'SCHEDULED PROTOCOL'}`;
        const body = note.alarm.label || note.content?.slice(0, 100) || 'Time is up!';

        if ('Notification' in window && Notification.permission === 'granted') {
            try {
                new Notification(title, {
                    body: body,
                    icon: 'src-tauri/icons/icon.png',
                    requireInteraction: true
                });
            } catch (_) {}
        }
    }

    dismissAlarm() {
        if (window.CyberSound) {
            window.CyberSound.stopAlarm();
        }

        if (this.activeAlarmNote) {
            const note = this.activeAlarmNote;

            // Handle recurring alarm
            if (note.alarm && note.alarm.repeat && note.alarm.repeat !== 'none') {
                const nextTime = this.calculateNextRecurrence(note.alarm.timestamp, note.alarm.repeat);
                note.alarm.timestamp = nextTime;
                note.alarm.triggered = false;
                window.NotesManager.updateNote(note.id, { alarm: note.alarm });
            }

            this.activeAlarmNote = null;
        }

        if (this.onAlarmDismissed) {
            this.onAlarmDismissed();
        }
    }

    snoozeAlarm(minutes = 5) {
        if (!this.activeAlarmNote) return;

        if (window.CyberSound) {
            window.CyberSound.stopAlarm();
        }

        const note = this.activeAlarmNote;
        const newTimestamp = Date.now() + minutes * 60 * 1000;

        note.alarm.timestamp = newTimestamp;
        note.alarm.triggered = false;
        window.NotesManager.updateNote(note.id, { alarm: note.alarm });

        this.activeAlarmNote = null;

        if (this.onAlarmDismissed) {
            this.onAlarmDismissed();
        }
    }

    calculateNextRecurrence(timestamp, repeat) {
        const date = new Date(timestamp);
        if (repeat === 'daily') {
            date.setDate(date.getDate() + 1);
        } else if (repeat === 'workdays') {
            do {
                date.setDate(date.getDate() + 1);
            } while (date.getDay() === 0 || date.getDay() === 6);
        } else if (repeat === 'weekly') {
            date.setDate(date.getDate() + 7);
        }
        return date.getTime();
    }

    formatTimeRemaining(diffMs) {
        if (diffMs === null || isNaN(diffMs) || diffMs <= 0) return '--:--:--';
        const totalSeconds = Math.floor(diffMs / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        if (hours > 0) {
            return `${hours}h ${minutes}m ${seconds}s`;
        }
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
}

window.CyberAlarm = new CyberAlarmManager();
