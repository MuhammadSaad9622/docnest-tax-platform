import { useState, useEffect, useCallback } from 'react'
import Grid from '@mui/material/Grid'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Pagination from '@mui/material/Pagination'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { MdPersonAdd, MdDownload } from 'react-icons/md'
import { toast } from 'react-toastify'
import { taxslayerService } from '../services/taxslayerService'
import { useAuth } from '../context/AuthContext'
import { can } from '../utils/permissions'
import ClientCard from '../components/client/ClientCard'
import ClientFilters from '../components/client/ClientFilters'
import SkeletonCard from '../components/ui/SkeletonCard'
import EmptyState from '../components/ui/EmptyState'
import { clientService } from '../services/clientService'

export default function ClientListPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const [clients, setClients] = useState([])
  const [totalPages, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ query: searchParams.get('query') || '' })

  const load = useCallback(async (f = filters, p = page) => {
    setLoading(true)
    try {
      const res = await clientService.getAll({ ...f, page: p, size: 12 })
      setClients(res.data.content || [])
      setTotal(res.data.totalPages || 0)
    } catch { setClients([]) }
    finally { setLoading(false) }
  }, [filters, page])

  useEffect(() => { load() }, [page])

  const handleFilter = (f) => {
    setFilters(f); setPage(0)
    load(f, 0)
  }

  return (
    <Box className="page-enter">
      <Box sx={{ mb: 5, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 0.5 }}>Client Directory</Typography>
          <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>Search and manage your global client base.</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          {can(user, 'editClient') && (
            <Button variant="outlined" startIcon={<MdDownload />}
              onClick={() => taxslayerService.downloadCsv().catch(e => toast.error(e.message))}>
              Export to TaxSlayer Pro
            </Button>
          )}
          <Button variant="contained" startIcon={<MdPersonAdd />} onClick={() => navigate('/clients/add')}>
            Add New Client
          </Button>
        </Box>
      </Box>

      <Box sx={{ mb: 4 }}>
        <ClientFilters onFilter={handleFilter} />
      </Box>

      {loading ? (
        <Grid container spacing={3}>
          {Array(8).fill(0).map((_, i) => <Grid item xs={12} sm={6} md={4} lg={3} key={i}><SkeletonCard /></Grid>)}
        </Grid>
      ) : clients.length === 0 ? (
        <EmptyState 
          icon="👥" 
          title="No clients found" 
          description="We couldn't find any clients matching your current filters."
          actionLabel="Clear Filters" 
          onAction={() => handleFilter({ query: '' })} 
        />
      ) : (
        <>
          <Grid container spacing={3}>
            {clients.map(client => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={client.id}>
                <ClientCard client={client} onRefresh={() => load()} />
              </Grid>
            ))}
          </Grid>
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
              <Pagination 
                count={totalPages} 
                page={page + 1} 
                onChange={(_, v) => setPage(v - 1)}
                color="primary" 
                shape="rounded"
                size="large"
              />
            </Box>
          )}
        </>
      )}
    </Box>
  )
}
