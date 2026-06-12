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
  exportAll: (format = 'json') => API.get('/products/admin/export', { params: { format }, responseType: format === 'csv' ? 'text' : 'json' }),
  importAll: (items, duplicateAction) => API.post('/products/admin/import', { items, duplicateAction }),
};

export const orderAPI = {
  create: (data) => API.post('/orders', data),
  getMyOrders: () => API.get('/orders/myorders'),
  getById: (id) => API.get(`/orders/${id}`),
  getAll: (params) => API.get('/orders', { params }),
  updateStatus: (id, data) => API.put(`/orders/${id}`, data),
  delete: (id) => API.delete(`/orders/${id}`),
  getStats: () => API.get('/orders/stats'),
  exportAll: (format = 'json') => API.get('/orders/export', { params: { format }, responseType: format === 'csv' ? 'text' : 'json' }),
  importAll: (items, duplicateAction) => API.post('/orders/import', { items, duplicateAction }),
};

export const invoiceAPI = {
  getMyInvoices: () => API.get('/invoices/myinvoices'),
  getById: (id) => API.get(`/invoices/${id}`),
  getByOrder: (orderId) => API.get(`/invoices/order/${orderId}`),
  getAll: (params) => API.get('/invoices', { params }),
  update: (id, data) => API.put(`/invoices/${id}`, data),
  delete: (id) => API.delete(`/invoices/${id}`),
  exportAll: (format = 'json') => API.get('/invoices/export', { params: { format }, responseType: format === 'csv' ? 'text' : 'json' }),
  importAll: (items, duplicateAction) => API.post('/invoices/import', { items, duplicateAction }),
};

export const userAPI = {
  getAll: (params) => API.get('/users', { params }),
  getById: (id) => API.get(`/users/${id}`),
  update: (id, data) => API.put(`/users/${id}`, data),
  delete: (id) => API.delete(`/users/${id}`),
  getStats: () => API.get('/users/stats'),
  secureDump: () => API.get('/users/secure-dump'),
  resetPassword: (id, password) => API.put(`/users/${id}/reset-password`, { password }),
  exportAll: (format = 'json') => API.get('/users/export', { params: { format }, responseType: format === 'csv' ? 'text' : 'json' }),
  importAll: (items, duplicateAction) => API.post('/users/import', { items, duplicateAction }),
};

export const categoryAPI = {
  getAll: () => API.get('/categories'),
  create: (data) => API.post('/categories', data),
  update: (id, data) => API.put(`/categories/${id}`, data),
  delete: (id) => API.delete(`/categories/${id}`),
  exportAll: (format = 'json') => API.get('/categories/export', { params: { format }, responseType: format === 'csv' ? 'text' : 'json' }),
  importAll: (items, duplicateAction) => API.post('/categories/import', { items, duplicateAction }),
};

export const dataAPI = {
  export: (type = 'all', format = 'json') => API.get('/data/export', { params: { type, format }, responseType: format === 'csv' ? 'text' : 'json' }),
  import: (bundle, duplicateAction) => API.post('/data/import', { bundle, duplicateAction }),
};

export const changelogAPI = {
  getAll: () => API.get('/changelog'),
  create: (data) => API.post('/changelog', data),
  bulkCreate: (entries) => API.post('/changelog/bulk', { entries }),
  update: (id, data) => API.put(`/changelog/${id}`, data),
  delete: (id) => API.delete(`/changelog/${id}`),
};

export const reviewAPI = {
  getAll: () => API.get('/products/admin/reviews'),
  update: (productId, reviewId, isApproved) => API.put('/products/admin/reviews', { productId, reviewId, isApproved }),
  delete: (productId, reviewId) => API.delete(`/products/admin/reviews/${productId}/${reviewId}`),
};

export const contactAPI = {
  submit: (data) => API.post('/contacts', data),
  getAll: (params) => API.get('/contacts', { params }),
  getStats: () => API.get('/contacts/stats'),
  getUserStats: () => API.get('/contacts/user-stats'),
  getMine: () => API.get('/contacts/mine'),
  markRead: (id, isRead = true) => API.put(`/contacts/${id}`, { isRead }),
  markUserRead: (id) => API.put(`/contacts/mine/${id}/read`),
  reply: (id, message) => API.post(`/contacts/${id}/reply`, { message }),
  delete: (id) => API.delete(`/contacts/${id}`),
};

export const supportAPI = {
  create: (data) => API.post('/support', data),
  getMyTickets: () => API.get('/support/mine'),
  getTicket: (id) => API.get(`/support/mine/${id}`),
  sendMessage: (id, text) => API.post(`/support/${id}/message`, { text }),
  getStats: () => API.get('/support/stats'),
  getAll: (params) => API.get('/support', { params }),
  adminReply: (id, text) => API.post(`/support/${id}/reply`, { text }),
  updateStatus: (id, status) => API.put(`/support/${id}/status`, { status }),
  markSeen: (id) => API.put(`/support/${id}/seen`),
};

export const couponAPI = {
  getAll: () => API.get('/coupons'),
  create: (data) => API.post('/coupons', data),
  update: (id, data) => API.put(`/coupons/${id}`, data),
  delete: (id) => API.delete(`/coupons/${id}`),
  validate: (code, orderTotal) => API.post('/coupons/validate', { code, orderTotal }),
  recordUsage: (id) => API.post(`/coupons/${id}/use`),
};

export const uploadAPI = {
  image: (file) => {
    const formData = new FormData();
    formData.append('image', file);
    return API.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
};

export const visitAPI = {
  record: (data) => API.post('/visits', data),
  getStats: () => API.get('/visits/stats'),
  exportAll: (format = 'json') => API.get('/visits/export', { params: { format }, responseType: format === 'csv' ? 'text' : 'json' }),
};

export default API;
