import axios from 'axios';
import { API_URL } from '@/settings';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000, // 10 seconds timeout is a good default
  headers: {
    'Content-Type': 'application/json',
    // Add other default headers here if needed
  },
});

// Optional: Add interceptors for auth, logging, or error handling
// api.interceptors.response.use(
//   response => response,
//   error => {
//     // Handle global errors here
//     return Promise.reject(error);
//   }
// );

export default api; 