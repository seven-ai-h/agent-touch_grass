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
  const [userId,    setUserId]    = useState(localStorage.getItem('user_id') || null)
  const [userEmail, setUserEmail] = useState(localStorage.getItem('user_email') || null)
  const [active,    setActive]    = useState(localStorage.getItem('user_id') ? 'dashboard' : 'login')

  function handleLogin(id, email) {
    setUserId(id)
    setUserEmail(email)
    setActive('dashboard')
  }

  function handleLogout() {
    localStorage.removeItem('user_id')
    localStorage.removeItem('user_email')
    setUserId(null)
    setUserEmail(null)
    setActive('login')
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Tab bar */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: '#fff', borderBottom: '1.5px solid var(--border)',
        display: 'flex', alignItems: 'center',
      }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            style={{
              padding: '14px 20px', fontSize: '13px', fontWeight: 500,
              border: 'none', background: 'none', cursor: 'pointer',
              color: active === tab.id ? 'var(--green)' : 'var(--muted)',
              borderBottom: active === tab.id ? '2px solid var(--green)' : '2px solid transparent',
              marginBottom: '-1.5px', transition: 'color 0.15s',
            }}
          >
            {tab.label}
          </button>
        ))}

        {/* Logged-in user + logout */}
        {userId && (
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px', paddingRight: '20px' }}>
            <span style={{ fontSize: '13px', color: 'var(--muted)' }}>{userEmail}</span>
            <button
              onClick={handleLogout}
              style={{
                fontSize: '12px', fontWeight: 600, color: 'var(--red)',
                background: 'none', border: '1px solid var(--red)',
                borderRadius: '20px', padding: '4px 12px', cursor: 'pointer',
              }}
            >
              Log out
            </button>
          </div>
        )}
      </div>

      {active === 'login'     && <Login onSuccess={handleLogin} />}
      {active === 'dashboard' && <Dashboard userId={userId} userEmail={userEmail} />}
      {active === 'popup'     && <InterventionPopup userId={userId} />}
    </div>
  )
}
