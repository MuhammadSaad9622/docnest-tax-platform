import { useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import Grid from '@mui/material/Grid'
import { MdAutoAwesome, MdFactCheck } from 'react-icons/md'
import { toast } from 'react-toastify'
import { documentService } from '../../services/documentService'
import { docTypeLabel } from '../../utils/formatters'

export const FIELD_LABELS = {
  employeeSsn: 'Employee SSN',
  employerEin: 'Employer EIN',
  taxYear: 'Tax year',
  box1Wages: 'Box 1 · Wages',
  box2FederalWithheld: 'Box 2 · Federal withheld',
  box3SocialSecurityWages: 'Box 3 · SS wages',
  box4SocialSecurityTax: 'Box 4 · SS tax',
  box5MedicareWages: 'Box 5 · Medicare wages',
  box6MedicareTax: 'Box 6 · Medicare tax',
  box16StateWages: 'Box 16 · State wages',
  box17StateTax: 'Box 17 · State tax',
  payerTin: 'Payer TIN',
  recipientTin: 'Recipient TIN',
  box1NonemployeeComp: 'Box 1 · Nonemployee comp',
  box4FederalWithheld: 'Box 4 · Federal withheld',
  box1Rents: 'Box 1 · Rents',
  box2Royalties: 'Box 2 · Royalties',
  box3OtherIncome: 'Box 3 · Other income',
  ssn: 'SSN',
  passportNumber: 'Passport number',
  expirationDate: 'Expiration date',
}

/** Expected fields per form, so preparers can fill anything OCR missed. */
const EXPECTED = {
  W2: ['employeeSsn', 'employerEin', 'taxYear', 'box1Wages', 'box2FederalWithheld', 'box3SocialSecurityWages', 'box4SocialSecurityTax', 'box5MedicareWages', 'box6MedicareTax', 'box16StateWages', 'box17StateTax'],
  FORM_1099NEC: ['payerTin', 'recipientTin', 'taxYear', 'box1NonemployeeComp', 'box4FederalWithheld'],
  FORM_1099_MISC: ['payerTin', 'recipientTin', 'taxYear', 'box1Rents', 'box2Royalties', 'box3OtherIncome', 'box4FederalWithheld'],
  SSN_CARD: ['ssn'],
  US_PASSPORT: ['passportNumber', 'expirationDate'],
}

export const isMoney = (key) => key.startsWith('box')
export const fmtValue = (key, v) =>
  isMoney(key) && v && !isNaN(Number(v)) ? `$${Number(v).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : v

/**
 * Shows the values the AI/OCR engine pulled off a tax form. Staff can open the
 * review dialog to correct them and mark the document VERIFIED.
 */
export default function ExtractedFieldsPanel({ document: doc, canReview, onUpdated }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)

  const fields = doc?.extractedFields || {}
  const keys = Object.keys(fields)
  const expected = EXPECTED[doc?.documentType] || []
  if (!doc || (keys.length === 0 && (!canReview || expected.length === 0))) return null

  const verified = doc.reviewStatus === 'VERIFIED'
  const openReview = () => {
    const initial = {}
    ;[...new Set([...expected, ...keys])].forEach(k => { initial[k] = fields[k] || '' })
    setForm(initial)
    setOpen(true)
  }

  const save = async () => {
    setSaving(true)
    try {
      await documentService.updateFields(doc.id, form)
      toast.success('Fields verified')
      setOpen(false)
      onUpdated?.()
    } catch (e) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  return (
    <Box sx={{ mt: 1, p: 1.25, borderRadius: 'var(--radius-sm)', background: '#F8FAFF', border: '1px solid #E0E7FF' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: keys.length ? 0.75 : 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#4338CA', fontWeight: 700, fontSize: '0.68rem' }}>
          <MdAutoAwesome size={13} /> Auto-extracted
        </Box>
        <Chip size="small" label={verified ? 'Verified' : keys.length ? 'Needs review' : 'Not extracted'}
          sx={{ height: 18, fontSize: '0.55rem', fontWeight: 700,
            background: verified ? '#D1FAE5' : '#FEF3C7', color: verified ? '#065F46' : '#92400E' }} />
      </Box>
      {keys.map(k => (
        <Box key={k} sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, fontSize: '0.68rem', lineHeight: 1.7 }}>
          <span style={{ color: 'var(--text-muted)' }}>{FIELD_LABELS[k] || k}</span>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{fmtValue(k, fields[k])}</span>
        </Box>
      ))}
      {canReview && (
        <Button size="small" startIcon={<MdFactCheck size={14} />} onClick={openReview}
          sx={{ mt: 0.75, p: 0.25, minWidth: 0, fontSize: '0.65rem', fontWeight: 700 }}>
          {verified ? 'Edit values' : 'Review & verify'}
        </Button>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Review {docTypeLabel(doc.documentType)}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: 'var(--text-secondary)', mb: 2 }}>
            Compare against the document and correct anything OCR misread. Verified values are what gets sent to TaxSlayer Pro.
          </Typography>
          <Grid container spacing={2}>
            {Object.keys(form).map(k => (
              <Grid item xs={12} sm={6} key={k}>
                <TextField fullWidth size="small" label={FIELD_LABELS[k] || k} value={form[k]}
                  onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
                  helperText={form[k]?.startsWith?.('***') ? 'Masked — type a new value to replace' : ' '} />
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={save} disabled={saving}>Mark verified</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
