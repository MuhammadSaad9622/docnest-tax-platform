import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '@mui/material/Checkbox'

export const FILING_STATUSES = [
  { value: 'SINGLE', label: 'Single' },
  { value: 'MARRIED_JOINT', label: 'Married filing jointly' },
  { value: 'MARRIED_SEPARATE', label: 'Married filing separately' },
  { value: 'HEAD_OF_HOUSEHOLD', label: 'Head of household' },
  { value: 'QUALIFYING_SURVIVOR', label: 'Qualifying surviving spouse' },
]

const INCOME_SOURCES = [
  { value: 'W2', label: 'W-2 job' },
  { value: '1099_NEC', label: '1099-NEC / gig work' },
  { value: '1099_MISC', label: '1099-MISC' },
  { value: 'SELF_EMPLOYMENT', label: 'Self-employment' },
  { value: 'RENTAL', label: 'Rental income' },
  { value: 'UNEMPLOYMENT', label: 'Unemployment' },
  { value: 'SOCIAL_SECURITY', label: 'Social Security' },
  { value: 'INVESTMENTS', label: 'Investments' },
]

const REFUND_METHODS = [
  { value: 'DIRECT_DEPOSIT', label: 'Direct deposit' },
  { value: 'CHECK', label: 'Paper check' },
  { value: 'REFUND_TRANSFER', label: 'Refund transfer (fees from refund)' },
]

const isMarried = (s) => s === 'MARRIED_JOINT' || s === 'MARRIED_SEPARATE'

/** Remote tax intake questionnaire. Pass `readOnly` for the staff view. */
export default function IntakeForm({ value, onChange, readOnly }) {
  const v = value || {}
  const set = (field) => (e) => onChange?.({ ...v, [field]: e.target.value })
  const setBool = (field) => (e) => onChange?.({ ...v, [field]: e.target.checked })
  const sources = (v.incomeSources || '').split(',').filter(Boolean)
  const toggleSource = (src) => {
    const next = sources.includes(src) ? sources.filter(s => s !== src) : [...sources, src]
    onChange?.({ ...v, incomeSources: next.join(',') })
  }

  return (
    <Box>
      <Grid container spacing={2.5}>
        <Grid item xs={12} sm={6}>
          <TextField select fullWidth label="Filing status" required value={v.filingStatus || ''} onChange={set('filingStatus')} disabled={readOnly}>
            {FILING_STATUSES.map(s => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth label="Your occupation" value={v.occupation || ''} onChange={set('occupation')} disabled={readOnly} />
        </Grid>

        {isMarried(v.filingStatus) && (
          <>
            <Grid item xs={12} sm={4}><TextField fullWidth label="Spouse first name" value={v.spouseFirstName || ''} onChange={set('spouseFirstName')} disabled={readOnly} /></Grid>
            <Grid item xs={12} sm={4}><TextField fullWidth label="Spouse last name" value={v.spouseLastName || ''} onChange={set('spouseLastName')} disabled={readOnly} /></Grid>
            <Grid item xs={12} sm={4}><TextField fullWidth label="Spouse occupation" value={v.spouseOccupation || ''} onChange={set('spouseOccupation')} disabled={readOnly} /></Grid>
          </>
        )}

        <Grid item xs={12} sm={6}>
          <TextField fullWidth type="number" label="Number of dependents" inputProps={{ min: 0 }}
            value={v.dependentsCount ?? ''} onChange={e => onChange?.({ ...v, dependentsCount: e.target.value === '' ? null : Number(e.target.value) })} disabled={readOnly} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField select fullWidth label="How do you want your refund?" value={v.refundMethod || ''} onChange={set('refundMethod')} disabled={readOnly}>
            {REFUND_METHODS.map(s => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
          </TextField>
        </Grid>

        <Grid item xs={12}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Income you received this year</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {INCOME_SOURCES.map(s => {
              const on = sources.includes(s.value)
              return (
                <Chip key={s.value} label={s.label} onClick={readOnly ? undefined : () => toggleSource(s.value)}
                  color={on ? 'primary' : 'default'} variant={on ? 'filled' : 'outlined'} sx={{ fontWeight: 600 }} />
              )
            })}
          </Box>
        </Grid>

        <Grid item xs={12}>
          <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600 }}>Did you have any of these?</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', columnGap: 3 }}>
            <FormControlLabel control={<Checkbox checked={!!v.hasHealthInsurance} onChange={setBool('hasHealthInsurance')} disabled={readOnly} />} label="Health insurance (1095-A/B/C)" />
            <FormControlLabel control={<Checkbox checked={!!v.hasEducationExpenses} onChange={setBool('hasEducationExpenses')} disabled={readOnly} />} label="College tuition (1098-T)" />
            <FormControlLabel control={<Checkbox checked={!!v.hasChildcareExpenses} onChange={setBool('hasChildcareExpenses')} disabled={readOnly} />} label="Childcare expenses" />
          </Box>
        </Grid>

        <Grid item xs={12}>
          <TextField fullWidth multiline rows={3} label="Anything else your preparer should know?" value={v.notes || ''} onChange={set('notes')} disabled={readOnly} />
        </Grid>
      </Grid>
    </Box>
  )
}
