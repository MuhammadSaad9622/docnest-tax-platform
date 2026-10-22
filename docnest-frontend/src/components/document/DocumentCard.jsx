import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import LinearProgress from '@mui/material/LinearProgress'
import Chip from '@mui/material/Chip'
import Collapse from '@mui/material/Collapse'
import { MdCloudUpload, MdVisibility, MdAutorenew, MdDelete, MdCheckCircle, MdWarning, MdInsertDriveFile, MdVerified, MdError, MdLightbulb } from 'react-icons/md'
import { toast } from 'react-toastify'
import { documentService } from '../../services/documentService'
import { docTypeLabel, formatDate } from '../../utils/formatters'
import { MAX_FILE_SIZE_MB, isAllowedFileType, isFileSizeOk, validateFile } from '../../utils/validators'
import { extractTextFromFile } from '../../utils/ocrService'
import { validateDocument } from '../../utils/documentValidators'
import { useAuth } from '../../context/AuthContext'
import { can } from '../../utils/permissions'
import { portalService } from '../../services/portalService'

const DOC_ICONS = {
  AADHAR:           { icon: '🪪', color: '#4F46E5' },
  PAN:              { icon: '🏦', color: '#10B981' },
  DRIVING_LICENSE:  { icon: '🚗', color: '#F59E0B' },
  ELECTRICITY_BILL: { icon: '⚡', color: '#EF4444' },
  W2:               { icon: '📋', color: '#2563EB' },
  W2_FORM:          { icon: '📋', color: '#2563EB' },
  FORM_1099NEC:     { icon: '📄', color: '#7C3AED' },
  FORM_1099_MISC:   { icon: '📄', color: '#0891B2' },
  SSN_CARD:         { icon: '🔢', color: '#DC2626' },
  US_PASSPORT:      { icon: '🛂', color: '#059669' },
}

// OCR step pipeline
const OCR_STEPS = [
  { id: 'file',     label: 'Checking file type & size',    icon: '📁' },
  { id: 'ocr',      label: 'Scanning document with OCR',   icon: '🔍' },
  { id: 'validate', label: 'Validating document content',  icon: '🧠' },
  { id: 'upload',   label: 'Uploading to server',          icon: '☁️' },
]

export default function DocumentCard({ ownerType, ownerId, docType, document: doc, onRefresh, onPreview, compact, isClientPortal }) {
  const { user } = useAuth()
  const canReplace = isClientPortal || can(user, 'replaceDocument')
  const canDeleteDoc = isClientPortal || can(user, 'deleteDocument')
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // OCR state
  const [ocrStep, setOcrStep] = useState(null)        // 'file' | 'ocr' | 'validate' | 'upload' | 'success' | 'error'
  const [ocrProgress, setOcrProgress] = useState(0)
  const [ocrResult, setOcrResult] = useState(null)     // { valid, confidence, reason, suggestions, extractedValue }
  const [ocrError, setOcrError] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)

  const meta = DOC_ICONS[docType] || { icon: '📄', color: '#6B7280' }
  const isUploaded = !!doc
  const isProcessing = ['file', 'ocr', 'validate', 'upload'].includes(ocrStep)

  const resetOcr = () => {
    setOcrStep(null)
    setOcrProgress(0)
    setOcrResult(null)
    setOcrError(null)
    setSelectedFile(null)
  }

  const handleUpload = useCallback(async (file) => {
    resetOcr()
    setSelectedFile(file)
    setUploading(true)

    // ── Step 1: File validation ──
    setOcrStep('file')
    const fileCheck = validateFile(file)
    if (!fileCheck.valid) {
      setOcrStep('error')
      setOcrError(fileCheck.message)
      toast.error(fileCheck.message)
      setUploading(false)
      return
    }
    await sleep(300)

    // ── Step 2: OCR text extraction ──
    setOcrStep('ocr')
    let rawText = ''
    try {
      rawText = await extractTextFromFile(file, (p) => setOcrProgress(p))
    } catch (err) {
      console.error('OCR failed:', err)
      setOcrStep('error')
      setOcrError('OCR scanning failed. Please try again with a clearer image.')
      toast.error('OCR scanning failed. Use a clearer, well-lit image or PDF.')
      setUploading(false)
      return
    }

    // ── Step 3: Document content validation ──
    setOcrStep('validate')
    await sleep(400)
    const validation = validateDocument(docType, rawText)
    setOcrResult(validation)

    if (!validation.valid) {
      setOcrStep('error')
      setOcrError(validation.reason)
      toast.error(`Validation failed: ${validation.reason}`, { autoClose: 7000 })
      setUploading(false)
      return
    }

    // ── Step 4: Upload to backend ──
    setOcrStep('upload')
    try {
      if (isClientPortal) {
        if (doc) {
          toast.info('Replace existing document from your portal coming soon')
        } else {
          await portalService.upload(docType, file, rawText, validation.confidence)
          toast.success(`${docTypeLabel(docType)} uploaded & verified ✅`)
        }
      } else if (doc) {
        await documentService.replace(doc.id, file)
        toast.success(`${docTypeLabel(docType)} replaced & verified ✅`)
      } else {
        await documentService.upload(ownerType, ownerId, docType, file, rawText, validation.confidence)
        toast.success(`${docTypeLabel(docType)} uploaded & verified ✅`)
      }
      setOcrStep('success')
      onRefresh?.()
    } catch (e) {
      setOcrStep('error')
      setOcrError(e.response?.data?.message || 'Upload failed')
      toast.error('Upload failed')
    } finally {
      setUploading(false)
    }
  }, [doc, ownerType, ownerId, docType, onRefresh, isClientPortal])

  const handleDelete = async () => {
    if (!doc) return
    setDeleting(true)
    try {
      if (isClientPortal) {
        await portalService.delete(doc.id)
      } else {
        await documentService.delete(doc.id)
      }
      toast.success(`${docTypeLabel(docType)} deleted`)
      resetOcr()
      onRefresh?.()
    } catch { toast.error('Delete failed') }
    finally { setDeleting(false) }
  }

  const onDrop = useCallback((accepted, rejected) => {
    if (rejected.length > 0) {
      toast.error(`Invalid file. Allowed: PDF, JPG, PNG (max ${MAX_FILE_SIZE_MB}MB)`)
      return
    }
    handleUpload(accepted[0])
  }, [handleUpload])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'] },
    maxSize: MAX_FILE_SIZE_MB * 1024 * 1024,
    multiple: false,
    noClick: isProcessing,
    noDrag: isProcessing,
  })

  const currentStepIdx = OCR_STEPS.findIndex(s => s.id === ocrStep)

  return (
    <Box sx={{
      border: (ocrStep === 'success' || isUploaded) ? '1px solid #A7F3D0' : ocrStep === 'error' ? '1px solid #FECACA' : '2px dashed var(--border-strong)',
      borderRadius: 'var(--radius)',
      p: compact ? 2 : 2.5,
      background: (ocrStep === 'success' || isUploaded) ? '#F0FDF4' : ocrStep === 'error' ? '#FFF5F5' : isProcessing ? '#FAFBFF' : 'var(--surface-2)',
      transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      '&:hover': !isProcessing ? {
        borderColor: meta.color,
        boxShadow: `0 0 0 1px ${meta.color}22, 0 4px 20px ${meta.color}11`,
        transform: 'translateY(-2px)',
      } : {},
    }}>
      {/* ── Header ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{
            width: compact ? 32 : 40, height: compact ? 32 : 40,
            borderRadius: 'var(--radius-sm)',
            background: `${meta.color}14`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: compact ? '1rem' : '1.3rem',
          }}>{meta.icon}</Box>
          <Box>
            <Typography variant={compact ? 'body2' : 'subtitle2'} sx={{ fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>
              {docTypeLabel(docType)}
            </Typography>
            {isUploaded && !compact && (
              <Typography variant="caption" sx={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>{doc.fileName}</Typography>
            )}
          </Box>
        </Box>
        <StatusBadge state={ocrStep} isUploaded={isUploaded} confidence={ocrResult?.confidence} />
      </Box>

      {/* ── Uploaded doc info ── */}
      {isUploaded && !ocrStep && (
        <Box sx={{ textAlign: 'center', py: 1.5, px: 2, background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', mb: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
          <MdInsertDriveFile size={18} color="var(--primary)" />
          <Typography variant="caption" sx={{ color: 'var(--text-secondary)', fontWeight: 500, maxWidth: 180 }} noWrap>{doc.fileName}</Typography>
        </Box>
      )}

      {/* ── Drop zone (when no processing active) ── */}
      {(isClientPortal || can(user, 'uploadDocument')) && !isProcessing && ocrStep !== 'success' && (
        <Box {...getRootProps()} sx={{
          cursor: 'pointer', textAlign: 'center', py: compact ? 1.5 : 2,
          borderRadius: 'var(--radius-sm)', transition: 'all 0.2s',
          border: isDragActive ? `2px dashed ${meta.color}` : '1px dashed transparent',
          background: isDragActive ? `${meta.color}08` : 'transparent',
          '&:hover': { background: `${meta.color}08` },
        }}>
          <input {...getInputProps()} />
          <MdCloudUpload size={compact ? 24 : 30} color={isDragActive ? meta.color : 'var(--border-strong)'} />
          <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: 'var(--primary)', fontWeight: 600, fontSize: compact ? '0.65rem' : '0.75rem' }}>
            {isDragActive ? 'Drop file here' : isUploaded ? 'Drop to replace' : 'Drag & drop or click'}
          </Typography>
          <Typography variant="caption" sx={{ color: 'var(--text-muted)', fontSize: '0.6rem' }}>PDF, JPG, PNG · Max {MAX_FILE_SIZE_MB}MB · Smart OCR validation</Typography>
        </Box>
      )}

      {/* ── OCR Processing Pipeline ── */}
      <Collapse in={!!ocrStep && ocrStep !== 'idle'}>
        <Box sx={{ mt: 1.5 }}>
          {/* File info banner */}
          {selectedFile && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 1, background: '#F1F5F9', borderRadius: 'var(--radius-sm)', mb: 1, fontSize: '0.7rem' }}>
              <span>📄</span>
              <Typography variant="caption" sx={{ flex: 1, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedFile.name}</Typography>
              <Typography variant="caption" sx={{ color: 'var(--text-muted)' }}>{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</Typography>
            </Box>
          )}

          {/* Step pipeline */}
          {OCR_STEPS.map((step, idx) => {
            let status = 'pending'
            if (ocrStep === 'error' && idx === currentStepIdx) status = 'error'
            else if (ocrStep === 'success' || idx < currentStepIdx) status = 'done'
            else if (idx === currentStepIdx) status = 'active'

            return (
              <Box key={step.id} sx={{
                display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.8, borderRadius: 'var(--radius-sm)',
                fontSize: '0.75rem', transition: 'all 0.25s',
                color: status === 'pending' ? '#94A3B8' : status === 'active' ? '#4F46E5' : status === 'done' ? '#065F46' : '#991B1B',
                background: status === 'active' ? '#EEF2FF' : status === 'done' ? '#F0FDF4' : status === 'error' ? '#FFF5F5' : 'transparent',
                fontWeight: status === 'active' || status === 'error' ? 600 : 400,
              }}>
                <Box sx={{ width: 20, textAlign: 'center', flexShrink: 0 }}>
                  {status === 'done' && '✅'}
                  {status === 'active' && <Box component="span" sx={{ display: 'inline-block', width: 12, height: 12, border: '2px solid #C7D2FE', borderTopColor: '#4F46E5', borderRadius: '50%', animation: 'spin 0.7s linear infinite', '@keyframes spin': { to: { transform: 'rotate(360deg)' } } }} />}
                  {status === 'error' && '❌'}
                  {status === 'pending' && step.icon}
                </Box>
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.3 }}>
                  <span>{step.label}</span>
                  {/* OCR progress bar */}
                  {step.id === 'ocr' && status === 'active' && (
                    <Box sx={{ position: 'relative' }}>
                      <LinearProgress variant="determinate" value={ocrProgress} sx={{ height: 4, borderRadius: 2, bgcolor: '#C7D2FE', '& .MuiLinearProgress-bar': { background: '#4F46E5', borderRadius: 2 } }} />
                      <Typography variant="caption" sx={{ fontSize: '0.6rem', color: '#4F46E5', fontWeight: 700, mt: 0.2 }}>{ocrProgress}%</Typography>
                    </Box>
                  )}
                  {/* Confidence badge */}
                  {step.id === 'validate' && status === 'done' && ocrResult && (
                    <Chip label={`${ocrResult.confidence}% confidence`} size="small" sx={{ height: 18, fontSize: '0.55rem', fontWeight: 700, background: '#D1FAE5', color: '#065F46', alignSelf: 'flex-start' }} />
                  )}
                </Box>
              </Box>
            )
          })}

          {/* Error detail */}
          {ocrStep === 'error' && ocrError && (
            <Box sx={{ mt: 1, p: 1.5, background: '#FFF5F5', border: '1px solid #FECACA', borderRadius: 'var(--radius-sm)', fontSize: '0.72rem' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 700, color: '#991B1B', mb: 0.5 }}>
                <MdError size={14} /> Validation Failed
              </Box>
              <Typography variant="caption" sx={{ color: '#475569', lineHeight: 1.6, display: 'block' }}>{ocrError}</Typography>
              {ocrResult?.suggestions?.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 600, color: '#92400E', fontSize: '0.65rem', mb: 0.3 }}>
                    <MdLightbulb size={12} /> Suggestions
                  </Box>
                  <Box component="ul" sx={{ m: 0, pl: 2.2, '& li': { fontSize: '0.68rem', color: '#475569', lineHeight: 1.6, mb: 0.3 } }}>
                    {ocrResult.suggestions.map((s, i) => <li key={i}>{s}</li>)}
                  </Box>
                </Box>
              )}
            </Box>
          )}

          {/* Success detail */}
          {ocrStep === 'success' && ocrResult && (
            <Box sx={{ mt: 1, p: 1.5, background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 'var(--radius-sm)', fontSize: '0.72rem' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 700, color: '#065F46', mb: 0.5 }}>
                <MdVerified size={14} /> Document Verified & Uploaded
              </Box>
              <Typography variant="caption" sx={{ color: '#047857', lineHeight: 1.6, display: 'block' }}>{ocrResult.reason}</Typography>
              {ocrResult.extractedValue && (
                <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: '#065F46', fontWeight: 600 }}>
                  Detected: {ocrResult.extractedValue}
                </Typography>
              )}
            </Box>
          )}
        </Box>
      </Collapse>

      {/* ── Action buttons ── */}
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5, mt: 1.5, pt: isUploaded || ocrStep ? 1.5 : 0, borderTop: isUploaded || ocrStep ? '1px solid var(--border)' : 'none' }}>
        {ocrStep === 'error' && (
          <Tooltip title="Try Again">
            <IconButton size="small" onClick={resetOcr} sx={{ color: '#4F46E5' }}><MdAutorenew size={16} /></IconButton>
          </Tooltip>
        )}
        {isUploaded && (
          <>
            <Tooltip title="Preview">
              <IconButton size="small" onClick={() => onPreview?.(doc)} sx={{ color: 'var(--primary)' }}><MdVisibility size={16} /></IconButton>
            </Tooltip>
            {canReplace && (
              <Tooltip title="Replace">
                <IconButton size="small" component="label" sx={{ color: 'var(--accent)' }} disabled={isProcessing}>
                  <MdAutorenew size={16} />
                  <input type="file" hidden accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => e.target.files[0] && handleUpload(e.target.files[0])} />
                </IconButton>
              </Tooltip>
            )}
            {canDeleteDoc && (
              <Tooltip title="Delete">
                <IconButton size="small" onClick={handleDelete} disabled={deleting} sx={{ color: 'var(--danger)' }}><MdDelete size={16} /></IconButton>
              </Tooltip>
            )}
          </>
        )}
      </Box>
    </Box>
  )
}

// ── Status badge sub-component ──
function StatusBadge({ state, isUploaded, confidence }) {
  if (state === 'success' || (isUploaded && !state)) {
    return (
      <Chip size="small" icon={<MdVerified size={14} />} label={confidence ? `Verified · ${confidence}%` : 'Uploaded'}
        sx={{ fontWeight: 600, fontSize: '0.6rem', height: 24, backgroundColor: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', '& .MuiChip-icon': { color: '#059669' } }} />
    )
  }
  if (state === 'error') {
    return <Chip size="small" icon={<MdError size={14} />} label="Invalid" sx={{ fontWeight: 600, fontSize: '0.6rem', height: 24, backgroundColor: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', '& .MuiChip-icon': { color: '#DC2626' } }} />
  }
  if (['file', 'ocr', 'validate', 'upload'].includes(state)) {
    return <Chip size="small" label="🔍 Scanning..." sx={{ fontWeight: 600, fontSize: '0.6rem', height: 24, backgroundColor: '#EEF2FF', color: '#4338CA', border: '1px solid #C7D2FE', animation: 'pulse 1.5s infinite', '@keyframes pulse': { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0.6 } } }} />
  }
  return <Chip size="small" icon={<MdWarning size={14} />} label="Missing" sx={{ fontWeight: 600, fontSize: '0.6rem', height: 24, backgroundColor: '#FFF7ED', color: '#D97706', border: '1px solid #FDE68A', '& .MuiChip-icon': { color: '#D97706' } }} />
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }
