import dayjs from 'dayjs'

// ── Indian Mobile: starts with 6-9, exactly 10 digits ──
export const isValidMobile = (m) => /^[6-9]\d{9}$/.test(m)

// ── PAN: 5 uppercase letters + 4 digits + 1 uppercase letter ──
export const isValidPAN = (pan) => /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan?.toUpperCase())

// ── Aadhaar: exactly 12 digits ──
export const isValidAadhaar = (a) => /^\d{12}$/.test(a)

// ── Driving License: 2 letter state + 2 digit RTO + 4 digit year + 7 digits ──
export const isValidDL = (dl) => /^[A-Z]{2}\d{2}\d{4}\d{7}$/.test(dl?.toUpperCase()?.replace(/[\s-]/g, ''))

// ── Email ──
export const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email?.trim())

// ── Required field ──
export const isRequired = (val) => val !== undefined && val !== null && String(val).trim() !== ''

// ── DOB: not future, age 18-100 for clients ──
export const isDobValid = (dob) => {
  if (!dob) return { valid: true }
  const d = dayjs(dob)
  if (!d.isValid()) return { valid: false, message: 'Invalid date' }
  if (d.isAfter(dayjs())) return { valid: false, message: 'Future dates are not allowed' }
  return { valid: true }
}

export const isClientAgeValid = (dob) => {
  if (!dob) return { valid: true }
  const age = dayjs().diff(dayjs(dob), 'year')
  if (age < 18) return { valid: false, message: 'Client must be at least 18 years old' }
  if (age > 100) return { valid: false, message: 'Please enter a realistic date of birth' }
  return { valid: true }
}

export const isFamilyDobValid = (memberDob, relation, clientDob) => {
  if (!memberDob) return { valid: true }
  const memberAge = dayjs().diff(dayjs(memberDob), 'year')
  const clientAge = clientDob ? dayjs().diff(dayjs(clientDob), 'year') : null

  const d = dayjs(memberDob)
  if (d.isAfter(dayjs())) return { valid: false, message: 'Future dates are not allowed' }

  if (clientAge !== null) {
    if (relation === 'Child' && memberAge >= clientAge) return { valid: false, message: 'Child cannot be older than the client' }
    if (relation === 'Parent' && memberAge <= clientAge) return { valid: false, message: 'Parent must be older than the client' }
    if (relation === 'Grandparent' && memberAge <= clientAge + 15) return { valid: false, message: 'Grandparent age is unrealistic' }
  }
  return { valid: true }
}

// ── File validation ──
export const ALLOWED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png']
export const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png']
export const MAX_FILE_SIZE_MB = 4 // Vercel functions cap request bodies at 4.5 MB

export const isAllowedFileType = (file) => ALLOWED_FILE_TYPES.includes(file.type)
export const isFileSizeOk = (file) => file.size <= MAX_FILE_SIZE_MB * 1024 * 1024

export const validateFile = (file) => {
  if (!isAllowedFileType(file)) return { valid: false, message: `Unsupported file type. Allowed: PDF, JPG, PNG` }
  if (!isFileSizeOk(file)) return { valid: false, message: `File exceeds ${MAX_FILE_SIZE_MB}MB limit` }
  return { valid: true }
}

// ── Numbers-only input filter ──
export const numbersOnly = (e) => { e.target.value = e.target.value.replace(/\D/g, '') }

// ── Format helpers ──
export const formatAadhaar = (v) => v?.replace(/\D/g, '').slice(0, 12).replace(/(\d{4})(?=\d)/g, '$1 ')
export const formatPAN = (v) => v?.toUpperCase().slice(0, 10)

// ── Validate complete client form ──
export const validateClientForm = (form, fieldConfig) => {
  const errs = {}
  for (const fc of fieldConfig) {
    const val = form[fc.fieldName]
    if (fc.isRequired && (!val || !String(val).trim())) errs[fc.fieldName] = `${fc.label} is required`
  }
  // Mobile
  if (form.mobile && !isValidMobile(form.mobile)) errs.mobile = 'Enter a valid Indian mobile number (starts with 6-9)'
  // Email
  if (form.email && !isValidEmail(form.email)) errs.email = 'Enter a valid email address'
  // DOB
  if (form.dob) {
    const dobCheck = isDobValid(form.dob)
    if (!dobCheck.valid) errs.dob = dobCheck.message
    else {
      const ageCheck = isClientAgeValid(form.dob)
      if (!ageCheck.valid) errs.dob = ageCheck.message
    }
  }
  return errs
}
