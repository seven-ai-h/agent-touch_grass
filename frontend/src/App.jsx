import { useState } from 'react'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import InterventionPopup from './components/agent/InterventionPopup'

const TABS = [
  { id: 'login',     label: 'Login' },
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'popup',     label: 'Agent popup' },
]

export default function App() {
  const [active, setActive] = useState('login')

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Tab bar */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: '#fff',
        borderBottom: '1.5px solid var(--border)',
        display: 'flex',
      }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            style={{
              padding: '14px 20px',
              fontSize: '13px',
              fontWeight: 500,
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              color: active === tab.id ? 'var(--green)' : 'var(--muted)',
              borderBottom: active === tab.id ? '2px solid var(--green)' : '2px solid transparent',
              marginBottom: '-1.5px',
              transition: 'color 0.15s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {active === 'login'     && <Login onSuccess={() => setActive('dashboard')} />}
      {active === 'dashboard' && <Dashboard />}
      {active === 'popup'     && <InterventionPopup />}
    </div>
  )
}
