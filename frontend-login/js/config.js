// js/config.js
// Edit API_BASE_URL when your backend exists.
// For early frontend work, set USE_MOCK = true to use local mocks.
window.APP_CONFIG = {
    USE_MOCK: true,
    API_BASE_URL: (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_BASE_URL) ? import.meta.env.VITE_API_BASE_URL : "http://localhost:8000",
  };
  