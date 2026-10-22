import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  timeout: 60000, // 60s to handle Render cold starts
});

// Request interceptor — attach JWT token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('docnest_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — global error handling
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;

      // 401 = missing/expired session. 403 = role/office denial, which must not log the user out.
      if (status === 401) {
        console.warn('[API] Auth failed, clearing session');
        localStorage.removeItem('docnest_token');
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login?expired=true';
        }
      }

      const message = data?.message || data?.error || `Request failed (${status})`;
      return Promise.reject(new Error(message));
    } else if (error.request) {
      // Distinguish CORS errors, timeouts, and general network failures
      if (error.code === 'ECONNABORTED') {
        return Promise.reject(
          new Error('Server is waking up. Please wait a moment and try again.')
        );
      }
      if (error.code === 'ERR_NETWORK') {
        return Promise.reject(
          new Error(
            'Unable to connect to server. Please try again in a few seconds.'
          )
        );
      }
      return Promise.reject(
        new Error(
          'Unable to connect to server. Please check your internet connection and try again.'
        )
      );
    }
    return Promise.reject(new Error(error.message || 'Something went wrong'));
  }
);

export default API;
