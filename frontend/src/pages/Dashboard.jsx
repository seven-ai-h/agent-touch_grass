import { useState, useEffect } from 'react'
import SchedulePanel from './SchedulePanel'
import WeeklyReportPanel from './WeeklyReportPanel'
import InterventionsPanel from './InterventionsPanel'

const NAV = [
  { id: 'dashboard', label: 'Dashboard',    icon: 'ti-layout-dashboard' },
  { id: 'intervent', label: 'Interventions', icon: 'ti-shield' },
  { id: 'schedule',  label: 'Schedule',      icon: 'ti-calendar' },
  { id: 'report',    label: 'Weekly report', icon: 'ti-chart-bar' },
  { id: 'settings',  label: 'Settings',      icon: 'ti-settings' },
]

async function fetchJSON(path) {
  const res = await fetch(path)
  if (!res.ok) throw new Error(`${path} → ${res.status}`)
  return res.json()
}

function apiPath(base, userId) {
  return userId ? `${base}?user_id=${userId}` : base
}

function Badge({ text, type }) {
  const map = {
    green: { bg: 'var(--green-light)',    color: 'var(--green)' },
    amber: { bg: 'var(--amber-badge-bg)', color: 'var(--amber-badge-text)' },
    red:   { bg: 'var(--red-badge-bg)',   color: 'var(--red)' },
  }
  const { bg, color } = map[type] ?? map.green
  return (
    <span style={{ display: 'inline-block', borderRadius: '20px', padding: '3px 8px', fontSize: '10px', fontWeight: 600, background: bg, color }}>
      {text}
    </span>
  )
}

function displayName(email) {
  if (!email) return 'User'
  const local = email.split('@')[0]
  return local.charAt(0).toUpperCase() + local.slice(1)
}

function initials(email) {
  if (!email) return '?'
  return email.charAt(0).toUpperCase()
}

export default function Dashboard({ userId, userEmail }) {
  const [activeNav, setActiveNav] = useState('dashboard')
  const [stats, setStats]         = useState(null)
  const [vuln, setVuln]           = useState([])
  const [gap, setGap]             = useState([])
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetchJSON(apiPath('/api/dashboard/stats',         userId)),
      fetchJSON(apiPath('/api/dashboard/vulnerability', userId)),
      fetchJSON(apiPath('/api/dashboard/gap',           userId)),
      fetchJSON(apiPath('/api/dashboard/suggestions',   userId)),
    ]).then(([s, v, g, sg]) => {
      setStats(s)
      setVuln(v)
      setGap(g)
      setSuggestions(sg)
      setLoading(false)
    }).catch(err => {
      console.error('Dashboard fetch failed:', err)
      setLoading(false)
    })
  }, [userId])

  const statCards = stats ? [
    {
      number: `${stats.streak}`,
      label: 'Day streak',
      badge: 'Personal best',
      badgeType: 'green',
    },
    {
      number: `${stats.intervention_rate}%`,
      label: 'Intervention rate',
      badge: '↑ 8% this week',
      badgeType: 'amber',
    },
    {
      number: `${stats.time_saved_today}h`,
      label: 'Saved today',
      badge: 'vs 3.8h avg',
      badgeType: 'green',
    },
    {
      number: `${stats.dopamine_score}`,
      label: 'Dopamine score',
      badge: 'High risk now',
      badgeType: 'red',
    },
  ] : []

  const isHighRisk = stats?.dopamine_score >= 70

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 47px)', background: 'var(--bg)' }}>

      {/* Sidebar */}
      <aside style={{ width: '220px', flexShrink: 0, background: 'var(--card)', borderRight: '1.5px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '28px 12px 20px' }}>
          <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '20px', color: 'var(--green)', whiteSpace: 'nowrap', overflow: 'hidden' }}>touch grass</div>
          <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '3px' }}>go outside already</div>
        </div>

        <nav style={{ flex: 1, padding: '8px 0' }}>
          {NAV.map(item => {
            const active = activeNav === item.id
            return (
              <button key={item.id} onClick={() => setActiveNav(item.id)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 20px', border: 'none', background: active ? 'var(--green-light)' : 'transparent', color: active ? 'var(--green)' : 'var(--text)', borderLeft: active ? '3px solid var(--green)' : '3px solid transparent', fontSize: '13px', fontWeight: 500, textAlign: 'left', transition: 'background 0.12s' }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#f3f4f6' }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
              >
                <i className={`ti ${item.icon}`} style={{ fontSize: '16px' }} />
                {item.label}
              </button>
            )
          })}
        </nav>

        <div style={{ padding: '16px', marginTop: 'auto' }}>
          <div style={{ background: 'var(--green-light)', border: '1px solid var(--green-card-border)', borderRadius: '14px', padding: '14px' }}>
            <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--green)', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '6px' }}>Your Identity</div>
            <div style={{ fontSize: '12px', color: 'var(--text)', lineHeight: 1.4 }}>I am an athlete and a builder.</div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Top bar */}
        <div style={{ background: 'var(--card)', borderBottom: '1.5px solid var(--border)', padding: '16px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ fontSize: '16px', fontWeight: 600 }}>
            {NAV.find(n => n.id === activeNav)?.label ?? 'Dashboard'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ position: 'relative' }}>
              <button style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '8px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>
                <i className="ti ti-bell" style={{ fontSize: '17px' }} />
              </button>
              <div style={{ position: 'absolute', top: '7px', right: '7px', width: '7px', height: '7px', borderRadius: '50%', background: 'var(--red)', border: '1.5px solid #fff' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '13px', fontWeight: 500 }}>{displayName(userEmail)}</div>
                <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{userEmail}</div>
              </div>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--green)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 600 }}>{initials(userEmail)}</div>
            </div>
          </div>
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {activeNav === 'schedule' ? (
            <SchedulePanel userId={userId} />
          ) : activeNav === 'report' ? (
            <WeeklyReportPanel userId={userId} />
          ) : activeNav === 'intervent' ? (
            <InterventionsPanel userId={userId} />
          ) : loading ? (
            <div style={{ color: 'var(--muted)', fontSize: '13px', padding: '40px 0', textAlign: 'center' }}>Loading...</div>
          ) : (
            <>
              {/* Stat row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px' }}>
                {statCards.map(s => (
                  <div key={s.label} style={{ background: 'var(--card)', borderRadius: '14px', border: '1px solid var(--border)', padding: '18px', boxShadow: '0 8px 48px rgba(0,0,0,.08)' }}>
                    <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '26px', color: 'var(--text)', marginBottom: '4px' }}>{s.number}</div>
                    <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '10px' }}>{s.label}</div>
                    <Badge text={s.badge} type={s.badgeType} />
                  </div>
                ))}
              </div>

              {/* Agent suggestions */}
              <div style={{ background: 'var(--card)', borderRadius: '14px', border: '1px solid var(--border)', padding: '20px', boxShadow: '0 8px 48px rgba(0,0,0,.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600 }}>Agent suggestions</div>
                  <span style={{ background: 'var(--green-light)', color: 'var(--green)', fontSize: '11px', fontWeight: 600, padding: '4px 10px', borderRadius: '20px' }}>Right now</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '14px' }}>
                  {suggestions.map(s => (
                    <div key={s.title} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ fontSize: '10px', fontWeight: 700, color: s.tagColor, letterSpacing: '0.4px', textTransform: 'uppercase' }}>{s.tag}</div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{s.title}</div>
                      <div style={{ fontSize: '11px', color: 'var(--muted)', lineHeight: 1.4, flex: 1 }}>{s.desc}</div>
                      <button style={{ alignSelf: 'flex-start', padding: '6px 14px', background: s.btnBg, color: '#fff', fontSize: '11px', fontWeight: 600, borderRadius: '50px', border: 'none', marginTop: '4px' }}>{s.btnText}</button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom 2-col */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

                {/* Gap chart */}
                <div style={{ background: 'var(--card)', borderRadius: '14px', border: '1px solid var(--border)', padding: '20px', boxShadow: '0 8px 48px rgba(0,0,0,.08)' }}>
                  <div style={{ marginBottom: '18px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 600 }}>The gap</div>
                    <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>watched vs. did</div>
                  </div>
                  {gap.map(row => (
                    <div key={row.hobby} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
                      <div style={{ width: '80px', fontSize: '11px', color: 'var(--text)', flexShrink: 0 }}>{row.hobby}</div>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ height: '9px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${row.watched_pct}%`, background: 'var(--muted)', borderRadius: '4px' }} />
                        </div>
                        <div style={{ height: '9px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${row.did_pct}%`, background: 'var(--green)', borderRadius: '4px' }} />
                        </div>
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--muted)', width: '36px', textAlign: 'right', lineHeight: 1.8 }}>
                        <div>{row.watched_hours}h</div>
                        <div>{row.did_hours}h</div>
                      </div>
                    </div>
                  ))}
                  <div style={{ display: 'flex', gap: '16px', marginTop: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--muted)' }} />
                      <span style={{ fontSize: '11px', color: 'var(--muted)' }}>Watched</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--green)' }} />
                      <span style={{ fontSize: '11px', color: 'var(--muted)' }}>Actually did</span>
                    </div>
                  </div>
                </div>

                {/* Vulnerability */}
                <div style={{ background: 'var(--card)', borderRadius: '14px', border: '1px solid var(--border)', padding: '20px', boxShadow: '0 8px 48px rgba(0,0,0,.08)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 600 }}>Vulnerability today</div>
                    <span style={{ background: 'var(--green-light)', color: 'var(--green)', fontSize: '11px', fontWeight: 600, padding: '4px 10px', borderRadius: '20px' }}>Live</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '90px' }}>
                    {vuln.map(v => (
                      <div key={v.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                        <div style={{ width: '100%', maxWidth: '18px', height: `${v.score}%`, background: v.color, borderRadius: '3px 3px 0 0', ...(v.isNow ? { border: '2px solid var(--red)' } : {}) }} />
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                    {vuln.map(v => (
                      <div key={v.label} style={{ flex: 1, textAlign: 'center', fontSize: '9px', color: v.isNow ? 'var(--red)' : 'var(--muted)', fontWeight: v.isNow ? 700 : 400 }}>{v.label}</div>
                    ))}
                  </div>

                  {isHighRisk && (
                    <div style={{ background: 'var(--red-warning-bg)', borderRadius: '8px', padding: '10px 12px', marginTop: '14px', fontSize: '11px', color: 'var(--red)', lineHeight: 1.5 }}>
                      <i className="ti ti-alert-circle" style={{ marginRight: '6px' }} />
                      High risk right now — 11pm, exam tomorrow, battery at 23%
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
