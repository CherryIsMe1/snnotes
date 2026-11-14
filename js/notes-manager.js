/**
 * SNNOTES // NOTES & CHECKLIST MANAGER
 * Handles notes storage, interactive checklists, tagging, and priority filtering.
 */
class NotesManager {
    constructor() {
        this.notes = new Map(); // id -> note
        this.tags = new Set(['WORK', 'PROJECT', 'TODO', 'IDEAS', 'PERSONAL']);
        this.activeFilter = {
            category: 'all', // 'all', 'pinned', 'urgent', 'alarm', 'completed'
            tag: null,
            searchQuery: '',
            priority: null
        };
        this.sortBy = 'updated-desc';
        this.selectedNoteId = null;
        this.onNotesChanged = null;
        this.onNoteSelected = null;

        this.loadFromStorage();
    }

    loadFromStorage() {
        try {
            const rawNotes = localStorage.getItem('snnotes_library_v1');
            if (rawNotes) {
                const parsed = JSON.parse(rawNotes);
                parsed.forEach(note => {
                    if (!note.checklist) note.checklist = [];
                    this.notes.set(note.id, note);
                    if (note.tags && Array.isArray(note.tags)) {
                        note.tags.forEach(t => this.tags.add(t.toUpperCase()));
                    }
                });
            } else {
                this.seedInitialNotes();
            }

            const rawTags = localStorage.getItem('snnotes_tags_v1');
            if (rawTags) {
                const parsedTags = JSON.parse(rawTags);
                parsedTags.forEach(t => this.tags.add(t.toUpperCase()));
            }
        } catch (e) {
            console.warn("Storage load error:", e);
        }
    }

    saveToStorage() {
        try {
            const arr = Array.from(this.notes.values());
            localStorage.setItem('snnotes_library_v1', JSON.stringify(arr));
            localStorage.setItem('snnotes_tags_v1', JSON.stringify(Array.from(this.tags)));
        } catch (e) {
            console.warn("Storage save error:", e);
        }
    }

    seedInitialNotes() {
        const sample1 = {
            id: 'note_' + Date.now() + '_1',
            title: 'Welcome to SNNotes',
            content: `SNNotes is your companion note-taking and alarm application.\n\nKey Features:\n- Interactive checklists with live progress tracking\n- Customizable keystroke typing sounds with custom audio upload\n- SNDeck themes (SN, ER, Blossom, Basic) and retro scanline filter\n- Timers, alarms, and quick reminders\n- Full offline storage on Windows`,
            checklist: [
                { id: 'task_1', text: 'Select your favorite theme in the top bar', done: true },
                { id: 'task_2', text: 'Try typing with mechanical or cyber switch sound effects', done: false },
                { id: 'task_3', text: 'Set an alarm reminder for an upcoming task', done: false },
                { id: 'task_4', text: 'Toggle the retro CRT scanline filter (RETRO: ON/OFF)', done: false }
            ],
            tags: ['TODO', 'PROJECT'],
            priority: 'high',
            pinned: true,
            completed: false,
            createdAt: Date.now() - 3600000,
            updatedAt: Date.now() - 1800000,
            alarm: {
                enabled: true,
                timestamp: Date.now() + 30 * 60 * 1000,
                label: 'Task Review',
                sound: 'siren',
                repeat: 'none',
                triggered: false
            }
        };

        const sample2 = {
            id: 'note_' + Date.now() + '_2',
            title: 'Project Roadmap',
            content: `Notes and ideas for the upcoming release:\n- Windows installer packaging with GitHub Actions\n- Smooth animations and keyboard shortcuts (Ctrl+N, Ctrl+S, Ctrl+F)\n- Clean export and backup options`,
            checklist: [
                { id: 'task_2_1', text: 'Verify audio latency on rapid keystrokes', done: true },
                { id: 'task_2_2', text: 'Check checklist progress indicator', done: true },
                { id: 'task_2_3', text: 'Final build verification', done: false }
            ],
            tags: ['WORK', 'IDEAS'],
            priority: 'med',
            pinned: false,
            completed: false,
            createdAt: Date.now() - 7200000,
            updatedAt: Date.now() - 3600000,
            alarm: null
        };

        this.notes.set(sample1.id, sample1);
        this.notes.set(sample2.id, sample2);
        this.saveToStorage();
    }

    getAllNotes() {
        return Array.from(this.notes.values());
    }

    getNote(id) {
        return this.notes.get(id);
    }

    createNote(data = {}) {
        const id = 'note_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
        const newNote = {
            id,
            title: data.title || 'Untitled Note',
            content: data.content || '',
            checklist: data.checklist || [],
            tags: data.tags || ['TODO'],
            priority: data.priority || 'med',
            pinned: !!data.pinned,
            completed: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            alarm: data.alarm || null
        };

        this.notes.set(id, newNote);
        this.saveToStorage();
        if (this.onNotesChanged) this.onNotesChanged();
        return newNote;
    }

    updateNote(id, partial) {
        const note = this.notes.get(id);
        if (!note) return null;

        Object.assign(note, partial, { updatedAt: Date.now() });

        // Update tags collection if note tags changed
        if (partial.tags && Array.isArray(partial.tags)) {
            partial.tags.forEach(t => this.tags.add(t.toUpperCase()));
        }

        this.saveToStorage();
        if (this.onNotesChanged) this.onNotesChanged();
        return note;
    }

    deleteNote(id) {
        if (!this.notes.has(id)) return false;
        this.notes.delete(id);
        this.saveToStorage();

        if (this.selectedNoteId === id) {
            this.selectedNoteId = null;
        }

        if (this.onNotesChanged) this.onNotesChanged();
        return true;
    }

    togglePin(id) {
        const note = this.notes.get(id);
        if (!note) return;
        return this.updateNote(id, { pinned: !note.pinned });
    }

    toggleCompleted(id) {
        const note = this.notes.get(id);
        if (!note) return;
        return this.updateNote(id, { completed: !note.completed });
    }

    // Checklist operations
    addChecklistItem(noteId, text) {
        const note = this.notes.get(noteId);
        if (!note || !text.trim()) return null;
        if (!note.checklist) note.checklist = [];

        const item = {
            id: 'task_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
            text: text.trim(),
            done: false
        };
        note.checklist.push(item);
        this.updateNote(noteId, { checklist: note.checklist });
        return item;
    }

    toggleChecklistItem(noteId, taskId) {
        const note = this.notes.get(noteId);
        if (!note || !note.checklist) return false;

        const item = note.checklist.find(t => t.id === taskId);
        if (!item) return false;

        item.done = !item.done;

        // Auto mark note completed if all tasks are done
        const stats = this.getChecklistStats(note);
        if (stats.total > 0 && stats.completed === stats.total) {
            note.completed = true;
        } else if (stats.completed < stats.total && note.completed) {
            note.completed = false;
        }

        this.updateNote(noteId, { checklist: note.checklist, completed: note.completed });
        return item.done;
    }

    deleteChecklistItem(noteId, taskId) {
        const note = this.notes.get(noteId);
        if (!note || !note.checklist) return false;

        note.checklist = note.checklist.filter(t => t.id !== taskId);
        this.updateNote(noteId, { checklist: note.checklist });
        return true;
    }

    getChecklistStats(note) {
        if (!note || !note.checklist || note.checklist.length === 0) {
            return { total: 0, completed: 0, percentage: 0 };
        }
        const total = note.checklist.length;
        const completed = note.checklist.filter(t => t.done).length;
        const percentage = Math.round((completed / total) * 100);
        return { total, completed, percentage };
    }

    addCustomTag(tag) {
        if (!tag || !tag.trim()) return;
        const clean = tag.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
        if (clean) {
            this.tags.add(clean);
            this.saveToStorage();
            if (this.onNotesChanged) this.onNotesChanged();
        }
    }

    getFilteredNotes() {
        const all = Array.from(this.notes.values());

        return all.filter(note => {
            // Category filter
            if (this.activeFilter.category === 'pinned' && !note.pinned) return false;
            if (this.activeFilter.category === 'urgent' && note.priority !== 'high') return false;
            if (this.activeFilter.category === 'alarm' && (!note.alarm || !note.alarm.enabled)) return false;
            if (this.activeFilter.category === 'completed' && !note.completed) return false;

            // Specific Tag filter
            if (this.activeFilter.tag && (!note.tags || !note.tags.includes(this.activeFilter.tag))) {
                return false;
            }

            // Text search
            if (this.activeFilter.searchQuery) {
                const q = this.activeFilter.searchQuery.toLowerCase();
                const titleMatch = (note.title || '').toLowerCase().includes(q);
                const contentMatch = (note.content || '').toLowerCase().includes(q);
                const tagMatch = note.tags && note.tags.some(t => t.toLowerCase().includes(q));
                const checklistMatch = note.checklist && note.checklist.some(t => t.text.toLowerCase().includes(q));
                if (!titleMatch && !contentMatch && !tagMatch && !checklistMatch) return false;
            }

            return true;
        }).sort((a, b) => {
            if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;

            if (this.sortBy === 'updated-desc') {
                return (b.updatedAt || 0) - (a.updatedAt || 0);
            }
            if (this.sortBy === 'created-desc') {
                return (b.createdAt || 0) - (a.createdAt || 0);
            }
            if (this.sortBy === 'title-asc') {
                return (a.title || '').localeCompare(b.title || '');
            }
            if (this.sortBy === 'priority-desc') {
                const weight = { high: 3, med: 2, low: 1 };
                return (weight[b.priority] || 0) - (weight[a.priority] || 0);
            }
            if (this.sortBy === 'alarm-asc') {
                const timeA = (a.alarm && a.alarm.enabled) ? a.alarm.timestamp : Infinity;
                const timeB = (b.alarm && b.alarm.enabled) ? b.alarm.timestamp : Infinity;
                return timeA - timeB;
            }
            return 0;
        });
    }

    getCounts() {
        const all = Array.from(this.notes.values());
        return {
            all: all.length,
            pinned: all.filter(n => n.pinned).length,
            urgent: all.filter(n => n.priority === 'high').length,
            alarm: all.filter(n => n.alarm && n.alarm.enabled).length,
            completed: all.filter(n => n.completed).length
        };
    }

    exportJSON() {
        const data = {
            version: '1.0.0',
            exportedAt: new Date().toISOString(),
            notes: Array.from(this.notes.values()),
            tags: Array.from(this.tags)
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `snnotes_backup_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    importJSON(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            if (!data.notes || !Array.isArray(data.notes)) throw new Error('Invalid format');
            let count = 0;
            data.notes.forEach(note => {
                if (note && note.id && note.title) {
                    if (!note.checklist) note.checklist = [];
                    this.notes.set(note.id, note);
                    count++;
                }
            });
            if (data.tags && Array.isArray(data.tags)) {
                data.tags.forEach(t => this.tags.add(t.toUpperCase()));
            }
            this.saveToStorage();
            if (this.onNotesChanged) this.onNotesChanged();
            return { success: true, count };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }
}

window.notesManager = new NotesManager();
