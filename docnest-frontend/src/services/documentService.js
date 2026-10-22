import api from './api'

export const documentService = {
  /** Get documents by owner type (CLIENT or FAMILY_MEMBER) */
  getByOwner: (ownerType, ownerId) => api.get(`/api/documents/owner/${ownerType}/${ownerId}`),

  /** Backward-compat: get by client ID */
  getByClient: (clientId) => api.get(`/api/documents/client/${clientId}`),

  /** Upload document for any owner — now includes optional OCR data */
  upload: (ownerType, ownerId, documentType, file, ocrText, confidence) => {
    const form = new FormData()
    form.append('ownerType', ownerType)
    form.append('ownerId', ownerId)
    if (documentType) form.append('documentType', documentType)
    form.append('file', file)
    if (ocrText) form.append('ocrText', ocrText)
    if (confidence != null) form.append('confidence', confidence)
    return api.post('/api/documents/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  replace: (documentId, file, ocrText, confidence) => {
    const form = new FormData()
    form.append('file', file)
    if (ocrText) form.append('ocrText', ocrText)
    if (confidence != null) form.append('confidence', confidence)
    return api.put(`/api/documents/replace/${documentId}`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  delete: (documentId) => api.delete(`/api/documents/${documentId}`),

  /** Get document completion stats */
  getCompletion: (ownerType, ownerId) => api.get(`/api/documents/completion/${ownerType}/${ownerId}`),

  /** Preparer confirms/corrects OCR-extracted tax fields */
  updateFields: (documentId, fields) => api.put(`/api/documents/${documentId}/fields`, fields).then(r => r.data),

  getPreviewUrl: (documentId) => `${import.meta.env.VITE_API_URL}/api/documents/preview/${documentId}`,
}
