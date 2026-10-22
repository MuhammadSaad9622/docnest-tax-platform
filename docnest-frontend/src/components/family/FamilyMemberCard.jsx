import { useState, useEffect } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Avatar from '@mui/material/Avatar'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Collapse from '@mui/material/Collapse'
import Grid from '@mui/material/Grid'
import Chip from '@mui/material/Chip'
import { MdExpandMore, MdExpandLess, MdEdit, MdDelete, MdFolder } from 'react-icons/md'
import { avatarColor, formatDate, docTypeLabel } from '../../utils/formatters'
import { documentService } from '../../services/documentService'
import { useAuth } from '../../context/AuthContext'
import { can } from '../../utils/permissions'
import DocumentCard from '../document/DocumentCard'

const DOC_TYPES = [
  'AADHAR', 'PAN', 'DRIVING_LICENSE', 'ELECTRICITY_BILL',
  'W2', 'FORM_1099NEC', 'FORM_1099_MISC', 'SSN_CARD', 'US_PASSPORT',
]

export default function FamilyMemberCard({ member, onEdit, onDelete, onPreview }) {
  const { user } = useAuth()
  const canEdit = can(user, 'editFamilyMember')
  const canDelete = can(user, 'deleteFamilyMember')
  const [expanded, setExpanded] = useState(false)
  const [docs, setDocs] = useState([])
  const [completion, setCompletion] = useState({ uploaded: 0, total: 4, percentage: 0 })

  const loadDocs = async () => {
    try {
      const [docRes, compRes] = await Promise.all([
        documentService.getByOwner('FAMILY_MEMBER', member.id),
        documentService.getCompletion('FAMILY_MEMBER', member.id),
      ])
      setDocs(docRes.data)
      setCompletion(compRes.data)
    } catch {}
  }

  useEffect(() => {
    if (expanded) loadDocs()
  }, [expanded, member.id])

  const getDocForType = (type) => docs.find(d => d.documentType === type) || null
  const color = avatarColor(member.memberName)

  return (
    <Box sx={{
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      overflow: 'hidden',
      transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
      '&:hover': { borderColor: 'var(--border-strong)', boxShadow: 'var(--shadow-sm)' },
    }}>
      {/* Collapsed Header */}
      <Box
        onClick={() => setExpanded(e => !e)}
        sx={{
          display: 'flex', alignItems: 'center', gap: 2, p: 2, cursor: 'pointer',
          background: expanded ? 'var(--surface-2)' : '#fff',
          transition: 'background 0.2s',
          '&:hover': { background: 'var(--surface-2)' },
        }}
      >
        <Avatar sx={{ bgcolor: color, width: 38, height: 38, fontSize: '0.85rem', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
          {member.memberName?.charAt(0)}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'var(--text-primary)' }} noWrap>
              {member.memberName}
            </Typography>
            <Chip label={member.relation} size="small" sx={{
              height: 20, fontSize: '0.6rem', fontWeight: 600,
              background: 'var(--primary-light)', color: 'var(--primary)',
            }} />
          </Box>
          <Typography variant="caption" sx={{ color: 'var(--text-muted)' }}>
            {member.dob ? formatDate(member.dob) : ''} {member.gender ? `· ${member.gender}` : ''}
          </Typography>
        </Box>
        {/* Mini completion indicator */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title={`${completion.uploaded}/${completion.total} documents`}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <MdFolder size={14} color="var(--text-muted)" />
              <Typography variant="caption" sx={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.65rem' }}>
                {completion.uploaded}/{completion.total}
              </Typography>
            </Box>
          </Tooltip>
          <Box sx={{ display: 'flex', gap: 0.25 }}>
            {canEdit && <Tooltip title="Edit"><IconButton size="small" onClick={(e) => { e.stopPropagation(); onEdit?.(member) }} sx={{ color: 'var(--primary)' }}><MdEdit size={15} /></IconButton></Tooltip>}
            {canDelete && <Tooltip title="Remove"><IconButton size="small" onClick={(e) => { e.stopPropagation(); onDelete?.(member.id) }} sx={{ color: 'var(--danger)' }}><MdDelete size={15} /></IconButton></Tooltip>}
          </Box>
          {expanded ? <MdExpandLess size={20} color="var(--text-muted)" /> : <MdExpandMore size={20} color="var(--text-muted)" />}
        </Box>
      </Box>

      {/* Expanded Content */}
      <Collapse in={expanded} timeout={300}>
        <Box sx={{ p: 2.5, pt: 2, borderTop: '1px solid var(--border)', background: '#FAFBFC' }}>
          {/* Personal Info Row */}
          <Box sx={{ display: 'flex', gap: 3, mb: 2.5, flexWrap: 'wrap' }}>
            {[
              { label: 'Mobile', value: member.mobile || '—' },
              { label: 'Email', value: member.email || '—' },
              { label: 'Gender', value: member.gender || '—' },
            ].map((f, i) => (
              <Box key={i}>
                <Typography variant="caption" sx={{ color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.55rem', letterSpacing: '0.05em' }}>{f.label}</Typography>
                <Typography variant="body2" sx={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: '0.8rem' }}>{f.value}</Typography>
              </Box>
            ))}
          </Box>

          {/* Documents Header */}
          <Typography variant="caption" sx={{
            display: 'block', mb: 1.5, fontWeight: 700, textTransform: 'uppercase',
            fontSize: '0.6rem', letterSpacing: '0.08em', color: 'var(--text-muted)',
          }}>
            Documents ({completion.uploaded}/{completion.total})
          </Typography>

          {/* Document Cards Grid */}
          <Grid container spacing={1.5}>
            {DOC_TYPES.map(type => (
              <Grid item xs={6} sm={3} key={type}>
                <DocumentCard
                  ownerType="FAMILY_MEMBER"
                  ownerId={member.id}
                  docType={type}
                  document={getDocForType(type)}
                  onRefresh={loadDocs}
                  onPreview={onPreview}
                  compact
                />
              </Grid>
            ))}
          </Grid>
        </Box>
      </Collapse>
    </Box>
  )
}
