import api from './api'

export const taxslayerService = {
  getReturn: (clientId) => api.get(`/api/taxslayer/returns/${clientId}`).then(r => r.data),
  push:      (clientId) => api.post(`/api/taxslayer/push/${clientId}`).then(r => r.data),

  /** Downloads the TaxSlayer Pro import CSV (all visible clients when no ids given). */
  downloadCsv: async (clientIds) => {
    const res = await api.get('/api/taxslayer/export.csv', {
      params: clientIds?.length ? { clientIds: clientIds.join(',') } : {},
      responseType: 'blob',
    })
    const url = URL.createObjectURL(res.data)
    const a = document.createElement('a')
    a.href = url
    a.download = `taxslayer-import-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  },
}
