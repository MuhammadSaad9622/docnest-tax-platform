import { useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Alert from '@mui/material/Alert'
import { MdSync, MdDownload, MdCheckCircle, MdCancel } from 'react-icons/md'
import { toast } from 'react-toastify'
import { taxslayerService } from '../../services/taxslayerService'
import { useAuth } from '../../context/AuthContext'
import { can } from '../../utils/permissions'
import { FIELD_LABELS, fmtValue } from '../document/ExtractedFieldsPanel'
import { FILING_STATUSES } from '../intake/IntakeForm'
import Spinner from '../ui/Spinner'

const FORM_SECTIONS = [
  { key: 'w2', title: 'W-2' },
  { key: 'form1099Nec', title: '1099-NEC' },
  { key: 'form1099Misc', title: '1099-MISC' },
]

/** Readiness check + hand-off of one client's return to TaxSlayer Pro. */
export default function TaxSlayerPanel({ clientId }) {
  const { user } = useAuth()
  const canPush = can(user, 'editClient')
  const [data, setData] = useState(null)
  const [busy, setBusy] = useState(false)

  const load = () => taxslayerService.getReturn(clientId).then(setData).catch(e => toast.error(e.message))
  useEffect(() => { load() }, [clientId])

  if (!data) return <Spinner />

  const r = data.readiness
  const checks = [
    { ok: r.intakeStatus === 'SUBMITTED', label: `Intake questionnaire ${r.intakeStatus === 'SUBMITTED' ? 'submitted' : r.intakeStatus === 'DRAFT' ? 'in draft' : 'not started'}` },
    { ok: r.ssnFound, label: r.ssnFound ? 'SSN captured from documents' : 'No SSN found — upload SSN card or W-2' },
    { ok: r.unverifiedDocuments === 0, label: r.unverifiedDocuments === 0 ? 'All extracted values verified' : `${r.unverifiedDocuments} document(s) need review` },
    { ok: r.documents > 0, label: `${r.documents} document(s) on file` },
  ]

  const push = async () => {
    setBusy(true)
    try {
      const res = await taxslayerService.push(clientId)
      res.status === 'SYNCED' ? toast.success(res.message) : toast.error(res.message, { autoClose: 8000 })
    } catch (e) { toast.error(e.message, { autoClose: 8000 }) }
    finally { setBusy(false); load() }
  }

  const exportCsv = async () => {
    try { await taxslayerService.downloadCsv([clientId]) } catch (e) { toast.error(e.message) }
  }

  const statusLabel = FILING_STATUSES.find(s => s.value === data.filingStatus)?.label || '—'

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} lg={4}>
        <Card sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Readiness</Typography>
            <Chip size="small" label={r.ready ? 'Ready to file' : 'Not ready'} color={r.ready ? 'success' : 'warning'} sx={{ fontWeight: 700 }} />
          </Box>
          {checks.map((c, i) => (
            <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.75, fontSize: '0.85rem' }}>
              {c.ok ? <MdCheckCircle color="#059669" /> : <MdCancel color="#DC2626" />}
              <span>{c.label}</span>
            </Box>
          ))}

          <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid var(--border)' }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>TaxSlayer Pro sync</Typography>
            {data.sync?.status ? (
              <Alert severity={data.sync.status === 'SYNCED' ? 'success' : 'error'} sx={{ mb: 2, fontSize: '0.8rem' }}>
                {data.sync.message}{data.sync.reference ? ` · Ref ${data.sync.reference}` : ''}
              </Alert>
            ) : (
              <Typography variant="body2" sx={{ color: 'var(--text-muted)', mb: 2 }}>Not sent yet.</Typography>
            )}
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {canPush && (
                <Button variant="contained" startIcon={<MdSync />} onClick={push} disabled={busy}>Push to TaxSlayer Pro</Button>
              )}
              {canPush && (
                <Button variant="outlined" startIcon={<MdDownload />} onClick={exportCsv}>Export CSV</Button>
              )}
            </Box>
          </Box>
        </Card>
      </Grid>

      <Grid item xs={12} lg={8}>
        <Card sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 0.5 }}>Return package · {data.taxYear}</Typography>
          <Typography variant="body2" sx={{ color: 'var(--text-secondary)', mb: 2 }}>
            What will be sent to TaxSlayer Pro{data.firmId ? ` (firm ${data.firmId})` : ''}.
          </Typography>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            {[
              ['Taxpayer', `${data.taxpayer.firstName} ${data.taxpayer.lastName}`],
              ['SSN', data.taxpayer.ssn ? `***-**-${data.taxpayer.ssn.slice(-4)}` : '—'],
              ['Filing status', statusLabel],
              ['Dependents', data.dependentsCount ?? '—'],
              ['Refund', data.refundMethod?.replace(/_/g, ' ').toLowerCase() || '—'],
              ['Office', data.office || '—'],
            ].map(([k, v]) => (
              <Grid item xs={6} sm={4} key={k}>
                <Typography variant="caption" sx={{ color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.6rem' }}>{k}</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{v}</Typography>
              </Grid>
            ))}
          </Grid>

          {FORM_SECTIONS.map(({ key, title }) => data[key]?.length > 0 && (
            <Box key={key} sx={{ mt: 2 }}>
              {data[key].map((form, i) => (
                <Box key={i} sx={{ mb: 1.5, p: 1.5, borderRadius: 'var(--radius-sm)', background: 'var(--surface-2)' }}>
                  <Typography variant="subtitle2" sx={{ mb: 0.5 }}>{title}{data[key].length > 1 ? ` #${i + 1}` : ''}</Typography>
                  <Grid container spacing={1}>
                    {Object.entries(form).filter(([k]) => !/ssn|recipientTin/i.test(k)).map(([k, v]) => (
                      <Grid item xs={6} sm={4} key={k}>
                        <Typography variant="caption" sx={{ color: 'var(--text-muted)', display: 'block' }}>{FIELD_LABELS[k] || k}</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{fmtValue(k, v)}</Typography>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              ))}
            </Box>
          ))}
          {FORM_SECTIONS.every(({ key }) => !data[key]?.length) && (
            <Typography variant="body2" sx={{ color: 'var(--text-muted)' }}>No income forms uploaded yet.</Typography>
          )}
        </Card>
      </Grid>
    </Grid>
  )
}
