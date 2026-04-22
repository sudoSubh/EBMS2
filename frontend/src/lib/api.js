import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Request interceptor – attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ebms_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor – global error handling
api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const { response } = error;

    if (response?.status === 401) {
      // Try refresh
      const refreshToken = localStorage.getItem('ebms_refresh');
      if (refreshToken) {
        try {
          const res = await axios.post(
            `${import.meta.env.VITE_API_URL}/auth/refresh`,
            { refreshToken }
          );
          const newToken = res.data.data.token;
          localStorage.setItem('ebms_token', newToken);
          error.config.headers.Authorization = `Bearer ${newToken}`;
          return api(error.config);
        } catch {
          localStorage.clear();
          window.location.href = '/';
        }
      } else {
        localStorage.clear();
        window.location.href = '/';
      }
    }

    return Promise.reject(response?.data || error);
  }
);

export default api;
