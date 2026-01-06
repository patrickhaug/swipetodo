import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { TodosProvider } from '@/contexts/TodosContext'
import { Login } from '@/pages/Login'
import { Verify } from '@/pages/Verify'
import { Setup } from '@/pages/Setup'
import { Join } from '@/pages/Join'
import { Pool } from '@/pages/Pool'
import { Mine } from '@/pages/Mine'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Laden...</div>
  }
  if (!user) return <Navigate to="/login" />
  if (!user.household) return <Navigate to="/setup" />

  return <>{children}</>
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/join/:code" element={<Join />} />
          <Route path="/setup" element={
            <ProtectedRoute>
              <Setup />
            </ProtectedRoute>
          } />
          <Route path="/" element={
            <ProtectedRoute>
              <TodosProvider>
                <Pool />
              </TodosProvider>
            </ProtectedRoute>
          } />
          <Route path="/mine" element={
            <ProtectedRoute>
              <TodosProvider>
                <Mine />
              </TodosProvider>
            </ProtectedRoute>
          } />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
