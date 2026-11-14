/**
 * CYBERDECK // NEURAL LOG & ALARM CONTROLLER
 * Main application coordinator, event listeners, live clock, markdown renderer.
 */
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const elements = {
        hudClock: document.getElementById('hudClock'),
        hudAlarmTicker: document.getElementById('hudAlarmTicker'),
        alarmTickerText: document.getElementById('alarmTickerText'),
        btnToggleSound: document.getElementById('btnToggleSound'),
        btnNewShard: document.getElementById('btnNewShard'),
        shardsList: document.getElementById('shardsList'),
        tagsCloud: document.getElementById('tagsCloud'),
        btnAddCustomTag: document.getElementById('btnAddCustomTag'),
        filterItems: document.querySelectorAll('.filter-item'),
        quickTimers: document.querySelectorAll('.btn-quick-timer'),
        inputSearch: document.getElementById('inputSearch'),
        selectSort: document.getElementById('selectSort'),

        // Editor Elements
        inputShardTitle: document.getElementById('inputShardTitle'),
        inputShardContent: document.getElementById('inputShardContent'),
        shardMarkdownPreview: document.getElementById('shardMarkdownPreview'),
        btnToggleView: document.getElementById('btnToggleView'),
        viewModeIcon: document.getElementById('viewModeIcon'),
        btnTogglePin: document.getElementById('btnTogglePin'),
        pinIcon: document.getElementById('pinIcon'),
        btnExportMd: document.getElementById('btnExportMd'),
        btnDeleteShard: document.getElementById('btnDeleteShard'),
        selectShardTag: document.getElementById('selectShardTag'),
        priorityButtons: document.querySelectorAll('.btn-priority'),
        charCount: document.getElementById('charCount'),
        saveStatus: document.getElementById('saveStatus'),
        editorStatus: document.getElementById('editorStatus'),

        // Alarm Module
        chkEnableAlarm: document.getElementById('chkEnableAlarm'),
        alarmConfigModule: document.getElementById('alarmConfigModule'),
        inputAlarmDatetime: document.getElementById('inputAlarmDatetime'),
        selectAlarmSound: document.getElementById('selectAlarmSound'),
        selectAlarmRepeat: document.getElementById('selectAlarmRepeat'),
        alarmTimeDisplay: document.getElementById('alarmTimeDisplay'),

        // Fullscreen Alarm Modal
        alarmModal: document.getElementById('alarmModal'),
        alarmModalTitle: document.getElementById('alarmModalTitle'),
        alarmModalDesc: document.getElementById('alarmModalDesc'),
        btnSnooze5: document.getElementById('btnSnooze5'),
        btnSnooze15: document.getElementById('btnSnooze15'),
        btnDismissAlarm: document.getElementById('btnDismissAlarm'),

        // Filter Counts
        countAll: document.getElementById('countAll'),
        countPinned: document.getElementById('countPinned'),
        countUrgent: document.getElementById('countUrgent'),
        countAlarms: document.getElementById('countAlarms'),
        countCompleted: document.getElementById('countCompleted')
    };

    let isPreviewMode = false;
    let autoSaveTimeout = null;

    // =========================================================================
    // 1. LIVE HUD CLOCK & ALARM TICKER
    // =========================================================================
    function updateClock() {
        const now = new Date();
        const pad = (n) => String(n).padStart(2, '0');
        elements.hudClock.textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    }
    setInterval(updateClock, 1000);
    updateClock();

    window.CyberAlarm.onTick = (nearestNote, diffMs) => {
        if (!nearestNote || diffMs === null) {
            elements.alarmTickerText.textContent = 'CHRONO: NO ACTIVE ALARMS';
        } else {
            const timeStr = window.CyberAlarm.formatTimeRemaining(diffMs);
            elements.alarmTickerText.textContent = `NEXT ALARM: [${nearestNote.title.slice(0, 16)}] IN ${timeStr}`;
        }
        updateAlarmDisplayInEditor();
    };

    // =========================================================================
    // 2. SFX TOGGLE
    // =========================================================================
    elements.btnToggleSound.addEventListener('click', () => {
        const active = window.CyberSound.toggle();
        elements.btnToggleSound.classList.toggle('active', active);
        elements.btnToggleSound.querySelector('span').textContent = active ? 'SFX: ON' : 'SFX: OFF';
        if (active) window.CyberSound.playClick();
    });

    // =========================================================================
    // 3. SHARDS DIRECTORY & CARDS RENDERING
    // =========================================================================
    function renderShardsList() {
        const list = window.NotesManager.getFilteredNotes();
        elements.shardsList.replaceChildren();

        if (list.length === 0) {
            const emptyEl = document.createElement('div');
            emptyEl.style.padding = '24px';
            emptyEl.style.textAlign = 'center';
            emptyEl.style.color = 'var(--cyber-text-muted)';
            emptyEl.style.fontFamily = 'var(--font-mono)';
            emptyEl.textContent = '[NO DATA SHARDS FOUND IN THIS FILTER]';
            elements.shardsList.appendChild(emptyEl);
            return;
        }

        list.forEach(note => {
            const card = document.createElement('div');
            card.className = `shard-card cyber-cut-sm ${note.id === window.NotesManager.selectedNoteId ? 'active' : ''}`;
            card.setAttribute('data-priority', note.priority);
            card.setAttribute('data-id', note.id);

            const topRow = document.createElement('div');
            topRow.className = 'card-top-row';

            const title = document.createElement('div');
            title.className = 'card-title';
            title.textContent = note.title || 'UNTITLED SHARD';
            topRow.appendChild(title);

            if (note.pinned) {
                const pin = document.createElement('span');
                pin.className = 'card-pin-icon';
                pin.textContent = '★';
                topRow.appendChild(pin);
            }
            card.appendChild(topRow);

            const preview = document.createElement('div');
            preview.className = 'card-preview';
            preview.textContent = note.content.replace(/[#*`[\]]/g, '').slice(0, 120) || '(Empty shard)';
            card.appendChild(preview);

            const bottomRow = document.createElement('div');
            bottomRow.className = 'card-bottom-row';

            const tagsDiv = document.createElement('div');
            tagsDiv.className = 'card-tags-list';
            if (note.tags && note.tags.length > 0) {
                note.tags.slice(0, 2).forEach(t => {
                    const tagSpan = document.createElement('span');
                    tagSpan.className = 'card-tag';
                    tagSpan.textContent = `#${t}`;
                    tagsDiv.appendChild(tagSpan);
                });
            }
            bottomRow.appendChild(tagsDiv);

            if (note.alarm && note.alarm.enabled && note.alarm.timestamp) {
                const alarmChip = document.createElement('div');
                const diff = note.alarm.timestamp - Date.now();
                alarmChip.className = `card-alarm-chip ${diff <= 0 ? 'urgent' : ''}`;
                const timeText = diff > 0 ? window.CyberAlarm.formatTimeRemaining(diff) : 'DUE';
                alarmChip.innerHTML = `⏰ ${timeText}`;
                bottomRow.appendChild(alarmChip);
            }

            card.appendChild(bottomRow);

            card.addEventListener('click', () => {
                window.CyberSound.playClick();
                selectShard(note.id);
            });

            elements.shardsList.appendChild(card);
        });

        updateFilterCounts();
    }

    function updateFilterCounts() {
        const all = window.NotesManager.getAllNotes();
        elements.countAll.textContent = all.filter(n => !n.completed).length;
        elements.countPinned.textContent = all.filter(n => n.pinned && !n.completed).length;
        elements.countUrgent.textContent = all.filter(n => n.priority === 'high' && !n.completed).length;
        elements.countAlarms.textContent = all.filter(n => n.alarm && n.alarm.enabled && !n.completed).length;
        elements.countCompleted.textContent = all.filter(n => n.completed).length;
    }

    function renderTags() {
        elements.tagsCloud.replaceChildren();
        elements.selectShardTag.replaceChildren();

        const allTags = Array.from(window.NotesManager.tags);

        allTags.forEach(tag => {
            // Sidebar chip
            const chip = document.createElement('button');
            chip.className = `tag-chip cyber-cut-sm ${window.NotesManager.activeFilter.tag === tag ? 'active' : ''}`;
            chip.textContent = `#${tag}`;
            chip.addEventListener('click', () => {
                window.CyberSound.playClick();
                if (window.NotesManager.activeFilter.tag === tag) {
                    window.NotesManager.activeFilter.tag = null;
                } else {
                    window.NotesManager.activeFilter.tag = tag;
                }
                renderTags();
                renderShardsList();
            });
            elements.tagsCloud.appendChild(chip);

            // Select dropdown option
            const opt = document.createElement('option');
            opt.value = tag;
            opt.textContent = tag;
            elements.selectShardTag.appendChild(opt);
        });
    }

    // =========================================================================
    // 4. EDITOR POPULATION & BINDINGS
    // =========================================================================
    function selectShard(id) {
        window.NotesManager.selectedNoteId = id;
        const note = window.NotesManager.getNote(id);
        if (!note) return;

        elements.inputShardTitle.value = note.title || '';
        elements.inputShardContent.value = note.content || '';

        // Priority Buttons
        elements.priorityButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.priority === note.priority);
        });

        // Pin Button
        elements.pinIcon.textContent = note.pinned ? '★' : '☆';
        elements.btnTogglePin.classList.toggle('active', note.pinned);

        // Tag
        if (note.tags && note.tags.length > 0) {
            elements.selectShardTag.value = note.tags[0];
        }

        // Alarm
        if (note.alarm && note.alarm.enabled) {
            elements.chkEnableAlarm.checked = true;
            elements.alarmConfigModule.style.display = 'flex';
            if (note.alarm.timestamp) {
                const date = new Date(note.alarm.timestamp);
                // Format for datetime-local: YYYY-MM-DDTHH:mm
                const tzOffset = date.getTimezoneOffset() * 60000;
                const localISOTime = (new Date(date.getTime() - tzOffset)).toISOString().slice(0, 16);
                elements.inputAlarmDatetime.value = localISOTime;
            }
            elements.selectAlarmSound.value = note.alarm.sound || 'siren';
            elements.selectAlarmRepeat.value = note.alarm.repeat || 'none';
        } else {
            elements.chkEnableAlarm.checked = false;
            elements.alarmConfigModule.style.display = 'none';
            // Default datetime to 1 hour from now
            const defaultDate = new Date(Date.now() + 3600000);
            const tzOffset = defaultDate.getTimezoneOffset() * 60000;
            elements.inputAlarmDatetime.value = (new Date(defaultDate.getTime() - tzOffset)).toISOString().slice(0, 16);
        }

        updateCharCount();
        updateAlarmDisplayInEditor();
        renderShardsList();
        if (isPreviewMode) renderMarkdownPreview();
    }

    function updateAlarmDisplayInEditor() {
        const note = window.NotesManager.getNote(window.NotesManager.selectedNoteId);
        if (!note || !note.alarm || !note.alarm.enabled || !note.alarm.timestamp) {
            elements.alarmTimeDisplay.textContent = '';
            return;
        }
        const diff = note.alarm.timestamp - Date.now();
        if (diff <= 0) {
            elements.alarmTimeDisplay.textContent = '[DUE NOW]';
        } else {
            elements.alarmTimeDisplay.textContent = `[TRIGGER IN: ${window.CyberAlarm.formatTimeRemaining(diff)}]`;
        }
    }

    function scheduleAutoSave() {
        elements.saveStatus.textContent = 'SYNCING...';
        elements.saveStatus.style.color = 'var(--omi-yellow)';
        clearTimeout(autoSaveTimeout);

        autoSaveTimeout = setTimeout(() => {
            saveCurrentShard();
        }, 350);
    }

    function saveCurrentShard() {
        const currentId = window.NotesManager.selectedNoteId;
        if (!currentId) return;

        const title = elements.inputShardTitle.value.trim() || 'UNTITLED SHARD';
        const content = elements.inputShardContent.value;
        const tag = elements.selectShardTag.value;

        // Alarm configuration
        let alarm = null;
        if (elements.chkEnableAlarm.checked) {
            const dtVal = elements.inputAlarmDatetime.value;
            const ts = dtVal ? new Date(dtVal).getTime() : Date.now() + 3600000;
            alarm = {
                enabled: true,
                timestamp: ts,
                sound: elements.selectAlarmSound.value,
                repeat: elements.selectAlarmRepeat.value,
                label: title,
                triggered: false
            };
        }

        window.NotesManager.updateNote(currentId, {
            title,
            content,
            tags: [tag],
            alarm
        });

        elements.saveStatus.textContent = 'ENCRYPTED & SAVED';
        elements.saveStatus.style.color = 'var(--omi-green)';
        updateCharCount();
    }

    function updateCharCount() {
        const text = elements.inputShardContent.value;
        const chars = text.length;
        const words = text.trim() ? text.trim().split(/\s+/).length : 0;
        elements.charCount.textContent = `${chars} CHARACTERS // ${words} WORDS`;
    }

    // =========================================================================
    // 5. SIMPLE CYBERPUNK MARKDOWN RENDERER
    // =========================================================================
    function renderMarkdownPreview() {
        const text = elements.inputShardContent.value;
        let html = '';

        const lines = text.split('\n');
        let inList = false;

        lines.forEach((line, lineIdx) => {
            // Task checkboxes: - [ ] or - [x]
            const taskMatch = line.match(/^-\s*\[([ xX])\]\s*(.*)/);
            if (taskMatch) {
                const isChecked = taskMatch[1].toLowerCase() === 'x';
                const taskText = taskMatch[2];
                html += `
                    <div class="cyber-checkbox-item ${isChecked ? 'checked' : ''}" data-line="${lineIdx}">
                        <div class="cyber-checkbox-box">${isChecked ? '✓' : ''}</div>
                        <span>${escapeHtml(taskText)}</span>
                    </div>
                `;
                return;
            }

            // Headers
            if (line.startsWith('### ')) {
                html += `<h3>${escapeHtml(line.slice(4))}</h3>`;
            } else if (line.startsWith('## ')) {
                html += `<h2>${escapeHtml(line.slice(3))}</h2>`;
            } else if (line.startsWith('# ')) {
                html += `<h1>${escapeHtml(line.slice(2))}</h1>`;
            } else if (line.startsWith('- ')) {
                html += `<li>${escapeHtml(line.slice(2))}</li>`;
            } else if (line.trim() === '') {
                html += `<br>`;
            } else {
                html += `<p>${formatInlineMarkdown(escapeHtml(line))}</p>`;
            }
        });

        elements.shardMarkdownPreview.innerHTML = html;

        // Wire interactive checkbox toggling
        elements.shardMarkdownPreview.querySelectorAll('.cyber-checkbox-item').forEach(item => {
            item.addEventListener('click', () => {
                window.CyberSound.playCheck();
                const lIdx = parseInt(item.dataset.line, 10);
                const curLines = elements.inputShardContent.value.split('\n');
                if (curLines[lIdx]) {
                    if (curLines[lIdx].includes('- [ ]')) {
                        curLines[lIdx] = curLines[lIdx].replace('- [ ]', '- [x]');
                    } else if (curLines[lIdx].includes('- [x]') || curLines[lIdx].includes('- [X]')) {
                        curLines[lIdx] = curLines[lIdx].replace(/- \[[xX]\]/, '- [ ]');
                    }
                    elements.inputShardContent.value = curLines.join('\n');
                    saveCurrentShard();
                    renderMarkdownPreview();
                }
            });
        });
    }

    function formatInlineMarkdown(str) {
        return str
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>');
    }

    function escapeHtml(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    // =========================================================================
    // 6. EVENT LISTENERS
    // =========================================================================
    elements.btnNewShard.addEventListener('click', () => {
        window.CyberSound.playSuccess();
        const created = window.NotesManager.createNote({
            title: 'NEW_MISSION_LOG // ' + (new Date().toISOString().slice(0, 10)),
            content: '- [ ] Mission Objective 1\n- [ ] Review intelligence parameters',
            tags: [elements.selectShardTag.value || 'MISSION']
        });
        selectShard(created.id);
        elements.inputShardTitle.focus();
    });

    elements.inputShardTitle.addEventListener('input', scheduleAutoSave);
    elements.inputShardContent.addEventListener('input', () => {
        window.CyberSound.playKey();
        scheduleAutoSave();
    });

    // Priority buttons
    elements.priorityButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            window.CyberSound.playClick();
            elements.priorityButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            window.NotesManager.updateNote(window.NotesManager.selectedNoteId, { priority: btn.dataset.priority });
            renderShardsList();
        });
    });

    // Pin
    elements.btnTogglePin.addEventListener('click', () => {
        window.CyberSound.playClick();
        window.NotesManager.togglePin(window.NotesManager.selectedNoteId);
        const note = window.NotesManager.getNote(window.NotesManager.selectedNoteId);
        if (note) {
            elements.pinIcon.textContent = note.pinned ? '★' : '☆';
            elements.btnTogglePin.classList.toggle('active', note.pinned);
        }
    });

    // Toggle Preview
    elements.btnToggleView.addEventListener('click', () => {
        window.CyberSound.playClick();
        isPreviewMode = !isPreviewMode;
        if (isPreviewMode) {
            renderMarkdownPreview();
            elements.inputShardContent.style.display = 'none';
            elements.shardMarkdownPreview.style.display = 'block';
            elements.viewModeIcon.textContent = '✎';
            elements.btnToggleView.querySelector('span:last-child').textContent = 'EDIT';
        } else {
            elements.inputShardContent.style.display = 'block';
            elements.shardMarkdownPreview.style.display = 'none';
            elements.viewModeIcon.textContent = '👁';
            elements.btnToggleView.querySelector('span:last-child').textContent = 'PREVIEW';
        }
    });

    // Delete
    elements.btnDeleteShard.addEventListener('click', () => {
        const note = window.NotesManager.getNote(window.NotesManager.selectedNoteId);
        if (!note) return;
        if (confirm(`PURGE SHARD: "${note.title}"?`)) {
            window.CyberSound.playBuzzer();
            window.NotesManager.deleteNote(note.id);
            const remaining = window.NotesManager.getFilteredNotes();
            if (remaining.length > 0) {
                selectShard(remaining[0].id);
            } else {
                elements.inputShardTitle.value = '';
                elements.inputShardContent.value = '';
            }
        }
    });

    // Alarm Checkbox Toggle
    elements.chkEnableAlarm.addEventListener('change', () => {
        window.CyberSound.playClick();
        elements.alarmConfigModule.style.display = elements.chkEnableAlarm.checked ? 'flex' : 'none';
        scheduleAutoSave();
    });

    elements.inputAlarmDatetime.addEventListener('change', scheduleAutoSave);
    elements.selectAlarmSound.addEventListener('change', scheduleAutoSave);
    elements.selectAlarmRepeat.addEventListener('change', scheduleAutoSave);
    elements.selectShardTag.addEventListener('change', scheduleAutoSave);

    // Quick countdown timer buttons (+5m, +15m, +30m, +1h)
    elements.quickTimers.forEach(btn => {
        btn.addEventListener('click', () => {
            window.CyberSound.playSuccess();
            const minutes = parseInt(btn.dataset.timer, 10);
            const targetTime = Date.now() + minutes * 60 * 1000;
            const targetDate = new Date(targetTime);

            elements.chkEnableAlarm.checked = true;
            elements.alarmConfigModule.style.display = 'flex';

            const tzOffset = targetDate.getTimezoneOffset() * 60000;
            elements.inputAlarmDatetime.value = (new Date(targetDate.getTime() - tzOffset)).toISOString().slice(0, 16);

            saveCurrentShard();
            alert(`⏰ CHRONO ALARM ACTIVATED: in ${minutes} minutes (${targetDate.toLocaleTimeString()})`);
        });
    });

    // Custom Tag Prompt
    elements.btnAddCustomTag.addEventListener('click', () => {
        const newTag = prompt("ENTER NEW TAG IDENTIFIER (e.g. OPERATIONS):");
        if (newTag) {
            window.CyberSound.playSuccess();
            window.NotesManager.addTag(newTag);
            renderTags();
        }
    });

    // Filters
    elements.filterItems.forEach(item => {
        item.addEventListener('click', () => {
            window.CyberSound.playClick();
            elements.filterItems.forEach(f => f.classList.remove('active'));
            item.classList.add('active');
            window.NotesManager.activeFilter.category = item.dataset.category;
            renderShardsList();
        });
    });

    // Search & Sort
    elements.inputSearch.addEventListener('input', (e) => {
        window.NotesManager.activeFilter.searchQuery = e.target.value;
        renderShardsList();
    });

    elements.selectSort.addEventListener('change', (e) => {
        window.CyberSound.playClick();
        window.NotesManager.sortBy = e.target.value;
        renderShardsList();
    });

    // Export .md
    elements.btnExportMd.addEventListener('click', () => {
        const note = window.NotesManager.getNote(window.NotesManager.selectedNoteId);
        if (!note) return;
        window.CyberSound.playSuccess();

        const fileContent = `# ${note.title}\n\nPriority: ${note.priority.toUpperCase()}\nTags: ${note.tags.join(', ')}\nDate: ${new Date(note.createdAt).toLocaleString()}\n\n${note.content}`;
        const blob = new Blob([fileContent], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${note.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    // =========================================================================
    // 7. EMERGENCY ALARM MODAL HANDLING
    // =========================================================================
    window.CyberAlarm.onAlarmTriggered = (note) => {
        elements.alarmModalTitle.textContent = `🚨 ${note.title}`;
        elements.alarmModalDesc.textContent = note.content || 'Protocol schedule deadline arrived.';
        elements.alarmModal.classList.add('active');
    };

    window.CyberAlarm.onAlarmDismissed = () => {
        elements.alarmModal.classList.remove('active');
    };

    elements.btnDismissAlarm.addEventListener('click', () => {
        window.CyberSound.playClick();
        window.CyberAlarm.dismissAlarm();
        renderShardsList();
    });

    elements.btnSnooze5.addEventListener('click', () => {
        window.CyberSound.playClick();
        window.CyberAlarm.snoozeAlarm(5);
        renderShardsList();
    });

    elements.btnSnooze15.addEventListener('click', () => {
        window.CyberSound.playClick();
        window.CyberAlarm.snoozeAlarm(15);
        renderShardsList();
    });

    // =========================================================================
    // 8. KEYBOARD SHORTCUTS
    // =========================================================================
    window.addEventListener('keydown', (e) => {
        // Ctrl + N: New Shard
        if (e.ctrlKey && e.key.toLowerCase() === 'n') {
            e.preventDefault();
            elements.btnNewShard.click();
        }
        // Ctrl + S: Save
        if (e.ctrlKey && e.key.toLowerCase() === 's') {
            e.preventDefault();
            saveCurrentShard();
            window.CyberSound.playSuccess();
        }
        // Escape: Dismiss active alarm or blur
        if (e.key === 'Escape') {
            if (elements.alarmModal.classList.contains('active')) {
                window.CyberAlarm.dismissAlarm();
            }
        }
    });

    // Notes Manager update callback
    window.NotesManager.onNotesChanged = () => {
        renderShardsList();
    };

    // Initial Render
    renderTags();
    const all = window.NotesManager.getFilteredNotes();
    if (all.length > 0) {
        selectShard(all[0].id);
    } else {
        elements.btnNewShard.click();
    }
});
