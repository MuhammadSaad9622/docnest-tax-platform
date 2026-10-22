import { useState } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Grid from '@mui/material/Grid'
import CircularProgress from '@mui/material/CircularProgress'
import InputAdornment from '@mui/material/InputAdornment'
import { MdCheckCircle, MdError } from 'react-icons/md'
import { toast } from 'react-toastify'
import { familyService } from '../../services/familyService'
import { isValidMobile, isValidEmail, isFamilyDobValid, numbersOnly } from '../../utils/validators'

const RELATIONS = ['Spouse', 'Child', 'Parent', 'Sibling', 'Grandparent', 'Other']
const GENDERS   = ['Male', 'Female', 'Other']
const EMPTY = { memberName: '', relation: '', dob: '', gender: '', mobile: '', email: '' }

export default function FamilyMemberForm({ open, onClose, clientId, member, onSaved, clientDob }) {
  const isEdit = !!member?.id
  const [form, setForm] = useState(member || EMPTY)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})

  const set = (field) => (e) => {
    let val = e.target.value
    setForm(f => ({ ...f, [field]: val }))
    setTouched(t => ({ ...t, [field]: true }))
    setErrors(errs => ({ ...errs, [field]: undefined }))
  }

  const onBlur = (field) => () => {
    setTouched(t => ({ ...t, [field]: true }))
    const val = form[field]
    let err
    if (field === 'memberName' && (!val || !val.trim())) err = 'Name is required'
    if (field === 'relation' && !val) err = 'Relation is required'
    if (field === 'mobile' && val && !isValidMobile(val)) err = 'Enter a valid 10-digit US phone number'
    if (field === 'email' && val && !isValidEmail(val)) err = 'Enter a valid email'
    if (field === 'dob' && val) {
      const check = isFamilyDobValid(val, form.relation, clientDob)
      if (!check.valid) err = check.message
    }
    if (err) setErrors(errs => ({ ...errs, [field]: err }))
  }

  // Re-validate DOB when relation changes
  const setRelation = (e) => {
    const val = e.target.value
    setForm(f => ({ ...f, relation: val }))
    setTouched(t => ({ ...t, relation: true }))
    setErrors(errs => ({ ...errs, relation: undefined }))
    // Re-check dob validity with new relation
    if (form.dob) {
      const check = isFamilyDobValid(form.dob, val, clientDob)
      if (!check.valid) setErrors(errs => ({ ...errs, dob: check.message }))
      else setErrors(errs => ({ ...errs, dob: undefined }))
    }
  }

  const validate = () => {
    const errs = {}
    if (!form.memberName?.trim()) errs.memberName = 'Name is required'
    if (!form.relation) errs.relation = 'Relation is required'
    if (form.mobile && !isValidMobile(form.mobile)) errs.mobile = 'Enter a valid 10-digit US phone number'
    if (form.email && !isValidEmail(form.email)) errs.email = 'Enter a valid email'
    if (form.dob) {
      const check = isFamilyDobValid(form.dob, form.relation, clientDob)
      if (!check.valid) errs.dob = check.message
    }
    setErrors(errs)
    const t = {}; Object.keys(EMPTY).forEach(k => { t[k] = true }); setTouched(t)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      const payload = { ...form, clientId, dob: form.dob || null, mobile: form.mobile || null, email: form.email || null }
      if (isEdit) await familyService.update(member.id, payload)
      else await familyService.add(payload)
      toast.success(isEdit ? 'Member updated' : 'Member added')
      onSaved?.()
      onClose()
    } catch (e) {
      const data = e.response?.data
      if (data?.fieldErrors) {
        const errs = {}
        data.fieldErrors.forEach(fe => { errs[fe.field] = fe.message })
        setErrors(errs)
        toast.error('Please fix validation errors')
      } else {
        toast.error(data?.error || e.message)
      }
    } finally { setLoading(false) }
  }

  const VIcon = ({ field }) => {
    const val = form[field]
    if (!val || !touched[field]) return null
    const valid = field === 'mobile' ? isValidMobile(val)
      : field === 'email' ? isValidEmail(val)
      : field === 'memberName' ? val.trim().length >= 2
      : !!val
    return valid && !errors[field]
      ? <MdCheckCircle size={16} color="var(--success)" />
      : errors[field] ? <MdError size={16} color="var(--danger)" /> : null
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      slotProps={{ backdrop: { sx: { backdropFilter: 'blur(4px)', background: 'rgba(15,23,42,0.5)' } } }}>
      <DialogTitle sx={{ fontWeight: 600, fontFamily: 'var(--font-heading)' }}>
        {isEdit ? 'Edit Family Member' : 'Add Family Member'}
      </DialogTitle>
      <DialogContent sx={{ pt: '16px !important' }}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField fullWidth label="Full Name *" value={form.memberName} onChange={set('memberName')} onBlur={onBlur('memberName')}
              error={touched.memberName && !!errors.memberName} helperText={touched.memberName && errors.memberName}
              InputProps={{ endAdornment: <InputAdornment position="end"><VIcon field="memberName"/></InputAdornment> }} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField select fullWidth label="Relation *" value={form.relation} onChange={setRelation} onBlur={onBlur('relation')}
              error={touched.relation && !!errors.relation} helperText={touched.relation && errors.relation}>
              {RELATIONS.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField select fullWidth label="Gender" value={form.gender} onChange={set('gender')}>
              {GENDERS.map(g => <MenuItem key={g} value={g}>{g}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Date of Birth" type="date" value={form.dob || ''} onChange={set('dob')} onBlur={onBlur('dob')}
              InputLabelProps={{ shrink: true }} error={touched.dob && !!errors.dob} helperText={touched.dob && errors.dob} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Mobile" value={form.mobile || ''} onChange={(e) => { numbersOnly(e); set('mobile')(e) }} onBlur={onBlur('mobile')}
              error={touched.mobile && !!errors.mobile} helperText={touched.mobile ? (errors.mobile || (form.mobile && isValidMobile(form.mobile) ? '✓ Valid US phone' : '')) : ''}
              inputProps={{ maxLength: 10, inputMode: 'numeric' }}
              InputProps={{ endAdornment: <InputAdornment position="end"><VIcon field="mobile"/></InputAdornment> }}
              FormHelperTextProps={{ sx: { color: !errors.mobile && form.mobile && isValidMobile(form.mobile) ? 'var(--success)' : undefined } }} />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth label="Email (Optional)" type="email" value={form.email || ''} onChange={set('email')} onBlur={onBlur('email')}
              error={touched.email && !!errors.email} helperText={touched.email && errors.email}
              InputProps={{ endAdornment: <InputAdornment position="end"><VIcon field="email"/></InputAdornment> }} />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button onClick={onClose} variant="outlined">Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
          {loading ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : (isEdit ? 'Update' : 'Add Member')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
