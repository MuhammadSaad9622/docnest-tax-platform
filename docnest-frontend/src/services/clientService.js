import api from './api'

export const clientService = {
  getAll: (params) => api.get('/api/clients', { params }),
  getById: (id) => api.get(`/api/clients/${id}`),
  create: (data) => api.post('/api/clients', data),
  update: (id, data) => api.put(`/api/clients/${id}`, data),
  delete: (id) => api.delete(`/api/clients/${id}`),
  getIntake: (id) => api.get(`/api/clients/${id}/intake`).then(r => r.data),
}
