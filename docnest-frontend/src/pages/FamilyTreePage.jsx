import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import { MdArrowBack, MdAdd } from 'react-icons/md'
import FamilyTreeView from '../components/family/FamilyTreeView'
import FamilyMemberForm from '../components/family/FamilyMemberForm'
import Spinner from '../components/ui/Spinner'
import EmptyState from '../components/ui/EmptyState'
import { familyService } from '../services/familyService'
import { clientService } from '../services/clientService'
import { useAuth } from '../context/AuthContext'
import { can } from '../utils/permissions'

export default function FamilyTreePage() {
  const { clientId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const canAddFamily = can(user, 'addFamilyMember')
  const [treeData, setTreeData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [client, setClient] = useState(null)
  const [clients, setClients] = useState([])
  const [selected, setSelected] = useState(clientId || '')
  const [formOpen, setFormOpen] = useState(false)

  useEffect(() => {
    clientService.getAll({ page: 0, size: 500 })
      .then(r => setClients(r.data.content || []))
      .catch(() => {})
  }, [])

  const loadTree = async (cid) => {
    if (!cid) return
    setLoading(true)
    try {
      const [treeRes, clientRes] = await Promise.all([
        familyService.getTree(cid),
        clientService.getById(cid)
      ])
      setTreeData(treeRes.data)
      setClient(clientRes.data)
    } catch {}
    finally { setLoading(false) }
  }

  useEffect(() => {
    if (selected) loadTree(selected)
  }, [selected])

  return (
    <Box className="page-enter">
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 5 }}>
        <IconButton onClick={() => navigate('/clients')} sx={{ color: 'var(--text-secondary)' }}><MdArrowBack /></IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>Family Tree</Typography>
          <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
            {client ? `${client.firstName} ${client.lastName}'s family hierarchy` : 'Visualize family relationships'}
          </Typography>
        </Box>
        {selected && canAddFamily && (
          <Button variant="contained" startIcon={<MdAdd />} onClick={() => setFormOpen(true)}>Add Member</Button>
        )}
      </Box>

      {/* Client Selector */}
      <Card sx={{ mb: 3, p: 2.5 }}>
        <TextField
          select fullWidth label="Select Client"
          value={selected}
          onChange={e => { setSelected(e.target.value); navigate(`/family/${e.target.value}`, { replace: true }) }}
        >
          {clients.map(c => (
            <MenuItem key={c.id} value={c.id}>{c.firstName} {c.lastName}</MenuItem>
          ))}
        </TextField>
      </Card>

      {!selected ? (
        <EmptyState icon="🌳" title="Select a client" description="Choose a client to view their family tree." />
      ) : loading ? (
        <Spinner message="Loading family tree…" />
      ) : !treeData || (!treeData.children?.length) ? (
        <EmptyState icon="🌳" title="No family members yet" description={canAddFamily ? 'Add family members to visualize the tree.' : 'No family members linked to this client.'}
          actionLabel={canAddFamily ? 'Add Member' : undefined} onAction={() => setFormOpen(true)} />
      ) : (
        <Card sx={{ 
          overflow: 'hidden',
          background: 'var(--surface-2)',
          backgroundImage: 'radial-gradient(var(--border) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}>
          <Box sx={{ p: 3 }}>
            <FamilyTreeView treeData={treeData} />
          </Box>
        </Card>
      )}

      {formOpen && (
        <FamilyMemberForm
          open={formOpen}
          onClose={() => setFormOpen(false)}
          clientId={Number(selected)}
          onSaved={() => loadTree(selected)}
          clientDob={client?.dob}
        />
      )}
    </Box>
  )
}
