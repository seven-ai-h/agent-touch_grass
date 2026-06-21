import { useState } from 'react'

export default function Login({ onSuccess }) {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleLogin() {
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (!res.ok) {
        setError('Invalid email or password.')
        return
      }
      const data = await res.json()
      localStorage.setItem('user_id', data.user_id)
      localStorage.setItem('user_email', data.email)
      onSuccess(data.user_id, data.email)
    } catch {
      setError('Could not reach server. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleLogin()
  }

  return (
    <div style={{
      minHeight: 'calc(100vh - 47px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
      position: 'relative',
      overflow: 'hidden',
      padding: '40px 20px',
    }}>
      {/* Background blobs */}
      <div style={{
        position: 'absolute', top: '-80px', right: '-60px',
        width: '280px', height: '280px',
        borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%',
        background: 'var(--green)', opacity: 0.10, pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-80px', left: '-60px',
        width: '240px', height: '240px',
        borderRadius: '40% 60% 70% 30% / 40% 50% 60% 50%',
        background: 'var(--green)', opacity: 0.12, pointerEvents: 'none',
      }} />

      {/* Card */}
      <div style={{
        display: 'flex', maxWidth: '900px', width: '100%',
        background: 'var(--card)', borderRadius: '24px',
        boxShadow: '0 8px 48px rgba(0,0,0,.08)',
        overflow: 'hidden', position: 'relative', zIndex: 1,
        minHeight: '520px',
      }}>

        {/* ── Left column ── */}
        <div style={{
          flex: 1, background: 'var(--green-light)',
          display: 'flex', flexDirection: 'column',
          padding: '48px 40px', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '28px', color: 'var(--green)' }}>
            touch grass
          </div>
          <div style={{ fontSize: '13px', color: 'var(--green-dark)', opacity: 0.70, marginTop: '6px' }}>
            your phone knows you. so does this.
          </div>

          <div style={{ flex: 1, position: 'relative', marginTop: '32px' }}>
            {/* Sun */}
            <div style={{
              position: 'absolute', top: '16px', right: '24px',
              width: '40px', height: '40px', borderRadius: '50%', background: 'var(--amber)',
            }} />

            {/* Cloud */}
            <div style={{ position: 'absolute', top: '26px', left: '24px', width: '62px', height: '20px', background: '#fff', borderRadius: '20px' }}>
              <div style={{ position: 'absolute', top: '-11px', left: '8px', width: '26px', height: '26px', background: '#fff', borderRadius: '50%' }} />
              <div style={{ position: 'absolute', top: '-7px', left: '28px', width: '20px', height: '20px', background: '#fff', borderRadius: '50%' }} />
            </div>

            {/* Floating phone */}
            <div style={{
              position: 'absolute', bottom: '72px', right: '24px',
              width: '52px', height: '80px',
              background: 'var(--card)', borderRadius: '10px',
              boxShadow: '0 4px 16px rgba(0,0,0,.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{
                width: '40px', height: '62px',
                background: 'var(--text)', borderRadius: '6px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: '20px', fontWeight: 700,
              }}>✕</div>
            </div>

            {/* Floating dots */}
            <div className="float-dot"   style={{ position: 'absolute', top: '88px',  right: '96px',  width: '10px', height: '10px', borderRadius: '50%', background: 'var(--green-mid)' }} />
            <div className="float-dot-2" style={{ position: 'absolute', top: '130px', left: '72px',   width: '8px',  height: '8px',  borderRadius: '50%', background: 'var(--amber)' }} />
            <div className="float-dot-3" style={{ position: 'absolute', top: '64px',  left: '140px',  width: '7px',  height: '7px',  borderRadius: '50%', background: 'var(--green-mid)' }} />

            {/* Ground + blades */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
              <div style={{ position: 'relative', height: '80px' }}>
                <div className="blade blade-1" style={{ position: 'absolute', bottom: 0, left: '50px',  width: '6px', height: '60px', borderRadius: '3px 3px 0 0', background: 'var(--green)' }} />
                <div className="blade blade-2" style={{ position: 'absolute', bottom: 0, left: '82px',  width: '6px', height: '44px', borderRadius: '3px 3px 0 0', background: 'var(--green)' }} />
                <div className="blade blade-3" style={{ position: 'absolute', bottom: 0, left: '114px', width: '6px', height: '70px', borderRadius: '3px 3px 0 0', background: 'var(--green)' }} />
                <div className="blade blade-4" style={{ position: 'absolute', bottom: 0, left: '146px', width: '6px', height: '52px', borderRadius: '3px 3px 0 0', background: 'var(--green)' }} />
                <div className="blade blade-5" style={{ position: 'absolute', bottom: 0, left: '178px', width: '6px', height: '65px', borderRadius: '3px 3px 0 0', background: 'var(--green)' }} />
              </div>
              <div style={{ height: '16px', background: 'var(--green)', borderRadius: '12px' }} />
            </div>
          </div>
        </div>

        {/* ── Right column ── */}
        <div style={{
          flex: 1, padding: '48px 44px',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
        }}>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '26px', color: 'var(--green)', marginBottom: '8px' }}>
            get back outside.
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '40px' }}>
            Sign in to see your stats and get coached.
          </p>

          {/* Email */}
          <div style={{ position: 'relative', marginBottom: '28px' }}>
            <i className="ti ti-mail" style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', fontSize: '16px', lineHeight: 1 }} />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
              style={{ width: '100%', padding: '10px 0 10px 28px', border: 'none', borderBottom: '1.5px solid var(--border)', background: 'transparent', fontSize: '14px', outline: 'none', color: 'var(--text)', boxSizing: 'border-box' }}
              onFocus={e => { e.target.style.borderBottomColor = 'var(--green)' }}
              onBlur={e  => { e.target.style.borderBottomColor = 'var(--border)' }}
            />
          </div>

          {/* Password */}
          <div style={{ position: 'relative', marginBottom: error ? '16px' : '40px' }}>
            <i className="ti ti-lock" style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', fontSize: '16px', lineHeight: 1 }} />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              style={{ width: '100%', padding: '10px 0 10px 28px', border: 'none', borderBottom: '1.5px solid var(--border)', background: 'transparent', fontSize: '14px', outline: 'none', color: 'var(--text)', boxSizing: 'border-box' }}
              onFocus={e => { e.target.style.borderBottomColor = 'var(--green)' }}
              onBlur={e  => { e.target.style.borderBottomColor = 'var(--border)' }}
            />
          </div>

          {/* Error */}
          {error && (
            <p style={{ fontSize: '13px', color: 'var(--red)', marginBottom: '24px' }}>{error}</p>
          )}

          {/* Hint */}
          <p style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '16px', opacity: 0.7 }}>
            Try: jamie@berkeley.edu / touchgrass123
          </p>

          {/* CTA */}
          <button
            onClick={handleLogin}
            disabled={loading}
            style={{
              width: '100%', padding: '14px',
              background: loading ? 'var(--muted)' : 'var(--green)', color: '#fff',
              fontWeight: 600, fontSize: '15px',
              borderRadius: '50px', border: 'none', cursor: loading ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = 'var(--green-dark)' }}
            onMouseLeave={e => { if (!loading) e.currentTarget.style.background = 'var(--green)' }}
          >
            {loading ? 'Signing in…' : <> Sign in <i className="ti ti-arrow-right" /> </>}
          </button>
        </div>
      </div>
    </div>
  )
}
