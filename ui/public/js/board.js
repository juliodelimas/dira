// Board data
let boardId = null;
let boardData = {};
let statuses = [];
let tasks = [];
let members = [];

async function loadBoard(id) {
  boardId = id;
  const [board, statusList, taskList] = await Promise.all([
    apiFetch(`/boards/${boardId}`),
    apiFetch(`/boards/${boardId}/statuses`),
    apiFetch(`/boards/${boardId}/tasks`),
  ]);
  boardData = board;
  statuses = statusList.items ?? statusList;
  tasks = taskList.items ?? taskList;
  renderBoard();
  initDragDrop();

  const btn = document.getElementById('invite-code-btn');
  if (btn && boardData.inviteCode) {
    btn.textContent = `Invite: ${boardData.inviteCode}`;
    btn.classList.remove('hidden');
  }
}

async function copyBoardInviteCode() {
  try {
    await navigator.clipboard.writeText(boardData.inviteCode);
    const btn = document.getElementById('invite-code-btn');
    const orig = btn.textContent;
    btn.textContent = 'Copied!';
    setTimeout(() => { btn.textContent = orig; }, 1500);
  } catch {
    prompt('Copy this invite code:', boardData.inviteCode);
  }
}

function getTasksByStatus(statusId) {
  return tasks.filter(t => t.statusId === statusId);
}

function renderBoard() {
  document.getElementById('board-title').textContent = boardData.name;
  const container = document.getElementById('columns-container');
  container.innerHTML = '';

  statuses.forEach(status => {
    const col = buildColumn(status);
    container.appendChild(col);
  });
}

function priorityBadge(priority) {
  const map = {
    low: 'bg-slate-600 text-slate-200',
    medium: 'bg-blue-700 text-blue-100',
    high: 'bg-amber-700 text-amber-100',
    critical: 'bg-red-700 text-red-100',
  };
  return `<span class="text-xs px-2 py-0.5 rounded-full font-medium ${map[priority] || map.low}">${priority}</span>`;
}

function buildColumn(status) {
  const colTasks = getTasksByStatus(status.id);
  const col = document.createElement('div');
  col.className = 'flex-shrink-0 w-72 bg-slate-800 rounded-xl flex flex-col max-h-full';
  col.innerHTML = `
    <div class="flex items-center justify-between px-4 py-3 border-b border-slate-700">
      <div class="flex items-center gap-2">
        <span class="w-3 h-3 rounded-full" style="background:${status.color || '#6366f1'}"></span>
        <h3 class="font-semibold text-white text-sm">${escHtml(status.name)}</h3>
        <span class="text-xs text-slate-400 bg-slate-700 px-2 py-0.5 rounded-full">${colTasks.length}</span>
      </div>
      <button onclick="openNewTaskModal('${status.id}')"
        class="text-slate-400 hover:text-white transition-colors text-lg leading-none">+</button>
    </div>
    <div class="task-list flex-1 overflow-y-auto p-3 space-y-2 min-h-[60px]"
         data-status-id="${status.id}">
      ${colTasks.map(buildTaskCard).join('')}
    </div>
  `;
  return col;
}

function buildTaskCard(task) {
  const due = task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
  const subtaskInfo = task.subtaskCount > 0
    ? `<span class="text-xs text-slate-400">${task.completedSubtaskCount}/${task.subtaskCount} subtasks</span>`
    : '';
  return `
    <div class="task-card bg-slate-700 rounded-lg p-3 cursor-pointer hover:bg-slate-600 transition-colors select-none"
         data-task-id="${task.id}"
         onclick="openTaskDetail('${task.id}')">
      <div class="flex items-start justify-between gap-2 mb-2">
        <p class="text-sm text-white font-medium leading-snug flex-1">${escHtml(task.title)}</p>
        ${priorityBadge(task.priority)}
      </div>
      <div class="flex items-center justify-between">
        ${subtaskInfo}
        ${due ? `<span class="text-xs text-slate-400 ml-auto">${due}</span>` : ''}
      </div>
    </div>
  `;
}

function initDragDrop() {
  document.querySelectorAll('.task-list').forEach(list => {
    Sortable.create(list, {
      group: 'tasks',
      animation: 150,
      ghostClass: 'opacity-40',
      dragClass: 'rotate-1',
      onEnd: async (evt) => {
        const taskId = evt.item.dataset.taskId;
        const newStatusId = evt.to.dataset.statusId;
        const oldStatusId = evt.from.dataset.statusId;
        if (newStatusId === oldStatusId && evt.oldIndex === evt.newIndex) return;

        const task = tasks.find(t => t.id === taskId);
        if (!task) return;
        const prevStatusId = task.statusId;
        task.statusId = newStatusId;
        updateColumnCounts();

        try {
          await apiFetch(`/tasks/${taskId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ statusId: newStatusId }),
          });
        } catch {
          // Revert on failure
          task.statusId = prevStatusId;
          evt.from.insertBefore(evt.item, evt.from.children[evt.oldIndex] || null);
          updateColumnCounts();
        }
      },
    });
  });
}

function updateColumnCounts() {
  statuses.forEach(status => {
    const count = tasks.filter(t => t.statusId === status.id).length;
    const list = document.querySelector(`.task-list[data-status-id="${status.id}"]`);
    if (list) {
      const badge = list.closest('.bg-slate-800').querySelector('.rounded-full.text-xs');
      if (badge) badge.textContent = count;
    }
  });
}

// ── New Task Modal ────────────────────────────────────────────────
let newTaskStatusId = null;

function openNewTaskModal(statusId) {
  newTaskStatusId = statusId;
  document.getElementById('new-task-title').value = '';
  document.getElementById('new-task-desc').value = '';
  document.getElementById('new-task-priority').value = 'medium';
  document.getElementById('new-task-due').value = '';
  document.getElementById('modal-new-task').classList.remove('hidden');
}

function closeNewTaskModal() {
  document.getElementById('modal-new-task').classList.add('hidden');
}

async function submitNewTask(e) {
  e.preventDefault();
  const title = document.getElementById('new-task-title').value.trim();
  const description = document.getElementById('new-task-desc').value.trim();
  const priority = document.getElementById('new-task-priority').value;
  const dueDate = document.getElementById('new-task-due').value || undefined;
  try {
    const task = await apiFetch(`/boards/${boardId}/tasks`, {
      method: 'POST',
      body: JSON.stringify({ title, description, priority, statusId: newTaskStatusId, dueDate }),
    });
    tasks.push(task);
    const list = document.querySelector(`.task-list[data-status-id="${newTaskStatusId}"]`);
    if (list) {
      list.insertAdjacentHTML('beforeend', buildTaskCard(task));
      initDragDrop();
    }
    updateColumnCounts();
    closeNewTaskModal();
  } catch (err) {
    alert(err.message);
  }
}

// ── Task Detail Modal ─────────────────────────────────────────────
let activeTask = null;
let subtasks = [];
let comments = [];

async function openTaskDetail(taskId) {
  activeTask = tasks.find(t => t.id === taskId);
  if (!activeTask) return;

  document.getElementById('detail-title').value = activeTask.title;
  document.getElementById('detail-desc').value = activeTask.description || '';
  document.getElementById('detail-priority').value = activeTask.priority;
  document.getElementById('detail-due').value = activeTask.dueDate ? activeTask.dueDate.split('T')[0] : '';
  document.getElementById('detail-status').innerHTML = statuses.map(s =>
    `<option value="${s.id}" ${s.id === activeTask.statusId ? 'selected' : ''}>${escHtml(s.name)}</option>`
  ).join('');

  const [subtaskData, commentData] = await Promise.all([
    apiFetch(`/tasks/${taskId}/subtasks`),
    apiFetch(`/tasks/${taskId}/comments`),
  ]);
  subtasks = subtaskData.items ?? subtaskData;
  comments = commentData.items ?? commentData;
  renderSubtasks();
  renderComments();
  document.getElementById('modal-task-detail').classList.remove('hidden');
}

function closeTaskDetail() {
  document.getElementById('modal-task-detail').classList.add('hidden');
  activeTask = null;
}

function renderSubtasks() {
  const el = document.getElementById('subtask-list');
  el.innerHTML = subtasks.map(st => `
    <div class="flex items-center gap-3 py-2 border-b border-slate-700 last:border-0">
      <input type="checkbox" ${st.completed ? 'checked' : ''}
        class="w-4 h-4 rounded accent-indigo-500"
        onchange="toggleSubtask('${st.id}', this.checked)" />
      <span class="text-sm text-slate-200 flex-1 ${st.completed ? 'line-through text-slate-400' : ''}">${escHtml(st.title)}</span>
      <button onclick="deleteSubtask('${st.id}')" class="text-slate-500 hover:text-red-400 transition-colors text-xs">✕</button>
    </div>
  `).join('') || '<p class="text-sm text-slate-500 py-2">No subtasks yet.</p>';
}

async function saveTaskDetail() {
  const title = document.getElementById('detail-title').value.trim();
  const description = document.getElementById('detail-desc').value.trim();
  const priority = document.getElementById('detail-priority').value;
  const dueDate = document.getElementById('detail-due').value || undefined;
  const statusId = document.getElementById('detail-status').value;
  try {
    const updated = await apiFetch(`/tasks/${activeTask.id}`, {
      method: 'PUT',
      body: JSON.stringify({ title, description, priority, dueDate, statusId }),
    });
    const idx = tasks.findIndex(t => t.id === activeTask.id);
    tasks[idx] = updated;
    renderBoard();
    initDragDrop();
    closeTaskDetail();
  } catch (err) {
    alert(err.message);
  }
}

async function deleteTask() {
  if (!confirm('Delete this task?')) return;
  try {
    await apiFetch(`/tasks/${activeTask.id}`, { method: 'DELETE' });
    tasks = tasks.filter(t => t.id !== activeTask.id);
    renderBoard();
    initDragDrop();
    closeTaskDetail();
  } catch (err) {
    alert(err.message);
  }
}

function refreshTaskCard(taskId) {
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;
  const card = document.querySelector(`.task-card[data-task-id="${taskId}"]`);
  if (!card) return;
  card.outerHTML = buildTaskCard(task);
}

async function addSubtask(e) {
  e.preventDefault();
  const input = document.getElementById('new-subtask-title');
  const title = input.value.trim();
  if (!title) return;
  try {
    const st = await apiFetch(`/tasks/${activeTask.id}/subtasks`, {
      method: 'POST',
      body: JSON.stringify({ title }),
    });
    subtasks.push(st);
    input.value = '';
    renderSubtasks();
    const task = tasks.find(t => t.id === activeTask.id);
    if (task) {
      task.subtaskCount = subtasks.length;
      task.completedSubtaskCount = subtasks.filter(s => s.completed).length;
    }
    refreshTaskCard(activeTask.id);
  } catch (err) {
    alert(err.message);
  }
}

async function toggleSubtask(subtaskId, completed) {
  try {
    await apiFetch(`/tasks/${activeTask.id}/subtasks/${subtaskId}`, {
      method: 'PUT',
      body: JSON.stringify({ completed }),
    });
    const st = subtasks.find(s => s.id === subtaskId);
    if (st) st.completed = completed;
    renderSubtasks();
    const task = tasks.find(t => t.id === activeTask.id);
    if (task) {
      task.completedSubtaskCount = subtasks.filter(s => s.completed).length;
    }
    refreshTaskCard(activeTask.id);
  } catch (err) {
    alert(err.message);
  }
}

async function deleteSubtask(subtaskId) {
  try {
    await apiFetch(`/tasks/${activeTask.id}/subtasks/${subtaskId}`, { method: 'DELETE' });
    subtasks = subtasks.filter(s => s.id !== subtaskId);
    renderSubtasks();
    const task = tasks.find(t => t.id === activeTask.id);
    if (task) {
      task.subtaskCount = subtasks.length;
      task.completedSubtaskCount = subtasks.filter(s => s.completed).length;
    }
    refreshTaskCard(activeTask.id);
  } catch (err) {
    alert(err.message);
  }
}

// ── Comments ──────────────────────────────────────────────────────

function renderComments() {
  const el = document.getElementById('comment-list');
  el.innerHTML = comments.map(c => `
    <div class="bg-slate-700 rounded-lg p-3">
      <div class="flex items-center justify-between mb-1">
        <span class="text-xs font-semibold text-slate-300">${escHtml(c.authorName || 'Unknown')}</span>
        <div class="flex items-center gap-2">
          <span class="text-xs text-slate-500">${new Date(c.createdAt).toLocaleString()}</span>
          <button onclick="deleteComment('${c.id}')" class="text-slate-500 hover:text-red-400 transition-colors text-xs">✕</button>
        </div>
      </div>
      <p class="text-sm text-slate-200 whitespace-pre-wrap">${escHtml(c.text)}</p>
    </div>
  `).join('') || '<p class="text-sm text-slate-500 py-1">No comments yet.</p>';
}

async function addComment(e) {
  e.preventDefault();
  const textarea = document.getElementById('new-comment-text');
  const text = textarea.value.trim();
  if (!text) return;
  try {
    const c = await apiFetch(`/tasks/${activeTask.id}/comments`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
    comments.push(c);
    textarea.value = '';
    renderComments();
  } catch (err) {
    alert(err.message);
  }
}

async function deleteComment(commentId) {
  try {
    await apiFetch(`/tasks/${activeTask.id}/comments/${commentId}`, { method: 'DELETE' });
    comments = comments.filter(c => c.id !== commentId);
    renderComments();
  } catch (err) {
    alert(err.message);
  }
}

// ── Status Management ─────────────────────────────────────────────
function openStatusModal() {
  renderStatusList();
  document.getElementById('modal-statuses').classList.remove('hidden');
}

function closeStatusModal() {
  document.getElementById('modal-statuses').classList.add('hidden');
}

function renderStatusList() {
  const el = document.getElementById('status-list');
  el.innerHTML = statuses.map(s => `
    <div class="flex items-center gap-3 py-2 border-b border-slate-700 last:border-0">
      <span class="w-4 h-4 rounded-full flex-shrink-0" style="background:${s.color || '#6366f1'}"></span>
      <span class="flex-1 text-sm text-slate-200">${escHtml(s.name)}</span>
      <button onclick="deleteStatus('${s.id}')" class="text-slate-500 hover:text-red-400 transition-colors text-xs">✕</button>
    </div>
  `).join('') || '<p class="text-sm text-slate-500">No statuses yet.</p>';
}

async function addStatus(e) {
  e.preventDefault();
  const name = document.getElementById('new-status-name').value.trim();
  const color = document.getElementById('new-status-color').value;
  if (!name) return;
  try {
    const s = await apiFetch(`/boards/${boardId}/statuses`, {
      method: 'POST',
      body: JSON.stringify({ name, color }),
    });
    statuses.push(s);
    document.getElementById('new-status-name').value = '';
    renderStatusList();
    renderBoard();
    initDragDrop();
  } catch (err) {
    alert(err.message);
  }
}

async function deleteStatus(statusId) {
  if (!confirm('Delete this status? Tasks in this column will lose their status.')) return;
  try {
    await apiFetch(`/boards/${boardId}/statuses/${statusId}`, { method: 'DELETE' });
    statuses = statuses.filter(s => s.id !== statusId);
    renderStatusList();
    renderBoard();
    initDragDrop();
  } catch (err) {
    alert(err.message);
  }
}

function escHtml(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
