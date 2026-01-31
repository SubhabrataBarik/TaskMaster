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

    // --- Authenticated Fetch (AUTO REFRESH) ---
    authFetch: async (url, options = {}) => {
        let access = app.getAccessToken();

        options.headers = {
            ...(options.headers || {}),
            Authorization: `Bearer ${access}`,
            "Content-Type": "application/json",
        };

        let response = await fetch(url, options);

        // Access token expired
        if (response.status === 401) {
            const newAccess = await app.refreshAccessToken();

            if (!newAccess) {
                app.logout();
                return;
            }

            // Retry original request with new token
            options.headers.Authorization = `Bearer ${newAccess}`;
            response = await fetch(url, options);
        }

        return response;
    },

    // --- API Methods ---
    
    // 1. Register
    register: async (formData) => {
        app.toggleLoading('signupBtn', 'signupSpinner', true);
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/auth/register/`, {
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
            const response = await fetch(`${CONFIG.API_BASE_URL}/auth/login/`, {
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

    const response = await fetch(`${CONFIG.API_BASE_URL}/auth/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh })
    });

    if (!response.ok) {
        app.logout();
        return null;
    }

    const data = await response.json();
    localStorage.setItem('access_token', data.access);
    return data.access;
},

  
    // 4. Fetch Profile (Me)
    fetchAndRenderMe: async (ui) => {
        const response = await app.authFetch(
            `${CONFIG.API_BASE_URL}/auth/me/`
        );
    
        if (!response || !response.ok) {
            app.logout();
            return;
        }
    
        const user = await response.json();
    
        ui.idEl.textContent = user.id;
        ui.emailEl.textContent = user.email;
        ui.usernameEl.textContent = user.username;
    
        ui.logoutBtn.onclick = () => app.logout();
    },
  
    // 5. Logout
    logout: async () => {
        const refresh = app.getRefreshToken();
        if (refresh) {
            await app.authFetch(`${CONFIG.API_BASE_URL}/auth/logout/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh })
            }).catch(() => {}); // Ignore errors on logout
        }
        app.clearTokens();
        window.location.href = 'index.html';
    },
  };
  
  
  // --- DOM Event Listeners ---
  document.addEventListener('DOMContentLoaded', () => {

    // Google Login (Backend OAuth)
    const googleBtn = document.getElementById("googleBtn");

    if (googleBtn) {
        google.accounts.id.initialize({
            client_id: CONFIG.GOOGLE_CLIENT_ID,
            callback: async (response) => {
                try {
                    const res = await fetch(
                        `${CONFIG.API_BASE_URL}/auth/google/`,
                        {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                                access_token: response.credential,
                            }),
                        }
                    );
    
                    const data = await res.json();
    
                    if (!res.ok) {
                        app.showAlert("alertPlaceholder", "Google login failed");
                        return;
                    }
    
                    app.setTokens(data.access, data.refresh);
                    window.location.href = "me.html";
                } catch (err) {
                    app.showAlert("alertPlaceholder", "Google server error");
                }
            },
        });
    
        // IMPORTANT PART
        google.accounts.id.renderButton(
            googleBtn,
            {
                theme: "outline",
                size: "large",
                text: "continue_with",
                width: "100%",
            }
        );
    }

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
  
  // Expose app to window for html inline script
  window.app = app;