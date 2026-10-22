import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Button from '@mui/material/Button'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Avatar from '@mui/material/Avatar'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import { MdEdit, MdSave, MdFolder, MdAccountTree, MdAdd, MdDelete, MdArrowBack, MdLocationOn, MdPhone, MdOpenInNew } from 'react-icons/md'
import { toast } from 'react-toastify'
import { clientService } from '../services/clientService'
import { documentService } from '../services/documentService'
import { familyService } from '../services/familyService'
import { locationService } from '../services/locationService'
import { getInitials, avatarColor, getFullName, formatDate } from '../utils/formatters'
import { isValidMobile } from '../utils/validators'
import { useAuth } from '../context/AuthContext'
import { can } from '../utils/permissions'
import FamilyMemberCard from '../components/family/FamilyMemberCard'
import FamilyMemberForm from '../components/family/FamilyMemberForm'
import DocumentPreviewModal from '../components/document/DocumentPreviewModal'
import ConfirmModal from '../components/ui/ConfirmModal'
import Badge from '../components/ui/Badge'
import Spinner from '../components/ui/Spinner'

const GENDERS = ['Male', 'Female', 'Other']

export default function ClientDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const canEditClient = can(user, 'editClient')
  const canEditFamily = can(user, 'editFamilyMember')
  const canAddFamily = can(user, 'addFamilyMember')
  const canDeleteFamily = can(user, 'deleteFamilyMember')
  const [client, setClient] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState(0)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({})
  const [locations, setLocations] = useState([])
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

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
      setForm(r.data)
    } catch { toast.error('Client not found'); navigate('/clients') }
    finally { setLoading(false) }
  }

  const loadCompletion = async () => {
    try {
      const r = await documentService.getCompletion('CLIENT', id)
      setCompletion(r.data)
    } catch {}
  }

  const loadFamily = async () => {
    try { const r = await familyService.getByClient(id); setMembers(r.data) } catch {}
  }

  useEffect(() => {
    loadClient()
    loadCompletion()
    loadFamily()
    locationService.getAll().then(r => setLocations(r.data)).catch(() => {})
  }, [id])

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  const handleSave = async () => {
    const errs = {}
    if (!form.firstName?.trim()) errs.firstName = 'Required'
    if (!form.lastName?.trim()) errs.lastName = 'Required'
    if (!isValidMobile(form.mobile)) errs.mobile = 'Invalid mobile'
    setErrors(errs)
    if (Object.keys(errs).length) return

    setSaving(true)
    try {
      await clientService.update(id, { ...form, dob: form.dob || null, locationId: Number(form.locationId) })
      toast.success('Client updated')
      setEditing(false)
      loadClient()
    } catch (e) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  const handleDeleteMember = async () => {
    try {
      await familyService.delete(deleteMemberId)
      toast.success('Member removed')
      setDeleteMemberId(null)
      loadFamily()
    } catch (e) { toast.error(e.message) }
  }

  if (loading) return <Spinner />
  if (!client) return null

  const initials = getInitials(client.firstName, client.lastName)
  const color = avatarColor(getFullName(client))
  const pct = completion.percentage || 0

  return (
    <Box className="page-enter">
      {/* Header */}
      <Box sx={{ mb: 5, display: 'flex', alignItems: 'flex-start', gap: 3, flexWrap: 'wrap' }}>
        <Avatar sx={{ bgcolor: color, width: 56, height: 56, fontSize: '1.3rem', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>{initials}</Avatar>
        <Box sx={{ flex: 1, minWidth: 200 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 0.5, flexWrap: 'wrap' }}>
            <Typography variant="h4" sx={{ fontWeight: 600 }}>{getFullName(client)}</Typography>
            <Badge label={client.hasMissingDocuments ? 'Docs Incomplete' : 'Verified'} variant={client.hasMissingDocuments ? 'warning' : 'success'} />
          </Box>
          <Box sx={{ display: 'flex', gap: 3, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <MdPhone size={15} color="var(--text-muted)" /> {client.mobile}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <MdLocationOn size={15} color="var(--text-muted)" /> {client.locationName || 'Unassigned'}
            </Box>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button variant="outlined" startIcon={<MdArrowBack />} onClick={() => navigate('/clients')}>Back</Button>
          <Button variant="contained" startIcon={<MdFolder />} onClick={() => navigate(`/clients/${id}/documents`)}>Document Center</Button>
          <Button variant="outlined" startIcon={<MdAccountTree />} onClick={() => navigate(`/family/${id}`)}>Family Tree</Button>
        </Box>
      </Box>

      {/* Tabs */}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 5, borderBottom: '1px solid var(--border)' }}>
        <Tab label="Overview" />
        <Tab label={`Family (${members.length})`} />
      </Tabs>

      {/* Tab 0: Profile */}
      {tab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} lg={8}>
            <Card sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
                <Typography variant="h6">Personal Information</Typography>
                {!editing ? (
                  canEditClient ? (
                    <Button variant="outlined" startIcon={<MdEdit />} onClick={() => setEditing(true)} size="small">Edit</Button>
                  ) : null
                ) : (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button onClick={() => { setEditing(false); setForm(client) }} size="small">Cancel</Button>
                    <Button variant="contained" startIcon={<MdSave />} size="small" onClick={handleSave} disabled={saving}>Save</Button>
                  </Box>
                )}
              </Box>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}><TextField fullWidth label="First Name" value={form.firstName || ''} onChange={set('firstName')} disabled={!editing} /></Grid>
                <Grid item xs={12} sm={6}><TextField fullWidth label="Last Name" value={form.lastName || ''} onChange={set('lastName')} disabled={!editing} /></Grid>
                <Grid item xs={12} sm={6}><TextField fullWidth label="Mobile" value={form.mobile || ''} onChange={set('mobile')} disabled={!editing} /></Grid>
                <Grid item xs={12} sm={6}><TextField fullWidth label="DOB" type="date" value={form.dob || ''} onChange={set('dob')} disabled={!editing} InputLabelProps={{ shrink: true }} /></Grid>
                <Grid item xs={12} sm={6}>
                  <TextField select fullWidth label="Gender" value={form.gender || ''} onChange={set('gender')} disabled={!editing}>
                    {GENDERS.map(g => <MenuItem key={g} value={g}>{g}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField select fullWidth label="Primary Location" value={form.locationId || ''} onChange={set('locationId')} disabled={!editing}>
                    {locations.map(l => <MenuItem key={l.id} value={l.id}>{l.locationName}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid item xs={12}><TextField fullWidth label="Email" value={form.email || ''} onChange={set('email')} disabled={!editing} /></Grid>
                <Grid item xs={12}><TextField fullWidth label="Address" multiline rows={3} value={form.address || ''} onChange={set('address')} disabled={!editing} /></Grid>
              </Grid>
            </Card>
          </Grid>
          <Grid item xs={12} lg={4}>
            <Card sx={{ p: 4, background: 'var(--surface-2)', border: '1px dashed var(--border-strong)', height: '100%' }}>
              <Typography variant="subtitle1" sx={{ mb: 3, fontFamily: 'var(--font-heading)' }}>Quick Stats</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {[
                  { label: 'Member Since', value: formatDate(client.createdAt) },
                  { label: 'Family Members', value: `${members.length} linked` },
                ].map((s, i) => (
                  <Box key={i}>
                    <Typography variant="caption" sx={{ color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.6rem', letterSpacing: '0.05em' }}>{s.label}</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.value}</Typography>
                  </Box>
                ))}
                {/* Document Completion Mini */}
                <Box>
                  <Typography variant="caption" sx={{ color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.6rem', letterSpacing: '0.05em' }}>Documents</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 0.5 }}>
                    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                      <CircularProgress variant="determinate" value={pct} size={40} thickness={4} sx={{ color: pct === 100 ? '#059669' : '#4F46E5' }} />
                      <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.6rem' }}>{pct}%</Typography>
                      </Box>
                    </Box>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>{completion.uploaded}/{completion.total} uploaded</Typography>
                      <Button size="small" endIcon={<MdOpenInNew size={12} />} onClick={() => navigate(`/clients/${id}/documents`)} sx={{ p: 0, minWidth: 0, fontWeight: 600, fontSize: '0.7rem', mt: 0.25 }}>Manage Documents</Button>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tab 1: Family */}
      {tab === 1 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
            <Box>
              <Typography variant="h6">Family Members</Typography>
              <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>Linked relatives and dependents.</Typography>
            </Box>
            {canAddFamily && (
              <Button variant="contained" startIcon={<MdAdd />} onClick={() => { setEditMember(null); setFamilyFormOpen(true) }}>Add Member</Button>
            )}
          </Box>
          {members.length === 0 ? (
            <Card sx={{ textAlign: 'center', py: 8, background: 'var(--surface-2)', border: '1px dashed var(--border-strong)' }}>
              <Typography variant="body2" sx={{ color: 'var(--text-muted)', fontWeight: 500 }}>No family members added yet.</Typography>
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
      )}

      {/* Modals */}
      <DocumentPreviewModal open={!!previewDoc} document={previewDoc} onClose={() => setPreviewDoc(null)} />
      {familyFormOpen && <FamilyMemberForm open={familyFormOpen} onClose={() => setFamilyFormOpen(false)} clientId={Number(id)} member={editMember} onSaved={loadFamily} clientDob={client?.dob} />}
      <ConfirmModal open={!!deleteMemberId} title="Remove Family Member" message="Are you sure? This action cannot be undone." onConfirm={handleDeleteMember} onCancel={() => setDeleteMemberId(null)} />
    </Box>
  )
}
