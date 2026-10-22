import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import Avatar from '@mui/material/Avatar'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Chip from '@mui/material/Chip'
import { MdArrowBack, MdAccountTree, MdAdd, MdCheckCircle, MdFolder } from 'react-icons/md'
import { toast } from 'react-toastify'
import { clientService } from '../services/clientService'
import { documentService } from '../services/documentService'
import { familyService } from '../services/familyService'
import { getInitials, avatarColor, getFullName, formatDate } from '../utils/formatters'
import { useAuth } from '../context/AuthContext'
import { can } from '../utils/permissions'
import DocumentCard from '../components/document/DocumentCard'
import DocumentPreviewModal from '../components/document/DocumentPreviewModal'
import FamilyMemberCard from '../components/family/FamilyMemberCard'
import FamilyMemberForm from '../components/family/FamilyMemberForm'
import ConfirmModal from '../components/ui/ConfirmModal'
import Spinner from '../components/ui/Spinner'

const DOC_TYPES = [
  'AADHAR', 'PAN', 'DRIVING_LICENSE', 'ELECTRICITY_BILL',
  'W2', 'FORM_1099NEC', 'FORM_1099_MISC', 'SSN_CARD', 'US_PASSPORT',
]

export default function DocumentCenterPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const canAddFamily = can(user, 'addFamilyMember')

  const [client, setClient] = useState(null)
  const [loading, setLoading] = useState(true)

  const [docs, setDocs] = useState([])
  const [completion, setCompletion] = useState({ uploaded: 0, total: 4, percentage: 0 })
  const [previewDoc, setPreviewDoc] = useState(null)

  const [members, setMembers] = useState([])
  const [familyFormOpen, setFamilyFormOpen] = useState(false)
  const [editMember, setEditMember] = useState(null)
  const [deleteMemberId, setDeleteMemberId] = useState(null)

  const loadClient = async () => {
    try {
      const r = await clientService.getById(id)
      setClient(r.data)
    } catch {
      toast.error('Client not found')
      navigate('/clients')
    } finally {
      setLoading(false)
    }
  }

  const loadDocs = async () => {
    try {
      const [docRes, compRes] = await Promise.all([
        documentService.getByOwner('CLIENT', id),
        documentService.getCompletion('CLIENT', id),
      ])
      setDocs(docRes.data)
      setCompletion(compRes.data)
    } catch {}
  }

  const loadFamily = async () => {
    try {
      const r = await familyService.getByClient(id)
      setMembers(r.data)
    } catch {}
  }

  useEffect(() => {
    loadClient()
    loadDocs()
    loadFamily()
  }, [id])

  const handleDeleteMember = async () => {
    try {
      await familyService.delete(deleteMemberId)
      toast.success('Member removed')
      setDeleteMemberId(null)
      loadFamily()
    } catch (e) {
      toast.error(e.message)
    }
  }

  const getDocForType = (type) => docs.find(d => d.documentType === type) || null

  if (loading) return <Spinner />
  if (!client) return null

  const initials = getInitials(client.firstName, client.lastName)
  const color = avatarColor(getFullName(client))
  const pct = completion.percentage || 0

  return (
    <Box className="page-enter">
      {/* ── Client Header ────────────────────────────── */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'flex-start', gap: 3, flexWrap: 'wrap' }}>
        <Avatar sx={{ bgcolor: color, width: 56, height: 56, fontSize: '1.3rem', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>{initials}</Avatar>
        <Box sx={{ flex: 1, minWidth: 200 }}>
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 0.5 }}>{getFullName(client)}</Typography>
          <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
            Document Center — Upload and manage all documents for this client and their family members.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button variant="outlined" startIcon={<MdArrowBack />} onClick={() => navigate(`/clients/${id}`)}>Back to Profile</Button>
          <Button variant="contained" startIcon={<MdAccountTree />} onClick={() => navigate(`/family/${id}`)}>Family Tree</Button>
        </Box>
      </Box>

      {/* ── Completion Banner ──────────────────────────── */}
      <Card sx={{
        p: 3, mb: 4, display: 'flex', alignItems: 'center', gap: 3,
        background: pct === 100 ? 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)' : 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)',
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
              <Typography variant="body2" sx={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.85rem' }}>
                {pct}%
              </Typography>
            )}
          </Box>
        </Box>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, color: pct === 100 ? '#065F46' : '#312E81', fontSize: '1rem' }}>
            {pct === 100 ? 'All Documents Verified' : 'Document Collection In Progress'}
          </Typography>
          <Typography variant="body2" sx={{ color: pct === 100 ? '#047857' : '#4338CA', mt: 0.25, fontSize: '0.8rem' }}>
            {completion.uploaded} of {completion.total} required documents uploaded for the client
          </Typography>
        </Box>
      </Card>

      {/* ── Client Documents ──────────────────────────── */}
      <Box sx={{ mb: 5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
          <Box sx={{
            width: 4, height: 22, background: 'var(--primary)', borderRadius: 2,
          }} />
          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.05rem' }}>
            Client Documents
          </Typography>
          <Chip label={`${completion.uploaded}/${completion.total}`} size="small" sx={{
            fontWeight: 700, fontSize: '0.7rem', height: 22,
            background: 'var(--primary-light)', color: 'var(--primary)',
          }} />
        </Box>
        <Grid container spacing={2.5}>
          {DOC_TYPES.map(type => (
            <Grid item xs={12} sm={6} md={3} key={type}>
              <DocumentCard
                ownerType="CLIENT"
                ownerId={Number(id)}
                docType={type}
                document={getDocForType(type)}
                onRefresh={loadDocs}
                onPreview={setPreviewDoc}
              />
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* ── Family Members ────────────────────────────── */}
      <Box sx={{ mb: 5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ width: 4, height: 22, background: '#8B5CF6', borderRadius: 2 }} />
            <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.05rem' }}>
              Family Members
            </Typography>
            <Chip label={members.length} size="small" sx={{
              fontWeight: 700, fontSize: '0.7rem', height: 22,
              background: '#F3E8FF', color: '#7C3AED',
            }} />
          </Box>
          {canAddFamily && (
            <Button
              variant="contained"
              startIcon={<MdAdd />}
              onClick={() => { setEditMember(null); setFamilyFormOpen(true) }}
              size="small"
              sx={{ background: '#7C3AED', '&:hover': { background: '#6D28D9' } }}
            >
              Add Member
            </Button>
          )}
        </Box>

        {members.length === 0 ? (
          <Card sx={{
            textAlign: 'center', py: 6,
            background: 'var(--surface-2)', border: '2px dashed var(--border-strong)',
          }}>
            <MdFolder size={40} color="var(--border-strong)" />
            <Typography variant="body2" sx={{ color: 'var(--text-muted)', fontWeight: 500, mt: 1.5 }}>
              No family members added yet
            </Typography>
            <Typography variant="caption" sx={{ color: 'var(--text-muted)', display: 'block', mt: 0.5, mb: 2 }}>
              Add family members to manage their documents separately
            </Typography>
            {canAddFamily && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<MdAdd />}
                onClick={() => { setEditMember(null); setFamilyFormOpen(true) }}
              >
                Add First Member
              </Button>
            )}
          </Card>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {members.map(m => (
              <FamilyMemberCard
                key={m.id}
                member={m}
                onEdit={(mem) => { setEditMember(mem); setFamilyFormOpen(true) }}
                onDelete={(memId) => setDeleteMemberId(memId)}
                onPreview={setPreviewDoc}
              />
            ))}
          </Box>
        )}
      </Box>

      {/* ── Bottom Navigation ─────────────────────────── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 3, borderTop: '1px solid var(--border)' }}>
        <Button variant="outlined" startIcon={<MdArrowBack />} onClick={() => navigate(`/clients/${id}`)}>
          Back to Client Profile
        </Button>
        {members.length > 0 && (
          <Button variant="contained" startIcon={<MdAccountTree />} onClick={() => navigate(`/family/${id}`)}>
            View Family Tree
          </Button>
        )}
      </Box>

      {/* ── Modals ────────────────────────────────────── */}
      <DocumentPreviewModal open={!!previewDoc} document={previewDoc} onClose={() => setPreviewDoc(null)} />
      {familyFormOpen && (
        <FamilyMemberForm
          open={familyFormOpen}
          onClose={() => setFamilyFormOpen(false)}
          clientId={Number(id)}
          member={editMember}
          onSaved={loadFamily}
          clientDob={client?.dob}
        />
      )}
      <ConfirmModal
        open={!!deleteMemberId}
        title="Remove Family Member"
        message="Are you sure? This will also remove all their uploaded documents. This action cannot be undone."
        onConfirm={handleDeleteMember}
        onCancel={() => setDeleteMemberId(null)}
      />
    </Box>
  )
}
