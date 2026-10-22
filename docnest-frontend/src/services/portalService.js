import api from './api'

const toForm = (fields) => {
  const form = new FormData()
  Object.entries(fields).forEach(([k, v]) => { if (v != null && v !== '') form.append(k, v) })
  return form
}

export const portalService = {
  getMe:         () => api.get('/api/portal/me').then(r => r.data),
  getDocuments:  () => api.get('/api/portal/documents').then(r => r.data),
  getCompletion: () => api.get('/api/portal/documents/completion').then(r => r.data),
  upload: (documentType, file, ocrText, confidence) =>
    api.post('/api/portal/documents/upload', toForm({ documentType, file, ocrText, confidence }), {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data),
  replace: (documentId, file, ocrText, confidence) =>
    api.put(`/api/portal/documents/${documentId}/replace`, toForm({ file, ocrText, confidence }), {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data),
  delete: (documentId) => api.delete(`/api/portal/documents/${documentId}`),
  previewPath: (documentId) => `/api/portal/documents/${documentId}/preview`,
  getIntake:  () => api.get('/api/portal/intake').then(r => r.data),
  saveIntake: (intake, submit = false) => api.put('/api/portal/intake', intake, { params: { submit } }).then(r => r.data),
}
