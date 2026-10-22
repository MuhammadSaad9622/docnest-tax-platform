import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import Avatar from '@mui/material/Avatar'
import Grid from '@mui/material/Grid'
import CircularProgress from '@mui/material/CircularProgress'
import Chip from '@mui/material/Chip'
import LinearProgress from '@mui/material/LinearProgress'
import { MdFolder, MdVisibility, MdCheckCircle, MdDelete, MdWarning } from 'react-icons/md'
import { toast } from 'react-toastify'
import { portalService } from '../services/portalService'
import { useAuth } from '../context/AuthContext'
import DocumentCard from '../components/document/DocumentCard'
import Spinner from '../components/ui/Spinner'
import { docTypeLabel } from '../utils/formatters'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Button from '@mui/material/Button'
import DocumentPreviewModal from '../components/document/DocumentPreviewModal'
import IntakeForm from '../components/intake/IntakeForm'

const DOC_TYPES = ['W2', 'FORM_1099NEC', 'FORM_1099_MISC', 'SSN_CARD', 'US_PASSPORT']

export default function ClientPortalPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [profile, setProfile] = useState(null)
  const [docs, setDocs] = useState([])
  const [completion, setCompletion] = useState({ uploaded: 0, total: 9, percentage: 0 })
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState(0)
  const [previewDoc, setPreviewDoc] = useState(null)
  const [intake, setIntake] = useState(null)
  const [savingIntake, setSavingIntake] = useState(false)

  const load = async () => {
    try {
      const [me, docRes, compRes, intakeRes] = await Promise.all([
        portalService.getMe(),
        portalService.getDocuments(),
        portalService.getCompletion(),
        portalService.getIntake().catch(() => null),
      ])
      setProfile(me.profile || {})
      setIntake(prev => prev || intakeRes)
      setDocs(docRes)
      setCompletion(compRes)
    } catch (e) {
      toast.error('Failed to load your portal. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (docId) => {
    try {
      await portalService.delete(docId)
      toast.success('Document removed')
      load()
    } catch (e) {
      toast.error('Could not delete document')
    }
  }

  const handleSaveIntake = async (submit) => {
    if (submit && !intake?.filingStatus) { toast.error('Please choose your filing status'); return }
    setSavingIntake(true)
    try {
      setIntake(await portalService.saveIntake(intake, submit))
      toast.success(submit ? 'Questionnaire sent to your tax preparer' : 'Progress saved')
    } catch (e) { toast.error(e.message) }
    finally { setSavingIntake(false) }
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  if (loading) return <Spinner message="Loading your portal…" />

  const pct = completion.percentage || 0

  return (
    <Box className="page-enter" sx={{ maxWidth: 1100, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{
            width: 48, height: 48, bgcolor: '#4F46E5',
            fontWeight: 700, fontSize: '1rem', fontFamily: 'var(--font-heading)',
          }}>
            {(user?.fullName || 'Client').charAt(0)}
          </Avatar>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
              My Document Portal
            </Typography>
            <Typography variant="body2" sx={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Welcome back{user?.fullName ? `, ${user.fullName}` : ''}. You can upload and manage your tax documents here.
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Chip label={user?.role || 'Client'} size="small" sx={{ fontWeight: 700 }} />
          <Chip
            label="Sign Out"
            size="small"
            onClick={handleLogout}
            sx={{
              fontWeight: 600, cursor: 'pointer',
              background: 'var(--surface-2)', color: 'var(--text-secondary)',
              '&:hover': { background: '#FEF2F2', color: '#DC2626' },
            }}
          />
        </Box>
      </Box>

      {/* Completion Banner */}
      <Card sx={{
        p: 3, mb: 4, display: 'flex', alignItems: 'center', gap: 3,
        background: pct === 100
          ? 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)'
          : 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)',
        border: `1px solid ${pct === 100 ? '#A7F3D0' : '#C7D2FE'}`,
      }}>
        <Box sx={{ position: 'relative', display: 'inline-flex' }}>
          <CircularProgress
            variant="determinate"
            value={pct}
            size={72}
            thickness={5}
            sx={{
              color: pct === 100 ? '#059669' : '#4F46E5',
              '& .MuiCircularProgress-circle': { strokeLinecap: 'round' },
            }}
          />
          <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {pct === 100 ? (
              <MdCheckCircle size={28} color="#059669" />
            ) : (
              <Typography variant="body2" sx={{ fontWeight: 700, color: pct === 100 ? '#065F46' : '#4338CA', fontSize: '0.85rem' }}>
                {pct}%
              </Typography>
            )}
          </Box>
        </Box>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, color: pct === 100 ? '#065F46' : '#312E81', fontSize: '1rem' }}>
            {pct === 100 ? 'All Documents Submitted' : 'Document Collection In Progress'}
          </Typography>
          <Typography variant="body2" sx={{ color: pct === 100 ? '#047857' : '#4338CA', mt: 0.25, fontSize: '0.8rem' }}>
            {completion.uploaded} of {completion.total} documents uploaded
          </Typography>
        </Box>
      </Card>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3, borderBottom: '1px solid var(--border)' }}>
        <Tab label="Documents" />
        <Tab label={intake?.status === 'SUBMITTED' ? 'Tax Questionnaire ✓' : 'Tax Questionnaire'} />
      </Tabs>

      {tab === 1 && (
        <Card sx={{ p: { xs: 2.5, sm: 4 }, mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>{intake?.taxYear} Tax Questionnaire</Typography>
              <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                Answer from home — no office visit needed. You can save and come back any time.
              </Typography>
            </Box>
            <Chip label={intake?.status === 'SUBMITTED' ? 'Submitted' : 'Draft'} color={intake?.status === 'SUBMITTED' ? 'success' : 'default'} sx={{ fontWeight: 700 }} />
          </Box>
          <IntakeForm value={intake} onChange={setIntake} />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, mt: 3 }}>
            <Button variant="outlined" onClick={() => handleSaveIntake(false)} disabled={savingIntake}>Save draft</Button>
            <Button variant="contained" onClick={() => handleSaveIntake(true)} disabled={savingIntake}>
              {intake?.status === 'SUBMITTED' ? 'Update & resubmit' : 'Submit to preparer'}
            </Button>
          </Box>
        </Card>
      )}

      {/* Document Grid */}
      {tab === 0 && (<>
      <Grid container spacing={2.5}>
        {DOC_TYPES.map(type => {
          const doc = docs.find(d => d.documentType === type)
          return (
            <Grid item xs={12} sm={6} md={4} key={type}>
              <DocumentCard
                ownerType="CLIENT"
                ownerId={profile?.id || 0}
                docType={type}
                document={doc}
                onRefresh={load}
                compact
                isClientPortal
                onPreview={setPreviewDoc}
              />
            </Grid>
          )
        })}
      </Grid>

      {/* Tips */}
      <Card sx={{ mt: 4, p: 3, background: 'var(--surface-2)', border: '1px dashed var(--border-strong)' }}>
        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '0.95rem', mb: 2 }}>Upload Tips</Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {['Use clear, well-lit photos or scans — avoid glare and shadows',
            'PDF, JPG, and PNG files up to 4 MB are accepted',
            'Documents are auto-scanned with OCR for instant validation',
            'Your tax preparer will be notified once your documents are verified'].map((tip, i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <MdCheckCircle size={14} style={{ color: '#10B981', marginTop: 2 }} />
                <Typography variant="body2" sx={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{tip}</Typography>
              </Box>
            ))}
          </Box>
      </Card>
      </>)}

      <DocumentPreviewModal open={!!previewDoc} document={previewDoc} onClose={() => setPreviewDoc(null)}
        previewPath={previewDoc ? portalService.previewPath(previewDoc.id) : null} />
    </Box>
  )
}
