/**
 * Task Service — backend only
 */

const TaskService = {

    fetchTasks: async (queryParams = {}) => {
        const query = new URLSearchParams(queryParams).toString();
    
        const res = await app.authFetch(
          `${CONFIG.API_BASE_URL}/tasks/?${query}`
        );
    
        if (!res.ok) throw new Error("Failed to fetch tasks");
    
        return await res.json();
      },
  
    fetchTaskById: async (id) => {
      return app.authFetch(
        `${CONFIG.API_BASE_URL}/tasks/${id}/`
      );
    },
  
    createTask: async (payload) => {
      return app.authFetch(
        `${CONFIG.API_BASE_URL}/tasks/`,
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      );
    },
  
    updateTask: async (id, payload) => {
      return app.authFetch(
        `${CONFIG.API_BASE_URL}/tasks/${id}/`,
        {
          method: "PATCH",
          body: JSON.stringify(payload),
        }
      );
    },
  
    deleteTask: async (id) => {
      return app.authFetch(
        `${CONFIG.API_BASE_URL}/tasks/${id}/`,
        { method: "DELETE" }
      );
    },
  
    completeTask: async (id) => {
      return app.authFetch(
        `${CONFIG.API_BASE_URL}/tasks/${id}/complete/`,
        { method: "POST" }
      );
    },
  };
  
  window.TaskService = TaskService;
  