import { useState, useEffect } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import Button from '@mui/material/Button'
import Avatar from '@mui/material/Avatar'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Chip from '@mui/material/Chip'
import LinearProgress from '@mui/material/LinearProgress'
import Divider from '@mui/material/Divider'
import Grid from '@mui/material/Grid'
import { useNavigate } from 'react-router-dom'
import {
  MdAdd, MdUpload, MdVisibility, MdDelete, MdAccountTree,
  MdFolder, MdPeople, MdFamilyRestroom, MdWarning, MdExpandMore,
  MdKeyboardArrowRight, MdPhone, MdLocationOn, MdAccessTime,
  MdTrendingUp, MdTrendingDown, MdDescription, MdErrorOutline,
} from 'react-icons/md'
import { dashboardService } from '../services/dashboardService'
import { clientService } from '../services/clientService'
import { toast } from 'react-toastify'
import { useAuth } from '../context/AuthContext'
import { can } from '../utils/permissions'
import ConfirmModal from '../components/ui/ConfirmModal'
import SkeletonCard from '../components/ui/SkeletonCard'
import {
  getFullName, avatarColor, getInitials, formatDate, timeAgo,
  docTypeLabel, actionLabel, actionColor,
} from '../utils/formatters'

const DOC_COLORS = { AADHAR: '#4F46E5', PAN: '#10B981', DRIVING_LICENSE: '#F59E0B', ELECTRICITY_BILL: '#EF4444', W2: '#2563EB', FORM_1099NEC: '#7C3AED', FORM_1099_MISC: '#0891B2', SSN_CARD: '#DC2626', US_PASSPORT: '#059669' }
const DOC_GRADIENTS = {
  AADHAR: 'linear-gradient(90deg, #2563EB, #60A5FA)',
  PAN: 'linear-gradient(90deg, #16A34A, #4ADE80)',
  DRIVING_LICENSE: 'linear-gradient(90deg, #D97706, #FCD34D)',
  ELECTRICITY_BILL: 'linear-gradient(90deg, #DC2626, #F87171)',
  W2: 'linear-gradient(90deg, #2563EB, #93C5FD)',
  FORM_1099NEC: 'linear-gradient(90deg, #7C3AED, #C4B5FD)',
  FORM_1099_MISC: 'linear-gradient(90deg, #0891B2, #67E8F9)',
  SSN_CARD: 'linear-gradient(90deg, #DC2626, #FCA5A5)',
  US_PASSPORT: 'linear-gradient(90deg, #059669, #6EE7B7)',
}
const INITIAL_SHOW = 7

export default function DashboardPage() {
  const nav = useNavigate()
  const { user } = useAuth()
  const canDelete = can(user, 'deleteClient')
  const canImport = can(user, 'importExcel')
  const [stats, setStats] = useState(null)
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const load = async () => {
    try {
      const [s, c] = await Promise.all([
        dashboardService.getStats(),
        clientService.getAll({ page: 0, size: 50 }),
      ])
      setStats(s.data)
      setClients(c.data?.content || c.data || [])
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await clientService.delete(deleteId)
      toast.success('Client deleted')
      setDeleteId(null)
      load()
    } catch (e) { toast.error('Delete failed') }
    finally { setDeleting(false) }
  }

  const chartData = stats?.documentsByType
    ? Object.entries(stats.documentsByType).map(([type, count]) => ({ name: docTypeLabel(type), count, type }))
    : []
  const maxCount = Math.max(...chartData.map(d => d.count), 1)

  const visibleClients = expanded ? clients : clients.slice(0, INITIAL_SHOW)
  const hasMore = clients.length > INITIAL_SHOW

  const statCards = [
    { label: 'Total Clients', value: stats?.totalClients ?? 0, trend: '+2 this week', trendUp: true, icon: <MdPeople size={22} />, iconBg: '#EFF6FF', iconColor: '#2563EB', borderColor: '#2563EB' },
    { label: 'Family Members', value: stats?.totalFamilyMembers ?? stats?.totalFamilies ?? 0, trend: '+1 this week', trendUp: true, icon: <MdFamilyRestroom size={22} />, iconBg: '#FDF2F8', iconColor: '#DB2777', borderColor: '#DB2777' },
    { label: 'Documents', value: stats?.totalDocuments ?? 0, trend: '+3 today', trendUp: true, icon: <MdDescription size={22} />, iconBg: '#F0FDF4', iconColor: '#16A34A', borderColor: '#16A34A' },
    { label: 'Missing Docs', value: stats?.missingDocumentClients ?? 0, trend: '-2 vs last week', trendUp: false, icon: <MdErrorOutline size={22} />, iconBg: '#FFFBEB', iconColor: '#D97706', borderColor: '#D97706' },
  ]

  // ── Client Row ──
  const ClientRow = ({ client, isLast }) => {
    const full = getFullName(client)
    const color = avatarColor(full)
    const total = client.totalDocTypes || 4
    const pct = client.hasMissingDocuments ? Math.round(((client.documentCount || 0) / total) * 100) : 100
    return (
      <Box sx={{
        display: 'flex', alignItems: 'center', gap: 2, py: 1.5, px: 2.5,
        borderBottom: isLast ? 'none' : '1px solid var(--border)',
        transition: 'all 0.15s',
        '&:hover': { background: '#F8FAFF', borderLeft: '3px solid #2563EB', pl: 2.1 },
      }}>
        <Avatar sx={{ bgcolor: color, width: 36, height: 36, fontSize: '0.78rem', fontWeight: 700, fontFamily: 'var(--font-heading)', cursor: 'pointer' }}
          onClick={() => nav(`/clients/${client.id}`)}>{getInitials(client.firstName, client.lastName)}</Avatar>
        <Box sx={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => nav(`/clients/${client.id}`)}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3, fontSize: '0.85rem' }} noWrap>{full}</Typography>
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
            <Typography variant="caption" sx={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 0.3, fontSize: '0.65rem' }}>
              <MdLocationOn size={11} /> {client.locationName || '—'}
            </Typography>
            <Typography variant="caption" sx={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 0.3, fontSize: '0.65rem' }}>
              <MdPhone size={11} /> {client.mobile}
            </Typography>
          </Box>
        </Box>

        {/* Doc completion */}
        <Box sx={{ width: 110, display: { xs: 'none', md: 'block' } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3 }}>
            <Typography variant="caption" sx={{ fontSize: '0.6rem', fontWeight: 600, color: pct === 100 ? '#059669' : '#D97706' }}>{pct}%</Typography>
            <Chip label={`${client.documentCount || 0}/${total}`} size="small" sx={{ height: 16, fontSize: '0.5rem', fontWeight: 700, background: pct === 100 ? '#ECFDF5' : '#FFF7ED', color: pct === 100 ? '#059669' : '#D97706' }} />
          </Box>
          <LinearProgress variant="determinate" value={pct} sx={{
            height: 5, borderRadius: 3, bgcolor: '#F1F5F9',
            '& .MuiLinearProgress-bar': { borderRadius: 3, background: pct === 100 ? 'linear-gradient(90deg, #059669, #34D399)' : pct > 50 ? 'linear-gradient(90deg, #2563EB, #60A5FA)' : 'linear-gradient(90deg, #D97706, #FCD34D)' },
          }} />
        </Box>

        {/* Status badge */}
        <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 0.5, minWidth: 85 }}>
          <Box sx={{ width: 6, height: 6, borderRadius: '50%', background: client.hasMissingDocuments ? '#D97706' : '#059669', flexShrink: 0 }} />
          <Typography variant="caption" sx={{ fontSize: '0.65rem', fontWeight: 600, color: client.hasMissingDocuments ? '#D97706' : '#059669' }}>
            {client.hasMissingDocuments ? 'Incomplete' : 'Complete'}
          </Typography>
        </Box>

        {/* Family count */}
        <Tooltip title={`${client.familyMemberCount || 0} family members`}>
          <Box sx={{ display: { xs: 'none', lg: 'flex' }, alignItems: 'center', gap: 0.3, color: 'var(--text-muted)' }}>
            <MdFamilyRestroom size={14} />
            <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>{client.familyMemberCount || 0}</Typography>
          </Box>
        </Tooltip>

        {/* Actions */}
        <Box sx={{ display: 'flex', gap: 0.25, flexShrink: 0 }}>
          <Tooltip title="View"><IconButton size="small" onClick={() => nav(`/clients/${client.id}`)} sx={{ color: '#2563EB', '&:hover': { background: '#EFF6FF' } }}><MdVisibility size={15} /></IconButton></Tooltip>
          <Tooltip title="Documents"><IconButton size="small" onClick={() => nav(`/clients/${client.id}/documents`)} sx={{ color: '#10B981', '&:hover': { background: '#ECFDF5' } }}><MdFolder size={15} /></IconButton></Tooltip>
          <Tooltip title="Family Tree"><IconButton size="small" onClick={() => nav(`/family/${client.id}`)} sx={{ color: '#8B5CF6', '&:hover': { background: '#F5F3FF' } }}><MdAccountTree size={15} /></IconButton></Tooltip>
          {canDelete && <Tooltip title="Delete"><IconButton size="small" onClick={() => setDeleteId(client.id)} sx={{ color: '#EF4444', '&:hover': { background: '#FEF2F2' } }}><MdDelete size={14} /></IconButton></Tooltip>}
        </Box>
      </Box>
    )
  }

  if (loading) return (
    <Box className="page-enter" sx={{ p: 4 }}>
      <Grid container spacing={3}>{[1,2,3,4].map(i => <Grid item xs={6} md={3} key={i}><SkeletonCard /></Grid>)}</Grid>
    </Box>
  )

  return (
    <Box className="page-enter">
      {/* ── Header ── */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'var(--text-primary)', mb: 0.25, fontSize: '1.6rem', fontFamily: 'var(--font-heading)' }}>Operations</Typography>
          <Typography variant="body2" sx={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Manage clients, documents, and family records.</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          {canImport && (
            <Button variant="outlined" startIcon={<MdUpload size={16} />} onClick={() => nav('/import')} size="small"
              sx={{ borderColor: 'var(--border)', color: 'var(--text-secondary)', '&:hover': { borderColor: '#2563EB', color: '#2563EB' } }}>Import</Button>
          )}
          <Button variant="contained" startIcon={<MdAdd size={16} />} onClick={() => nav('/clients/add')} size="small"
            sx={{ background: '#2563EB', '&:hover': { background: '#1D4ED8' }, boxShadow: '0 4px 12px rgba(37,99,235,0.25)' }}>New Client</Button>
        </Box>
      </Box>

      {/* ── Stat Cards ── */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        {statCards.map((s, i) => (
          <Grid item xs={6} md={3} key={i}>
            <Card sx={{
              p: 2.5, borderRadius: '14px', border: '1px solid var(--border)',
              borderLeft: `4px solid ${s.borderColor}`,
              boxShadow: 'var(--shadow-sm)', transition: 'all 0.2s',
              '&:hover': { transform: 'translateY(-3px)', boxShadow: 'var(--shadow-md)' },
            }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
                <Box sx={{ width: 42, height: 42, borderRadius: '12px', background: s.iconBg, color: s.iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {s.icon}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3, px: 1, py: 0.3, borderRadius: '8px', background: s.trendUp ? '#F0FDF4' : '#FFF7ED' }}>
                  {s.trendUp ? <MdTrendingUp size={12} color="#16A34A" /> : <MdTrendingDown size={12} color="#D97706" />}
                  <Typography variant="caption" sx={{ fontSize: '0.55rem', fontWeight: 600, color: s.trendUp ? '#16A34A' : '#D97706' }}>{s.trend}</Typography>
                </Box>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, fontSize: '1.8rem', color: 'var(--text-primary)', fontFamily: 'var(--font-heading)', lineHeight: 1 }}>{s.value}</Typography>
              <Typography variant="caption" sx={{ color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.7rem', mt: 0.5, display: 'block' }}>{s.label}</Typography>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* ── Two-Column Body ── */}
      <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start', flexDirection: { xs: 'column', lg: 'row' } }}>

        {/* LEFT: Client Operations */}
        <Box sx={{ flex: '1 1 0', minWidth: 0, width: { xs: '100%', lg: '70%' } }}>
          <Card sx={{ overflow: 'hidden', borderRadius: '14px' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2.5, py: 2, borderBottom: '1px solid var(--border)' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ width: 4, height: 20, background: '#2563EB', borderRadius: 2 }} />
                <Typography variant="subtitle1" sx={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.95rem' }}>Client Operations</Typography>
                <Chip label={clients.length} size="small" sx={{ height: 20, fontSize: '0.6rem', fontWeight: 700, background: '#EFF6FF', color: '#2563EB' }} />
              </Box>
              <Button size="small" endIcon={<MdKeyboardArrowRight size={14} />} onClick={() => nav('/clients')} sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#0EA5E9' }}>View All</Button>
            </Box>

            {/* Column headers */}
            <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 2, px: 2.5, py: 0.75, background: '#F1F5F9', borderBottom: '1px solid var(--border)' }}>
              <Typography variant="caption" sx={{ flex: 1, fontWeight: 600, fontSize: '0.55rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', ml: 6.5 }}>Client</Typography>
              <Typography variant="caption" sx={{ width: 110, fontWeight: 600, fontSize: '0.55rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', display: { xs: 'none', md: 'block' } }}>Documents</Typography>
              <Typography variant="caption" sx={{ width: 85, fontWeight: 600, fontSize: '0.55rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', display: { xs: 'none', sm: 'block' } }}>Status</Typography>
              <Typography variant="caption" sx={{ width: 30, fontWeight: 600, fontSize: '0.55rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', display: { xs: 'none', lg: 'block' } }}>Fam</Typography>
              <Typography variant="caption" sx={{ width: 145, fontWeight: 600, fontSize: '0.55rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', textAlign: 'right' }}>Actions</Typography>
            </Box>

            {clients.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8, px: 3 }}>
                <MdPeople size={40} color="#CBD5E1" />
                <Typography variant="body2" sx={{ color: 'var(--text-muted)', mt: 1.5, fontWeight: 500 }}>No clients yet</Typography>
                <Button variant="contained" startIcon={<MdAdd />} onClick={() => nav('/clients/add')} sx={{ mt: 2, background: '#2563EB' }} size="small">Create First Client</Button>
              </Box>
            ) : (
              <>
                {visibleClients.map((c, i) => <ClientRow key={c.id} client={c} isLast={i === visibleClients.length - 1 && !hasMore} />)}
                {hasMore && (
                  <Box sx={{ textAlign: 'center', py: 1.5, borderTop: '1px solid var(--border)' }}>
                    <Button size="small" endIcon={<MdExpandMore size={16} style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }} />}
                      onClick={() => setExpanded(e => !e)} sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#2563EB' }}>
                      {expanded ? 'Show Less' : `Show ${clients.length - INITIAL_SHOW} More`}
                    </Button>
                  </Box>
                )}
              </>
            )}
          </Card>
        </Box>

        {/* RIGHT: Analytics Sidebar */}
        <Box sx={{ width: { xs: '100%', lg: 300 }, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 2.5 }}>

          {/* Quick Metrics */}
          <Card sx={{ p: 2.5, borderRadius: '14px' }}>
            <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', display: 'block', mb: 1 }}>Quick Metrics</Typography>
            {[
              { icon: <MdPeople size={16} />, label: 'Total Clients', value: stats?.totalClients, color: '#2563EB', borderColor: '#2563EB' },
              { icon: <MdFamilyRestroom size={16} />, label: 'Family Members', value: stats?.totalFamilyMembers ?? stats?.totalFamilies, color: '#DB2777', borderColor: '#DB2777' },
              { icon: <MdFolder size={16} />, label: 'Documents', value: stats?.totalDocuments, color: '#16A34A', borderColor: '#16A34A' },
              { icon: <MdWarning size={16} />, label: 'Missing Docs', value: stats?.missingDocumentClients, color: '#D97706', borderColor: '#D97706' },
            ].map((m, i, arr) => (
              <Box key={i}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.25, borderLeft: `3px solid ${m.borderColor}`, pl: 1.5 }}>
                  <Box sx={{ width: 34, height: 34, borderRadius: '8px', background: `${m.color}14`, color: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{m.icon}</Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" sx={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{m.label}</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1.1rem', lineHeight: 1.1 }}>{m.value ?? 0}</Typography>
                  </Box>
                </Box>
                {i < arr.length - 1 && <Divider sx={{ borderColor: 'var(--border)' }} />}
              </Box>
            ))}
          </Card>

          {/* Document Analytics - Gradient Bars */}
          <Card sx={{ p: 2.5, borderRadius: '14px' }}>
            <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', display: 'block', mb: 2 }}>Document Analytics</Typography>
            {chartData.length > 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {chartData.map((d, i) => (
                  <Box key={i}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 500, color: 'var(--text-secondary)' }}>{d.name}</Typography>
                      <Typography variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-primary)' }}>{d.count}</Typography>
                    </Box>
                    <Box sx={{ height: 8, borderRadius: 4, background: '#F1F5F9', overflow: 'hidden' }}>
                      <Box sx={{
                        height: '100%', borderRadius: 4,
                        background: DOC_GRADIENTS[d.type] || 'linear-gradient(90deg, #2563EB, #60A5FA)',
                        width: `${(d.count / maxCount) * 100}%`,
                        animation: 'barGrow 0.8s ease-out',
                      }} />
                    </Box>
                  </Box>
                ))}
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="caption" sx={{ color: 'var(--text-muted)' }}>No documents uploaded yet</Typography>
              </Box>
            )}
          </Card>

          {/* Recent Activity - Timeline Style */}
          <Card sx={{ p: 2.5, borderRadius: '14px' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>Recent Activity</Typography>
              <Button size="small" onClick={() => nav('/activity')} sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#0EA5E9', p: 0, minWidth: 0 }}>View All</Button>
            </Box>
            {stats?.recentActivities?.length > 0 ? (
              <Box sx={{ position: 'relative', pl: 2.5, '&::before': { content: '""', position: 'absolute', left: 8, top: 8, bottom: 8, width: 2, background: '#F1F5F9', borderRadius: 1 } }}>
                {stats.recentActivities.slice(0, 6).map((a, i) => (
                  <Box key={a.id || i} sx={{ display: 'flex', gap: 1.5, py: 1, position: 'relative' }}>
                    <Box sx={{
                      position: 'absolute', left: -18, top: 12,
                      width: 10, height: 10, borderRadius: '50%',
                      background: actionColor(a.action),
                      border: '2px solid #fff', zIndex: 1,
                    }} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.7rem', display: 'block' }}>{actionLabel(a.action)}</Typography>
                      <Typography variant="caption" sx={{ color: 'var(--text-muted)', fontSize: '0.6rem' }} noWrap>{a.description}</Typography>
                      <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.3, color: 'var(--text-muted)', fontSize: '0.55rem', mt: 0.25, fontFamily: 'var(--font-mono)' }}>
                        <MdAccessTime size={10} /> {timeAgo(a.timestamp)}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography variant="caption" sx={{ color: 'var(--text-muted)', display: 'block', textAlign: 'center', py: 2 }}>No recent activity</Typography>
            )}
          </Card>

          {/* Missing Docs Alert */}
          {stats?.missingDocumentClients > 0 && (
            <Card sx={{ p: 2.5, background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '14px' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <MdWarning size={16} color="#D97706" />
                <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.65rem', color: '#92400E' }}>Action Required</Typography>
              </Box>
              <Typography variant="caption" sx={{ color: '#92400E', fontSize: '0.7rem', display: 'block', lineHeight: 1.5 }}>
                {stats.missingDocumentClients} client{stats.missingDocumentClients > 1 ? 's' : ''} with incomplete documents.
              </Typography>
              <Button size="small" onClick={() => nav('/clients')} sx={{ mt: 1, fontWeight: 600, fontSize: '0.65rem', color: '#D97706' }}>Review Clients →</Button>
            </Card>
          )}
        </Box>
      </Box>

      <ConfirmModal open={!!deleteId} title="Delete Client" message="This will permanently delete the client and all their documents. This cannot be undone." onConfirm={handleDelete} onCancel={() => setDeleteId(null)} loading={deleting} />

      <style>{`@keyframes barGrow { from { width: 0; } }`}</style>
    </Box>
  )
}
