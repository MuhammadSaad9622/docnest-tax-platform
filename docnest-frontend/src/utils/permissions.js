// Role-based access control utilities
// All self-registered users are EMPLOYEE. Roles are assigned by ADMIN.

const ROLE_HIERARCHY = {
  EMPLOYEE: 1,
  MANAGER:  2,
  ADMIN:    3,
  // CLIENT is a self-service portal user — can only manage their own documents
  CLIENT:   4,
}

export function roleLevel(role) {
  return ROLE_HIERARCHY[role] || ROLE_HIERARCHY.EMPLOYEE
}

// Returns true if the user's role permits the given capability
export function can(user, capability) {
  const level = roleLevel(user?.role)
  const caps = {
    // Viewing
    viewClients:        1,
    viewFamily:         1,
    viewActivity:       1,  // recent only for EMPLOYEE
    viewDashboard:      1,

    // Creating
    createClient:       1,
    uploadDocument:     1,
    addFamilyMember:    1,

    // Editing
    editClient:         2,
    editFamilyMember:   2,
    replaceDocument:    2,

    // Deleting
    deleteClient:       2,
    deleteDocument:     2,
    deleteFamilyMember: 2,

    // Bulk import
    importExcel:        2,

    // Full activity logs
    viewAllActivity:    2,

    // Settings (form fields, doc types, locations, preferences)
    manageSettings:     3,
    manageLocations:    3,

    // User management
    manageUsers:        3,
  }
  const required = caps[capability] ?? 1
  return level >= required
}
