/**
 * SNNOTES // MAIN APPLICATION CONTROLLER
 * Manages themes, retro CRT scanline toggle, keystroke audio, interactive checklists,
 * alarms, markdown preview & formatting, hotkeys, deletion confirmation, and planner integration.
 */
document.addEventListener('DOMContentLoaded', () => {
    // -------------------------------------------------------------------------
    // DOM Element References
    // -------------------------------------------------------------------------
    const elements = {
        // Top HUD
        hudClock: document.getElementById('hudClock'),
        hudAlarmTicker: document.getElementById('hudAlarmTicker'),
        alarmTickerText: document.getElementById('alarmTickerText'),
        themeSelect: document.getElementById('themeSelect'),
        btnCreateTheme: document.getElementById('btnCreateTheme'),
        btnToggleRetro: document.getElementById('btnToggleRetro'),
        btnToggleSound: document.getElementById('btnToggleSound'),
        btnTypingSettings: document.getElementById('btnTypingSettings'),
        btnExportAll: document.getElementById('btnExportAll'),
        inputImportBackup: document.getElementById('inputImportBackup'),
        scanlines: document.getElementById('scanlines'),

        // Left Sidebar
        btnNewNote: document.getElementById('btnNewNote'),
        filterItems: document.querySelectorAll('.filter-item'),
        quickTimers: document.querySelectorAll('.btn-quick-timer'),
        tagsCloud: document.getElementById('tagsCloud'),
        btnAddCustomTag: document.getElementById('btnAddCustomTag'),
        countAll: document.getElementById('countAll'),
        countPinned: document.getElementById('countPinned'),
        countUrgent: document.getElementById('countUrgent'),
        countAlarms: document.getElementById('countAlarms'),
        countCompleted: document.getElementById('countCompleted'),

        // Center Editor
        editorStatus: document.getElementById('editorStatus'),
        btnTogglePin: document.getElementById('btnTogglePin'),
        pinIcon: document.getElementById('pinIcon'),
        btnToggleChecklist: document.getElementById('btnToggleChecklist'),
        btnToggleView: document.getElementById('btnToggleView'),
        viewModeIcon: document.getElementById('viewModeIcon'),
        btnExportMd: document.getElementById('btnExportMd'),
        btnDeleteNote: document.getElementById('btnDeleteNote'),
        inputNoteTitle: document.getElementById('inputNoteTitle'),
        priorityButtons: document.querySelectorAll('.btn-priority'),
        selectNoteTag: document.getElementById('selectNoteTag'),
        chkEnableAlarm: document.getElementById('chkEnableAlarm'),
        alarmConfigModule: document.getElementById('alarmConfigModule'),
        inputAlarmDatetime: document.getElementById('inputAlarmDatetime'),
        selectAlarmSound: document.getElementById('selectAlarmSound'),
        selectAlarmRepeat: document.getElementById('selectAlarmRepeat'),
        alarmTimeDisplay: document.getElementById('alarmTimeDisplay'),

        // Checklist Component
        checklistContainer: document.getElementById('checklistContainer'),
        checklistProgressFill: document.getElementById('checklistProgressFill'),
        checklistProgressText: document.getElementById('checklistProgressText'),
        checklistItemsList: document.getElementById('checklistItemsList'),
        inputNewTask: document.getElementById('inputNewTask'),
        btnAddTask: document.getElementById('btnAddTask'),

        // Text & Preview
        inputNoteContent: document.getElementById('inputNoteContent'),
        noteMarkdownPreview: document.getElementById('noteMarkdownPreview'),
        charCount: document.getElementById('charCount'),
        saveStatus: document.getElementById('saveStatus'),
        formatButtons: document.querySelectorAll('.btn-format'),

        // Right Sidebar
        inputSearch: document.getElementById('inputSearch'),
        selectSort: document.getElementById('selectSort'),
        notesList: document.getElementById('notesList'),

        // Modals
        modalTypingSettings: document.getElementById('modalTypingSettings'),
        btnCloseTypingModal: document.getElementById('btnCloseTypingModal'),
        chkTypingEnabled: document.getElementById('chkTypingEnabled'),
        selectTypingProfile: document.getElementById('selectTypingProfile'),
        inputCustomAudioFile: document.getElementById('inputCustomAudioFile'),
        btnUploadCustomAudio: document.getElementById('btnUploadCustomAudio'),
        customAudioFileName: document.getElementById('customAudioFileName'),
        rangeTypingVolume: document.getElementById('rangeTypingVolume'),
        typingVolumeDisplay: document.getElementById('typingVolumeDisplay'),
        btnTestTypingSound: document.getElementById('btnTestTypingSound'),
        btnSaveTypingSettings: document.getElementById('btnSaveTypingSettings'),

        modalCustomTheme: document.getElementById('modalCustomTheme'),
        btnCloseThemeModal: document.getElementById('btnCloseThemeModal'),
        btnCancelCustomTheme: document.getElementById('btnCancelCustomTheme'),
        btnSaveCustomTheme: document.getElementById('btnSaveCustomTheme'),
        inputCustomThemeName: document.getElementById('inputCustomThemeName'),
        colorThemeGreen: document.getElementById('colorThemeGreen'),
        colorThemeBlue: document.getElementById('colorThemeBlue'),
        colorThemePink: document.getElementById('colorThemePink'),

        modalConfirmDelete: document.getElementById('modalConfirmDelete'),
        deleteConfirmMessage: document.getElementById('deleteConfirmMessage'),
        btnCancelDelete: document.getElementById('btnCancelDelete'),
        btnConfirmDelete: document.getElementById('btnConfirmDelete'),

        alarmModal: document.getElementById('alarmModal'),
        alarmModalTitle: document.getElementById('alarmModalTitle'),
        alarmModalDesc: document.getElementById('alarmModalDesc'),
        btnSnooze5: document.getElementById('btnSnooze5'),
        btnSnooze15: document.getElementById('btnSnooze15'),
        btnDismissAlarm: document.getElementById('btnDismissAlarm')
    };

    let isPreviewMode = false;
    let isChecklistVisible = true;
    let autoSaveTimeout = null;

    // -------------------------------------------------------------------------
    // 1. LIVE HUD CLOCK & ALARM TICKER
    // -------------------------------------------------------------------------
    function updateClock() {
        const now = new Date();
        const pad = (n) => String(n).padStart(2, '0');
        elements.hudClock.textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    }
    setInterval(updateClock, 1000);
    updateClock();

    window.alarmManager.onTick = (nearestNote, diffMs) => {
        if (!nearestNote || diffMs === null) {
            elements.alarmTickerText.textContent = 'NO ACTIVE ALARMS';
        } else {
            const timeStr = window.alarmManager.formatTimeRemaining(diffMs);
            elements.alarmTickerText.textContent = `${timeStr} (${nearestNote.title.slice(0, 18)})`;
        }
        updateAlarmDisplayInEditor();
    };

    // -------------------------------------------------------------------------
    // 2. THEMES & CUSTOM THEME MANAGEMENT (Matched to SNDeck)
    // -------------------------------------------------------------------------
    const rgbFromHex = hex => {
        const v = hex.replace('#', '');
        return `${parseInt(v.slice(0, 2), 16)}, ${parseInt(v.slice(2, 4), 16)}, ${parseInt(v.slice(4, 6), 16)}`;
    };

    function applyTheme(themeId) {
        document.body.removeAttribute('data-theme');
        const customProps = [
            '--omi-green', '--omi-blue', '--omi-pink', '--omi-purple',
            '--omi-green-rgb', '--omi-blue-rgb', '--omi-pink-rgb',
            '--omi-green-glow', '--omi-blue-glow', '--omi-pink-glow',
            '--cyber-panel-border'
        ];
        customProps.forEach(p => document.body.style.removeProperty(p));

        if (themeId.startsWith('custom-')) {
            try {
                const customThemes = JSON.parse(localStorage.getItem('snnotes_custom_themes') || '[]');
                const theme = customThemes.find(t => t.id === themeId);
                if (theme && theme.colors) {
                    const c = theme.colors;
                    document.body.style.setProperty('--omi-green', c.green);
                    document.body.style.setProperty('--omi-green-rgb', rgbFromHex(c.green));
                    document.body.style.setProperty('--omi-green-glow', `0 0 14px rgba(${rgbFromHex(c.green)}, 0.45)`);

                    document.body.style.setProperty('--omi-blue', c.blue);
                    document.body.style.setProperty('--omi-blue-rgb', rgbFromHex(c.blue));
                    document.body.style.setProperty('--omi-blue-glow', `0 0 14px rgba(${rgbFromHex(c.blue)}, 0.4)`);

                    document.body.style.setProperty('--omi-pink', c.pink);
                    document.body.style.setProperty('--omi-pink-rgb', rgbFromHex(c.pink));
                    document.body.style.setProperty('--omi-pink-glow', `0 0 16px rgba(${rgbFromHex(c.pink)}, 0.45)`);
                    document.body.style.setProperty('--cyber-panel-border', `rgba(${rgbFromHex(c.pink)}, 0.35)`);
                }
            } catch (_) {}
        } else if (themeId !== 'omi') {
            document.body.setAttribute('data-theme', themeId);
        }

        elements.themeSelect.value = themeId;
        localStorage.setItem('snnotes_theme', themeId);
    }

    function initThemes() {
        try {
            const customThemes = JSON.parse(localStorage.getItem('snnotes_custom_themes') || '[]');
            customThemes.forEach(theme => {
                if (!theme || !theme.id || !theme.label) return;
                const opt = document.createElement('option');
                opt.value = theme.id;
                opt.textContent = theme.label.toUpperCase();
                elements.themeSelect.appendChild(opt);
            });
        } catch (_) {}

        const savedTheme = localStorage.getItem('snnotes_theme') || 'omi';
        applyTheme(savedTheme);

        elements.themeSelect.addEventListener('change', () => {
            window.soundEngine.playClick();
            applyTheme(elements.themeSelect.value);
        });

        // Create Custom Theme Modal
        elements.btnCreateTheme.addEventListener('click', () => {
            window.soundEngine.playClick();
            elements.modalCustomTheme.classList.add('active');
        });

        const closeCustomThemeModal = () => elements.modalCustomTheme.classList.remove('active');
        elements.btnCloseThemeModal.addEventListener('click', closeCustomThemeModal);
        elements.btnCancelCustomTheme.addEventListener('click', closeCustomThemeModal);

        elements.btnSaveCustomTheme.addEventListener('click', () => {
            const name = elements.inputCustomThemeName.value.trim();
            if (!name) return;

            const themeId = 'custom-' + Date.now();
            const colors = {
                green: elements.colorThemeGreen.value,
                blue: elements.colorThemeBlue.value,
                pink: elements.colorThemePink.value
            };

            const customThemes = JSON.parse(localStorage.getItem('snnotes_custom_themes') || '[]');
            customThemes.push({ id: themeId, label: name, colors });
            localStorage.setItem('snnotes_custom_themes', JSON.stringify(customThemes));

            const opt = document.createElement('option');
            opt.value = themeId;
            opt.textContent = name.toUpperCase();
            elements.themeSelect.appendChild(opt);

            applyTheme(themeId);
            closeCustomThemeModal();
            window.soundEngine.playSuccess();
        });
    }

    initThemes();

    // -------------------------------------------------------------------------
    // 3. RETRO SCANLINE CRT FILTER TOGGLE (Like in SNDeck)
    // -------------------------------------------------------------------------
    const savedRetro = localStorage.getItem('snnotes_retro_effect');
    const isRetroActive = savedRetro !== 'false';
    if (!isRetroActive) {
        elements.scanlines.classList.add('disabled');
        elements.btnToggleRetro.classList.remove('active');
        elements.btnToggleRetro.querySelector('span').textContent = 'RETRO: OFF';
    }

    elements.btnToggleRetro.addEventListener('click', () => {
        window.soundEngine.playClick();
        const active = elements.scanlines.classList.toggle('disabled');
        const currentlyOn = !active;
        elements.btnToggleRetro.classList.toggle('active', currentlyOn);
        elements.btnToggleRetro.querySelector('span').textContent = currentlyOn ? 'RETRO: ON' : 'RETRO: OFF';
        localStorage.setItem('snnotes_retro_effect', String(currentlyOn));
    });

    // -------------------------------------------------------------------------
    // 4. UI SFX & KEYSTROKE TYPING AUDIO SYSTEM
    // -------------------------------------------------------------------------
    elements.btnToggleSound.addEventListener('click', () => {
        const active = window.soundEngine.toggleSFX();
        elements.btnToggleSound.classList.toggle('active', active);
        elements.btnToggleSound.querySelector('span').textContent = active ? 'SFX: ON' : 'SFX: OFF';
        if (active) window.soundEngine.playClick();
    });

    function initTypingAudioUI() {
        const se = window.soundEngine;
        elements.chkTypingEnabled.checked = se.typingEnabled;
        elements.selectTypingProfile.value = se.typingProfile;
        elements.rangeTypingVolume.value = se.typingVolume;
        elements.typingVolumeDisplay.textContent = Math.round(se.typingVolume * 100) + '%';
        if (se.customAudioName) elements.customAudioFileName.textContent = se.customAudioName;

        elements.btnTypingSettings.addEventListener('click', () => {
            window.soundEngine.playClick();
            elements.modalTypingSettings.classList.add('active');
        });

        const closeTypingModal = () => elements.modalTypingSettings.classList.remove('active');
        elements.btnCloseTypingModal.addEventListener('click', closeTypingModal);
        elements.btnSaveTypingSettings.addEventListener('click', () => {
            closeTypingModal();
            window.soundEngine.playClick();
        });

        elements.chkTypingEnabled.addEventListener('change', () => {
            const on = se.toggleTypingSFX(elements.chkTypingEnabled.checked);
            elements.btnTypingSettings.classList.toggle('active', on);
            elements.btnTypingSettings.querySelector('span').textContent = on ? 'TYPING: ON' : 'TYPING: OFF';
        });

        elements.selectTypingProfile.addEventListener('change', () => {
            se.setTypingProfile(elements.selectTypingProfile.value);
        });

        elements.rangeTypingVolume.addEventListener('input', () => {
            const vol = parseFloat(elements.rangeTypingVolume.value);
            se.setTypingVolume(vol);
            elements.typingVolumeDisplay.textContent = Math.round(vol * 100) + '%';
        });

        elements.btnTestTypingSound.addEventListener('click', () => {
            se.playTypingSound();
        });

        elements.btnUploadCustomAudio.addEventListener('click', () => {
            elements.inputCustomAudioFile.click();
        });

        elements.inputCustomAudioFile.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            elements.customAudioFileName.textContent = 'Decoding...';
            const res = await se.loadCustomAudioFile(file);
            if (res.success) {
                elements.customAudioFileName.textContent = res.name;
                elements.selectTypingProfile.value = 'custom';
            } else {
                elements.customAudioFileName.textContent = 'Decode Error';
            }
        });

        const typingTargets = [
            elements.inputNoteTitle,
            elements.inputNoteContent,
            elements.inputNewTask,
            elements.inputSearch
        ];

        typingTargets.forEach(el => {
            if (!el) return;
            el.addEventListener('keydown', (e) => {
                if (['Control', 'Shift', 'Alt', 'Meta', 'CapsLock'].includes(e.key)) return;
                window.soundEngine.playTypingSound();
            });
        });
    }

    initTypingAudioUI();

    // -------------------------------------------------------------------------
    // 5. MARKDOWN FORMATTING SYSTEM (Ctrl+B, Ctrl+I, Ctrl+U, Toolbar)
    // -------------------------------------------------------------------------
    function applyMarkdownFormat(format) {
        const textarea = elements.inputNoteContent;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = textarea.value.substring(start, end);

        let prefix = '';
        let suffix = '';
        let defaultText = '';

        switch (format) {
            case 'bold':
                prefix = '**';
                suffix = '**';
                defaultText = 'bold text';
                break;
            case 'italic':
                prefix = '*';
                suffix = '*';
                defaultText = 'italic text';
                break;
            case 'strike':
                prefix = '~~';
                suffix = '~~';
                defaultText = 'strikethrough';
                break;
            case 'h1':
                prefix = '# ';
                suffix = '';
                defaultText = 'Heading 1';
                break;
            case 'h2':
                prefix = '## ';
                suffix = '';
                defaultText = 'Heading 2';
                break;
            case 'bullet':
                prefix = '- ';
                suffix = '';
                defaultText = 'List item';
                break;
            case 'task':
                prefix = '- [ ] ';
                suffix = '';
                defaultText = 'New task';
                break;
            case 'code':
                prefix = '`';
                suffix = '`';
                defaultText = 'code';
                break;
            case 'quote':
                prefix = '> ';
                suffix = '';
                defaultText = 'Quote';
                break;
            case 'link':
                prefix = '[';
                suffix = '](https://)';
                defaultText = selectedText || 'link text';
                break;
        }

        const replacement = selectedText ? (prefix + selectedText + suffix) : (prefix + defaultText + suffix);

        textarea.focus();
        textarea.setRangeText(replacement, start, end, 'select');

        if (!selectedText) {
            textarea.setSelectionRange(start + prefix.length, start + prefix.length + defaultText.length);
        }

        window.soundEngine.playClick();
        scheduleAutoSave();
    }

    // Attach toolbar button actions
    elements.formatButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const action = btn.dataset.action;
            if (action) applyMarkdownFormat(action);
        });
    });

    // Keyboard shortcuts for textarea
    elements.inputNoteContent.addEventListener('keydown', (e) => {
        if (e.ctrlKey) {
            if (e.key.toLowerCase() === 'b') {
                e.preventDefault();
                applyMarkdownFormat('bold');
            } else if (e.key.toLowerCase() === 'i') {
                e.preventDefault();
                applyMarkdownFormat('italic');
            } else if (e.key.toLowerCase() === 'u') {
                e.preventDefault();
                applyMarkdownFormat('strike');
            } else if (e.key.toLowerCase() === 'k') {
                e.preventDefault();
                applyMarkdownFormat('link');
            }
        } else if (e.key === 'Enter' && !e.shiftKey && !e.altKey) {
            const textarea = elements.inputNoteContent;
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            if (start === end) {
                const text = textarea.value;
                const lineStart = text.lastIndexOf('\n', start - 1) + 1;
                const lineEnd = text.indexOf('\n', start);
                const currentLine = text.substring(lineStart, lineEnd === -1 ? text.length : lineEnd);

                // If current line is an empty task item "- [ ] " or "- [x] "
                const emptyTaskMatch = currentLine.match(/^(-\s*\[[ xX]?\]\s*)$/);
                if (emptyTaskMatch) {
                    e.preventDefault();
                    textarea.setRangeText('', lineStart, start, 'end');
                    scheduleAutoSave();
                    return;
                }

                // If current line is a task item with text "- [ ] Task"
                const taskMatch = currentLine.match(/^(-\s*\[[ xX]?\]\s+)/);
                if (taskMatch) {
                    e.preventDefault();
                    textarea.setRangeText('\n- [ ] ', start, start, 'end');
                    window.soundEngine.playTypingSound();
                    scheduleAutoSave();
                    return;
                }

                // If current line is an empty bullet item "- "
                if (/^-\s*$/.test(currentLine)) {
                    e.preventDefault();
                    textarea.setRangeText('', lineStart, start, 'end');
                    scheduleAutoSave();
                    return;
                }

                // If current line is a bullet item with text "- Item"
                const bulletMatch = currentLine.match(/^(-\s+)/);
                if (bulletMatch) {
                    e.preventDefault();
                    textarea.setRangeText('\n- ', start, start, 'end');
                    window.soundEngine.playTypingSound();
                    scheduleAutoSave();
                    return;
                }
            }
        }
    });

    // -------------------------------------------------------------------------
    // 6. NOTES DIRECTORY & NOTE CARDS
    // -------------------------------------------------------------------------
    function renderNotesList() {
        const list = window.notesManager.getFilteredNotes();
        elements.notesList.replaceChildren();

        if (list.length === 0) {
            const emptyEl = document.createElement('div');
            emptyEl.style.padding = '24px';
            emptyEl.style.textAlign = 'center';
            emptyEl.style.color = 'var(--cyber-text-muted)';
            emptyEl.style.fontFamily = 'var(--font-mono)';
            emptyEl.textContent = '[NO NOTES IN THIS FILTER]';
            elements.notesList.appendChild(emptyEl);
            return;
        }

        list.forEach(note => {
            const card = document.createElement('div');
            card.className = `shard-card cyber-cut-sm ${note.id === window.notesManager.selectedNoteId ? 'active' : ''}`;
            card.setAttribute('data-priority', note.priority);
            card.setAttribute('data-id', note.id);

            const topRow = document.createElement('div');
            topRow.className = 'card-top-row';

            const title = document.createElement('div');
            title.className = 'card-title';
            title.textContent = note.title || 'Untitled Note';
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
            preview.textContent = note.content.replace(/[#*`[\]]/g, '').slice(0, 110) || '(Empty note)';
            card.appendChild(preview);

            const stats = window.notesManager.getChecklistStats(note);
            if (stats.total > 0) {
                const progressDiv = document.createElement('div');
                progressDiv.className = 'card-checklist-progress';
                progressDiv.innerHTML = `
                    <div class="card-checklist-bar"><div class="card-checklist-fill" style="width: ${stats.percentage}%;"></div></div>
                    <span>${stats.completed}/${stats.total} (${stats.percentage}%)</span>
                `;
                card.appendChild(progressDiv);
            }

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
                const timeText = diff > 0 ? window.alarmManager.formatTimeRemaining(diff) : 'DUE';
                alarmChip.textContent = `⏰ ${timeText}`;
                bottomRow.appendChild(alarmChip);
            }

            card.appendChild(bottomRow);

            card.addEventListener('click', () => {
                window.soundEngine.playClick();
                selectNote(note.id);
            });

            elements.notesList.appendChild(card);
        });

        updateFilterCounts();
    }

    function updateFilterCounts() {
        const counts = window.notesManager.getCounts();
        elements.countAll.textContent = counts.all;
        elements.countPinned.textContent = counts.pinned;
        elements.countUrgent.textContent = counts.urgent;
        elements.countAlarms.textContent = counts.alarm;
        elements.countCompleted.textContent = counts.completed;
    }

    function renderTags() {
        elements.tagsCloud.replaceChildren();
        elements.selectNoteTag.replaceChildren();

        const allTags = Array.from(window.notesManager.tags);

        allTags.forEach(tag => {
            const chip = document.createElement('button');
            chip.className = `tag-chip cyber-cut-sm ${window.notesManager.activeFilter.tag === tag ? 'active' : ''}`;
            chip.textContent = `#${tag}`;
            chip.addEventListener('click', () => {
                window.soundEngine.playClick();
                window.notesManager.activeFilter.tag = (window.notesManager.activeFilter.tag === tag) ? null : tag;
                renderTags();
                renderNotesList();
            });
            elements.tagsCloud.appendChild(chip);

            const opt = document.createElement('option');
            opt.value = tag;
            opt.textContent = tag;
            elements.selectNoteTag.appendChild(opt);
        });
    }

    // -------------------------------------------------------------------------
    // 7. EDITOR POPULATION & BINDINGS
    // -------------------------------------------------------------------------
    function selectNote(id) {
        window.notesManager.selectedNoteId = id;
        const note = window.notesManager.getNote(id);
        if (!note) return;

        elements.inputNoteTitle.value = note.title || '';
        elements.inputNoteContent.value = note.content || '';

        elements.priorityButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.priority === note.priority);
        });

        elements.pinIcon.textContent = note.pinned ? '★' : '☆';
        elements.btnTogglePin.classList.toggle('active', note.pinned);

        if (note.tags && note.tags.length > 0) {
            elements.selectNoteTag.value = note.tags[0];
        }

        if (note.alarm && note.alarm.enabled) {
            elements.chkEnableAlarm.checked = true;
            elements.alarmConfigModule.style.display = 'flex';
            if (note.alarm.timestamp) {
                const date = new Date(note.alarm.timestamp);
                const tzOffset = date.getTimezoneOffset() * 60000;
                elements.inputAlarmDatetime.value = (new Date(date.getTime() - tzOffset)).toISOString().slice(0, 16);
            }
            elements.selectAlarmSound.value = note.alarm.sound || 'siren';
            elements.selectAlarmRepeat.value = note.alarm.repeat || 'none';
        } else {
            elements.chkEnableAlarm.checked = false;
            elements.alarmConfigModule.style.display = 'none';
            const defaultDate = new Date(Date.now() + 3600000);
            const tzOffset = defaultDate.getTimezoneOffset() * 60000;
            elements.inputAlarmDatetime.value = (new Date(defaultDate.getTime() - tzOffset)).toISOString().slice(0, 16);
        }

        renderChecklist(note);
        updateCharCount();
        updateAlarmDisplayInEditor();
        renderNotesList();
        if (isPreviewMode) renderMarkdownPreview();
    }

    function updateAlarmDisplayInEditor() {
        const note = window.notesManager.getNote(window.notesManager.selectedNoteId);
        if (!note || !note.alarm || !note.alarm.enabled || !note.alarm.timestamp) {
            elements.alarmTimeDisplay.textContent = '';
            return;
        }
        const diff = note.alarm.timestamp - Date.now();
        if (diff <= 0) {
            elements.alarmTimeDisplay.textContent = '[DUE NOW]';
        } else {
            elements.alarmTimeDisplay.textContent = `[${window.alarmManager.formatTimeRemaining(diff)}]`;
        }
    }

    function scheduleAutoSave() {
        elements.saveStatus.textContent = 'SAVING...';
        elements.saveStatus.style.color = 'var(--omi-yellow)';
        clearTimeout(autoSaveTimeout);

        autoSaveTimeout = setTimeout(() => {
            saveCurrentNote();
        }, 350);
    }

    function saveCurrentNote() {
        const currentId = window.notesManager.selectedNoteId;
        if (!currentId) return;

        const title = elements.inputNoteTitle.value.trim() || 'Untitled Note';
        const content = elements.inputNoteContent.value;
        const tag = elements.selectNoteTag.value;

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

        window.notesManager.updateNote(currentId, {
            title,
            content,
            tags: [tag],
            alarm
        });

        // Update real-time checklist progress stats
        const updatedNote = window.notesManager.getNote(currentId);
        if (updatedNote) {
            const stats = window.notesManager.getChecklistStats(updatedNote);
            elements.checklistProgressFill.style.width = `${stats.percentage}%`;
            elements.checklistProgressText.textContent = `${stats.completed}/${stats.total} (${stats.percentage}%)`;
        }

        elements.saveStatus.textContent = 'SAVED';
        elements.saveStatus.style.color = 'var(--omi-green)';
        updateCharCount();

        if (window.cyberPlanner && window.cyberPlanner.activeView === 'planner') {
            window.cyberPlanner.renderCalendar();
            window.cyberPlanner.renderAgenda();
        }
    }

    function updateCharCount() {
        const text = elements.inputNoteContent.value;
        const chars = text.length;
        const words = text.trim() ? text.trim().split(/\s+/).length : 0;
        elements.charCount.textContent = `${chars} CHARACTERS // ${words} WORDS`;
    }

    // -------------------------------------------------------------------------
    // 8. INTERACTIVE CHECKLIST LOGIC
    // -------------------------------------------------------------------------
    function renderChecklist(note) {
        if (!note) return;
        elements.checklistItemsList.replaceChildren();

        const stats = window.notesManager.getChecklistStats(note);
        elements.checklistProgressFill.style.width = `${stats.percentage}%`;
        elements.checklistProgressText.textContent = `${stats.completed}/${stats.total} (${stats.percentage}%)`;

        if (!note.checklist || note.checklist.length === 0) {
            const empty = document.createElement('div');
            empty.style.color = 'var(--cyber-text-muted)';
            empty.style.fontFamily = 'var(--font-mono)';
            empty.style.fontSize = '12px';
            empty.style.padding = '8px 0';
            if (stats.total > 0) {
                empty.textContent = `${stats.total} task(s) active in note text. Click PREVIEW [👁] to check them off, or add new tasks below.`;
            } else {
                empty.textContent = 'No tasks added yet. Add one below or type - [ ] in note.';
            }
            elements.checklistItemsList.appendChild(empty);
            return;
        }

        note.checklist.forEach(task => {
            const item = document.createElement('div');
            item.className = `checklist-item ${task.done ? 'done' : ''}`;
            item.setAttribute('role', 'checkbox');
            item.setAttribute('aria-checked', task.done ? 'true' : 'false');
            item.title = 'Click to toggle task';

            const checkBtn = document.createElement('div');
            checkBtn.className = 'checklist-checkbox';
            checkBtn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>`;
            item.appendChild(checkBtn);

            const textSpan = document.createElement('span');
            textSpan.className = 'checklist-item-text';
            textSpan.textContent = task.text;
            item.appendChild(textSpan);

            const delBtn = document.createElement('button');
            delBtn.className = 'checklist-delete-btn';
            delBtn.textContent = '✕';
            delBtn.title = 'Delete task';
            delBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                window.soundEngine.playClick();
                window.notesManager.deleteChecklistItem(note.id, task.id);
                renderChecklist(window.notesManager.getNote(note.id));
                renderNotesList();
            });
            item.appendChild(delBtn);

            item.addEventListener('click', (e) => {
                if (e.target.closest('.checklist-delete-btn')) return;
                const nowDone = window.notesManager.toggleChecklistItem(note.id, task.id);
                if (nowDone) window.soundEngine.playCheck();
                else window.soundEngine.playClick();
                renderChecklist(window.notesManager.getNote(note.id));
                renderNotesList();
            });

            elements.checklistItemsList.appendChild(item);
        });
    }

    function addNewTask() {
        const text = elements.inputNewTask.value.trim();
        if (!text) return;

        const currentId = window.notesManager.selectedNoteId;
        if (!currentId) return;

        window.notesManager.addChecklistItem(currentId, text);
        elements.inputNewTask.value = '';
        window.soundEngine.playSuccess();
        renderChecklist(window.notesManager.getNote(currentId));
        renderNotesList();
    }

    elements.btnAddTask.addEventListener('click', addNewTask);
    elements.inputNewTask.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addNewTask();
        }
    });

    elements.btnToggleChecklist.addEventListener('click', () => {
        window.soundEngine.playClick();
        isChecklistVisible = !isChecklistVisible;
        elements.checklistContainer.style.display = isChecklistVisible ? 'flex' : 'none';
        elements.btnToggleChecklist.classList.toggle('active', isChecklistVisible);
    });

    // -------------------------------------------------------------------------
    // 9. MARKDOWN PREVIEW RENDERER
    // -------------------------------------------------------------------------
    function renderMarkdownPreview() {
        const text = elements.inputNoteContent.value;
        let html = '';
        const lines = text.split('\n');

        lines.forEach((line, lineIndex) => {
            const taskMatch = line.match(/^-\s*\[([ xX])\]\s*(.*)$/);
            if (taskMatch) {
                const isChecked = taskMatch[1].toLowerCase() === 'x';
                const taskText = taskMatch[2];
                html += `
                    <div class="cyber-checkbox-item ${isChecked ? 'checked' : ''}" data-line="${lineIndex}" role="checkbox" aria-checked="${isChecked}" title="Click to toggle task">
                        <div class="cyber-checkbox-box">${isChecked ? '✓' : ''}</div>
                        <span>${formatInlineMarkdown(escapeHtml(taskText))}</span>
                    </div>
                `;
            } else if (line.startsWith('### ')) {
                html += `<h3>${escapeHtml(line.slice(4))}</h3>`;
            } else if (line.startsWith('## ')) {
                html += `<h2>${escapeHtml(line.slice(3))}</h2>`;
            } else if (line.startsWith('# ')) {
                html += `<h1>${escapeHtml(line.slice(2))}</h1>`;
            } else if (line.startsWith('- ')) {
                html += `<li>${formatInlineMarkdown(escapeHtml(line.slice(2)))}</li>`;
            } else if (line.trim() === '') {
                html += `<br>`;
            } else {
                html += `<p>${formatInlineMarkdown(escapeHtml(line))}</p>`;
            }
        });

        elements.noteMarkdownPreview.innerHTML = html;

        elements.noteMarkdownPreview.querySelectorAll('.cyber-checkbox-item').forEach(el => {
            el.addEventListener('click', () => {
                const lineIdx = parseInt(el.getAttribute('data-line'), 10);
                toggleMarkdownTask(lineIdx);
            });
        });
    }

    function toggleMarkdownTask(lineIndex) {
        const lines = elements.inputNoteContent.value.split('\n');
        if (lineIndex < 0 || lineIndex >= lines.length) return;

        const line = lines[lineIndex];
        const match = line.match(/^(-\s*\[)([ xX])(\]\s*.*)$/);
        if (!match) return;

        const isCurrentlyChecked = match[2].toLowerCase() === 'x';
        const newMark = isCurrentlyChecked ? ' ' : 'x';
        lines[lineIndex] = `${match[1]}${newMark}${match[3]}`;

        elements.inputNoteContent.value = lines.join('\n');
        if (!isCurrentlyChecked) window.soundEngine.playCheck();
        else window.soundEngine.playClick();

        saveCurrentNote();
        renderMarkdownPreview();
        const currentId = window.notesManager.selectedNoteId;
        if (currentId) {
            renderChecklist(window.notesManager.getNote(currentId));
            renderNotesList();
        }
    }

    function formatInlineMarkdown(str) {
        return str
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/~~(.*?)~~/g, '<del>$1</del>')
            .replace(/`([^`]+)`/g, '<code>$1</code>');
    }

    function escapeHtml(str) {
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    elements.btnToggleView.addEventListener('click', () => {
        window.soundEngine.playClick();
        isPreviewMode = !isPreviewMode;

        if (isPreviewMode) {
            renderMarkdownPreview();
            elements.inputNoteContent.style.display = 'none';
            elements.noteMarkdownPreview.style.display = 'block';
            elements.viewModeIcon.textContent = '✏';
            elements.btnToggleView.classList.add('active');
            elements.editorStatus.textContent = 'PREVIEW';
        } else {
            elements.inputNoteContent.style.display = 'block';
            elements.noteMarkdownPreview.style.display = 'none';
            elements.viewModeIcon.textContent = '👁';
            elements.btnToggleView.classList.remove('active');
            elements.editorStatus.textContent = 'EDIT';
        }
    });

    // -------------------------------------------------------------------------
    // 10. EVENT LISTENERS & USER ACTIONS
    // -------------------------------------------------------------------------
    elements.btnNewNote.addEventListener('click', () => {
        window.soundEngine.playClick();
        const newNote = window.notesManager.createNote({
            title: 'New Note',
            content: '',
            checklist: []
        });
        selectNote(newNote.id);
        elements.inputNoteTitle.focus();
        elements.inputNoteTitle.select();
    });

    elements.btnTogglePin.addEventListener('click', () => {
        window.soundEngine.playClick();
        const currentId = window.notesManager.selectedNoteId;
        if (!currentId) return;

        const updated = window.notesManager.togglePin(currentId);
        elements.pinIcon.textContent = updated.pinned ? '★' : '☆';
        elements.btnTogglePin.classList.toggle('active', updated.pinned);
        renderNotesList();
    });

    elements.priorityButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            window.soundEngine.playClick();
            elements.priorityButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const currentId = window.notesManager.selectedNoteId;
            if (currentId) {
                window.notesManager.updateNote(currentId, { priority: btn.dataset.priority });
                renderNotesList();
            }
        });
    });

    elements.selectNoteTag.addEventListener('change', () => {
        window.soundEngine.playClick();
        scheduleAutoSave();
    });

    elements.chkEnableAlarm.addEventListener('change', () => {
        window.soundEngine.playClick();
        elements.alarmConfigModule.style.display = elements.chkEnableAlarm.checked ? 'flex' : 'none';
        scheduleAutoSave();
    });

    elements.inputAlarmDatetime.addEventListener('change', scheduleAutoSave);
    elements.selectAlarmSound.addEventListener('change', scheduleAutoSave);
    elements.selectAlarmRepeat.addEventListener('change', scheduleAutoSave);

    elements.inputNoteTitle.addEventListener('input', scheduleAutoSave);
    elements.inputNoteContent.addEventListener('input', scheduleAutoSave);

    // Delete Note (With Confirmation Modal!)
    elements.btnDeleteNote.addEventListener('click', () => {
        const currentId = window.notesManager.selectedNoteId;
        if (!currentId) return;

        const note = window.notesManager.getNote(currentId);
        const title = note ? note.title : 'this note';

        elements.deleteConfirmMessage.textContent = `Are you sure you want to delete "${title}"? This action cannot be undone.`;
        elements.modalConfirmDelete.classList.add('active');
        window.soundEngine.playBuzzer();
    });

    elements.btnCancelDelete.addEventListener('click', () => {
        elements.modalConfirmDelete.classList.remove('active');
        window.soundEngine.playClick();
    });

    elements.btnConfirmDelete.addEventListener('click', () => {
        elements.modalConfirmDelete.classList.remove('active');
        const currentId = window.notesManager.selectedNoteId;
        if (!currentId) return;

        window.notesManager.deleteNote(currentId);
        window.soundEngine.playBuzzer();

        const all = window.notesManager.getFilteredNotes();
        if (all.length > 0) {
            selectNote(all[0].id);
        } else {
            elements.inputNoteTitle.value = '';
            elements.inputNoteContent.value = '';
            elements.checklistItemsList.replaceChildren();
            elements.charCount.textContent = '0 CHARACTERS // 0 WORDS';
        }
        renderNotesList();

        if (window.cyberPlanner) {
            window.cyberPlanner.renderCalendar();
            window.cyberPlanner.renderAgenda();
        }
    });

    // Export single note as Markdown
    elements.btnExportMd.addEventListener('click', () => {
        const note = window.notesManager.getNote(window.notesManager.selectedNoteId);
        if (!note) return;

        window.soundEngine.playSuccess();
        let md = `# ${note.title}\n\n`;
        if (note.checklist && note.checklist.length > 0) {
            md += `### Tasks\n`;
            note.checklist.forEach(t => {
                md += `- [${t.done ? 'x' : ' '}] ${t.text}\n`;
            });
            md += `\n### Notes\n`;
        }
        md += note.content;

        const blob = new Blob([md], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${note.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.md`;
        a.click();
        URL.revokeObjectURL(url);
    });

    // Backup & Restore Library
    elements.btnExportAll.addEventListener('click', () => {
        window.soundEngine.playSuccess();
        window.notesManager.exportJSON();
    });

    // Left Sidebar Filter Categories
    elements.filterItems.forEach(item => {
        item.addEventListener('click', () => {
            window.soundEngine.playClick();
            elements.filterItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            window.notesManager.activeFilter.category = item.dataset.category;
            renderNotesList();
        });
    });

    // Quick Timers
    elements.quickTimers.forEach(btn => {
        btn.addEventListener('click', () => {
            window.soundEngine.playSuccess();
            const mins = parseInt(btn.dataset.timer, 10);
            const target = Date.now() + mins * 60 * 1000;

            const currentId = window.notesManager.selectedNoteId;
            if (currentId) {
                const note = window.notesManager.getNote(currentId);
                const updatedAlarm = {
                    enabled: true,
                    timestamp: target,
                    sound: 'siren',
                    repeat: 'none',
                    label: note.title,
                    triggered: false
                };
                window.notesManager.updateNote(currentId, { alarm: updatedAlarm });
                selectNote(currentId);
            }
        });
    });

    // Add Custom Tag
    elements.btnAddCustomTag.addEventListener('click', () => {
        const tag = prompt("Enter new tag name:");
        if (tag) {
            window.soundEngine.playClick();
            window.notesManager.addCustomTag(tag);
            renderTags();
        }
    });

    // Search and Sort
    elements.inputSearch.addEventListener('input', () => {
        window.notesManager.activeFilter.searchQuery = elements.inputSearch.value.trim();
        renderNotesList();
    });

    elements.selectSort.addEventListener('change', () => {
        window.soundEngine.playClick();
        window.notesManager.sortBy = elements.selectSort.value;
        renderNotesList();
    });

    // -------------------------------------------------------------------------
    // 11. ALARM ALERT MODAL ACTIONS
    // -------------------------------------------------------------------------
    window.alarmManager.onAlarmTriggered = (note) => {
        elements.alarmModalTitle.textContent = note.title;
        elements.alarmModalDesc.textContent = note.content ? note.content.slice(0, 160) : 'Reminder is due now.';
        elements.alarmModal.classList.add('active');
    };

    window.alarmManager.onAlarmDismissed = () => {
        elements.alarmModal.classList.remove('active');
        renderNotesList();
    };

    elements.btnSnooze5.addEventListener('click', () => window.alarmManager.snooze(5));
    elements.btnSnooze15.addEventListener('click', () => window.alarmManager.snooze(15));
    elements.btnDismissAlarm.addEventListener('click', () => window.alarmManager.dismiss());

    // -------------------------------------------------------------------------
    // 12. KEYBOARD SHORTCUTS
    // -------------------------------------------------------------------------
    document.addEventListener('keydown', (e) => {
        // Ctrl+N: New note
        if (e.ctrlKey && e.key.toLowerCase() === 'n') {
            e.preventDefault();
            elements.btnNewNote.click();
        }
        // Ctrl+S: Instant save
        else if (e.ctrlKey && e.key.toLowerCase() === 's') {
            e.preventDefault();
            saveCurrentNote();
            window.soundEngine.playSuccess();
        }
        // Ctrl+F: Search focus
        else if (e.ctrlKey && e.key.toLowerCase() === 'f') {
            e.preventDefault();
            elements.inputSearch.focus();
            elements.inputSearch.select();
        }
        // Escape: Close open modals
        else if (e.key === 'Escape') {
            if (elements.alarmModal.classList.contains('active')) {
                window.alarmManager.dismiss();
            }
            elements.modalConfirmDelete.classList.remove('active');
            elements.modalTypingSettings.classList.remove('active');
            elements.modalCustomTheme.classList.remove('active');
        }
    });

    // -------------------------------------------------------------------------
    // INITIAL BOOTSTRAP
    // -------------------------------------------------------------------------
    window.selectNote = selectNote;
    window.renderNotesList = renderNotesList;

    renderTags();
    const initialNotes = window.notesManager.getAllNotes();
    if (initialNotes.length > 0) {
        selectNote(initialNotes[0].id);
    }
    renderNotesList();

    if (window.cyberPlanner) {
        window.cyberPlanner.init();
    }
});
