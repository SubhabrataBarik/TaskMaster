/**
 * TaskMaster AI - Full Task & Subtask Controller
 */

const taskApp = {
    // --- 1. CONFIG & HEADERS ---
    getHeaders: () => {
        const token = localStorage.getItem('access_token');
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
    },

    // --- 2. CORE TASK API CALLS ---
    
    // GET /tasks/ (with Filters)
    loadTasks: async () => {
        const todayStr = new Date().toISOString().split('T')[0];
        const query = new URLSearchParams();

        // Status Filter
        const statuses = [];
        if (document.getElementById('sPending')?.checked) statuses.push('pending');
        if (document.getElementById('sProgress')?.checked) statuses.push('in_progress');
        if (document.getElementById('sDone')?.checked) statuses.push('completed');
        if (statuses.length > 0) query.append('status__in', statuses.join(','));

        // Priority Filter
        const priorities = [];
        document.querySelectorAll('.filter-priority:checked').forEach(el => priorities.push(el.value));
        if (priorities.length > 0) query.append('priority__in', priorities.join(','));

        // Search
        const searchVal = document.getElementById('searchInput')?.value;
        if (searchVal) query.append('search', searchVal);

        try {
            const response = await fetch(`${CONFIG.TASKS_API_BASE_URL}/tasks/?${query.toString()}`, {
                headers: taskApp.getHeaders()
            });
            
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
            document.getElementById('list-today').innerHTML = '<div class="alert alert-danger">Failed to connect to backend.</div>';
        }
    },

    // POST /tasks/ or PATCH /tasks/{id}/
    saveTask: async () => {
        const id = document.getElementById('taskId').value;
        const method = id ? 'PATCH' : 'POST';
        const url = id ? `${CONFIG.TASKS_API_BASE_URL}/tasks/${id}/` : `${CONFIG.TASKS_API_BASE_URL}/tasks/`;

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

    // DELETE /tasks/{id}/
    deleteTask: async (forceId = null) => {
        const id = forceId || document.getElementById('taskId').value;
        if (!confirm("Permanently delete this task?")) return;

        await fetch(`${CONFIG.TASKS_API_BASE_URL}/tasks/${id}/`, {
            method: 'DELETE',
            headers: taskApp.getHeaders()
        });
        
        const modalEl = document.getElementById('taskModal');
        const modalInstance = bootstrap.Modal.getInstance(modalEl);
        if (modalInstance) modalInstance.hide();
        
        taskApp.loadTasks();
    },

    // POST /tasks/{id}/complete/
    toggleComplete: async (id) => {
        await fetch(`${CONFIG.TASKS_API_BASE_URL}/tasks/${id}/complete/`, {
            method: 'POST',
            headers: taskApp.getHeaders()
        });
        taskApp.loadTasks();
    },

    // --- 3. SUBTASK API CALLS ---

    // GET /tasks/{id}/subtasks/
    loadSubtasks: async (taskId) => {
        const res = await fetch(`${CONFIG.TASKS_API_BASE_URL}/tasks/${taskId}/subtasks/`, {
            headers: taskApp.getHeaders()
        });
        const subtasks = await res.json();
        taskApp.renderSubtasks(subtasks);
    },

    // POST /tasks/{id}/subtasks/
    addSubtask: async () => {
        const taskId = document.getElementById('taskId').value;
        const title = document.getElementById('newSubtaskTitle').value;
        const hours = document.getElementById('newSubtaskHours').value;

        if (!title) return;

        await fetch(`${CONFIG.TASKS_API_BASE_URL}/tasks/${taskId}/subtasks/`, {
            method: 'POST',
            headers: taskApp.getHeaders(),
            body: JSON.stringify({ title, estimated_hours: hours || 0 })
        });

        document.getElementById('newSubtaskTitle').value = '';
        document.getElementById('newSubtaskHours').value = '';
        taskApp.loadSubtasks(taskId);
    },

    // PATCH /subtasks/{id}/
    toggleSubtask: async (subId, currentStatus) => {
        const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
        await fetch(`${CONFIG.TASKS_API_BASE_URL}/subtasks/${subId}/`, {
            method: 'PATCH',
            headers: taskApp.getHeaders(),
            body: JSON.stringify({ status: newStatus })
        });
        taskApp.loadSubtasks(document.getElementById('taskId').value);
    },

    // DELETE /subtasks/{id}/
    deleteSubtask: async (subId) => {
        await fetch(`${CONFIG.TASKS_API_BASE_URL}/subtasks/${subId}/`, {
            method: 'DELETE',
            headers: taskApp.getHeaders()
        });
        taskApp.loadSubtasks(document.getElementById('taskId').value);
    },

    // --- 4. UI RENDERING ---

    renderDashboard: (tasks) => {
        const containers = {
            overdue: document.getElementById('list-overdue'),
            today: document.getElementById('list-today'),
            upcoming: document.getElementById('list-upcoming')
        };

        // Clear all containers (removes spinners)
        Object.values(containers).forEach(c => c.innerHTML = '');
        document.getElementById('section-overdue').classList.add('d-none');

        const todayStr = new Date().toISOString().split('T')[0];

        tasks.forEach(task => {
            const card = taskApp.createCardHTML(task);
            const taskDate = task.due_date;

            if (task.status !== 'completed' && taskDate && taskDate < todayStr) {
                containers.overdue.innerHTML += card;
                document.getElementById('section-overdue').classList.remove('d-none');
            } else if (taskDate === todayStr) {
                containers.today.innerHTML += card;
            } else {
                containers.upcoming.innerHTML += card;
            }
        });

        if (!containers.today.innerHTML) {
            containers.today.innerHTML = '<p class="text-muted text-center">No tasks for today.</p>';
        }
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
        list.innerHTML = subtasks.map(st => `
            <div class="d-flex align-items-center mb-2 bg-light p-2 rounded">
                <input type="checkbox" class="form-check-input me-2" ${st.status === 'completed' ? 'checked' : ''} 
                    onclick="taskApp.toggleSubtask('${st.id}', '${st.status}')">
                <span class="flex-grow-1 small ${st.status === 'completed' ? 'text-decoration-line-through' : ''}">${st.title}</span>
                <button type="button" class="btn btn-sm text-danger" onclick="taskApp.deleteSubtask('${st.id}')"><i class="bi bi-trash"></i></button>
            </div>
        `).join('');
    },

    // GET /tasks/{id}/
    editTask: async (id) => {
        const res = await fetch(`${CONFIG.TASKS_API_BASE_URL}/tasks/${id}/`, { headers: taskApp.getHeaders() });
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
    }
};

// --- 5. INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    if (!localStorage.getItem('access_token')) {
        window.location.href = 'index.html';
        return;
    }
    taskApp.loadTasks();

    // Listeners for filters
    document.querySelectorAll('.filter-status, .filter-priority').forEach(el => {
        el.addEventListener('change', () => taskApp.loadTasks());
    });

    // Search Debounce
    let timer;
    document.getElementById('searchInput')?.addEventListener('input', () => {
        clearTimeout(timer);
        timer = setTimeout(() => taskApp.loadTasks(), 500);
    });
});