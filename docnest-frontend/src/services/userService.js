import api from './api'

export const userService = {
  list:    () => api.get('/api/users').then(r => r.data),
  update:  (id, data) => api.put(`/api/users/${id}`, data).then(r => r.data),
}
