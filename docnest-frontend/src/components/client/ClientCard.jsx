import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Card from '@mui/material/Card'
import Avatar from '@mui/material/Avatar'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Divider from '@mui/material/Divider'
import { MdEdit, MdDelete, MdFolder, MdAccountTree, MdPhone, MdLocationOn } from 'react-icons/md'
import ConfirmModal from '../ui/ConfirmModal'
import { getInitials, avatarColor } from '../../utils/formatters'
import { toast } from 'react-toastify'
import { clientService } from '../../services/clientService'
import { useAuth } from '../../context/AuthContext'
import { can } from '../../utils/permissions'

export default function ClientCard({ client, onRefresh }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const canDelete = can(user, 'deleteClient')
  const canEdit = can(user, 'editClient')

  const initials = getInitials(client.firstName, client.lastName)
  const color = avatarColor(`${client.firstName}${client.lastName}`)
  const fullName = `${client.firstName} ${client.lastName}`

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await clientService.delete(client.id)
      toast.success(`${fullName} deleted successfully`)
      onRefresh?.()
    } catch (e) {
      toast.error(e.message)
    } finally {
      setDeleting(false)
      setConfirmOpen(false)
    }
  }

  // Mini doc status dots
  const docTypes = [
    'AADHAR', 'PAN', 'DRIVING_LICENSE', 'ELECTRICITY_BILL',
    'W2', 'FORM_1099NEC', 'FORM_1099_MISC', 'SSN_CARD', 'US_PASSPORT',
  ]

  return (
    <>
      <Card sx={{ 
        height: '100%', display: 'flex', flexDirection: 'column', 
        transition: 'all 0.15s ease', 
        '&:hover': { transform: 'translateY(-2px)', boxShadow: 'var(--shadow-md)' } 
      }}>
        <Box sx={{ p: 3, flex: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Avatar sx={{ bgcolor: color, width: 44, height: 44, fontWeight: 700, fontSize: '0.9rem', fontFamily: 'var(--font-heading)' }}>
              {initials}
            </Avatar>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <Tooltip title={canEdit ? 'Edit Details' : 'View Details'}>
                <IconButton size="small" onClick={() => navigate(`/clients/${client.id}`)} sx={{ color: 'var(--primary)', '&:hover': { background: 'var(--primary-light)' } }}>
                  <MdEdit size={15} />
                </IconButton>
              </Tooltip>
              {canDelete && (
                <Tooltip title="Delete">
                  <IconButton size="small" onClick={() => setConfirmOpen(true)} sx={{ color: 'var(--danger)', '&:hover': { background: '#FEF2F2' } }}>
                    <MdDelete size={15} />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Box>

          <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '0.95rem', mb: 0.5, color: 'var(--text-primary)' }} noWrap>
            {fullName}
          </Typography>

          {/* Mini doc status dots */}
          <Box sx={{ display: 'flex', gap: 0.5, mb: 2 }}>
            {docTypes.map(t => (
              <Box key={t} sx={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--text-muted)' }} />
            ))}
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, color: 'var(--text-secondary)', mb: 2 }}>
            <MdPhone size={13} />
            <Typography variant="caption" sx={{ fontWeight: 500 }}>{client.mobile}</Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, color: 'var(--text-muted)' }}>
            <MdLocationOn size={13} />
            <Typography variant="caption" sx={{ fontWeight: 500 }}>{client.locationName || 'N/A'}</Typography>
          </Box>
        </Box>

        <Divider sx={{ borderColor: 'var(--border)' }} />

        <Box sx={{ px: 3, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ 
              width: 7, height: 7, borderRadius: '50%', 
              background: client.hasMissingDocuments ? 'var(--warning)' : 'var(--success)' 
            }} />
            <Typography variant="caption" sx={{ fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: '0.6rem' }}>
              {client.hasMissingDocuments ? 'Needs Docs' : 'Verified'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title="Family Tree">
              <IconButton size="small" onClick={() => navigate(`/family/${client.id}`)} sx={{ color: 'var(--text-muted)' }}><MdAccountTree size={16} /></IconButton>
            </Tooltip>
            <Tooltip title="Files">
              <IconButton size="small" onClick={() => navigate(`/clients/${client.id}?tab=documents`)} sx={{ color: 'var(--text-muted)' }}><MdFolder size={16} /></IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Card>

      <ConfirmModal
        open={confirmOpen}
        title="Delete Client"
        message={`Are you sure you want to delete "${fullName}"? All documents and family data will also be deleted.`}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
        loading={deleting}
      />
    </>
  )
}
