import { useState, useEffect } from 'react'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import Chip from '@mui/material/Chip'
import Avatar from '@mui/material/Avatar'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import { MdSave } from 'react-icons/md'
import { toast } from 'react-toastify'
import { userService } from '../../services/userService'
import { locationService } from '../../services/locationService'
import { clientService } from '../../services/clientService'
import { getInitials, avatarColor } from '../../utils/formatters'
import EmptyState from '../../components/ui/EmptyState'

const ROLE_COLORS = {
  ADMIN:    { bg: '#EEF2FF', color: '#4F46E5' },
  MANAGER:  { bg: '#ECFDF5', color: '#059669' },
  EMPLOYEE: { bg: '#F5F3FF', color: '#7C3AED' },
}

export default function UserManagementSection({ selfUserId }) {
  const [users, setUsers] = useState([])
  const [locations, setLocations] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [roleEdits, setRoleEdits] = useState({})
  const [officeEdits, setOfficeEdits] = useState({})
  const [clientEdits, setClientEdits] = useState({})
  const [supervisedEdits, setSupervisedEdits] = useState({})
  const [savingId, setSavingId] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const [userData, locData, clientData] = await Promise.all([
        userService.list(),
        locationService.getAll().then(r => r.data),
        clientService.getAll({ size: 500 }).then(r => r.data?.content || r.data || []),
      ])
      setUsers(userData)
      setLocations(locData)
      setClients(Array.isArray(clientData) ? clientData : [])
    } catch {
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleRoleChange = (id, newRole) => setRoleEdits(prev => ({ ...prev, [id]: newRole }))

  const handleOfficeChange = (id, officeId) => setOfficeEdits(prev => ({ ...prev, [id]: officeId || null }))

  const handleClientChange = (id, clientId) => setClientEdits(prev => ({ ...prev, [id]: clientId || null }))

  const handleSupervisedToggle = (id, officeId) => {
    setSupervisedEdits(prev => {
      const current = prev[id] ?? (users.find(u => u.id === id)?.supervisedOffices ?? [])
      const next = current.includes(officeId) ? current.filter(o => o !== officeId) : [...current, officeId]
      return { ...prev, [id]: next }
    })
  }

  const handleSave = async (id) => {
    setSavingId(id)
    const user = users.find(u => u.id === id)
    const supervised = supervisedEdits[id] !== undefined ? supervisedEdits[id] : (user.supervisedOffices ?? [])
    const payload = {
      role: roleEdits[id] ?? user.role,
      assignedOffice: officeEdits[id] !== undefined ? officeEdits[id] : user.assignedOffice,
      linkedClient: clientEdits[id] !== undefined ? clientEdits[id] : user.linkedClient,
      supervisedOffices: supervised,
    }
    try {
      await userService.update(id, payload)
      toast.success('User updated')
      setRoleEdits(prev => { const { [id]: _, ...rest } = prev; return rest })
      setOfficeEdits(prev => { const { [id]: __, ...rest2 } = prev; return rest2 })
      setClientEdits(prev => { const { [id]: ___, ...rest3 } = prev; return rest3 })
      setSupervisedEdits(prev => { const { [id]: ____, ...rest4 } = prev; return rest4 })
      load()
    } catch (e) {
      toast.error(e.message || 'Failed to update user')
    } finally {
      setSavingId(null)
    }
  }

  const officeName = (id) => {
    if (!id) return '—'
    return locations.find(l => l.id === id)?.locationName || `Office #${id}`
  }

  const isDirty = (id, user) =>
    (roleEdits[id] && roleEdits[id] !== user.role) ||
    (officeEdits[id] !== undefined && String(officeEdits[id] ?? '') !== String(user.assignedOffice ?? '')) ||
    (clientEdits[id] !== undefined && String(clientEdits[id] ?? '') !== String(user.linkedClient ?? '')) ||
    (supervisedEdits[id] !== undefined &&
      JSON.stringify([...(supervisedEdits[id] ?? [])].sort()) !== JSON.stringify([...(user.supervisedOffices ?? [])].sort()))

  const isManager = (user) => user.role === 'MANAGER'
  const showSupervised = (user) => isManager(user)

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>User Management</Typography>
        <Typography variant="body2" sx={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
          Manage team access, roles, and office assignments. Changes take effect on next login.
        </Typography>
      </Box>

      {loading ? (
        <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress size={32} />
        </Box>
      ) : users.length === 0 ? (
        <EmptyState icon="👥" title="No users" description="No users found." />
      ) : (
        <Card>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ background: 'var(--surface-3)' }}>
                  <TableCell sx={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', px: 3 }}>User</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', width: 160 }}>Role</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', width: 160 }}>Office</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', width: 160 }}>Linked Client</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', width: 220 }}>Supervised Offices</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', width: 120, px: 2 }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((u) => {
                  const currentRole = roleEdits[u.id] ?? u.role
                  const currentOffice = officeEdits[u.id] !== undefined ? officeEdits[u.id] : u.assignedOffice
                  const currentLinkedClient = clientEdits[u.id] !== undefined ? clientEdits[u.id] : u.linkedClient
                  const currentSupervised = supervisedEdits[u.id] ?? (u.supervisedOffices ?? [])
                  const roleColor = ROLE_COLORS[currentRole] || ROLE_COLORS.EMPLOYEE
                  const manager = isManager(u)
                  return (
                    <TableRow key={u.id} sx={{ '&:nth-of-type(even)': { background: 'var(--surface-2)' } }}>
                      <TableCell sx={{ px: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar sx={{
                            width: 32, height: 32, fontSize: '0.7rem',
                            bgcolor: avatarColor(u.fullName || u.email),
                            fontWeight: 700,
                            fontFamily: 'var(--font-heading)',
                          }}>
                            {getInitials(u.fullName || u.email, '')}
                          </Avatar>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{u.fullName || '—'}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>
                          {u.email}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <TextField
                            select
                            size="small"
                            value={currentRole}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            disabled={u.id === selfUserId}
                            sx={{ width: 120, '& .MuiSelect-select': { fontSize: '0.78rem', py: 0.4 }, '& .MuiOutlinedInput-root': { minHeight: 32 } }}
                          >
                            {['EMPLOYEE', 'MANAGER', 'ADMIN', 'CLIENT'].map(r => (
                              <MenuItem key={r} value={r} sx={{ fontSize: '0.78rem', fontWeight: 500 }}>{r}</MenuItem>
                            ))}
                          </TextField>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <TextField
                          select
                          size="small"
                          value={currentOffice ?? ''}
                          onChange={(e) => handleOfficeChange(u.id, e.target.value)}
                          sx={{ width: 130, '& .MuiSelect-select': { fontSize: '0.78rem', py: 0.4 }, '& .MuiOutlinedInput-root': { minHeight: 32 } }}
                        >
                          <MenuItem value="" sx={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>No office</MenuItem>
                          {locations.map(l => (
                            <MenuItem key={l.id} value={l.id} sx={{ fontSize: '0.78rem' }}>{l.locationName}</MenuItem>
                          ))}
                        </TextField>
                      </TableCell>
                      <TableCell>
                        <TextField
                          select
                          size="small"
                          value={currentLinkedClient ?? ''}
                          onChange={(e) => handleClientChange(u.id, e.target.value)}
                          sx={{ width: 130, '& .MuiSelect-select': { fontSize: '0.78rem', py: 0.4 }, '& .MuiOutlinedInput-root': { minHeight: 32 } }}
                        >
                          <MenuItem value="" sx={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>No client</MenuItem>
                          {clients.map(c => (
                            <MenuItem key={c.id} value={c.id} sx={{ fontSize: '0.78rem' }}>{c.firstName} {c.lastName}</MenuItem>
                          ))}
                        </TextField>
                      </TableCell>
                      <TableCell>
                        {manager ? (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {locations.map(l => {
                              const on = currentSupervised.includes(l.id)
                              return (
                                <Chip
                                  key={l.id}
                                  label={l.locationName}
                                  size="small"
                                  color={on ? 'primary' : 'default'}
                                  onClick={() => handleSupervisedToggle(u.id, l.id)}
                                  sx={{
                                    height: 22, fontSize: '0.65rem', fontWeight: 600, cursor: 'pointer',
                                    '&.MuiChip-default': { background: 'var(--surface-2)', color: 'var(--text-muted)' },
                                  }}
                                />
                              )
                            })}
                          </Box>
                        ) : (
                          <Typography variant="caption" sx={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>—</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={u.enabled === false ? 'Disabled' : 'Active'}
                          size="small"
                          sx={{
                            height: 22, fontSize: '0.65rem', fontWeight: 600,
                            background: u.enabled === false ? '#FEF2F2' : '#ECFDF5',
                            color: u.enabled === false ? '#DC2626' : '#059669',
                          }}
                        />
                      </TableCell>
                      {u.id !== selfUserId && isDirty(u.id, u) && (
                        <TableCell align="right" sx={{ px: 2 }}>
                          <Button
                            size="small"
                            variant="contained"
                            startIcon={savingId === u.id ? <CircularProgress size={12} sx={{ color: '#fff' }} /> : <MdSave size={13} />}
                            onClick={() => handleSave(u.id)}
                            disabled={savingId === u.id}
                            sx={{
                              height: 32, px: 1.5, fontSize: '0.72rem', fontWeight: 600,
                              background: roleColor.color,
                              '&:hover': { background: roleColor.color },
                            }}
                          >
                            Save
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}
    </Box>
  )
}
