/**
 * SNNOTES // CYBER PLANNER & CALENDAR CONTROLLER
 * Unifies alarms, scheduled notes, daily checklists, and month/day timelines.
 */

class CyberPlanner {
    constructor() {
        this.currentYear = new Date().getFullYear();
        this.currentMonth = new Date().getMonth(); // 0-11
        this.selectedDateStr = this.toDateStr(Date.now());
        this.activeView = 'notes'; // 'notes' or 'planner'

        this.elements = {};
    }

    init() {
        this.bindElements();
        this.bindEvents();
        this.renderCalendar();
        this.renderAgenda();
    }

    toDateStr(dateOrTs) {
        const d = new Date(dateOrTs);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    }

    bindElements() {
        this.elements = {
            // View toggle buttons in HUD
            btnViewNotes: document.getElementById('btnViewNotes'),
            btnViewPlanner: document.getElementById('btnViewPlanner'),
            notesWorkspace: document.getElementById('notesWorkspace'),
            plannerWorkspace: document.getElementById('plannerWorkspace'),

            // Calendar
            calendarMonthTitle: document.getElementById('calendarMonthTitle'),
            btnPrevMonth: document.getElementById('btnPrevMonth'),
            btnNextMonth: document.getElementById('btnNextMonth'),
            btnToday: document.getElementById('btnToday'),
            calendarDaysGrid: document.getElementById('calendarDaysGrid'),

            // Agenda
            agendaDateTitle: document.getElementById('agendaDateTitle'),
            agendaProgressFill: document.getElementById('agendaProgressFill'),
            agendaProgressText: document.getElementById('agendaProgressText'),
            agendaTimelineList: document.getElementById('agendaTimelineList'),
            btnQuickAddPlan: document.getElementById('btnQuickAddPlan'),
            inputPlanTime: document.getElementById('inputPlanTime'),
            inputPlanTitle: document.getElementById('inputPlanTitle'),
            chkPlanAlarm: document.getElementById('chkPlanAlarm'),
            selectPlanSound: document.getElementById('selectPlanSound')
        };
    }

    bindEvents() {
        if (this.elements.btnViewNotes && this.elements.btnViewPlanner) {
            this.elements.btnViewNotes.addEventListener('click', () => {
                window.soundEngine.playClick();
                this.switchView('notes');
            });
            this.elements.btnViewPlanner.addEventListener('click', () => {
                window.soundEngine.playClick();
                this.switchView('planner');
            });
        }

        if (this.elements.btnPrevMonth) {
            this.elements.btnPrevMonth.addEventListener('click', () => {
                window.soundEngine.playClick();
                this.prevMonth();
            });
        }

        if (this.elements.btnNextMonth) {
            this.elements.btnNextMonth.addEventListener('click', () => {
                window.soundEngine.playClick();
                this.nextMonth();
            });
        }

        if (this.elements.btnToday) {
            this.elements.btnToday.addEventListener('click', () => {
                window.soundEngine.playSuccess();
                this.goToToday();
            });
        }

        if (this.elements.btnQuickAddPlan) {
            this.elements.btnQuickAddPlan.addEventListener('click', () => {
                this.addPlanItem();
            });
        }

        if (this.elements.inputPlanTitle) {
            this.elements.inputPlanTitle.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.addPlanItem();
                }
            });
        }
    }

    switchView(view) {
        this.activeView = view;
        if (view === 'planner') {
            this.elements.notesWorkspace.style.display = 'none';
            this.elements.plannerWorkspace.style.display = 'grid';
            this.elements.btnViewNotes.classList.remove('active');
            this.elements.btnViewPlanner.classList.add('active');
            this.renderCalendar();
            this.renderAgenda();
        } else {
            this.elements.plannerWorkspace.style.display = 'none';
            this.elements.notesWorkspace.style.display = 'grid';
            this.elements.btnViewPlanner.classList.remove('active');
            this.elements.btnViewNotes.classList.add('active');
            if (window.renderNotesList) window.renderNotesList();
        }
    }

    prevMonth() {
        this.currentMonth--;
        if (this.currentMonth < 0) {
            this.currentMonth = 11;
            this.currentYear--;
        }
        this.renderCalendar();
    }

    nextMonth() {
        this.currentMonth++;
        if (this.currentMonth > 11) {
            this.currentMonth = 0;
            this.currentYear++;
        }
        this.renderCalendar();
    }

    goToToday() {
        const now = new Date();
        this.currentYear = now.getFullYear();
        this.currentMonth = now.getMonth();
        this.selectedDateStr = this.toDateStr(now);
        this.renderCalendar();
        this.renderAgenda();
    }

    // Returns all notes relevant for dateStr
    getNotesForDate(dateStr) {
        const allNotes = window.notesManager.getAllNotes();
        const targetDate = new Date(dateStr + 'T00:00:00');
        const targetDayOfWeek = targetDate.getDay();

        return allNotes.filter(note => {
            // Direct scheduledDate match
            if (note.scheduledDate === dateStr) return true;

            // Alarm match (exact date)
            if (note.alarm && note.alarm.enabled && note.alarm.timestamp) {
                const alarmDateStr = this.toDateStr(note.alarm.timestamp);
                if (alarmDateStr === dateStr) return true;

                // Repeating alarm: daily - show on every future day
                const repeat = note.alarm.repeat;
                if (repeat === 'daily' && targetDate.getTime() >= new Date(this.toDateStr(note.alarm.timestamp) + 'T00:00:00').getTime()) {
                    return true;
                }
                // Repeating alarm: weekly - show on matching weekday
                if (repeat === 'weekly') {
                    const alarmDay = new Date(note.alarm.timestamp).getDay();
                    if (alarmDay === targetDayOfWeek && targetDate.getTime() >= new Date(this.toDateStr(note.alarm.timestamp) + 'T00:00:00').getTime()) {
                        return true;
                    }
                }
            }

            return false;
        });
    }

    renderCalendar() {
        if (!this.elements.calendarDaysGrid) return;

        const monthNames = [
            'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
            'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
        ];
        this.elements.calendarMonthTitle.textContent = `${monthNames[this.currentMonth]} ${this.currentYear}`;

        this.elements.calendarDaysGrid.replaceChildren();

        const todayStr = this.toDateStr(Date.now());

        // First day of current month (0: Sunday, 1: Monday, ...)
        const firstDay = new Date(this.currentYear, this.currentMonth, 1).getDay();
        // Convert to Monday=0, Sunday=6
        const startOffset = (firstDay + 6) % 7;

        // Days in current month
        const daysInMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
        // Days in previous month
        const daysInPrevMonth = new Date(this.currentYear, this.currentMonth, 0).getDate();

        // Total cells (multiples of 7: 35 or 42)
        const totalCells = (startOffset + daysInMonth > 35) ? 42 : 35;

        for (let i = 0; i < totalCells; i++) {
            const cell = document.createElement('div');
            cell.className = 'calendar-day-cell cyber-cut-sm';

            let cellDate;
            let isCurrentMonth = true;

            if (i < startOffset) {
                // Previous month padding
                const prevDayNum = daysInPrevMonth - startOffset + i + 1;
                cellDate = new Date(this.currentYear, this.currentMonth - 1, prevDayNum);
                isCurrentMonth = false;
                cell.classList.add('is-other-month');
            } else if (i >= startOffset + daysInMonth) {
                // Next month padding
                const nextDayNum = i - (startOffset + daysInMonth) + 1;
                cellDate = new Date(this.currentYear, this.currentMonth + 1, nextDayNum);
                isCurrentMonth = false;
                cell.classList.add('is-other-month');
            } else {
                // Current month day
                const dayNum = i - startOffset + 1;
                cellDate = new Date(this.currentYear, this.currentMonth, dayNum);
            }

            const cellDateStr = this.toDateStr(cellDate);
            cell.dataset.date = cellDateStr;

            if (cellDateStr === todayStr) {
                cell.classList.add('is-today');
            }

            if (cellDateStr === this.selectedDateStr) {
                cell.classList.add('is-selected');
            }

            // Top row with Day Number
            const topRow = document.createElement('div');
            topRow.className = 'cell-top-row';

            const dayNumEl = document.createElement('span');
            dayNumEl.className = 'cell-day-number';
            dayNumEl.textContent = cellDate.getDate();
            topRow.appendChild(dayNumEl);

            if (cellDateStr === todayStr) {
                const todayBadge = document.createElement('span');
                todayBadge.className = 'cell-today-badge';
                todayBadge.textContent = 'TODAY';
                topRow.appendChild(todayBadge);
            }

            cell.appendChild(topRow);

            // Badges / Indicators
            const dayNotes = this.getNotesForDate(cellDateStr);
            if (dayNotes.length > 0) {
                const badgesWrap = document.createElement('div');
                badgesWrap.className = 'cell-badges-wrap';

                let alarmsCount = 0;
                let tasksCount = 0;
                let tasksDone = 0;

                dayNotes.forEach(note => {
                    if (note.alarm && note.alarm.enabled) alarmsCount++;
                    if (note.checklist && note.checklist.length > 0) {
                        tasksCount += note.checklist.length;
                        tasksDone += note.checklist.filter(t => t.done).length;
                    }
                });

                if (alarmsCount > 0) {
                    const alarmBadge = document.createElement('div');
                    alarmBadge.className = 'cal-badge cal-badge-alarm';
                    alarmBadge.innerHTML = `<span class="badge-dot"></span><span>${alarmsCount} ALARM${alarmsCount > 1 ? 'S' : ''}</span>`;
                    badgesWrap.appendChild(alarmBadge);
                }

                if (tasksCount > 0) {
                    const taskBadge = document.createElement('div');
                    taskBadge.className = 'cal-badge cal-badge-task';
                    taskBadge.textContent = `☑ ${tasksDone}/${tasksCount}`;
                    badgesWrap.appendChild(taskBadge);
                } else if (alarmsCount === 0 && dayNotes.length > 0) {
                    const noteBadge = document.createElement('div');
                    noteBadge.className = 'cal-badge cal-badge-note';
                    noteBadge.textContent = `📝 ${dayNotes.length} NOTE${dayNotes.length > 1 ? 'S' : ''}`;
                    badgesWrap.appendChild(noteBadge);
                }

                cell.appendChild(badgesWrap);
            }

            // Click to select day
            cell.addEventListener('click', () => {
                window.soundEngine.playClick();
                this.selectedDateStr = cellDateStr;
                document.querySelectorAll('.calendar-day-cell').forEach(c => c.classList.remove('is-selected'));
                cell.classList.add('is-selected');
                this.renderAgenda();
            });

            this.elements.calendarDaysGrid.appendChild(cell);
        }
    }

    renderAgenda() {
        if (!this.elements.agendaTimelineList) return;

        const dateObj = new Date(this.selectedDateStr + 'T00:00:00');
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        this.elements.agendaDateTitle.textContent = dateObj.toLocaleDateString('en-US', options).toUpperCase();

        const dayNotes = this.getNotesForDate(this.selectedDateStr);
        this.elements.agendaTimelineList.replaceChildren();

        // Calculate day task progress
        let totalTasks = 0;
        let completedTasks = 0;

        dayNotes.forEach(n => {
            if (n.checklist && n.checklist.length > 0) {
                totalTasks += n.checklist.length;
                completedTasks += n.checklist.filter(t => t.done).length;
            }
        });

        const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        this.elements.agendaProgressFill.style.width = `${percentage}%`;
        this.elements.agendaProgressText.textContent = `${completedTasks}/${totalTasks} TASKS (${percentage}%)`;

        if (dayNotes.length === 0) {
            const emptyEl = document.createElement('div');
            emptyEl.className = 'agenda-empty-state';
            emptyEl.innerHTML = `
                <div style="font-family: var(--font-heading); font-size: 14px; color: var(--cyber-text-dim); margin-bottom: 6px;">NO PLANS FOR THIS DAY</div>
                <div style="font-family: var(--font-mono); font-size: 12px; color: var(--cyber-text-muted);">Use the quick planner form below to schedule an alarm or task.</div>
            `;
            this.elements.agendaTimelineList.appendChild(emptyEl);
            return;
        }

        // Sort items by alarm time or update time
        dayNotes.sort((a, b) => {
            const timeA = (a.alarm && a.alarm.enabled && a.alarm.timestamp) ? a.alarm.timestamp : a.createdAt;
            const timeB = (b.alarm && b.alarm.enabled && b.alarm.timestamp) ? b.alarm.timestamp : b.createdAt;
            return timeA - timeB;
        });

        dayNotes.forEach(note => {
            const card = document.createElement('div');
            card.className = `agenda-item-card cyber-cut-sm`;
            card.setAttribute('data-priority', note.priority);

            // Left Time Column
            const timeCol = document.createElement('div');
            timeCol.className = 'agenda-time-col';

            let displayTime = '--:--';
            if (note.alarm && note.alarm.enabled && note.alarm.timestamp) {
                const alarmDate = new Date(note.alarm.timestamp);
                displayTime = `${String(alarmDate.getHours()).padStart(2, '0')}:${String(alarmDate.getMinutes()).padStart(2, '0')}`;
            }
            timeCol.textContent = displayTime;
            card.appendChild(timeCol);

            // Center Content
            const contentCol = document.createElement('div');
            contentCol.className = 'agenda-content-col';

            const headerRow = document.createElement('div');
            headerRow.className = 'agenda-item-header';

            const title = document.createElement('div');
            title.className = 'agenda-item-title';
            title.textContent = note.title;
            headerRow.appendChild(title);

            if (note.alarm && note.alarm.enabled) {
                const alarmBadge = document.createElement('span');
                alarmBadge.className = 'agenda-alarm-badge';
                const repeatStr = note.alarm.repeat !== 'none' ? ` (${note.alarm.repeat.toUpperCase()})` : '';
                alarmBadge.innerHTML = `⏰ ${note.alarm.sound.toUpperCase()}${repeatStr}`;
                headerRow.appendChild(alarmBadge);
            }

            contentCol.appendChild(headerRow);

            // Snippet of note content if any
            if (note.content && note.content.trim()) {
                const snippet = document.createElement('div');
                snippet.className = 'agenda-item-snippet';
                snippet.textContent = note.content.slice(0, 100);
                contentCol.appendChild(snippet);
            }

            // Interactive Checklists inside Agenda
            if (note.checklist && note.checklist.length > 0) {
                const checklistWrap = document.createElement('div');
                checklistWrap.className = 'agenda-checklist-wrap';

                note.checklist.forEach(task => {
                    const taskRow = document.createElement('div');
                    taskRow.className = `agenda-task-row ${task.done ? 'done' : ''}`;

                    const checkbox = document.createElement('div');
                    checkbox.className = 'agenda-task-checkbox';
                    checkbox.innerHTML = `<svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>`;
                    checkbox.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const isDone = window.notesManager.toggleChecklistItem(note.id, task.id);
                        if (isDone) window.soundEngine.playCheck();
                        else window.soundEngine.playClick();
                        this.renderAgenda();
                        this.renderCalendar();
                    });
                    taskRow.appendChild(checkbox);

                    const taskLabel = document.createElement('span');
                    taskLabel.className = 'agenda-task-text';
                    taskLabel.textContent = task.text;
                    taskRow.appendChild(taskLabel);

                    checklistWrap.appendChild(taskRow);
                });

                contentCol.appendChild(checklistWrap);
            }

            card.appendChild(contentCol);

            // Right Action: Open in Note Editor
            const actionsCol = document.createElement('div');
            actionsCol.className = 'agenda-actions-col';

            const btnOpen = document.createElement('button');
            btnOpen.className = 'btn-agenda-action';
            btnOpen.title = 'Open in Notes Editor';
            btnOpen.innerHTML = '<span>↗</span> OPEN';
            btnOpen.addEventListener('click', () => {
                window.soundEngine.playClick();
                this.openInNotesEditor(note.id);
            });
            actionsCol.appendChild(btnOpen);

            card.appendChild(actionsCol);
            this.elements.agendaTimelineList.appendChild(card);
        });
    }

    addPlanItem() {
        const title = this.elements.inputPlanTitle.value.trim();
        if (!title) return;

        const timeStr = this.elements.inputPlanTime.value || '12:00';
        const [hours, minutes] = timeStr.split(':').map(Number);

        const scheduledDate = new Date(`${this.selectedDateStr}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`);
        const timestamp = scheduledDate.getTime();

        const withAlarm = this.elements.chkPlanAlarm.checked;
        const sound = this.elements.selectPlanSound.value || 'siren';

        let alarm = null;
        if (withAlarm) {
            alarm = {
                enabled: true,
                timestamp: timestamp,
                sound: sound,
                repeat: 'none',
                label: title,
                triggered: false
            };
        }

        const newNote = window.notesManager.createNote({
            title: title,
            content: `Scheduled plan for ${this.selectedDateStr} at ${timeStr}.`,
            scheduledDate: this.selectedDateStr,
            checklist: [
                { id: 'task_' + Date.now(), text: title, done: false }
            ],
            tags: ['PLAN', 'TODO'],
            priority: withAlarm ? 'high' : 'med',
            alarm: alarm
        });

        this.elements.inputPlanTitle.value = '';
        window.soundEngine.playSuccess();
        this.renderCalendar();
        this.renderAgenda();
    }

    openInNotesEditor(noteId) {
        this.switchView('notes');
        if (window.selectNote) {
            window.selectNote(noteId);
        }
    }
}

window.cyberPlanner = new CyberPlanner();
