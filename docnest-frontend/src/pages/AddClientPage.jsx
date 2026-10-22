import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import Stepper from '@mui/material/Stepper'
import Step from '@mui/material/Step'
import StepLabel from '@mui/material/StepLabel'
import Grid from '@mui/material/Grid'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import InputAdornment from '@mui/material/InputAdornment'
import { MdCheckCircle, MdError } from 'react-icons/md'
import { toast } from 'react-toastify'
import { clientService } from '../services/clientService'
import { locationService } from '../services/locationService'
import { settingsService } from '../services/settingsService'
import { validateClientForm, isValidMobile, isValidEmail, isDobValid, isClientAgeValid, numbersOnly } from '../utils/validators'
import { formatDate } from '../utils/formatters'

const STEPS = ['Personal Information', 'Review & Save']
const GENDERS = ['Male', 'Female', 'Other']

const ValidationIcon = ({ valid }) => valid
  ? <MdCheckCircle size={18} color="var(--success)" style={{ transition: 'all 0.2s' }} />
  : <MdError size={18} color="var(--danger)" style={{ transition: 'all 0.2s' }} />

export default function AddClientPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({})
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [locations, setLocations] = useState([])
  const [saving, setSaving] = useState(false)
  const [fieldConfig, setFieldConfig] = useState([])

  useEffect(() => {
    locationService.getAll().then(r => setLocations(r.data)).catch(() => {})
    settingsService.getFormFields().then(r => {
      setFieldConfig(r.data.filter(f => f.isVisible))
    }).catch(() => {
      setFieldConfig([
        { fieldName: 'firstName', label: 'First Name', fieldType: 'TEXT', isRequired: true },
        { fieldName: 'lastName', label: 'Last Name', fieldType: 'TEXT', isRequired: true },
        { fieldName: 'mobile', label: 'Mobile Number', fieldType: 'TEXT', isRequired: true },
        { fieldName: 'dob', label: 'Date of Birth', fieldType: 'DATE', isRequired: false },
        { fieldName: 'gender', label: 'Gender', fieldType: 'SELECT', isRequired: false },
        { fieldName: 'locationId', label: 'Primary Location', fieldType: 'SELECT', isRequired: true },
        { fieldName: 'email', label: 'Email Address', fieldType: 'TEXT', isRequired: false },
        { fieldName: 'address', label: 'Full Address', fieldType: 'TEXTAREA', isRequired: false },
      ])
    })
  }, [])

  const set = (field) => (e) => {
    let val = e.target.value
    setForm(f => ({ ...f, [field]: val }))
    setTouched(t => ({ ...t, [field]: true }))
    // Live clear error on change
    setErrors(errs => ({ ...errs, [field]: undefined }))
  }

  const onBlur = (field) => () => {
    setTouched(t => ({ ...t, [field]: true }))
    // Live validate on blur
    const val = form[field]
    const fc = fieldConfig.find(f => f.fieldName === field)
    let err
    if (fc?.isRequired && (!val || !String(val).trim())) err = `${fc.label} is required`
    else if (field === 'mobile' && val && !isValidMobile(val)) err = 'Enter a valid 10-digit US phone number'
    else if (field === 'email' && val && !isValidEmail(val)) err = 'Enter a valid email address'
    else if (field === 'dob' && val) {
      const dCheck = isDobValid(val)
      if (!dCheck.valid) err = dCheck.message
      else { const aCheck = isClientAgeValid(val); if (!aCheck.valid) err = aCheck.message }
    }
    if (err) setErrors(errs => ({ ...errs, [field]: err }))
  }

  const isFieldValid = (field) => {
    const val = form[field]
    if (!val || !String(val).trim()) return null // not typed yet
    if (field === 'mobile') return isValidMobile(val)
    if (field === 'email') return isValidEmail(val)
    if (field === 'dob') return isDobValid(val).valid && isClientAgeValid(val).valid
    if (field === 'firstName' || field === 'lastName') return String(val).trim().length >= 2
    return !!String(val).trim()
  }

  const validate = () => {
    const errs = validateClientForm(form, fieldConfig)
    setErrors(errs)
    // Mark all as touched
    const t = {}; fieldConfig.forEach(fc => { t[fc.fieldName] = true }); setTouched(t)
    return Object.keys(errs).length === 0
  }

  const handleNext = () => { if (validate()) setStep(1) }

  const handleSave = async () => {
    try {
      setSaving(true)
      const payload = { ...form, locationId: form.locationId ? Number(form.locationId) : null, dob: form.dob || null }
      const res = await clientService.create(payload)
      toast.success('Client profile created successfully! Redirecting to Document Center...')
      navigate(`/clients/${res.data.id}/documents`)
    } catch (err) {
      // Handle backend validation errors
      const data = err.response?.data
      if (data?.fieldErrors) {
        const errs = {}
        data.fieldErrors.forEach(fe => { errs[fe.field] = fe.message })
        setErrors(errs)
        setStep(0)
        toast.error('Please fix the validation errors')
      } else {
        toast.error(data?.error || 'Unable to save client.')
      }
    } finally { setSaving(false) }
  }

  const getAdornment = (field) => {
    const v = isFieldValid(field)
    if (v === null || !touched[field]) return {}
    return { endAdornment: <InputAdornment position="end"><ValidationIcon valid={v} /></InputAdornment> }
  }

  const renderField = (fc) => {
    const { fieldName, label, fieldType, isRequired } = fc
    const lbl = isRequired ? `${label} *` : label
    const half = !['address'].includes(fieldName)

    let input
    if (fieldName === 'gender') {
      input = <TextField select fullWidth label={lbl} value={form.gender || ''} onChange={set('gender')} onBlur={onBlur('gender')} error={touched.gender && !!errors.gender} helperText={touched.gender && errors.gender} InputProps={getAdornment('gender')}>{GENDERS.map(g => <MenuItem key={g} value={g}>{g}</MenuItem>)}</TextField>
    } else if (fieldName === 'locationId') {
      input = <TextField select fullWidth label={lbl} value={form.locationId || ''} onChange={set('locationId')} onBlur={onBlur('locationId')} error={touched.locationId && !!errors.locationId} helperText={touched.locationId && errors.locationId}>{locations.map(l => <MenuItem key={l.id} value={l.id}>{l.locationName}</MenuItem>)}</TextField>
    } else if (fieldType === 'DATE') {
      input = <TextField fullWidth label={lbl} type="date" value={form[fieldName] || ''} onChange={set(fieldName)} onBlur={onBlur(fieldName)} InputLabelProps={{ shrink: true }} error={touched[fieldName] && !!errors[fieldName]} helperText={touched[fieldName] && errors[fieldName]} InputProps={getAdornment(fieldName)} />
    } else if (fieldType === 'TEXTAREA') {
      input = <TextField fullWidth label={lbl} multiline rows={3} value={form[fieldName] || ''} onChange={set(fieldName)} onBlur={onBlur(fieldName)} error={touched[fieldName] && !!errors[fieldName]} helperText={touched[fieldName] && errors[fieldName]} />
    } else if (fieldName === 'mobile') {
      input = <TextField fullWidth label={lbl} value={form.mobile || ''} onChange={(e) => { numbersOnly(e); set('mobile')(e) }} onBlur={onBlur('mobile')} error={touched.mobile && !!errors.mobile} helperText={touched.mobile ? (errors.mobile || (form.mobile && isValidMobile(form.mobile) ? '✓ Valid US phone' : '')) : ''} inputProps={{ maxLength: 10, inputMode: 'numeric' }} InputProps={getAdornment('mobile')}
        FormHelperTextProps={{ sx: { color: !errors.mobile && form.mobile && isValidMobile(form.mobile) ? 'var(--success)' : undefined } }} />
    } else {
      input = <TextField fullWidth label={lbl} value={form[fieldName] || ''} onChange={set(fieldName)} onBlur={onBlur(fieldName)} error={touched[fieldName] && !!errors[fieldName]} helperText={touched[fieldName] && errors[fieldName]} type={fieldName === 'email' ? 'email' : 'text'} InputProps={getAdornment(fieldName)} />
    }
    return <Grid item xs={12} sm={half ? 6 : 12} key={fieldName}>{input}</Grid>
  }

  const loc = locations.find(l => l.id === Number(form.locationId))

  const reviewFields = fieldConfig.map(fc => {
    let val = form[fc.fieldName]
    if (fc.fieldName === 'locationId') val = loc?.locationName
    if (fc.fieldName === 'dob' && val) val = formatDate(val)
    return { label: fc.label, value: val || 'N/A' }
  })

  return (
    <Box className="page-enter" sx={{ maxWidth: 900, mx: 'auto' }}>
      <Box sx={{ mb: 5 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 0.5 }}>Add New Client</Typography>
        <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>Create a professional profile for your new client.</Typography>
      </Box>
      <Stepper activeStep={step} sx={{ mb: 5, '& .MuiStepLabel-label': { fontFamily: 'var(--font-body)', fontSize: '0.875rem' } }}>
        {STEPS.map(label => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
      </Stepper>

      {step === 0 && (
        <Card sx={{ p: 4, mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ width: 4, height: 20, background: 'var(--primary)', borderRadius: 2 }} /> Client Details
          </Typography>
          <Grid container spacing={3}>
            {fieldConfig.map(renderField)}
          </Grid>
        </Card>
      )}

      {step === 1 && (
        <Card sx={{ p: 4, mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ width: 4, height: 20, background: 'var(--success)', borderRadius: 2 }} /> Final Review
          </Typography>
          <Grid container spacing={2}>
            {reviewFields.map((f, i) => (
              <Grid item xs={12} sm={f.label === 'Full Address' ? 12 : 6} key={i}>
                <Box sx={{ p: 2, background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                  <Typography variant="caption" sx={{ color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.6rem', letterSpacing: '0.05em' }}>{f.label}</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>{f.value}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Card>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button variant="outlined" onClick={() => step === 0 ? navigate('/clients') : setStep(0)} disabled={saving}>
          {step === 0 ? 'Cancel' : 'Back'}
        </Button>
        <Button variant="contained" onClick={step === 0 ? handleNext : handleSave} disabled={saving} sx={{ minWidth: 160 }}>
          {saving ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : (step === 0 ? 'Review Profile' : 'Confirm & Create')}
        </Button>
      </Box>
    </Box>
  )
}
