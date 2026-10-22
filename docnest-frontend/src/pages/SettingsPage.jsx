import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Card from '@mui/material/Card'
import { MdTune, MdLocationOn, MdDescription, MdPerson, MdSettings, MdRocket, MdGroup, MdSync } from 'react-icons/md'
import { useAuth } from '../context/AuthContext'
import { can } from '../utils/permissions'
import FormFieldsSection from '../components/settings/FormFieldsSection'
import LocationsSection from '../components/settings/LocationsSection'
import DocTypesSection from '../components/settings/DocTypesSection'
import ProfileSection from '../components/settings/ProfileSection'
import PreferencesSection from '../components/settings/PreferencesSection'
import FutureSection from '../components/settings/FutureSection'
import UserManagementSection from '../components/settings/UserManagementSection'
import TaxSlayerSection from '../components/settings/TaxSlayerSection'

const ALL_TABS = [
  { key: 'form', label: 'Form Configuration', icon: <MdTune size={18}/>, desc: 'Client form fields' },
  { key: 'locations', label: 'Locations', icon: <MdLocationOn size={18}/>, desc: 'Location master data' },
  { key: 'documents', label: 'Document Types', icon: <MdDescription size={18}/>, desc: 'Required documents' },
  { key: 'profile', label: 'Admin Profile', icon: <MdPerson size={18}/>, desc: 'Your account' },
  { key: 'preferences', label: 'Preferences', icon: <MdSettings size={18}/>, desc: 'System settings' },
  { key: 'users', label: 'User Management', icon: <MdGroup size={18}/>, desc: 'Roles & access', adminOnly: true },
  { key: 'taxslayer', label: 'TaxSlayer Pro', icon: <MdSync size={18}/>, desc: 'Integration bridge', adminOnly: true },
  { key: 'future', label: 'Coming Soon', icon: <MdRocket size={18}/>, desc: 'Roadmap' },
]

const SECTION_MAP = {
  form: FormFieldsSection,
  locations: LocationsSection,
  documents: DocTypesSection,
  profile: ProfileSection,
  preferences: PreferencesSection,
  users: UserManagementSection,
  taxslayer: TaxSlayerSection,
  future: FutureSection,
}

export default function SettingsPage() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const initialTab = searchParams.get('tab') || 'form'
  const isAdmin = can(user, 'manageUsers')
  const [tab, setTab] = useState(isAdmin ? initialTab : 'form')
  const visibleTabs = ALL_TABS.filter(t => !t.adminOnly || isAdmin)
  const Section = SECTION_MAP[tab] || FormFieldsSection

  return (
    <Box className="page-enter">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 0.25, fontSize: '1.6rem' }}>Settings</Typography>
        <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>Configure your DocNest platform.</Typography>
      </Box>
      <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start', flexDirection: { xs: 'column', md: 'row' } }}>
        {/* Nav */}
        <Card sx={{ width: { xs: '100%', md: 240 }, flexShrink: 0, overflow: 'hidden' }}>
          <List disablePadding>
            {visibleTabs.map(t => (
              <ListItemButton key={t.key} selected={tab === t.key} onClick={() => setTab(t.key)}
                sx={{ py: 1.5, px: 2, borderLeft: tab === t.key ? '3px solid var(--primary)' : '3px solid transparent',
                  '&.Mui-selected': { background: 'var(--primary-light)' }, '&:hover': { background: 'var(--surface-2)' } }}>
                <ListItemIcon sx={{ minWidth: 32, color: tab === t.key ? 'var(--primary)' : 'var(--text-muted)' }}>{t.icon}</ListItemIcon>
                <ListItemText primary={t.label} secondary={t.desc}
                  primaryTypographyProps={{ fontSize: '0.82rem', fontWeight: tab === t.key ? 600 : 500, color: tab === t.key ? 'var(--primary)' : 'var(--text-primary)' }}
                  secondaryTypographyProps={{ fontSize: '0.6rem', color: 'var(--text-muted)' }} />
              </ListItemButton>
            ))}
          </List>
        </Card>
        {/* Content */}
        <Box sx={{ flex: 1, minWidth: 0, width: { xs: '100%', md: 'auto' } }}>
          {tab === 'users' ? <UserManagementSection selfUserId={user?.id} /> : <Section />}
        </Box>
      </Box>
    </Box>
  )
}
