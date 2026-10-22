import dayjs from 'dayjs'

// "Rahul Sharma" → "RS"
export const getInitials = (firstName = '', lastName = '') =>
  `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()

// Full name
export const getFullName = (client) =>
  `${client?.firstName || ''} ${client?.lastName || ''}`.trim()

// Format date: "15 Jun 1990"
export const formatDate = (date) =>
  date ? dayjs(date).format('DD MMM YYYY') : '—'

// Format datetime: "15 Jun 2024, 10:20 AM"
export const formatDateTime = (dt) =>
  dt ? dayjs(dt).format('DD MMM YYYY, hh:mm A') : '—'

// Relative time: "2 hours ago"
export const timeAgo = (dt) => {
  if (!dt) return ''
  const diff = dayjs().diff(dayjs(dt), 'minute')
  if (diff < 1)  return 'Just now'
  if (diff < 60) return `${diff}m ago`
  const hrs = Math.floor(diff / 60)
  if (hrs < 24)  return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

// Document type → readable label
export const docTypeLabel = (type) => ({
  AADHAR:          'Aadhar Card',
  PAN:             'PAN Card',
  DRIVING_LICENSE: 'Driving License',
  ELECTRICITY_BILL:'Electricity Bill',
  W2:              'W-2 Form',
  W2_FORM:         'W-2 Form',
  FORM_1099NEC:    '1099-NEC',
  FORM_1099_MISC:  '1099-MISC',
  SSN_CARD:        'SSN Card',
  US_PASSPORT:     'US Passport',
})[type] || type

// Action → readable label
export const actionLabel = (action) => ({
  CLIENT_ADDED:        'Client Added',
  CLIENT_UPDATED:      'Client Updated',
  CLIENT_DELETED:      'Client Deleted',
  CLIENT_IMPORTED:     'Client Imported',
  DOCUMENT_UPLOADED:   'Document Uploaded',
  DOCUMENT_REPLACED:   'Document Replaced',
  DOCUMENT_DELETED:    'Document Deleted',
  FAMILY_MEMBER_ADDED: 'Family Member Added',
  FAMILY_MEMBER_UPDATED:'Family Member Updated',
  FAMILY_MEMBER_REMOVED:'Family Member Removed',
})[action] || action

// Action → color
export const actionColor = (action) => {
  if (action?.includes('DELETED') || action?.includes('REMOVED')) return '#EF4444'
  if (action?.includes('UPDATED') || action?.includes('REPLACED')) return '#F59E0B'
  return '#10B981'
}

// File size formatter
export const formatFileSize = (bytes) => {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// Avatar color from name (consistent hashing)
export const avatarColor = (name = '') => {
  const colors = ['#4F46E5','#7C3AED','#DB2777','#059669','#D97706','#0284C7','#DC2626','#16A34A']
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}
