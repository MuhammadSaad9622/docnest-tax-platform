import { useEffect, useState } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import CircularProgress from '@mui/material/CircularProgress'
import { MdClose, MdDownload } from 'react-icons/md'
import Badge from '../ui/Badge'
import api from '../../services/api'
import { docTypeLabel, formatDate } from '../../utils/formatters'

/**
 * Files are behind JWT auth on the API domain, so they are fetched with the
 * token and shown from a local blob URL rather than linked directly.
 * `previewPath` overrides the staff endpoint (the client portal has its own).
 */
export default function DocumentPreviewModal({ open, document: doc, onClose, previewPath }) {
  const [blobUrl, setBlobUrl] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!open || !doc) return
    let url = null
    setBlobUrl(null)
    setError(null)
    api.get(previewPath || `/api/documents/preview/${doc.id}`, { responseType: 'blob' })
      .then(res => { url = URL.createObjectURL(res.data); setBlobUrl(url) })
      .catch(e => setError(e.message || 'Could not load document'))
    return () => { if (url) URL.revokeObjectURL(url) }
  }, [open, doc, previewPath])

  if (!doc) return null

  const isImage = doc.fileName?.match(/\.(jpg|jpeg|png)$/i)

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      slotProps={{ backdrop: { sx: { backdropFilter: 'blur(6px)', background: 'rgba(15,23,42,0.6)' } } }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, pt: 3, pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography variant="h6" sx={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '1rem' }}>
            {doc.fileName}
          </Typography>
          <Badge label={docTypeLabel(doc.documentType)} variant="primary" />
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: 'var(--text-muted)' }}>
          <MdClose size={20} />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ px: 3, pb: 0 }}>
        {doc.uploadDate && (
          <Typography variant="caption" sx={{ display: 'block', mb: 1.5, color: 'var(--text-muted)' }}>
            Uploaded on {formatDate(doc.uploadDate)}
          </Typography>
        )}
        <Box sx={{
          background: 'var(--surface-3)', borderRadius: 'var(--radius)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          minHeight: 400, overflow: 'hidden',
        }}>
          {error ? (
            <Typography variant="body2" sx={{ color: 'var(--danger)' }}>{error}</Typography>
          ) : !blobUrl ? (
            <CircularProgress size={28} />
          ) : isImage ? (
            <img src={blobUrl} alt={doc.fileName} style={{ maxWidth: '100%', maxHeight: 500, objectFit: 'contain' }} />
          ) : (
            <iframe src={blobUrl} title={doc.fileName} style={{ width: '100%', height: 500, border: 'none' }} />
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button
          variant="outlined"
          startIcon={<MdDownload />}
          component="a"
          href={blobUrl || undefined}
          download={doc.fileName}
          disabled={!blobUrl}
        >
          Download
        </Button>
        <Button variant="outlined" onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  )
}
