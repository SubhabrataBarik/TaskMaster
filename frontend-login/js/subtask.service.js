/**
 * Subtask Service — backend only
 */

const SubtaskService = {

    fetchSubtasks: async (taskId) => {
      return app.authFetch(
        `${CONFIG.API_BASE_URL}/tasks/${taskId}/subtasks/`
      );
    },
  
    addSubtask: async (taskId, payload) => {
      return app.authFetch(
        `${CONFIG.API_BASE_URL}/tasks/${taskId}/subtasks/`,
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      );
    },
  
    updateSubtaskStatus: async (subtaskId, status) => {
      return app.authFetch(
        `${CONFIG.API_BASE_URL}/subtasks/${subtaskId}/`,
        {
          method: "PATCH",
          body: JSON.stringify({ status }),
        }
      );
    },
  
    deleteSubtask: async (subtaskId) => {
      return app.authFetch(
        `${CONFIG.API_BASE_URL}/subtasks/${subtaskId}/`,
        { method: "DELETE" }
      );
    },
  
    reorderSubtasks: async (payload) => {
      return app.authFetch(
        `${CONFIG.API_BASE_URL}/subtasks/reorder/`,
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      );
    },
  };
  
  window.SubtaskService = SubtaskService;
  