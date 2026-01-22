/**
 * TaskMaster AI - Authentication Logic
 */

const app = {
  // --- Helper: UI Alerts ---
  showAlert: (elementId, message, type = 'danger') => {
      const wrapper = document.getElementById(elementId);
      if (wrapper) {
          wrapper.innerHTML = `
              <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                  ${message}
                  <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
              </div>`;
      }
  },

  // --- Helper: Loading State ---
  toggleLoading: (btnId, spinnerId, isLoading) => {
      const btn = document.getElementById(btnId);
      const spinner = document.getElementById(spinnerId);
      if (btn && spinner) {
          btn.disabled = isLoading;
          isLoading ? spinner.classList.remove('d-none') : spinner.classList.add('d-none');
      }
  },

  // --- Token Management ---
  setTokens: (access, refresh) => {
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
  },

  getAccessToken: () => localStorage.getItem('access_token'),
  getRefreshToken: () => localStorage.getItem('refresh_token'),

  clearTokens: () => {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
  },

  // --- API Methods ---
  
  // 1. Register
  register: async (formData) => {
      app.toggleLoading('signupBtn', 'signupSpinner', true);
      try {
          const response = await fetch(`${CONFIG.API_BASE_URL}/register/`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(formData)
          });
          const data = await response.json();

          if (response.ok) {
              app.showAlert('suAlert', 'Account created! Redirecting to login...', 'success');
              setTimeout(() => window.location.href = 'index.html', 2000);
          } else {
              app.showAlert('suAlert', data.detail || 'Registration failed. Check your inputs.');
          }
      } catch (error) {
          app.showAlert('suAlert', 'Network error. Please try again.');
      } finally {
          app.toggleLoading('signupBtn', 'signupSpinner', false);
      }
  },

  // 2. Login
  login: async (email, password) => {
      app.toggleLoading('loginBtn', 'loginSpinner', true);
      try {
          const response = await fetch(`${CONFIG.API_BASE_URL}/login/`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, password })
          });
          const data = await response.json();

          if (response.ok) {
              app.setTokens(data.access, data.refresh);
              window.location.href = 'me.html';
          } else {
              app.showAlert('alertPlaceholder', data.detail || 'Invalid credentials.');
          }
      } catch (error) {
          app.showAlert('alertPlaceholder', 'Server unavailable.');
      } finally {
          app.toggleLoading('loginBtn', 'loginSpinner', false);
      }
  },

// 3. Refresh Token
refreshAccessToken: async () => {
  const refresh = app.getRefreshToken();
  if (!refresh) return null;
  try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/token/refresh/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh })
      });
      const data = await response.json();
      if (response.ok) {
          localStorage.setItem('access_token', data.access);
          if (data.refresh) {
              localStorage.setItem('refresh_token', data.refresh);
          }
          return data.access;
      } else {
          console.error("Refresh failed:", data);
          app.logout();
      }
  } catch (e) { 
      console.error("Network error during refresh", e); 
  }
  return null;
},

  // 4. Fetch Profile (Me)
  fetchAndRenderMe: async (ui) => {
      let token = app.getAccessToken();
      if (!token) {
          window.location.href = 'index.html';
          return;
      }

      const fetchProfile = async (accessToken) => {
          return fetch(`${CONFIG.API_BASE_URL}/me/`, {
              headers: { 'Authorization': `Bearer ${accessToken}` }
          });
      };

      let response = await fetchProfile(token);

      // If expired, try to refresh once
      if (response.status === 401) {
          const newToken = await app.refreshAccessToken();
          if (newToken) {
              response = await fetchProfile(newToken);
          } else {
              app.logout();
              return;
          }
      }

      if (response.ok) {
          const user = await response.json();
          ui.idEl.textContent = user.id;
          ui.emailEl.textContent = user.email;
          ui.usernameEl.textContent = user.username;
      } else {
          app.showAlert('meAlert', 'Failed to load profile.');
      }

      // Setup Buttons
      ui.logoutBtn.onclick = () => app.logout();
      ui.refreshBtn.onclick = async () => {
          const success = await app.refreshAccessToken();
          app.showAlert('meAlert', success ? 'Token Refreshed!' : 'Refresh Failed', success ? 'success' : 'danger');
      };
  },

  // 5. Logout
  logout: async () => {
      const refresh = app.getRefreshToken();
      if (refresh) {
          await fetch(`${CONFIG.API_BASE_URL}/logout/`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refresh })
          }).catch(() => {}); // Ignore errors on logout
      }
      app.clearTokens();
      window.location.href = 'index.html';
  }
};

// --- DOM Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
  // Login Form
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
          e.preventDefault();
          const email = document.getElementById('email').value;
          const password = document.getElementById('password').value;
          app.login(email, password);
      });
  }

  // Signup Form
  const signupBtn = document.getElementById('signupBtn');
  if (signupBtn) {
      signupBtn.addEventListener('click', () => {
          const email = document.getElementById('su_email').value;
          const username = document.getElementById('su_username').value;
          const password = document.getElementById('su_password').value;
          const password2 = document.getElementById('su_password2').value;

          if (password !== password2) {
              app.showAlert('suAlert', 'Passwords do not match!');
              return;
          }
          app.register({ email, username, password, password2 });
      });
  }
});

// Expose app to window for me.html inline script
window.app = app;