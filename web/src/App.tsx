import { Navigate, Route, Routes } from 'react-router-dom'
import { useState } from 'react'
import { AppShell } from './components/AppShell'
import type { SessionUser } from './lib/roles'
import { DashboardPage } from './pages/DashboardPage'
import { ExtractionLabPage } from './pages/ExtractionLabPage'
import { LoginPage } from './pages/LoginPage'
import { PartiesPage } from './pages/PartiesPage'
import { RenewalPage } from './pages/RenewalPage'
import { SoHealthPage } from './pages/SoHealthPage'

export default function App() {
  const [user, setUser] = useState<SessionUser | null>(null)

  if (!user) {
    return <LoginPage onLogin={setUser} />
  }

  return (
    <Routes>
      <Route element={<AppShell user={user} onLogout={() => setUser(null)} />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage user={user} />} />
        <Route path="/parties" element={<PartiesPage />} />
        <Route path="/renewal" element={<RenewalPage />} />
        <Route path="/so" element={<SoHealthPage user={user} />} />
        <Route path="/lab/extraction" element={<ExtractionLabPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  )
}
