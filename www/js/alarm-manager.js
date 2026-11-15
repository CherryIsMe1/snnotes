/**
 * SNNOTES // ALARM & REMINDER MANAGER
 * Timer engine, notification dispatch, snooze controls, and ticker calculations.
 */
class AlarmManager {
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
        if (!window.notesManager) return;

        const notes = window.notesManager.getAllNotes();
        let nearestDiff = Infinity;
        let nearestNote = null;

        for (const note of notes) {
            if (!note.alarm || !note.alarm.enabled || !note.alarm.timestamp) continue;

            const target = Number(note.alarm.timestamp);
            const diff = target - now;

            // Trigger if due (within 1 second window and not yet triggered)
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
        note.alarm.triggered = true;
        window.notesManager.updateNote(note.id, { alarm: note.alarm });

        this.activeAlarmNote = note;

        // Play alarm sound
        const soundType = (note.alarm && note.alarm.sound) || 'siren';
        if (window.soundEngine) {
            window.soundEngine.startAlarm(soundType);
        }

        // Native Tauri notification or Web Notification API
        this.dispatchNotification(note);

        if (window.__TAURI__ && window.__TAURI__.core) {
            window.__TAURI__.core.invoke('trigger_system_alarm', {
                title: note.title || 'ALARM ALERT',
                message: note.alarm.label || note.content || 'A scheduled reminder is due.'
            }).catch(() => {});
        }

        if (this.onAlarmTriggered) {
            this.onAlarmTriggered(note);
        }
    }

    dispatchNotification(note) {
        const title = `ALARM: ${note.title || 'REMINDER'}`;
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

    snooze(minutes = 5) {
        if (!this.activeAlarmNote) return;

        const note = this.activeAlarmNote;
        if (window.soundEngine) {
            window.soundEngine.stopAlarm();
        }

        const newTarget = Date.now() + minutes * 60 * 1000;
        const updatedAlarm = {
            ...note.alarm,
            enabled: true,
            timestamp: newTarget,
            triggered: false
        };

        window.notesManager.updateNote(note.id, { alarm: updatedAlarm });
        this.activeAlarmNote = null;

        if (this.onAlarmDismissed) {
            this.onAlarmDismissed(note);
        }
    }

    dismiss() {
        if (!this.activeAlarmNote) return;

        const note = this.activeAlarmNote;
        if (window.soundEngine) {
            window.soundEngine.stopAlarm();
        }

        const repeat = note.alarm?.repeat || 'none';
        let updatedAlarm = null;

        if (repeat === 'daily') {
            updatedAlarm = {
                ...note.alarm,
                timestamp: Number(note.alarm.timestamp) + 24 * 60 * 60 * 1000,
                triggered: false
            };
        } else if (repeat === 'weekly') {
            updatedAlarm = {
                ...note.alarm,
                timestamp: Number(note.alarm.timestamp) + 7 * 24 * 60 * 60 * 1000,
                triggered: false
            };
        } else {
            // Non-repeating alarm disabled after dismissal
            updatedAlarm = {
                ...note.alarm,
                enabled: false,
                triggered: true
            };
        }

        window.notesManager.updateNote(note.id, { alarm: updatedAlarm });
        this.activeAlarmNote = null;

        if (this.onAlarmDismissed) {
            this.onAlarmDismissed(note);
        }
    }

    formatTimeRemaining(diffMs) {
        if (diffMs === null || diffMs < 0) return 'NO ACTIVE ALARMS';

        const totalSec = Math.floor(diffMs / 1000);
        const hours = Math.floor(totalSec / 3600);
        const mins = Math.floor((totalSec % 3600) / 60);
        const secs = totalSec % 60;

        if (hours > 0) {
            return `NEXT ALARM IN: ${hours}h ${mins.toString().padStart(2, '0')}m`;
        }
        return `NEXT ALARM IN: ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
    }
}

window.alarmManager = new AlarmManager();
