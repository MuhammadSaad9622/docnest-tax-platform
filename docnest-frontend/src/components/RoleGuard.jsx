import { Navigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { useAuth } from '../context/AuthContext'
import { can } from '../utils/permissions'

export default function RoleGuard({ capability, children, fallback }) {
  const { user } = useAuth()

  if (!user) return <Navigate to="/login" replace />

  if (!can(user, capability)) {
    if (fallback) return fallback
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 12, textAlign: 'center' }}>
        <Box sx={{ fontSize: 48, mb: 2 }}>🔒</Box>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>Access Restricted</Typography>
        <Typography variant="body2" sx={{ color: 'var(--text-secondary)', maxWidth: 400 }}>
          You don't have permission to access this page.
          Contact your administrator for access.
        </Typography>
      </Box>
    )
  }

  return children
}
