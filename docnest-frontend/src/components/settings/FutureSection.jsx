import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import { MdRocket, MdAssessment, MdFileDownload, MdSecurity } from 'react-icons/md'

const FEATURES = [
  { icon: <MdSecurity size={20}/>, title: 'Team Scoping', desc: 'EMPLOYEEs see only their assigned clients; MANAGERS see their team', color: '#8B5CF6' },
  { icon: <MdAssessment size={20}/>, title: 'Audit Reports', desc: 'Detailed compliance and audit trail exports (PDF/Excel)', color: '#10B981' },
  { icon: <MdFileDownload size={20}/>, title: 'Analytics Export', desc: 'Export dashboards and reports to PDF/Excel', color: '#F59E0B' },
]

export default function FutureSection() {
  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>Coming Soon</Typography>
        <Typography variant="body2" sx={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Advanced features on the roadmap.</Typography>
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
        {FEATURES.map((f, i) => (
          <Card key={i} sx={{ p: 3, display: 'flex', gap: 2, alignItems: 'flex-start', opacity: 0.7, '&:hover': { opacity: 1 }, transition: 'opacity 0.2s' }}>
            <Box sx={{ width: 40, height: 40, borderRadius: '10px', background: `${f.color}14`, color: f.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{f.icon}</Box>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{f.title}</Typography>
                <Chip label="Planned" size="small" sx={{ height: 18, fontSize: '0.5rem', fontWeight: 600, background: '#DBEAFE', color: '#2563EB' }}/>
              </Box>
              <Typography variant="caption" sx={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{f.desc}</Typography>
            </Box>
          </Card>
        ))}
      </Box>
    </Box>
  )
}
