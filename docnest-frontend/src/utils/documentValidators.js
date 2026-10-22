// ── Document Type Definitions ──────────────────────────────

export const DOCUMENT_TYPES = {
  AADHAR: 'AADHAR',
  PAN: 'PAN',
  DRIVING_LICENSE: 'DRIVING_LICENSE',
  ELECTRICITY_BILL: 'ELECTRICITY_BILL',
  // US Tax Documents
  W2: 'W2',
  W2_FORM: 'W2',
  FORM_1099NEC: 'FORM_1099NEC',
  FORM_1099_MISC: 'FORM_1099_MISC',
  SSN_CARD: 'SSN_CARD',
  US_PASSPORT: 'US_PASSPORT',
}

export const DOCUMENT_CONFIG = {
  [DOCUMENT_TYPES.AADHAR]: {
    label: 'Aadhaar Card',
    icon: '🪪',
    description: 'Government issued 12-digit Aadhaar Card',
  },
  [DOCUMENT_TYPES.PAN]: {
    label: 'PAN Card',
    icon: '💳',
    description: 'Permanent Account Number Card',
  },
  [DOCUMENT_TYPES.DRIVING_LICENSE]: {
    label: 'Driving License',
    icon: '🚗',
    description: 'Valid Driving License issued by RTO',
  },
  [DOCUMENT_TYPES.ELECTRICITY_BILL]: {
    label: 'Electricity Bill',
    icon: '⚡',
    description: 'Recent Electricity / Utility Bill',
  },
  [DOCUMENT_TYPES.W2]: {
    label: 'W-2 Form',
    icon: '📋',
    description: 'Wage and Tax Statement (US)',
  },
  [DOCUMENT_TYPES.FORM_1099NEC]: {
    label: '1099-NEC',
    icon: '📄',
    description: 'Nonemployee Compensation (US)',
  },
  [DOCUMENT_TYPES.FORM_1099_MISC]: {
    label: '1099-MISC',
    icon: '📄',
    description: 'Miscellaneous Income (US)',
  },
  [DOCUMENT_TYPES.SSN_CARD]: {
    label: 'SSN Card',
    icon: '🔢',
    description: 'Social Security Card (US)',
  },
  [DOCUMENT_TYPES.US_PASSPORT]: {
    label: 'US Passport',
    icon: '🛂',
    description: 'United States Passport (US)',
  },
}

// ── Aadhaar Validator ──────────────────────────────────────
const AADHAAR_PATTERNS = [
  /\b\d{4}\s\d{4}\s\d{4}\b/,
  /\b\d{12}\b/,
  /\b\d{4}-\d{4}-\d{4}\b/,
]

const AADHAAR_KEYWORDS = [
  'aadhaar', 'aadhar', 'uidai', 'unique identification',
  'government of india', 'भारत सरकार', 'आधार', 'enrolment',
  'dob', 'date of birth', 'male', 'female',
]

export function validateAadhaar(text) {
  const lower = text.toLowerCase().replace(/\s+/g, ' ')
  const hasPattern = AADHAAR_PATTERNS.some(p => p.test(text))
  const hasKeyword = AADHAAR_KEYWORDS.some(k => lower.includes(k))

  if (!hasPattern) return {
    valid: false, confidence: 0,
    reason: 'No valid 12-digit Aadhaar number pattern found in document.',
    suggestions: ['Ensure the Aadhaar number is clearly visible and not obscured.', 'Try uploading a higher resolution image.', 'Make sure the document is not cropped.'],
  }
  if (!hasKeyword) return {
    valid: false, confidence: 30,
    reason: 'Document contains a 12-digit number but no Aadhaar-related keywords were detected.',
    suggestions: ['Ensure you are uploading an actual Aadhaar card.', 'The UIDAI header or "Aadhaar" text must be visible.'],
  }
  return { valid: true, confidence: 95, reason: 'Aadhaar number pattern and document keywords verified successfully.', suggestions: [] }
}

// ── PAN Validator ──────────────────────────────────────────
const PAN_PATTERN = /\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b/

const PAN_KEYWORDS = [
  'permanent account number', 'pan', 'income tax', 'income tax department',
  'govt. of india', 'government of india', 'आयकर विभाग',
]

export function validatePAN(text) {
  const upper = text.toUpperCase()
  const lower = text.toLowerCase()
  const match = upper.match(PAN_PATTERN)
  const hasKeyword = PAN_KEYWORDS.some(k => lower.includes(k.toLowerCase()))

  if (!match) return {
    valid: false, confidence: 0,
    reason: 'No valid PAN number (format: ABCDE1234F) found in the document.',
    suggestions: ['PAN number must be clearly visible on the card.', 'Ensure the image is not blurry or overexposed.', 'PAN format is 5 letters + 4 digits + 1 letter (e.g., ABCDE1234F).'],
  }
  if (!hasKeyword) return {
    valid: false, confidence: 40,
    reason: `Found a PAN-format number (${match[0]}) but no Income Tax Department keywords detected.`,
    suggestions: ['Ensure you are uploading the actual PAN card.', '"Income Tax Department" or "Permanent Account Number" text must be visible.'],
  }
  return { valid: true, confidence: 97, extractedValue: match[0], reason: `PAN number ${match[0]} verified successfully.`, suggestions: [] }
}

// ── Driving License Validator ──────────────────────────────
const DL_PATTERNS = [
  /\b[A-Z]{2}[0-9]{2}\s?[0-9]{4}[0-9]{7}\b/,
  /\b[A-Z]{2}-[0-9]{2}-[0-9]{4}-[0-9]{7}\b/,
  /\b[A-Z]{2}[0-9]{13}\b/,
  /driving\s*licen[sc]e\s*no[.:]*\s*([A-Z0-9-]+)/i,
  /dl\s*no[.:]*\s*([A-Z0-9-]+)/i,
  /licence\s*no[.:]*\s*([A-Z0-9-]+)/i,
]

const DL_KEYWORDS = [
  'driving licence', 'driving license', 'dl no', 'licence no',
  'transport department', 'rto', 'motor vehicles',
  'valid upto', 'valid till', 'valid through', 'date of issue',
  'cov', 'class of vehicle', 'lmv', 'mcwg',
]

export function validateDrivingLicense(text) {
  const lower = text.toLowerCase()
  const upper = text.toUpperCase()
  const hasPattern = DL_PATTERNS.some(p => p.test(upper))
  const keywordsFound = DL_KEYWORDS.filter(k => lower.includes(k))
  const hasKeyword = keywordsFound.length >= 2

  if (!hasPattern && !hasKeyword) return {
    valid: false, confidence: 0,
    reason: 'No Driving License number pattern or relevant keywords found.',
    suggestions: ['Upload the full front side of your Driving License.', 'Ensure DL number, validity date, and RTO details are visible.', 'Try a higher resolution scan.'],
  }
  if (hasKeyword && !hasPattern) return {
    valid: true, confidence: 70,
    reason: 'Driving License keywords detected. Number pattern partially matched.',
    suggestions: ['For best results, ensure the DL number is clearly readable.'],
  }
  if (hasPattern && !hasKeyword) return {
    valid: false, confidence: 35,
    reason: 'A license-format number was found but no Driving License keywords detected.',
    suggestions: ['Ensure "Driving Licence", validity, and RTO text are visible.'],
  }
  return { valid: true, confidence: 93, reason: 'Driving License number and keywords verified successfully.', suggestions: [] }
}

// ── Electricity Bill Validator ─────────────────────────────
const ELEC_REQUIRED = [
  'electricity', 'electric', 'power', 'energy',
  'consumer no', 'consumer number', 'account no', 'account number',
  'mseb', 'msedcl', 'bescom', 'tneb', 'tata power', 'adani electricity',
  'torrent power', 'bses', 'wbsedcl', 'discoms', 'discom',
]

const ELEC_BILLING = [
  'bill', 'invoice', 'units consumed', 'kwh', 'meter reading',
  'due date', 'amount due', 'total amount', 'bill period',
  'billing period', 'bill date', 'bill no', 'bill number',
  'previous reading', 'current reading', 'tariff',
]

const CONSUMER_PATTERN = /(?:consumer\s*(?:no|number|#|id)[.:]*\s*)([A-Z0-9-]{6,15})/i

export function validateElectricityBill(text) {
  const lower = text.toLowerCase()
  const reqMatched = ELEC_REQUIRED.filter(k => lower.includes(k.toLowerCase()))
  const billMatched = ELEC_BILLING.filter(k => lower.includes(k.toLowerCase()))
  const hasConsumer = CONSUMER_PATTERN.test(text)

  if (reqMatched.length < 1) return {
    valid: false, confidence: 0,
    reason: 'No electricity provider or utility keywords detected.',
    suggestions: ['Upload an electricity bill from a recognized provider (MSEDCL, BESCOM, TATA Power, etc.).', 'Ensure the provider name and "Consumer No" are clearly visible.'],
  }
  if (billMatched.length < 2) return {
    valid: false, confidence: 40,
    reason: 'Electricity provider detected but billing information (units, amount, period) is missing.',
    suggestions: ['Upload the complete bill, not just a partial page.', 'Ensure billing period, amount due, and meter readings are visible.'],
  }
  return {
    valid: true,
    confidence: hasConsumer ? 96 : 82,
    reason: `Electricity bill verified. Provider keywords (${reqMatched.slice(0, 2).join(', ')}) and billing details confirmed.`,
    suggestions: hasConsumer ? [] : ['Consumer number was not clearly extracted but bill appears valid.'],
  }
}

// ── US W-2 Validator ─────────────────────────────────────────
const W2_KEYWORDS = [
  'form w-2', 'wage and tax statement', 'box 1', 'box 2',
  'federal withholding', 'social security', 'medicare',
  'taxpayer identification', 'employer identification',
  'earnings', 'wages', 'federal income tax withheld',
]

const W2_SSN_PATTERN = /\b\d{3}-\d{2}-\d{4}\b/
const W2_TIN_PATTERN = /\b\d{2}-\d{7}\b/

export function validateW2(text) {
  const lower = text.toLowerCase()
  const keywordHits = W2_KEYWORDS.filter(k => lower.includes(k))
  const hasSSN = W2_SSN_PATTERN.test(text)
  const hasTIN = W2_TIN_PATTERN.test(text)

  if (keywordHits.length < 2 && !hasSSN) {
    return {
      valid: false, confidence: 0,
      reason: 'W-2 specific keywords (e.g. "Wage and Tax Statement", "Box 1", "Social Security") not detected.',
      suggestions: ['Upload the complete Form W-2, not just a partial printout.', 'Ensure all boxes including wages and SSN are visible.'],
    }
  }
  if (keywordHits.length >= 3 && hasSSN) {
    return {
      valid: true, confidence: 96,
      extractedValue: text.match(W2_SSN_PATTERN)?.[0] || null,
      reason: `W-2 verified. ${keywordHits.length} W-2 keywords and SSN pattern detected.`,
      suggestions: [],
    }
  }
  if (keywordHits.length >= 2 || hasTIN) {
    return {
      valid: true, confidence: 78,
      reason: 'W-2 keywords detected. Some details may not be fully readable.',
      suggestions: ['For best extraction, ensure the "Box 1 — Wages" area is sharp.'],
    }
  }
  return {
    valid: true, confidence: 55,
    reason: 'Partial W-2 match. Document appears to be a Form W-2 but details are unclear.',
    suggestions: ['Re-upload with better lighting and resolution if data entry is needed.'],
  }
}

// ── US 1099-NEC Validator ────────────────────────────────────
const NEC_KEYWORDS = [
  '1099-ner', '1099nec', 'nonemployee compensation',
  'box 1', 'form 1099', 'internal revenue service', 'irs',
  'recipient', 'payer', 'tin', 'social security number',
]

export function validate1099NEC(text) {
  const lower = text.toLowerCase().replace(/\s+/g, ' ')
  const hits = NEC_KEYWORDS.filter(k => lower.includes(k))
  const hasAmount = /\b[\d,]{3,}\b/.test(text)

  if (hits.length < 2) {
    return {
      valid: false, confidence: 0,
      reason: '1099-NEC specific keywords not detected.',
      suggestions: ['Upload the actual Form 1099-NEC, not a general 1099.', 'Ensure "Nonemployee Compensation" or "1099-NEC" text is visible.'],
    }
  }
  if (hits.includes('nonemployee compensation') && hasAmount) {
    return {
      valid: true, confidence: 93,
      reason: '1099-NEC verified. Nonemployee compensation field detected with amount.',
      suggestions: [],
    }
  }
  return {
    valid: true, confidence: 75,
    reason: `1099-NEC keywords detected (${hits.slice(0, 2).join(', ')}).`,
    suggestions: ['Verify Box 1 compensation amount is legible.'],
  }
}

// ── US 1099-MISC Validator ────────────────────────────────────
const MISC_KEYWORDS = [
  '1099-misc', '1099misc', 'miscellaneous information',
  'form 1099', 'box 1', 'rents', 'interest',
  'internal revenue service', 'irs',
]

export function validate1099MISC(text) {
  const lower = text.toLowerCase().replace(/\s+/g, ' ')
  const hits = MISC_KEYWORDS.filter(k => lower.includes(k))

  if (hits.length < 2) {
    return {
      valid: false, confidence: 0,
      reason: '1099-MISC specific keywords not detected.',
      suggestions: ['Upload the actual Form 1099-MISC.', 'Ensure "Miscellaneous Information" or "1099-MISC" text is visible.'],
    }
  }
  if (hits.includes('miscellaneous information') || hits.includes('1099-misc')) {
    return {
      valid: true, confidence: 91,
      reason: '1099-MISC verified.',
      suggestions: [],
    }
  }
  return {
    valid: true, confidence: 70,
    reason: `1099-MISC keywords detected (${hits.slice(0, 2).join(', ')}).`,
    suggestions: ['Confirm the correct form type is displayed.'],
  }
}

// ── US SSN Card Validator ─────────────────────────────────────
const SSN_KEYWORDS = [
  'social security', 'social security number', 'ssn',
  'issued', 'birth', 'date of birth',
]
const SSN_PATTERN = /\b(\d{3})[- ]?(\d{2})[- ]?(\d{4})\b/

export function validateSSNCard(text) {
  const lower = text.toLowerCase()
  const hits = SSN_KEYWORDS.filter(k => lower.includes(k))
  const match = text.match(SSN_PATTERN)

  if (!match && hits.length < 2) {
    return {
      valid: false, confidence: 0,
      reason: 'No SSN pattern or "Social Security" keywords detected.',
      suggestions: ['Upload a clear image of the Social Security Card.', 'Ensure the SSN digits and "Social Security" header are visible.'],
    }
  }
  if (match) {
    // Format check: first 3 digits (area) should not be 000/666/9xx
    const area = match[1]
    const group = match[2]
    const serial = match[3]
    const formatOk = !(area === '000' || area === '666' || area.startsWith('9'))
      && group !== '00' && serial !== '0000'
    if (!formatOk) {
      return {
        valid: false, confidence: 30,
        reason: `SSN pattern found but format is invalid (area=${area}, group=${group}). SSNs cannot start with 000/666/9xx, have group 00, or serial 0000.`,
        suggestions: ['Verify the SSN is correctly read by OCR.', 'Check for smudged or partially obscured digits.'],
      }
    }
    return {
      valid: true, confidence: 95,
      extractedValue: `${area}-${group}-${serial}`,
      reason: 'SSN card verified. Valid SSN format detected.',
      suggestions: [],
    }
  }
  if (hits.length >= 2) {
    return {
      valid: true, confidence: 70,
      reason: 'Social Security Card keywords detected but SSN digits were not clearly extracted.',
      suggestions: ['Try a higher resolution scan to capture the full SSN.'],
    }
  }
  return {
    valid: false, confidence: 25,
    reason: 'Only partial keywords detected. Not enough evidence for a valid SSN Card.',
    suggestions: ['Upload the full front side of the Social Security Card.'],
  }
}

// ── US Passport Validator ─────────────────────────────────────
const PASSPORT_KEYWORDS = [
  'passport', 'united states', 'usa', 'united states of america',
  'document number', 'passport number', 'date of birth',
  'place of birth', 'nationality', 'citizen of',
]

export function validateUSPassport(text) {
  const lower = text.toLowerCase().replace(/\s+/g, ' ')
  const hits = PASSPORT_KEYWORDS.filter(k => lower.includes(k))
  const hasDocNo = /document\s*no\.?|passport\s*no\.?/i.test(text)
  const hasNumber = /\b[A-Z]\d{7}\b/.test(text.toUpperCase()) || /\b\d{6}\b/.test(text)

  if (hits.length < 2) {
    return {
      valid: false, confidence: 0,
      reason: 'Passport keywords not detected.',
      suggestions: ['Upload the biographical data page of the passport.', 'Ensure "Passport", "United States", and "Document Number" are visible.'],
    }
  }
  if (hasDocNo && hasNumber) {
    return {
      valid: true, confidence: 92,
      reason: 'US Passport verified. Document number and keywords detected.',
      suggestions: [],
    }
  }
  if (hits.includes('passport') && hits.includes('united states')) {
    return {
      valid: true, confidence: 80,
      reason: 'US Passport keywords confirmed (Passport + United States).',
      suggestions: ['Document number was not clearly extracted — re-upload if needed.'],
    }
  }
  return {
    valid: true, confidence: 65,
    reason: `Passport keywords detected (${hits.slice(0, 2).join(', ')}).`,
    suggestions: ['Verify the document number is legible.'],
  }
}

// ── Master Router ──────────────────────────────────────────
export function validateDocument(docType, text) {
  switch (docType) {
    case DOCUMENT_TYPES.AADHAR:           return validateAadhaar(text)
    case DOCUMENT_TYPES.PAN:              return validatePAN(text)
    case DOCUMENT_TYPES.DRIVING_LICENSE:  return validateDrivingLicense(text)
    case DOCUMENT_TYPES.ELECTRICITY_BILL: return validateElectricityBill(text)
    // US Tax Documents
    case 'W2':                return validateW2(text)
    case 'FORM_1099NEC':      return validate1099NEC(text)
    case 'FORM_1099_MISC':    return validate1099MISC(text)
    case 'SSN_CARD':          return validateSSNCard(text)
    case 'US_PASSPORT':       return validateUSPassport(text)
    default: return { valid: true, confidence: 50, reason: 'Document type not validated via OCR.', suggestions: [] }
  }
}
