import axios from 'axios';

const apiInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

apiInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

apiInstance.interceptors.response.use((response) => {
  return response;
}, (error) => {
  if (error.response && error.response.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
  }
  return Promise.reject(error);
});

const api = {
  auth: {
    login: (data) => apiInstance.post('/auth/login', data),
    register: (data) => apiInstance.post('/auth/register', data),
    getMe: () => apiInstance.get('/auth/me')
  },
  books: {
    getBooks: (params) => apiInstance.get('/books', { params }),
    getBook: (id) => apiInstance.get(`/books/${id}`),
    createBook: (data) => apiInstance.post('/books', data),
    updateBook: (id, data) => apiInstance.put(`/books/${id}`, data),
    deleteBook: (id) => apiInstance.delete(`/books/${id}`),
    scanBook: (id) => apiInstance.get(`/books/scan/${id}`)
  },
  transactions: {
    getTransactions: (params) => apiInstance.get('/transactions', { params }),
    issueBook: (data) => apiInstance.post('/transactions/issue', data),
    returnBook: (data) => apiInstance.post('/transactions/return', data)
  },
  dashboard: {
    getStats: () => apiInstance.get('/dashboard/stats'),
    getIssuedBooks: () => apiInstance.get('/dashboard/issued'),
    getOverdueBooks: () => apiInstance.get('/dashboard/overdue')
  },
  exports: {
    exportCSV: (params) => apiInstance.get('/export/csv', { params, responseType: 'blob' }),
    exportExcel: (params) => apiInstance.get('/export/excel', { params, responseType: 'blob' })
  },
  ai: {
    chat: (message, history) => apiInstance.post('/ai/chat', { message, history }),
    smartSearch: (query) => apiInstance.post('/ai/smart-search', { query })
  }
};

export default api;
