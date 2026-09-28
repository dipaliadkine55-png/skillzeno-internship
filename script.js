const STORAGE_KEY = 'daymark-dashboard-v1';
const todayKey = localDateKey(new Date());
const state = loadState();
let currentFilter = 'all';
let editingTaskId = null;
let editingNoteId = null;
let toastTimer;

const elements = {
  taskList: document.querySelector('#task-list'),
  taskEmpty: document.querySelector('#task-empty'),
  emptyTitle: document.querySelector('#empty-title'),
  emptyDescription: document.querySelector('#empty-description'),
  taskSearch: document.querySelector('#task-search'),
  noteSearch: document.querySelector('#note-search'),
  deadlineList: document.querySelector('#deadline-list'),
  deadlineEmpty: document.querySelector('#deadline-empty'),
  noteList: document.querySelector('#note-list'),
  notesEmpty: document.querySelector('#notes-empty'),
  taskDialog: document.querySelector('#task-dialog'),
  noteDialog: document.querySelector('#note-dialog'),
  goalDialog: document.querySelector('#goal-dialog'),
  toast: document.querySelector('#toast'),
};

function localDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function loadState() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return {
      tasks: Array.isArray(stored.tasks) ? stored.tasks : [],
      notes: Array.isArray(stored.notes) ? stored.notes : [],
      dailyGoals: stored.dailyGoals && typeof stored.dailyGoals === 'object' ? stored.dailyGoals : {},
    };
  } catch {
    return { tasks: [], notes: [], dailyGoals: {} };
  }
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    showToast('Could not save. Check this browser’s storage settings.');
    return false;
  }
}

function escapeDate(value) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value, options = { month: 'short', day: 'numeric' }) {
  const date = escapeDate(value);
  return date ? new Intl.DateTimeFormat(undefined, options).format(date) : '';
}

function makeId() {
  return globalThis.crypto?.randomUUID?.() || `item-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function node(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => elements.toast.classList.remove('show'), 2400);
}

function todayLabel() {
  const now = new Date();
  return new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).format(now).toUpperCase();
}

function sortedTasks(tasks) {
  const priority = { high: 0, medium: 1, low: 2 };
  return [...tasks].sort((a, b) => Number(a.completed) - Number(b.completed)
    || (priority[a.priority] ?? 1) - (priority[b.priority] ?? 1)
    || (a.dueDate || '9999-99-99').localeCompare(b.dueDate || '9999-99-99')
    || (b.createdAt || '').localeCompare(a.createdAt || ''));
}

function renderStats() {
  const completed = state.tasks.filter((task) => task.completed).length;
  const pending = state.tasks.length - completed;
  const progress = state.tasks.length ? Math.round(completed / state.tasks.length * 100) : 0;
  document.querySelector('#stat-completed').textContent = completed;
  document.querySelector('#stat-pending').textContent = pending;
  document.querySelector('#stat-progress').innerHTML = `${progress}<span>%</span>`;
  document.querySelector('#progress-bar').style.width = `${progress}%`;
  document.querySelector('#progress-caption').textContent = progress === 100 && state.tasks.length ? 'Look at you go!' : progress ? 'You’re finding your rhythm' : 'Ready when you are';
  document.querySelector('#progress-detail').textContent = `${completed} of ${state.tasks.length} task${state.tasks.length === 1 ? '' : 's'} completed`;
  document.querySelector('#task-total').textContent = state.tasks.length;
  document.querySelector('#nav-task-count').textContent = pending;
  document.querySelector('#date-label').textContent = todayLabel();

  const doneToday = state.tasks.filter((task) => task.completed && task.completedAt === todayKey).length;
  const daily = state.dailyGoals[todayKey] || { target: 3 };
  const target = Math.max(1, Math.min(20, Number(daily.target) || 3));
  const ringProgress = Math.min(1, doneToday / target);
  const degrees = Math.round(ringProgress * 360);
  document.querySelector('#goal-count').innerHTML = `${doneToday}<span> / ${target}</span>`;
  document.querySelector('#goal-ring').style.background = `conic-gradient(#77936e 0deg, #77936e ${degrees}deg, #d5ddcf ${degrees}deg, #d5ddcf 360deg)`;
  document.querySelector('#goal-ring').setAttribute('aria-label', `${doneToday} of ${target} daily goals completed`);
  document.querySelector('#goal-description').textContent = doneToday >= target ? 'You reached the intention you set for today.' : `${Math.max(0, target - doneToday)} more ${target - doneToday === 1 ? 'task' : 'tasks'} to meet today’s intention.`;
}

function taskMatchesFilter(task) {
  if (currentFilter === 'completed') return task.completed;
  if (task.completed) return false;
  if (currentFilter === 'today') return !task.dueDate || task.dueDate <= todayKey;
  if (currentFilter === 'upcoming') return Boolean(task.dueDate && task.dueDate > todayKey);
  return true;
}

function renderTasks() {
  const query = elements.taskSearch.value.trim().toLocaleLowerCase();
  const filtered = sortedTasks(state.tasks.filter((task) => {
    const searchable = `${task.title || ''} ${task.subject || ''} ${task.priority || ''}`.toLocaleLowerCase();
    return taskMatchesFilter(task) && searchable.includes(query);
  }));
  elements.taskList.replaceChildren(...filtered.map(createTaskRow));
  const showEmpty = filtered.length === 0;
  elements.taskEmpty.classList.toggle('visible', showEmpty);
  if (state.tasks.length === 0) {
    elements.emptyTitle.textContent = 'A fresh page.';
    elements.emptyDescription.textContent = 'Add your first task and give your day a little direction.';
    document.querySelector('#empty-add').hidden = false;
  } else {
    elements.emptyTitle.textContent = query ? 'Nothing found.' : 'No tasks in this view.';
    elements.emptyDescription.textContent = query ? 'Try a different search or clear the search box.' : 'Switch filters or add a new task to get started.';
    document.querySelector('#empty-add').hidden = currentFilter !== 'all' || Boolean(query);
  }
  renderStats();
}

function createTaskRow(task) {
  const row = node('article', `task-item${task.completed ? ' is-complete' : ''}`);
  const checkbox = node('input', 'task-check');
  checkbox.type = 'checkbox';
  checkbox.checked = Boolean(task.completed);
  checkbox.setAttribute('aria-label', `${task.completed ? 'Mark incomplete' : 'Complete'}: ${task.title}`);
  checkbox.addEventListener('change', () => toggleTask(task.id, checkbox.checked));

  const main = node('div', 'task-main');
  main.append(node('span', 'task-title', task.title));
  const meta = node('div', 'task-meta');
  if (task.subject) meta.append(node('span', 'subject-tag', task.subject));
  const priority = node('span', `priority-tag priority-${task.priority || 'medium'}`, `${(task.priority || 'medium').toUpperCase()} PRIORITY`);
  meta.append(priority);
  if (task.dueDate) {
    const date = escapeDate(task.dueDate);
    const due = node('span', `due-tag${date && date < new Date(todayKey + 'T00:00:00') && !task.completed ? ' overdue' : ''}`, `◷ ${task.dueDate === todayKey ? 'Today' : formatDate(task.dueDate)}`);
    meta.append(due);
  }
  main.append(meta);
  const actions = node('div', 'task-actions');
  const edit = node('button', 'task-action', '✎');
  edit.type = 'button'; edit.setAttribute('aria-label', `Edit ${task.title}`); edit.title = 'Edit task';
  edit.addEventListener('click', () => openTaskDialog(task));
  const remove = node('button', 'task-action', '×');
  remove.type = 'button'; remove.setAttribute('aria-label', `Delete ${task.title}`); remove.title = 'Delete task';
  remove.addEventListener('click', () => deleteTask(task.id));
  actions.append(edit, remove);
  row.append(checkbox, main, actions);
  return row;
}

function toggleTask(id, completed) {
  const task = state.tasks.find((entry) => entry.id === id);
  if (!task) return;
  task.completed = completed;
  task.completedAt = completed ? todayKey : null;
  persist();
  renderAll();
  showToast(completed ? 'One small win, checked off.' : 'Task moved back to your list.');
}

function openTaskDialog(task = null) {
  editingTaskId = task?.id || null;
  document.querySelector('#task-dialog-title').textContent = task ? 'Edit task' : 'Add a task';
  document.querySelector('#save-task').innerHTML = task ? 'Save changes <span>↗</span>' : 'Save task <span>↗</span>';
  document.querySelector('#task-title').value = task?.title || '';
  document.querySelector('#task-subject').value = task?.subject || '';
  document.querySelector('#task-date').value = task?.dueDate || '';
  document.querySelector('#task-priority').value = task?.priority || 'medium';
  elements.taskDialog.showModal();
  document.querySelector('#task-title').focus();
}

function saveTask(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const values = new FormData(form);
  const title = String(values.get('title')).trim();
  if (!title) return;
  if (editingTaskId) {
    const task = state.tasks.find((entry) => entry.id === editingTaskId);
    if (task) Object.assign(task, { title, subject: String(values.get('subject')).trim(), dueDate: String(values.get('dueDate')), priority: String(values.get('priority')) });
    showToast('Task updated.');
  } else {
    state.tasks.unshift({ id: makeId(), title, subject: String(values.get('subject')).trim(), dueDate: String(values.get('dueDate')), priority: String(values.get('priority')), completed: false, completedAt: null, createdAt: new Date().toISOString() });
    showToast('Task added to your list.');
  }
  persist();
  elements.taskDialog.close();
  form.reset();
  renderAll();
}

function deleteTask(id) {
  const task = state.tasks.find((entry) => entry.id === id);
  if (!task || !window.confirm(`Delete “${task.title}”?`)) return;
  state.tasks = state.tasks.filter((entry) => entry.id !== id);
  persist(); renderAll(); showToast('Task deleted.');
}

function renderDeadlines() {
  const upcoming = state.tasks.filter((task) => !task.completed && task.dueDate && task.dueDate >= todayKey)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate)).slice(0, 5);
  elements.deadlineList.replaceChildren(...upcoming.map((task) => {
    const row = node('div', 'deadline-item');
    const date = escapeDate(task.dueDate);
    const badge = node('div', 'deadline-date');
    badge.append(node('b', '', date ? String(date.getDate()).padStart(2, '0') : '—'), node('span', '', date ? new Intl.DateTimeFormat(undefined, { month: 'short' }).format(date).toUpperCase() : 'DATE'));
    const copy = node('div', 'deadline-copy');
    copy.append(node('b', '', task.title));
    copy.append(node('span', task.dueDate === todayKey ? 'deadline-today' : '', task.dueDate === todayKey ? 'Due today' : `Due in ${daysUntil(task.dueDate)} day${daysUntil(task.dueDate) === 1 ? '' : 's'}`));
    row.append(badge, copy);
    return row;
  }));
  elements.deadlineEmpty.hidden = upcoming.length > 0;
}

function daysUntil(value) {
  const date = escapeDate(value);
  if (!date) return 0;
  return Math.max(0, Math.round((date - new Date(todayKey + 'T00:00:00')) / 86400000));
}

function renderNotes() {
  const query = elements.noteSearch.value.trim().toLocaleLowerCase();
  const filtered = [...state.notes].filter((note) => `${note.title || ''} ${note.body || ''}`.toLocaleLowerCase().includes(query))
    .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
  elements.noteList.replaceChildren(...filtered.map(createNoteCard));
  elements.notesEmpty.hidden = filtered.length > 0;
  elements.notesEmpty.textContent = query ? 'No notes match that search.' : state.notes.length ? 'No notes yet.' : 'Your good ideas can live here.';
}

function createNoteCard(note) {
  const card = node('article', 'note-card');
  const top = node('div', 'note-card-top');
  top.append(node('h3', '', note.title));
  const actions = node('div', 'note-actions');
  const edit = node('button', 'note-action', '✎');
  edit.type = 'button'; edit.setAttribute('aria-label', `Edit note: ${note.title}`); edit.title = 'Edit note';
  edit.addEventListener('click', () => openNoteDialog(note));
  const remove = node('button', 'note-action', '×');
  remove.type = 'button'; remove.setAttribute('aria-label', `Delete note: ${note.title}`); remove.title = 'Delete note';
  remove.addEventListener('click', () => deleteNote(note.id));
  actions.append(edit, remove);
  top.append(actions);
  card.append(top, node('p', '', note.body));
  card.append(node('div', 'note-date', `UPDATED ${formatNoteDate(note.updatedAt)}`));
  return card;
}

function formatNoteDate(value) {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? 'JUST NOW' : new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date).toUpperCase();
}

function openNoteDialog(note = null) {
  editingNoteId = note?.id || null;
  document.querySelector('#note-dialog-title').textContent = note ? 'Edit note' : 'Add a note';
  document.querySelector('#save-note').innerHTML = note ? 'Save changes <span>↗</span>' : 'Save note <span>↗</span>';
  document.querySelector('#note-title').value = note?.title || '';
  document.querySelector('#note-body').value = note?.body || '';
  elements.noteDialog.showModal();
  document.querySelector('#note-title').focus();
}

function saveNote(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const values = new FormData(form);
  const title = String(values.get('title')).trim();
  const body = String(values.get('body')).trim();
  if (!title || !body) return;
  const now = new Date().toISOString();
  if (editingNoteId) {
    const note = state.notes.find((entry) => entry.id === editingNoteId);
    if (note) Object.assign(note, { title, body, updatedAt: now });
    showToast('Note updated.');
  } else {
    state.notes.unshift({ id: makeId(), title, body, createdAt: now, updatedAt: now });
    showToast('Note saved for later.');
  }
  persist(); elements.noteDialog.close(); form.reset(); renderNotes();
}

function deleteNote(id) {
  const note = state.notes.find((entry) => entry.id === id);
  if (!note || !window.confirm(`Delete the note “${note.title}”?`)) return;
  state.notes = state.notes.filter((entry) => entry.id !== id);
  persist(); renderNotes(); showToast('Note deleted.');
}

function openGoalDialog() {
  document.querySelector('#goal-target').value = state.dailyGoals[todayKey]?.target || 3;
  elements.goalDialog.showModal();
  document.querySelector('#goal-target').focus();
}

function saveGoal(event) {
  event.preventDefault();
  const input = document.querySelector('#goal-target');
  if (!input.reportValidity()) return;
  state.dailyGoals[todayKey] = { target: Math.max(1, Math.min(20, Number(input.value))) };
  persist(); elements.goalDialog.close(); renderStats(); showToast('Today’s intention updated.');
}

function renderAll() {
  renderTasks();
  renderDeadlines();
  renderNotes();
}

document.querySelector('#add-task').addEventListener('click', () => openTaskDialog());
document.querySelector('#empty-add').addEventListener('click', () => openTaskDialog());
document.querySelector('#task-form').addEventListener('submit', saveTask);
document.querySelector('#note-form').addEventListener('submit', saveNote);
document.querySelector('#goal-form').addEventListener('submit', saveGoal);
document.querySelector('#add-note').addEventListener('click', () => openNoteDialog());
document.querySelector('#add-note-link').addEventListener('click', () => openNoteDialog());
document.querySelector('#edit-goal').addEventListener('click', openGoalDialog);
elements.taskSearch.addEventListener('input', renderTasks);
elements.noteSearch.addEventListener('input', renderNotes);
document.querySelectorAll('.filter-tab').forEach((button) => {
  button.addEventListener('click', () => {
    currentFilter = button.dataset.filter;
    document.querySelectorAll('.filter-tab').forEach((tab) => {
      const selected = tab === button;
      tab.classList.toggle('selected', selected);
      tab.setAttribute('aria-pressed', String(selected));
    });
    renderTasks();
  });
});
document.querySelectorAll('.close-modal,.cancel-modal').forEach((button) => {
  button.addEventListener('click', () => button.closest('dialog').close());
});
[elements.taskDialog, elements.noteDialog, elements.goalDialog].forEach((dialog) => {
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
});
document.querySelector('#focus-button').addEventListener('click', (event) => {
  const active = document.body.classList.toggle('focus-mode');
  event.currentTarget.setAttribute('aria-pressed', String(active));
  event.currentTarget.title = active ? 'Exit focus mode' : 'Toggle focus mode';
  showToast(active ? 'Focus mode is on.' : 'Focus mode is off.');
});
const mobileMenu = document.querySelector('#mobile-menu');
const sidebar = document.querySelector('#sidebar');
mobileMenu.addEventListener('click', () => {
  const isOpen = sidebar.classList.toggle('open');
  mobileMenu.setAttribute('aria-expanded', String(isOpen));
  mobileMenu.setAttribute('aria-label', isOpen ? 'Close menu' : 'Toggle menu');
});
document.querySelectorAll('.side-link').forEach((link) => {
  link.addEventListener('click', () => {
    document.querySelectorAll('.side-link').forEach((other) => other.classList.toggle('active', other === link));
    sidebar.classList.remove('open');
    mobileMenu.setAttribute('aria-expanded', 'false');
  });
});

renderAll();
