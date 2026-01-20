// js/app.js
(function () {
    const cfg = window.APP_CONFIG || { USE_MOCK: true, API_BASE_URL: "" };
  
    const form = document.getElementById("loginForm");
    const emailEl = document.getElementById("email");
    const passwordEl = document.getElementById("password");
    const loginBtn = document.getElementById("loginBtn");
    const loginBtnText = document.getElementById("loginBtnText");
    const loginSpinner = document.getElementById("loginSpinner");
    const alertPlaceholder = document.getElementById("alertPlaceholder");
    const googleBtn = document.getElementById("googleBtn");
    const githubBtn = document.getElementById("githubBtn");
    const signUpLink = document.getElementById("signUpLink");
  
    function showAlert(message, type = "danger") {
      alertPlaceholder.innerHTML = `
        <div class="alert alert-${type} alert-sm" role="alert">
          ${message}
        </div>
      `;
    }
  
    function clearAlert() {
      alertPlaceholder.innerHTML = "";
    }
  
    function setLoading(loading) {
      if (loading) {
        loginBtn.setAttribute("disabled", "true");
        loginSpinner.classList.remove("d-none");
      } else {
        loginBtn.removeAttribute("disabled");
        loginSpinner.classList.add("d-none");
      }
    }
  
    async function mockLogin(email, password) {
      // simple mock: if email contains "test" succeed, else fail
      await new Promise(r => setTimeout(r, 700)); // simulate network
      if (!email || !password) {
        return { ok: false, status: 400, data: { detail: "Missing credentials." } };
      }
      if (email.includes("test") && password.length >= 6) {
        return { ok: true, status: 200, data: { access: "fake.access.token", user: { id: "u-123", email } } };
      }
      return { ok: false, status: 401, data: { detail: "Invalid credentials." } };
    }
  
    async function callLoginApi(email, password) {
      if (cfg.USE_MOCK) {
        return mockLogin(email, password);
      }
      // Real call to backend
      try {
        const resp = await fetch(cfg.API_BASE_URL + "/api/auth/login/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = await resp.json();
        return { ok: resp.ok, status: resp.status, data };
      } catch (err) {
        return { ok: false, status: 0, data: { detail: "Network error" } };
      }
    }
  
    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      clearAlert();
  
      // browser built-in validity
      if (!form.checkValidity()) {
        form.classList.add("was-validated");
        return;
      }
  
      const email = emailEl.value.trim();
      const password = passwordEl.value;
  
      setLoading(true);
  
      const result = await callLoginApi(email, password);
      setLoading(false);
  
      if (result.ok) {
        // success – store token (temporary)
        // NOTE: use HttpOnly cookies in production instead of localStorage
        try {
          localStorage.setItem("tm_access_token", result.data.access);
        } catch (err) {
          console.warn("Could not persist token", err);
        }
        // redirect to dashboard (replace with actual route)
        window.location.href = "/dashboard.html";
      } else {
        const detail = result.data && result.data.detail ? result.data.detail : "Login failed";
        showAlert(detail, "danger");
      }
    });
  
    // OAuth button clicks - these should point to backend OAuth endpoints
    googleBtn.addEventListener("click", function () {
      // in real app: window.location = API_BASE_URL + "/api/auth/google/login/"
      if (cfg.USE_MOCK) {
        showAlert("OAuth flow is mocked - implement backend endpoint /api/auth/google/login", "info");
        return;
      }
      window.location.href = cfg.API_BASE_URL + "/api/auth/google/login/";
    });
  
    githubBtn.addEventListener("click", function () {
      if (cfg.USE_MOCK) {
        showAlert("OAuth flow is mocked - implement backend endpoint /api/auth/github/login", "info");
        return;
      }
      window.location.href = cfg.API_BASE_URL + "/api/auth/github/login/";
    });
  
    signUpLink.addEventListener("click", function (e) {
      e.preventDefault();
      // navigate to sign up page (create sign-up page later)
      window.location.href = "/signup.html";
    });
  
  })();
  