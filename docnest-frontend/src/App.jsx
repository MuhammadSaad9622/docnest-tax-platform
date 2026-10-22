import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import LandingPage from './pages/Landing/LandingPage'
import LoginPage from './pages/Auth/LoginPage'
import RegisterPage from './pages/Auth/RegisterPage'
import AppLayout from './components/layout/AppLayout'
import AppRoutes from './routes/AppRoutes'
import ErrorBoundary from './components/ui/ErrorBoundary'

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-base)' }}>
      <div style={{ width: 36, height: 36, border: '3px solid #E2E8F0', borderTopColor: '#2563EB', borderRadius: '50%', animation: 'authSpin 0.6s linear infinite' }} />
    </div>
  )
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

function PublicOnlyRoute({ children }) {
  const { isAuthenticated, user, loading } = useAuth()
  if (loading) return null
  if (isAuthenticated) {
    const dest = user?.role === 'CLIENT' ? '/portal' : '/dashboard'
    return <Navigate to={dest} replace />
  }
  return children
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
            <Route path="/register" element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />
            <Route path="/*" element={
              <ProtectedRoute>
                <AppLayout>
                  <AppRoutes />
                </AppLayout>
              </ProtectedRoute>
            } />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  )
}
