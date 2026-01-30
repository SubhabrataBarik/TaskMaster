/**
 * TaskMaster AI - Complete Tasks & Subtasks Controller
 */

const taskApp = {

    filterState: {
        status: [],
        priority: [],
        timeline: null,
    },

    // --- 1. CONFIG & HEADERS ---
    getHeaders: () => {
        const token = localStorage.getItem('access_token');
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
    },

    // --- 2. CORE TASK API CALLS ---
    
    loadTasks: async () => {
        const query = new URLSearchParams();
    
        if (taskApp.filterState.status.length) {
            query.append('status__in', taskApp.filterState.status.join(','));
        }
    
        if (taskApp.filterState.priority.length) {
            query.append('priority__in', taskApp.filterState.priority.join(','));
        }
    
        if (taskApp.filterState.timeline) {
            query.append('timeline', taskApp.filterState.timeline);
        }
    
        const searchVal = document.getElementById('searchInput')?.value;
        if (searchVal) query.append('search', searchVal);
    
        try {
            const response = await fetch(
                `${CONFIG.API_BASE_URL}/tasks/?${query.toString()}`,
                { headers: taskApp.getHeaders() }
            );
    
            if (response.status === 401) {
                localStorage.clear();
                window.location.href = 'index.html';
                return;
            }
    
            const data = await response.json();
            const tasks = Array.isArray(data) ? data : (data.results || []);
            taskApp.renderDashboard(tasks);
    
        } catch (error) {
            console.error("Fetch Error:", error);
        }
    },
    

    saveTask: async () => {
        const id = document.getElementById('taskId').value;
        const method = id ? 'PATCH' : 'POST';
        const url = id ? `${CONFIG.API_BASE_URL}/tasks/${id}/` : `${CONFIG.API_BASE_URL}/tasks/`;

        const payload = {
            title: document.getElementById('taskTitle').value,
            description: document.getElementById('taskDesc').value,
            priority: document.getElementById('taskPriority').value,
            status: document.getElementById('taskStatus').value,
            due_date: document.getElementById('taskDueDate').value || null,
            due_time: document.getElementById('taskDueTime').value || null
        };

        const res = await fetch(url, {
            method: method,
            headers: taskApp.getHeaders(),
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            bootstrap.Modal.getInstance(document.getElementById('taskModal')).hide();
            taskApp.loadTasks();
        }
    },

    deleteTask: async (forceId = null) => {
        const id = forceId || document.getElementById('taskId').value;
        if (!confirm("Permanently delete this task?")) return;

        await fetch(`${CONFIG.API_BASE_URL}/tasks/${id}/`, {
            method: 'DELETE',
            headers: taskApp.getHeaders()
        });
        
        const modalInstance = bootstrap.Modal.getInstance(document.getElementById('taskModal'));
        if (modalInstance) modalInstance.hide();
        taskApp.loadTasks();
    },

    toggleComplete: async (id) => {
        await fetch(`${CONFIG.API_BASE_URL}/tasks/${id}/complete/`, {
            method: 'POST',
            headers: taskApp.getHeaders()
        });
        taskApp.loadTasks();
    },

    // --- 3. SUBTASK API CALLS ---

    loadSubtasks: async (taskId) => {
        const res = await fetch(`${CONFIG.API_BASE_URL}/tasks/${taskId}/subtasks/`, {
            headers: taskApp.getHeaders()
        });
        const subtasks = await res.json();
        taskApp.renderSubtasks(subtasks);
    },

    addSubtask: async () => {
        const taskId = document.getElementById('taskId').value;
        const title = document.getElementById('newSubtaskTitle').value;
        const hours = document.getElementById('newSubtaskHours').value;

        if (!title) return;

        await fetch(`${CONFIG.API_BASE_URL}/tasks/${taskId}/subtasks/`, {
            method: 'POST',
            headers: taskApp.getHeaders(),
            body: JSON.stringify({ title, estimated_hours: hours || 0 })
        });

        document.getElementById('newSubtaskTitle').value = '';
        document.getElementById('newSubtaskHours').value = '';
        taskApp.loadSubtasks(taskId);
    },

    toggleSubtask: async (subId, currentStatus) => {
        const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
        await fetch(`${CONFIG.API_BASE_URL}/subtasks/${subId}/`, {
            method: 'PATCH',
            headers: taskApp.getHeaders(),
            body: JSON.stringify({ status: newStatus })
        });
        taskApp.loadSubtasks(document.getElementById('taskId').value);
    },

    deleteSubtask: async (subId) => {
        await fetch(`${CONFIG.API_BASE_URL}/subtasks/${subId}/`, {
            method: 'DELETE',
            headers: taskApp.getHeaders()
        });
        taskApp.loadSubtasks(document.getElementById('taskId').value);
    },

    reorderSubtasks: async (orderedData) => {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/subtasks/reorder/`, {
                method: 'POST',
                headers: taskApp.getHeaders(),
                body: JSON.stringify(orderedData)
            });

            if (response.ok) {
                taskApp.loadSubtasks(document.getElementById('taskId').value);
            }
        } catch (e) {
            console.error("Reorder failed:", e);
        }
    },

    // --- 4. UI RENDERING & DRAG/DROP ---
    renderDashboard: (tasks) => {
        const containers = {
            overdue: document.getElementById('list-overdue'),
            today: document.getElementById('list-today'),
            upcoming: document.getElementById('list-upcoming')
        };
    
        // 1. Clear everything (CRITICAL for filters to work)
        Object.values(containers).forEach(c => {
            if (c) c.innerHTML = ''; 
        });
        
        // Hide overdue section by default
        const overdueSection = document.getElementById('section-overdue');
        if (overdueSection) overdueSection.classList.add('d-none');
    
        if (tasks.length === 0) {
            containers.today.innerHTML = `
                <div class="text-center py-5 w-100">
                    <i class="bi bi-search text-muted" style="font-size: 2rem;"></i>
                    <p class="text-muted mt-2">No tasks found matching these filters.</p>
                </div>`;
            return;
        }
    
        const todayStr = new Date().toISOString().split('T')[0];
    
        tasks.forEach(task => {
            const card = taskApp.createCardHTML(task);
            if (task.status !== 'completed' && task.due_date && task.due_date < todayStr) {
                containers.overdue.innerHTML += card;
                if (overdueSection) overdueSection.classList.remove('d-none');
            } else if (task.due_date === todayStr) {
                containers.today.innerHTML += card;
            } else {
                containers.upcoming.innerHTML += card;
            }
        });
    },

    createCardHTML: (task) => {
        const borderClass = `border-${task.priority}`;
        const isDone = task.status === 'completed';
        return `
        <div class="col-md-6 col-lg-4">
            <div class="card task-card shadow-sm ${borderClass} h-100" onclick="taskApp.editTask('${task.id}')">
                <div class="card-body">
                    <div class="d-flex justify-content-between">
                        <h6 class="fw-bold ${isDone ? 'text-decoration-line-through text-muted' : ''}">${task.title}</h6>
                        <span class="badge rounded-pill bg-light text-dark border small">${task.status}</span>
                    </div>
                    <p class="small text-muted text-truncate mb-2">${task.description || 'No description'}</p>
                    <div class="d-flex justify-content-between align-items-center mt-3">
                        <span class="small text-muted"><i class="bi bi-clock me-1"></i>${task.due_date || 'No Date'}</span>
                        <button class="btn btn-sm ${isDone ? 'btn-success' : 'btn-outline-success'}" 
                                onclick="event.stopPropagation(); taskApp.toggleComplete('${task.id}')">
                            <i class="bi ${isDone ? 'bi-check-all' : 'bi-check'}"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>`;
    },

    renderSubtasks: (subtasks) => {
        const list = document.getElementById('subtaskList');
        const sorted = subtasks.sort((a, b) => a.order_index - b.order_index);

        list.innerHTML = sorted.map((st, index) => {
            const hours = st.estimated_hours ? parseFloat(st.estimated_hours).toFixed(1) : '0.0';
            return `
                <div class="d-flex align-items-center mb-2 bg-white p-2 rounded shadow-sm border subtask-item" 
                     draggable="true" 
                     data-id="${st.id}" 
                     data-index="${index}"
                     ondragstart="taskApp.handleDragStart(event)"
                     ondragover="taskApp.handleDragOver(event)"
                     ondragleave="taskApp.handleDragLeave(event)"
                     ondrop="taskApp.handleDrop(event)">
                    <i class="bi bi-grip-vertical text-muted me-2" style="cursor: grab;"></i>
                    <input type="checkbox" class="form-check-input me-2" ${st.status === 'completed' ? 'checked' : ''} 
                        onclick="taskApp.toggleSubtask('${st.id}', '${st.status}')">
                    <span class="flex-grow-1 small ${st.status === 'completed' ? 'text-decoration-line-through text-muted' : ''}">${st.title}</span>
                    <span class="badge bg-info-subtle text-info border border-info-subtle me-2">${hours}h</span>
                    <button type="button" class="btn btn-sm text-danger p-0" onclick="taskApp.deleteSubtask('${st.id}')"><i class="bi bi-trash"></i></button>
                </div>`;
        }).join('');
    },

    handleDragStart: (e) => {
        e.dataTransfer.setData('text/plain', e.target.dataset.index);
        e.target.classList.add('dragging');
    },

    handleDragOver: (e) => {
        e.preventDefault();
        const el = e.target.closest('.subtask-item');
        if (el) el.classList.add('drag-over');
    },

    handleDragLeave: (e) => {
        const el = e.target.closest('.subtask-item');
        if (el) el.classList.remove('drag-over');
    },

    handleDrop: async (e) => {
        e.preventDefault();
        const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
        const toElement = e.target.closest('.subtask-item');
        if (!toElement) return;
        
        toElement.classList.remove('drag-over');
        const toIndex = parseInt(toElement.dataset.index);
        if (fromIndex === toIndex) return;

        const items = [...document.querySelectorAll('.subtask-item')];
        const ids = items.map(el => el.dataset.id);
        const [movedId] = ids.splice(fromIndex, 1);
        ids.splice(toIndex, 0, movedId);

        const payload = ids.map((id, index) => ({ id, order_index: index }));
        await taskApp.reorderSubtasks(payload);
    },

    editTask: async (id) => {
        const res = await fetch(`${CONFIG.API_BASE_URL}/tasks/${id}/`, { headers: taskApp.getHeaders() });
        const task = await res.json();

        document.getElementById('taskId').value = task.id;
        document.getElementById('taskTitle').value = task.title;
        document.getElementById('taskDesc').value = task.description || '';
        document.getElementById('taskPriority').value = task.priority;
        document.getElementById('taskStatus').value = task.status;
        document.getElementById('taskDueDate').value = task.due_date || '';
        document.getElementById('taskDueTime').value = task.due_time || '';
        
        taskApp.loadSubtasks(id);
        new bootstrap.Modal(document.getElementById('taskModal')).show();
    },

    resetModal: () => {
        document.getElementById('taskForm').reset();
        document.getElementById('taskId').value = '';
        document.getElementById('subtaskList').innerHTML = '';
    },

    collectFilters: () => {
        const status = [];
        const priority = [];
    
        if (document.getElementById('sPending')?.checked) status.push('pending');
        if (document.getElementById('sProgress')?.checked) status.push('in_progress');
        if (document.getElementById('sDone')?.checked) status.push('completed');
    
        document.querySelectorAll('.filter-priority:checked')
            .forEach(el => priority.push(el.value));
    
        taskApp.filterState.status = status;
        taskApp.filterState.priority = priority;
    
        taskApp.updateActiveFiltersUI();
    },

    updateActiveFiltersUI: () => {
        const el = document.getElementById('activeFilters');
        const text = document.getElementById('activeFiltersText');
    
        const parts = [];
        
        if (taskApp.filterState.timeline) {
            parts.push(`Timeline: ${taskApp.filterState.timeline}`);
        }
        
        if (taskApp.filterState.status.length) {
            parts.push(`Status: ${taskApp.filterState.status.join(', ')}`);
        }
    
        if (taskApp.filterState.priority.length) {
            parts.push(`Priority: ${taskApp.filterState.priority.join(', ')}`);
        }
    
        if (parts.length === 0) {
            el.classList.add('d-none');
            text.innerText = '';
        } else {
            el.classList.remove('d-none');
            text.innerText = parts.join(' | ');
        }
    },
    
    filterByTime: (value) => {
        taskApp.filterState.timeline = value;
        taskApp.updateActiveFiltersUI();
        taskApp.loadTasks();
    },
    
    
};

// --- 5. INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {

    document.getElementById('applyFiltersBtn')
    ?.addEventListener('click', () => {
        taskApp.collectFilters();
        taskApp.loadTasks();
    });

    if (!localStorage.getItem('access_token')) {
        window.location.href = 'index.html';
        return;
    }

    taskApp.loadTasks();

    let timer;
    document.getElementById('searchInput')?.addEventListener('input', () => {
        clearTimeout(timer);
        timer = setTimeout(() => taskApp.loadTasks(), 500);
    });

    // ✅ LOGOUT FIX
    const logoutLink = document.getElementById("logoutLink");

    if (logoutLink) {
        logoutLink.addEventListener("click", (e) => {
            e.preventDefault();
            window.app.logout();
        });
    }

    document.getElementById('clearFiltersBtn')
    ?.addEventListener('click', () => {
        taskApp.filterState = {
            status: [],
            priority: [],
            timeline: null,
        };

        // reset checkboxes
        document.querySelectorAll('.filter-status, .filter-priority')
            .forEach(el => el.checked = false);

        taskApp.updateActiveFiltersUI();
        taskApp.loadTasks();
    });

});
