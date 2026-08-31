import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({ baseURL });

// Attach the staff JWT when one exists. Citizen-facing endpoints (report
// an incident, track a reference code) never require a token, so this is
// simply a no-op for those requests.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('aquasync_staff_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If a staff token expires or is rejected, drop it so the app falls back
// to the login screen instead of looping on 401s.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('aquasync_staff_token');
      localStorage.removeItem('aquasync_staff_user');
    }
    return Promise.reject(error);
  }
);

export default api;
