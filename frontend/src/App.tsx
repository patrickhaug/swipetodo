import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { TodosProvider } from '@/contexts/TodosContext'
import { Login } from '@/pages/Login'
import { Verify } from '@/pages/Verify'
import { Setup } from '@/pages/Setup'
import { Join } from '@/pages/Join'
import { PoolContent } from '@/pages/Pool'
import { MineContent } from '@/pages/Mine'
import { SwipeableLayout } from '@/components/SwipeableLayout'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Laden...</div>
  }
  if (!user) return <Navigate to="/login" />
  if (!user.household) return <Navigate to="/setup" />

  return <>{children}</>
}

function MainApp() {
  return (
    <TodosProvider>
      <SwipeableLayout
        poolContent={<PoolContent />}
        mineContent={<MineContent />}
      />
    </TodosProvider>
  )
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
              <MainApp />
            </ProtectedRoute>
          } />
          <Route path="/mine" element={
            <ProtectedRoute>
              <MainApp />
            </ProtectedRoute>
          } />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
