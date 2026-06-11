import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:5000/api' });

API.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  if (user?.token) config.headers.Authorization = `Bearer ${user.token}`;
  return config;
});

API.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401 && error.response?.data?.deactivated) {
      localStorage.removeItem('user');
      window.dispatchEvent(new CustomEvent('auth:deactivated'));
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data) => API.post('/auth/login', data),
  register: (data) => API.post('/auth/register', data),
  getProfile: () => API.get('/auth/profile'),
  updateProfile: (data) => API.put('/auth/profile', data),
  toggleWishlist: (productId) => API.post(`/auth/wishlist/${productId}`),
  getCards: () => API.get('/auth/cards'),
  saveCard: (data) => API.post('/auth/cards', data),
  deleteCard: (id) => API.delete(`/auth/cards/${id}`),
};

export const productAPI = {
  getAll: (params) => API.get('/products', { params }),
  adminGetAll: (params) => API.get('/products/admin/all', { params }),
  getById: (id) => API.get(`/products/${id}`),
  getBySlug: (slug) => API.get(`/products/${slug}`),
  getFeatured: () => API.get('/products/featured'),
  getCategories: () => API.get('/products/categories'),
  create: (data) => API.post('/products', data),
  update: (id, data) => API.put(`/products/${id}`, data),
  delete: (id) => API.delete(`/products/${id}`),
  addReview: (id, data) => API.post(`/products/${id}/reviews`, data),
  updateReview: (id, data) => API.put(`/products/${id}/reviews`, data),
};

export const orderAPI = {
  create: (data) => API.post('/orders', data),
  getMyOrders: () => API.get('/orders/myorders'),
  getById: (id) => API.get(`/orders/${id}`),
  getAll: (params) => API.get('/orders', { params }),
  updateStatus: (id, data) => API.put(`/orders/${id}`, data),
  delete: (id) => API.delete(`/orders/${id}`),
  getStats: () => API.get('/orders/stats'),
};

export const invoiceAPI = {
  getMyInvoices: () => API.get('/invoices/myinvoices'),
  getById: (id) => API.get(`/invoices/${id}`),
  getByOrder: (orderId) => API.get(`/invoices/order/${orderId}`),
  getAll: (params) => API.get('/invoices', { params }),
  update: (id, data) => API.put(`/invoices/${id}`, data),
  delete: (id) => API.delete(`/invoices/${id}`),
};

export const userAPI = {
  getAll: (params) => API.get('/users', { params }),
  getById: (id) => API.get(`/users/${id}`),
  update: (id, data) => API.put(`/users/${id}`, data),
  delete: (id) => API.delete(`/users/${id}`),
  getStats: () => API.get('/users/stats'),
};

export const categoryAPI = {
  getAll: () => API.get('/categories'),
  create: (data) => API.post('/categories', data),
  update: (id, data) => API.put(`/categories/${id}`, data),
  delete: (id) => API.delete(`/categories/${id}`),
};

export const visitAPI = {
  record: (data) => API.post('/visits', data),
  getStats: () => API.get('/visits/stats'),
};

export default API;
