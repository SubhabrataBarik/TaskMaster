/**
 * TaskMaster AI - Task Management Logic
 */

const taskApp = {
    // --- Helpers ---
    getHeaders: () => {
        const token = localStorage.getItem('access_token');
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
    },

    // --- 1. Fetch & Filter Tasks ---
    loadTasks: async () => {
        // A. Get Time Filter (Radio)
        const timeRadio = document.querySelector('input[name="timeFilter"]:checked');
        const timeFilter = timeRadio ? timeRadio.value : 'all';

        // B. Get Status Filters (Checkboxes)
        const statuses = [];
        if (document.getElementById('sTodo')?.checked) statuses.push('todo');
        if (document.getElementById('sProgress')?.checked) statuses.push('in_progress');
        if (document.getElementById('sDone')?.checked) statuses.push('done');

        // C. Get Priority Filters (Checkboxes)
        const priorities = [];
        document.querySelectorAll('.filter-priority:checked').forEach(el => priorities.push(el.value));

        // D. Build Query Params
        let query = new URLSearchParams();

        // Add lists (status__in, priority__in)
        if (statuses.length > 0) query.append('status__in', statuses.join(','));
        if (priorities.length > 0) query.append('priority__in', priorities.join(','));

        // Add Time Logic
        const today = new Date().toISOString().split('T')[0];
        
        if (timeFilter === 'today') {
            query.append('due_date', today);
        } else if (timeFilter === 'overdue') {
            query.append('due_date__lt', today);
            // Overdue usually implies incomplete tasks, but we respect the status checkboxes too
        } else if (timeFilter === 'week') {
            let nextWeek = new Date();
            nextWeek.setDate(nextWeek.getDate() + 7);
            const nextWeekStr = nextWeek.toISOString().split('T')[0];
            query.append('due_date__range', `${today},${nextWeekStr}`);
        }

        // Add Search
        const searchInput = document.getElementById('searchInput');
        if (searchInput && searchInput.value) {
            query.append('search', searchInput.value);
        }

        // E. Fetch from API
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/tasks/?${query.toString()}`, {
                headers: taskApp.getHeaders()
            });

            if (response.status === 401) {
                window.location.href = 'index.html'; // Redirect if token expired
                return;
            }

            const data = await response.json();
            // Supports both paginated {results: []} and flat [] responses
            const taskList = Array.isArray(data) ? data : (data.results || []);
            taskApp.renderDashboard(taskList);

        } catch (error) {
            console.error("Error loading tasks:", error);
        }
    },

    // --- 2. Render Dashboard (Group by Date) ---
    renderDashboard: (tasks) => {
        const overdueContainer = document.getElementById('list-overdue');
        const todayContainer = document.getElementById('list-today');
        const upcomingContainer = document.getElementById('list-upcoming');
        const overdueSection = document.getElementById('section-overdue');

        // Reset UI
        overdueContainer.innerHTML = '';
        todayContainer.innerHTML = '';
        upcomingContainer.innerHTML = '';

        const todayStr = new Date().toISOString().split('T')[0];
        let hasOverdue = false;

        if (tasks.length === 0) {
            todayContainer.innerHTML = '<div class="col-12 text-muted text-center py-4">No tasks found matching your filters.</div>';
            overdueSection.classList.add('d-none');
            return;
        }

        tasks.forEach(task => {
            const taskDate = task.due_date ? task.due_date.split('T')[0] : null;
            const cardHTML = taskApp.createCardHTML(task);

            if (task.status === 'done') {
                // Completed tasks: If due today, show in Today, otherwise Upcoming
                if (taskDate === todayStr) todayContainer.innerHTML += cardHTML;
                else upcomingContainer.innerHTML += cardHTML;
            
            } else if (taskDate && taskDate < todayStr) {
                // Overdue & Not Done
                overdueContainer.innerHTML += cardHTML;
                hasOverdue = true;
            } else if (taskDate === todayStr) {
                // Due Today
                todayContainer.innerHTML += cardHTML;
            } else {
                // Future or No Date
                upcomingContainer.innerHTML += cardHTML;
            }
        });

        // Toggle Overdue Section Visibility
        if (hasOverdue) overdueSection.classList.remove('d-none');
        else overdueSection.classList.add('d-none');
    },

    // --- 3. Generate Card HTML ---
    createCardHTML: (task) => {
        const badgeColor = {
            'high': 'danger',
            'medium': 'warning text-dark',
            'low': 'success'
        }[task.priority] || 'secondary';

        const borderClass = `border-${task.priority}`; // Matches CSS classes in HTML
        const dateDisplay = task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No Date';
        
        // Strikethrough style for completed tasks
        const titleStyle = task.status === 'done' ? 'text-decoration-line-through text-muted' : '';

        return `
        <div class="col-12 col-md-6 col-xl-4">
            <div class="card shadow-sm task-card ${borderClass} h-100">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <span class="badge bg-${badgeColor}">${task.priority.toUpperCase()}</span>
                        <div class="dropdown">
                            <button class="btn btn-link text-muted p-0" data-bs-toggle="dropdown" aria-expanded="false">
                                <i class="bi bi-three-dots-vertical"></i>
                            </button>
                            <ul class="dropdown-menu dropdown-menu-end">
                                <li><a class="dropdown-item" href="#" onclick="taskApp.editTask('${task.id}')">Edit</a></li>
                                <li><a class="dropdown-item text-danger" href="#" onclick="taskApp.deleteTask('${task.id}')">Delete</a></li>
                            </ul>
                        </div>
                    </div>
                    
                    <h5 class="card-title ${titleStyle}">${task.title}</h5>
                    <p class="card-text text-muted small text-truncate">${task.description || ''}</p>
                    
                    <div class="d-flex justify-content-between align-items-center mt-3 pt-2 border-top">
                        <small class="text-muted"><i class="bi bi-calendar-event me-1"></i>${dateDisplay}</small>
                        
                        <button class="btn btn-sm ${task.status === 'done' ? 'btn-outline-secondary' : 'btn-outline-success'}" 
                                onclick="taskApp.toggleComplete('${task.id}', '${task.status}')">
                            ${task.status === 'done' ? '<i class="bi bi-arrow-counterclockwise"></i> Undo' : '<i class="bi bi-check-lg"></i> Complete'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
        `;
    },

    // --- 4. Save (Create/Update) ---
    saveTask: async () => {
        const id = document.getElementById('taskId').value;
        const method = id ? 'PATCH' : 'POST'; // Use PATCH for updates
        const url = id ? `${CONFIG.API_BASE_URL}/tasks/${id}/` : `${CONFIG.API_BASE_URL}/tasks/`;

        const payload = {
            title: document.getElementById('taskTitle').value,
            description: document.getElementById('taskDesc').value,
            priority: document.getElementById('taskPriority').value,
            status: document.getElementById('taskStatus').value,
            due_date: document.getElementById('taskDueDate').value || null
        };

        try {
            const response = await fetch(url, {
                method: method,
                headers: taskApp.getHeaders(),
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                // Close Modal manually using Bootstrap instance
                const modalEl = document.getElementById('taskModal');
                const modal = bootstrap.Modal.getInstance(modalEl);
                if (modal) modal.hide();
                
                // Refresh Task List
                taskApp.loadTasks();
            } else {
                const err = await response.json();
                alert("Failed to save: " + JSON.stringify(err));
            }
        } catch (e) { console.error(e); }
    },

    // --- 5. Delete Task ---
    deleteTask: async (id) => {
        if (!confirm("Are you sure you want to delete this task?")) return;
        
        try {
            await fetch(`${CONFIG.API_BASE_URL}/tasks/${id}/`, {
                method: 'DELETE',
                headers: taskApp.getHeaders()
            });
            taskApp.loadTasks(); // Refresh
        } catch (e) { console.error(e); }
    },

    // --- 6. Quick Complete Toggle ---
    toggleComplete: async (id, currentStatus) => {
        const newStatus = currentStatus === 'done' ? 'todo' : 'done';
        try {
            await fetch(`${CONFIG.API_BASE_URL}/tasks/${id}/`, {
                method: 'PATCH',
                headers: taskApp.getHeaders(),
                body: JSON.stringify({ status: newStatus })
            });
            taskApp.loadTasks();
        } catch (e) { console.error(e); }
    },

    // --- 7. Modal Handlers ---
    editTask: async (id) => {
        try {
            const res = await fetch(`${CONFIG.API_BASE_URL}/tasks/${id}/`, { headers: taskApp.getHeaders() });
            if (!res.ok) throw new Error("Task not found");
            
            const task = await res.json();

            // Populate Form
            document.getElementById('taskId').value = task.id;
            document.getElementById('taskTitle').value = task.title;
            document.getElementById('taskDesc').value = task.description || '';
            document.getElementById('taskPriority').value = task.priority;
            document.getElementById('taskStatus').value = task.status;
            document.getElementById('taskDueDate').value = task.due_date ? task.due_date.split('T')[0] : '';
            
            // UI Tweaks
            document.getElementById('modalTitle').innerText = "Edit Task";
            
            // Show Modal
            new bootstrap.Modal(document.getElementById('taskModal')).show();
        } catch (e) { console.error(e); }
    },

    resetModal: () => {
        document.getElementById('taskForm').reset();
        document.getElementById('taskId').value = ''; // Clear ID implies CREATE mode
        document.getElementById('modalTitle').innerText = "New Task";
    }
};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. Auth Check
    if (!localStorage.getItem('access_token')) {
        window.location.href = 'index.html';
        return;
    }

    // 2. Initial Load
    taskApp.loadTasks();

    // 3. Attach Filter Listeners (Radio & Checkboxes)
    const filters = document.querySelectorAll('.filter-time, .filter-status, .filter-priority');
    filters.forEach(input => {
        input.addEventListener('change', () => {
            taskApp.loadTasks();
        });
    });

    // 4. Search Listener (Debounced)
    let searchTimeout;
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => taskApp.loadTasks(), 400);
        });
    }

    // 5. Logout Hook (Reusing your app.js logic if available)
    const logoutLink = document.getElementById('logoutLink');
    if (logoutLink) {
        logoutLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (window.app && window.app.logout) {
                window.app.logout();
            } else {
                // Fallback logout
                localStorage.clear();
                window.location.href = 'index.html';
            }
        });
    }
});