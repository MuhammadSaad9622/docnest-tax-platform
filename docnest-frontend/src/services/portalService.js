import api from './api'

export const portalService = {
  getMe:         () => api.get('/api/portal/me').then(r => r.data),
  getDocuments:  () => api.get('/api/portal/documents').then(r => r.data),
  getCompletion: () => api.get('/api/portal/documents/completion').then(r => r.data),
  upload: (documentType, file, ocrText, confidence) => {
    const form = new FormData()
    if (documentType) form.append('documentType', documentType)
    form.append('file', file)
    if (ocrText) form.append('ocrText', ocrText)
    if (confidence != null) form.append('confidence', confidence)
    return api.post('/api/portal/documents/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data)
  },
  delete: (documentId) => api.delete(`/api/portal/documents/${documentId}`),
}
