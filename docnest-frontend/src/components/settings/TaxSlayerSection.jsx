import { useState, useEffect } from 'react'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import MenuItem from '@mui/material/MenuItem'
import { MdSave, MdSecurity, MdCheckCircle, MdRadioButtonUnchecked, MdSync } from 'react-icons/md'
import { toast } from 'react-toastify'
import api from '../../services/api'

const STATUS_COLORS = {
  CONNECTED:    { bg: '#ECFDF5', color: '#059669', icon: <MdCheckCircle size={14} /> },
  DISCONNECTED: { bg: '#FEF2F2', color: '#DC2626', icon: <MdRadioButtonUnchecked size={14} /> },
  ERROR:        { bg: '#FFF7ED', color: '#D97706', icon: <MdSecurity size={14} /> },
}

const TAXSLAYER_CONFIG = {
  apiKey: '',
  apiBaseUrl: '',
  firmId: '',
  taxYear: new Date().getFullYear(),
  connectionStatus: 'DISCONNECTED',
  lastCheckedAt: null,
}

export default function TaxSlayerSection() {
  const [form, setForm] = useState(TAXSLAYER_CONFIG)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)

  useEffect(() => {
    api.get('/api/settings/taxslayer')
      .then(r => setForm(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const set = (k) => (e) => {
    let val = e.target.value
    if (k === 'taxYear') val = parseInt(val, 10) || null
    setForm(f => ({ ...f, [k]: val }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const r = await api.put('/api/settings/taxslayer', form)
      setForm(r.data)
      toast.success('TaxSlayer Pro settings saved')
    } catch (e) {
      toast.error(e.message || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async () => {
    setTesting(true)
    try {
      const r = await api.post('/api/settings/taxslayer/test', {}, { timeout: 30000 })
      toast.success(r.data.message)
      const fresh = await api.get('/api/settings/taxslayer')
      setForm(fresh.data)
    } catch (e) {
      toast.error('Connection test failed')
    } finally {
      setTesting(false)
    }
  }

  if (loading) return <Box sx={{ py: 8, textAlign: 'center' }}><CircularProgress size={32} /></Box>

  const statusMeta = STATUS_COLORS[form.connectionStatus] || STATUS_COLORS.DISCONNECTED

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>TaxSlayer Pro Integration</Typography>
        <Typography variant="body2" sx={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
          Configure the API bridge between DocNest and TaxSlayer Pro service bureau.
        </Typography>
      </Box>

      {/* Status banner */}
      <Card sx={{
        p: 2.5, mb: 3, display: 'flex', alignItems: 'center', gap: 2,
        background: statusMeta.bg, border: `1px solid ${statusMeta.color}33`,
      }}>
        <Box sx={{
          width: 36, height: 36, borderRadius: '8px',
          background: `${statusMeta.color}15`,
          color: statusMeta.color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>{statusMeta.icon}</Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" sx={{ fontWeight: 700, color: statusMeta.color }}>
            {form.connectionStatus === 'CONNECTED' ? 'Connected' : 'Not Connected'}
          </Typography>
          {form.lastCheckedAt && (
            <Typography variant="caption" sx={{ color: 'var(--text-muted)' }}>
              Last checked: {form.lastCheckedAt}
            </Typography>
          )}
        </Box>
        <Button
          variant="outlined"
          size="small"
          startIcon={testing ? <CircularProgress size={14} /> : <MdSync size={14} />}
          onClick={handleTest}
          disabled={testing}
          sx={{ fontWeight: 600, color: statusMeta.color, borderColor: `${statusMeta.color}55` }}
        >
          {testing ? 'Testing…' : 'Test Connection'}
        </Button>
      </Card>

      {/* Config form */}
      <Card sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2.5 }}>Integration Credentials</Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <TextField
            select
            fullWidth
            label="Tax Year"
            value={form.taxYear ?? ''}
            onChange={set('taxYear')}
            helperText="Which tax year this integration targets"
          >
            {[2022, 2023, 2024, 2025, 2026, 2027].map(y => (
              <MenuItem key={y} value={y}>{y}</MenuItem>
            ))}
          </TextField>

          <TextField
            fullWidth
            label="Firm / Office ID"
            value={form.firmId || ''}
            onChange={set('firmId')}
            placeholder="e.g. FIRM-001"
            helperText="Your service bureau identifier in TaxSlayer Pro"
          />

          <TextField
            fullWidth
            label="API Base URL"
            value={form.apiBaseUrl || ''}
            onChange={set('apiBaseUrl')}
            placeholder="https://api.taxslayerpro.com"
            helperText="TaxSlayer Pro API endpoint"
          />

          <TextField
            fullWidth
            label="API Key"
            value={form.apiKey || ''}
            onChange={set('apiKey')}
            type="password"
            placeholder="••••••••••••••••"
            helperText="Your TaxSlayer Pro developer API key"
          />
        </Box>

        <Divider sx={{ my: 3 }} />

        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>About This Integration</Typography>
        <Typography variant="body2" sx={{ color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: 1.7 }}>
          This module provides a data bridge between DocNest and TaxSlayer Pro.
          Once configured and tested, scanned client documents and extracted
          data (W-2, 1099, SSN, etc.) can be pushed to the TaxSlayer Pro
          filing system for the configured tax year and firm.
          <br /><br />
          <strong>Design note:</strong> The actual API call is stubbed as a
          connection test. The real integration requires your TaxSlayer Pro
          developer credentials and the official API documentation.
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={14} sx={{ color: '#fff' }} /> : <MdSave size={15} />}
            onClick={handleSave}
            disabled={saving}
            sx={{ fontWeight: 600 }}
          >
            {saving ? 'Saving…' : 'Save Configuration'}
          </Button>
        </Box>
      </Card>

      {/* Roadmap */}
      <Card sx={{ p: 3, background: 'var(--surface-2)', border: '1px dashed var(--border-strong)' }}>
        <Typography variant="body2" sx={{ fontWeight: 700, mb: 1.5, textTransform: 'uppercase', fontSize: '0.6rem', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
          Coming Soon
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {[
            'Automatic W-2 / 1099 data extraction to TaxSlayer Pro filing records',
            'Bulk sync of verified documents to TaxSlayer Pro per tax year',
            'Real-time connection health monitoring',
            'TaxSlayer Pro API documentation & official developer key provisioning',
          ].map((item, i) => (
            <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, opacity: 0.6 }}>
              <Chip label="Planned" size="small" sx={{ height: 18, fontSize: '0.55rem', fontWeight: 600, background: '#DBEAFE', color: '#2563EB' }} />
              <Typography variant="body2" sx={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{item}</Typography>
            </Box>
          ))}
        </Box>
      </Card>
    </Box>
  )
}
