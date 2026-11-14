/**
 * CYBERDECK // NEURAL DATA SHARDS MANAGER
 * Persistent storage, tag indexing, priority matrix, and checklist logic.
 */
class CyberNotesManager {
    constructor() {
        this.notes = new Map(); // id -> note
        this.tags = new Set(['MISSION', 'INTEL', 'PERSONAL', 'SYSTEM', 'CORPO']);
        this.activeFilter = {
            category: 'all', // 'all', 'pinned', 'urgent', 'alarm', 'completed'
            tag: null,
            searchQuery: '',
            priority: null
        };
        this.sortBy = 'updated-desc'; // 'updated-desc', 'alarm-asc', 'priority-desc', 'title-asc'
        this.selectedNoteId = null;
        this.onNotesChanged = null;
        this.onNoteSelected = null;

        this.loadFromStorage();
    }

    loadFromStorage() {
        try {
            const rawNotes = localStorage.getItem('cyberdeck_notes_v1');
            if (rawNotes) {
                const parsed = JSON.parse(rawNotes);
                parsed.forEach(note => {
                    this.notes.set(note.id, note);
                    if (note.tags && Array.isArray(note.tags)) {
                        note.tags.forEach(t => this.tags.add(t.toUpperCase()));
                    }
                });
            } else {
                // Populate default starter shards if empty
                this.seedInitialShards();
            }

            const rawTags = localStorage.getItem('cyberdeck_tags_v1');
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
            localStorage.setItem('cyberdeck_notes_v1', JSON.stringify(arr));
            localStorage.setItem('cyberdeck_tags_v1', JSON.stringify(Array.from(this.tags)));
        } catch (e) {
            console.warn("Storage save error:", e);
        }
    }

    seedInitialShards() {
        const sample1 = {
            id: 'shard_' + Date.now() + '_1',
            title: 'SNDECK PROTOCOL // OPERATIONAL DIRECTIVE',
            content: `# MISSION BRIEFING\n\n- [x] Integrate CyberDeck Notes with futuristic sound synthesizer\n- [ ] Configure neural alarms and reminder timers\n- [ ] Deploy Windows desktop package with GitHub Actions CI\n\nRemember: Cyberpunk systems prioritize zero latency, high contrast, and mechanical acoustic feedback.`,
            tags: ['MISSION', 'SYSTEM'],
            priority: 'high', // 'low', 'med', 'high'
            pinned: true,
            completed: false,
            createdAt: Date.now() - 3600000,
            updatedAt: Date.now() - 1800000,
            alarm: {
                enabled: true,
                timestamp: Date.now() + 15 * 60 * 1000, // 15 mins from now
                label: 'MISSION PROTOCOL SYNC CHECK',
                sound: 'siren',
                repeat: 'none',
                triggered: false
            }
        };

        const sample2 = {
            id: 'shard_' + Date.now() + '_2',
            title: 'NETRUNNER INTEL // NIGHT CITY ENCRYPTION KEYS',
            content: `Access codes for subnet 404:\n\n- Proxy Alpha: 127.0.0.1:8080 (Encrypted)\n- ICE Breaker: Sandevistan Overclock DSP\n- Frequency: 24-bit 48kHz audio stream\n\nAlways maintain audio backups in local storage.`,
            tags: ['INTEL'],
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
        const id = 'shard_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
        const newNote = {
            id,
            title: data.title || 'UNTITLED SHARD',
            content: data.content || '',
            tags: data.tags || ['MISSION'],
            priority: data.priority || 'med',
            pinned: !!data.pinned,
            completed: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            alarm: data.alarm || null
        };

        this.notes.set(id, newNote);
        this.selectedNoteId = id;
        this.saveToStorage();
        this.notifyChange();
        return newNote;
    }

    updateNote(id, patch, notify = true) {
        const note = this.notes.get(id);
        if (!note) return null;

        Object.assign(note, patch, { updatedAt: Date.now() });

        if (patch.tags && Array.isArray(patch.tags)) {
            patch.tags.forEach(t => this.tags.add(t.toUpperCase()));
        }

        this.notes.set(id, note);
        this.saveToStorage();
        if (notify) this.notifyChange();
        return note;
    }

    deleteNote(id) {
        const deleted = this.notes.delete(id);
        if (this.selectedNoteId === id) {
            const remaining = this.getFilteredNotes();
            this.selectedNoteId = remaining.length > 0 ? remaining[0].id : null;
        }
        this.saveToStorage();
        this.notifyChange();
        return deleted;
    }

    togglePin(id) {
        const note = this.notes.get(id);
        if (!note) return;
        note.pinned = !note.pinned;
        note.updatedAt = Date.now();
        this.saveToStorage();
        this.notifyChange();
    }

    toggleComplete(id) {
        const note = this.notes.get(id);
        if (!note) return;
        note.completed = !note.completed;
        note.updatedAt = Date.now();
        this.saveToStorage();
        this.notifyChange();
    }

    getFilteredNotes() {
        let list = Array.from(this.notes.values());

        // Category Filter
        if (this.activeFilter.category === 'pinned') {
            list = list.filter(n => n.pinned && !n.completed);
        } else if (this.activeFilter.category === 'urgent') {
            list = list.filter(n => n.priority === 'high' && !n.completed);
        } else if (this.activeFilter.category === 'alarm') {
            list = list.filter(n => n.alarm && n.alarm.enabled && !n.completed);
        } else if (this.activeFilter.category === 'completed') {
            list = list.filter(n => n.completed);
        } else {
            // 'all': show active notes (uncompleted) unless specific search
            list = list.filter(n => !n.completed);
        }

        // Tag filter
        if (this.activeFilter.tag) {
            const t = this.activeFilter.tag.toUpperCase();
            list = list.filter(n => n.tags && n.tags.some(tag => tag.toUpperCase() === t));
        }

        // Priority filter
        if (this.activeFilter.priority) {
            list = list.filter(n => n.priority === this.activeFilter.priority);
        }

        // Search Query
        if (this.activeFilter.searchQuery) {
            const q = this.activeFilter.searchQuery.toLowerCase();
            list = list.filter(n =>
                (n.title && n.title.toLowerCase().includes(q)) ||
                (n.content && n.content.toLowerCase().includes(q)) ||
                (n.tags && n.tags.some(tag => tag.toLowerCase().includes(q)))
            );
        }

        // Sorting
        list.sort((a, b) => {
            // Pinned notes always surface first in default view
            if (this.activeFilter.category !== 'pinned') {
                if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
            }

            if (this.sortBy === 'updated-desc') {
                return b.updatedAt - a.updatedAt;
            } else if (this.sortBy === 'created-desc') {
                return b.createdAt - a.createdAt;
            } else if (this.sortBy === 'alarm-asc') {
                const aTime = (a.alarm && a.alarm.enabled) ? a.alarm.timestamp : Infinity;
                const bTime = (b.alarm && b.alarm.enabled) ? b.alarm.timestamp : Infinity;
                return aTime - bTime;
            } else if (this.sortBy === 'priority-desc') {
                const pVal = { high: 3, med: 2, low: 1 };
                return (pVal[b.priority] || 0) - (pVal[a.priority] || 0);
            } else if (this.sortBy === 'title-asc') {
                return a.title.localeCompare(b.title);
            }
            return b.updatedAt - a.updatedAt;
        });

        return list;
    }

    addTag(tagName) {
        if (!tagName) return;
        const clean = tagName.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
        if (clean) {
            this.tags.add(clean);
            this.saveToStorage();
            this.notifyChange();
        }
    }

    notifyChange() {
        if (this.onNotesChanged) this.onNotesChanged();
    }
}

window.NotesManager = new CyberNotesManager();
