/**
 * Task Page — UI + orchestration
 */

const taskApp = {

    pageState: {
        currentPage: 1,
        pageSize: 10,
        totalCount: 0,
        hasNext: false,
        hasPrevious: false,
    },
    
    // PAGE STATE
    filterState: {
      status: [],
      priority: [],
      timeline: null,
    },
    
    // TASK FLOW
    createCardHTML: (task) => {
        const borderClass = `border-${task.priority}`;
        const isDone = task.status === "completed";
      
        return `
          <div class="col-md-6 col-lg-4">
            <div class="card task-card shadow-sm ${borderClass} h-100"
                 onclick="taskApp.editTask('${task.id}')">
              <div class="card-body">
                <div class="d-flex justify-content-between">
                  <h6 class="fw-bold ${isDone ? "text-decoration-line-through text-muted" : ""}">
                    ${task.title}
                  </h6>
                  <span class="badge rounded-pill bg-light text-dark border small">
                    ${task.status}
                  </span>
                </div>
                <p class="small text-muted text-truncate mb-2">
                  ${task.description || "No description"}
                </p>
                <div class="d-flex justify-content-between align-items-center mt-3">
                  <span class="small text-muted">
                    <i class="bi bi-clock me-1"></i>
                    ${task.due_date || "No Date"}
                  </span>
                  <button class="btn btn-sm ${isDone ? "btn-success" : "btn-outline-success"}"
                    onclick="event.stopPropagation(); taskApp.toggleComplete('${task.id}')">
                    <i class="bi ${isDone ? "bi-check-all" : "bi-check"}"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>`;
      },
      
      loadTasks: async () => {
        const query = {};
      
        // pagination
        query.page = taskApp.pageState.currentPage;
      
        // filters
        if (taskApp.filterState.status.length) {
          query.status__in = taskApp.filterState.status.join(',');
        }
      
        if (taskApp.filterState.priority.length) {
          query.priority__in = taskApp.filterState.priority.join(',');
        }
      
        if (taskApp.filterState.timeline) {
          query.timeline = taskApp.filterState.timeline;
        }
      
        const searchVal = document.getElementById('searchInput')?.value;
        if (searchVal) query.search = searchVal;
      
        try {
          const data = await TaskService.fetchTasks(query);
      
          // pagination metadata
          taskApp.pageState.totalCount = data.count;
          taskApp.pageState.hasNext = !!data.next;
          taskApp.pageState.hasPrevious = !!data.previous;
      
          taskApp.renderDashboard(data.results);
          taskApp.renderPagination();
      
        } catch (err) {
          console.error("Load tasks failed:", err);
        }
      },      
    
    saveTask: async () => {
        const id = document.getElementById("taskId").value;
      
        const payload = {
          title: document.getElementById("taskTitle").value,
          description: document.getElementById("taskDesc").value,
          priority: document.getElementById("taskPriority").value,
          status: document.getElementById("taskStatus").value,
          due_date: document.getElementById("taskDueDate").value || null,
          due_time: document.getElementById("taskDueTime").value || null,
        };
      
        const res = id
          ? await TaskService.updateTask(id, payload)
          : await TaskService.createTask(payload);
      
        if (res.ok) {
          bootstrap.Modal
            .getInstance(document.getElementById("taskModal"))
            .hide();
          taskApp.loadTasks();
        }
      },
    
      toggleComplete: async (id) => {
        await TaskService.completeTask(id);
        taskApp.loadTasks();
      },

      deleteTask: async () => {
        const id = document.getElementById("taskId").value;
        if (!id) return;
      
        if (!confirm("Permanently delete this task?")) return;
      
        await TaskService.deleteTask(id);
      
        bootstrap.Modal
          .getInstance(document.getElementById("taskModal"))
          .hide();
      
        // ✅ pagination safety
        if (
          taskApp.pageState.currentPage > 1 &&
          taskApp.pageState.totalCount % taskApp.pageState.pageSize === 1
        ) {
          taskApp.pageState.currentPage--;
        }
      
        taskApp.loadTasks();
      },      
    
      renderPagination: () => {
        const container = document.getElementById('pagination');
        if (!container) return;
      
        const { currentPage, pageSize, totalCount, hasNext, hasPrevious } = taskApp.pageState;
      
        const totalPages = Math.ceil(totalCount / pageSize);
      
        container.innerHTML = `
          <nav class="d-flex justify-content-between align-items-center mt-4">
            <button class="btn btn-sm btn-outline-secondary"
                    ${!hasPrevious ? 'disabled' : ''}
                    onclick="taskApp.changePage(${currentPage - 1})">
              ← Previous
            </button>
      
            <span class="text-muted small">
              Page <strong>${currentPage}</strong> of ${totalPages}
            </span>
      
            <button class="btn btn-sm btn-outline-secondary"
                    ${!hasNext ? 'disabled' : ''}
                    onclick="taskApp.changePage(${currentPage + 1})">
              Next →
            </button>
          </nav>
        `;
    },      
    
    changePage: (page) => {
        taskApp.pageState.currentPage = page;
        taskApp.loadTasks();
      },


    editTask: async (id) => {
      const res = await TaskService.fetchTaskById(id);
      const task = await res.json();
  
      document.getElementById("taskId").value = task.id;
      document.getElementById("taskTitle").value = task.title;
      document.getElementById("taskDesc").value = task.description || "";
      document.getElementById("taskPriority").value = task.priority;
      document.getElementById("taskStatus").value = task.status;
      document.getElementById("taskDueDate").value = task.due_date || "";
      document.getElementById("taskDueTime").value = task.due_time || "";
  
      await taskApp.loadSubtasks(id);
  
      new bootstrap.Modal(document.getElementById("taskModal")).show();
    },
  
    // -------------------------
    // SUBTASK FLOW
    // -------------------------
    renderSubtasks: (subtasks) => {
        const list = document.getElementById("subtaskList");
        const sorted = subtasks.sort((a, b) => a.order_index - b.order_index);
      
        list.innerHTML = sorted.map((st, index) => `
          <div class="subtask-item d-flex align-items-center mb-2 p-2 rounded"
               draggable="true"
               data-id="${st.id}"
               data-index="${index}"
               ondragstart="taskApp.handleDragStart(event)"
               ondragover="taskApp.handleDragOver(event)"
               ondragleave="taskApp.handleDragLeave(event)"
               ondrop="taskApp.handleDrop(event)">
            <i class="bi bi-grip-vertical me-2"></i>
            <input type="checkbox" class="form-check-input me-2"
              ${st.status === "completed" ? "checked" : ""}
              onclick="taskApp.toggleSubtask('${st.id}', '${st.status}')">
            <span class="flex-grow-1 small ${st.status === "completed" ? "text-decoration-line-through text-muted" : ""}">
              ${st.title}
            </span>
            <span class="badge me-2">${Number(st.estimated_hours || 0).toFixed(1)}h</span>
            <button class="btn btn-sm text-danger p-0"
              onclick="taskApp.deleteSubtask('${st.id}')">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        `).join("");
      },
      
    loadSubtasks: async (taskId) => {
      const res = await SubtaskService.fetchSubtasks(taskId);
      const subtasks = await res.json();
      taskApp.renderSubtasks(subtasks);
    },
  
    addSubtask: async () => {
      const taskId = document.getElementById("taskId").value;
      const title = document.getElementById("newSubtaskTitle").value;
      const hours = document.getElementById("newSubtaskHours").value;
  
      if (!title) return;
  
      await SubtaskService.addSubtask(taskId, {
        title,
        estimated_hours: hours || 0,
      });
  
      document.getElementById("newSubtaskTitle").value = "";
      document.getElementById("newSubtaskHours").value = "";
  
      taskApp.loadSubtasks(taskId);
    },
  
    toggleSubtask: async (id, currentStatus) => {
      const status = currentStatus === "completed" ? "pending" : "completed";
      await SubtaskService.updateSubtaskStatus(id, status);
  
      const taskId = document.getElementById("taskId").value;
      taskApp.loadSubtasks(taskId);
    },
  
    deleteSubtask: async (id) => {
      await SubtaskService.deleteSubtask(id);
  
      const taskId = document.getElementById("taskId").value;
      taskApp.loadSubtasks(taskId);
    },
  
    reorderSubtasks: async (payload) => {
      const res = await SubtaskService.reorderSubtasks(payload);
  
      if (res.ok) {
        const taskId = document.getElementById("taskId").value;
        taskApp.loadSubtasks(taskId);
      }
    },
  
    // -------------------------
    // UI RENDERING
    // -------------------------
    handleDragStart: (e) => {
        e.dataTransfer.setData("text/plain", e.target.dataset.index);
        e.target.classList.add("dragging");
      },
      
      handleDragOver: (e) => {
        e.preventDefault();
        const el = e.target.closest(".subtask-item");
        el?.classList.add("drag-over");
      },
      
      handleDragLeave: (e) => {
        const el = e.target.closest(".subtask-item");
        el?.classList.remove("drag-over");
      },
      
      handleDrop: async (e) => {
        e.preventDefault();
        const fromIndex = Number(e.dataTransfer.getData("text/plain"));
        const target = e.target.closest(".subtask-item");
        if (!target) return;
      
        const toIndex = Number(target.dataset.index);
        if (fromIndex === toIndex) return;
      
        const items = [...document.querySelectorAll(".subtask-item")];
        const ids = items.map(el => el.dataset.id);
      
        const [moved] = ids.splice(fromIndex, 1);
        ids.splice(toIndex, 0, moved);
      
        const payload = ids.map((id, i) => ({ id, order_index: i }));
        await taskApp.reorderSubtasks(payload);
      },
      
    renderDashboard: (tasks) => {
      const containers = {
        overdue: document.getElementById("list-overdue"),
        today: document.getElementById("list-today"),
        upcoming: document.getElementById("list-upcoming"),
      };
  
      Object.values(containers).forEach(c => c && (c.innerHTML = ""));
  
      const overdueSection = document.getElementById("section-overdue");
      overdueSection?.classList.add("d-none");
  
      if (!tasks.length) {
        containers.today.innerHTML = `
          <div class="text-center py-5">
            <p class="text-muted">No tasks found.</p>
          </div>`;
        return;
      }
  
      const today = new Date().toISOString().split("T")[0];
  
      tasks.forEach(task => {
        const card = taskApp.createCardHTML(task);
        if (task.status !== "completed" && task.due_date && task.due_date < today) {
          containers.overdue.innerHTML += card;
          overdueSection?.classList.remove("d-none");
        } else if (task.due_date === today) {
          containers.today.innerHTML += card;
        } else {
          containers.upcoming.innerHTML += card;
        }
      });
    },
  
    // -------------------------
    // FILTERS
    // -------------------------
    collectFilters: () => {
        const status = [];
        const priority = [];
      
        if (document.getElementById("sPending")?.checked) status.push("pending");
        if (document.getElementById("sProgress")?.checked) status.push("in_progress");
        if (document.getElementById("sDone")?.checked) status.push("completed");
      
        document.querySelectorAll(".filter-priority:checked")
          .forEach(el => priority.push(el.value));
      
        taskApp.filterState.status = status;
        taskApp.filterState.priority = priority;
      
        taskApp.pageState.currentPage = 1;   // reset page AFTER state update
        taskApp.updateActiveFiltersUI();
        taskApp.loadTasks();
      },
      
    updateActiveFiltersUI: () => {
      const el = document.getElementById("activeFilters");
      const text = document.getElementById("activeFiltersText");
  
      const parts = [];
  
      if (taskApp.filterState.timeline)
        parts.push(`Timeline: ${taskApp.filterState.timeline}`);
  
      if (taskApp.filterState.status.length)
        parts.push(`Status: ${taskApp.filterState.status.join(", ")}`);
  
      if (taskApp.filterState.priority.length)
        parts.push(`Priority: ${taskApp.filterState.priority.join(", ")}`);
  
      if (!parts.length) {
        el.classList.add("d-none");
        text.innerText = "";
      } else {
        el.classList.remove("d-none");
        text.innerText = parts.join(" | ");
      }
    },
  
    filterByTime: (value) => {
        taskApp.filterState.timeline = value;
        taskApp.pageState.currentPage = 1;
        taskApp.updateActiveFiltersUI();
        taskApp.loadTasks();
      },      
  
    resetModal: () => {
      document.getElementById("taskForm").reset();
      document.getElementById("taskId").value = "";
      document.getElementById("subtaskList").innerHTML = "";
    },
  };
  
  // -------------------------
  // INIT
  // -------------------------
  document.addEventListener("DOMContentLoaded", () => {
  
    if (!localStorage.getItem("access_token")) {
      window.location.href = "index.html";
      return;
    }
  
    taskApp.loadTasks();
  
    document.getElementById("applyFiltersBtn")
      ?.addEventListener("click", () => {
        taskApp.collectFilters();
        taskApp.loadTasks();
      });
  
    let timer;
    document.getElementById("searchInput")
      ?.addEventListener("input", () => {
        clearTimeout(timer);
        timer = setTimeout(taskApp.loadTasks, 500);
      });
  
    document.getElementById("clearFiltersBtn")
      ?.addEventListener("click", () => {
        taskApp.filterState = { status: [], priority: [], timeline: null };
        document.querySelectorAll(".filter-status, .filter-priority")
          .forEach(el => el.checked = false);
        taskApp.updateActiveFiltersUI();
        taskApp.loadTasks();
      });
  });
  
  window.taskApp = taskApp;
  