import { Routes, Route } from 'react-router-dom'
import DashboardPage      from '../pages/DashboardPage'
import ClientListPage     from '../pages/ClientListPage'
import AddClientPage      from '../pages/AddClientPage'
import ClientDetailPage   from '../pages/ClientDetailPage'
import DocumentCenterPage from '../pages/DocumentCenterPage'
import FamilyTreePage     from '../pages/FamilyTreePage'
import ImportPage         from '../pages/ImportPage'
import ActivityPage       from '../pages/ActivityPage'
import SettingsPage       from '../pages/SettingsPage'
import ClientPortalPage   from '../pages/ClientPortalPage'
import NotFoundPage       from '../pages/NotFoundPage'
import RoleGuard          from '../components/RoleGuard'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/dashboard"                 element={<DashboardPage />} />
      <Route path="/clients"                   element={<ClientListPage />} />
      <Route path="/clients/add"               element={<RoleGuard capability="createClient"><AddClientPage /></RoleGuard>} />
      <Route path="/clients/:id"               element={<ClientDetailPage />} />
      <Route path="/clients/:id/documents"      element={<DocumentCenterPage />} />
      <Route path="/family/:clientId"          element={<RoleGuard capability="viewFamily"><FamilyTreePage /></RoleGuard>} />
      <Route path="/import"                    element={<RoleGuard capability="importExcel"><ImportPage /></RoleGuard>} />
      <Route path="/activity"                  element={<RoleGuard capability="viewAllActivity"><ActivityPage /></RoleGuard>} />
      <Route path="/settings"                  element={<RoleGuard capability="manageSettings"><SettingsPage /></RoleGuard>} />
      <Route path="/portal"                    element={<ClientPortalPage />} />
      <Route path="*"                          element={<NotFoundPage />} />
    </Routes>
  )
}
