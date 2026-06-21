import { useState, useEffect, useCallback } from 'react'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function WeeklyReportPanel({ userId }) {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  const apiPath = useCallback(
    base => userId ? `${base}?user_id=${userId}` : base,
    [userId]
  )

  useEffect(() => {
    setLoading(true)
    fetch(apiPath('/api/report/weekly'))
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => { setError('Failed to load report'); setLoading(false) })
  }, [userId, apiPath])

  if (loading) return <div style={{ color: 'var(--muted)', fontSize: '13px', padding: '40px', textAlign: 'center' }}>Loading report…</div>
  if (error)   return <div style={{ color: 'var(--red)',   fontSize: '13px', padding: '40px', textAlign: 'center' }}>{error}</div>

  const {
    week_label, cal_connected, cal_events, cal_by_day, total_cal_hours,
    focus_slots, leisure_slots, total_sessions, redirected, overridden,
    comply_rate, time_saved_h, vuln_avg, sessions_by_day, hobby_gap,
  } = data

  const maxSessions = Math.max(...DAYS.map(d => sessions_by_day[d]?.total ?? 0), 1)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '16px', fontWeight: 600 }}>Weekly Report</div>
          <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>{week_label}</div>
        </div>
        {!cal_connected && (
          <a
            href={`/api/auth/google/connect?user_id=${userId}`}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, padding: '7px 16px', borderRadius: '20px', border: '1.5px solid var(--border)', background: '#fff', textDecoration: 'none', color: 'var(--text)' }}
          >
            <i className="ti ti-brand-google" style={{ color: '#4285F4' }} />
            Connect calendar for full report
          </a>
        )}
        {cal_connected && (
          <div style={{ fontSize: '12px', color: 'var(--green)', background: 'var(--green-light)', border: '1px solid var(--green-card-border)', borderRadius: '20px', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <i className="ti ti-calendar-check" /> Google Calendar synced
          </div>
        )}
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
        <StatCard icon="ti-shield-check" value={`${comply_rate}%`} label="Comply rate" color="var(--green)" bg="var(--green-light)" border="var(--green-card-border)" />
        <StatCard icon="ti-clock" value={`${time_saved_h}h`} label="Time saved" color="var(--green)" bg="var(--green-light)" border="var(--green-card-border)" />
        <StatCard icon="ti-calendar-event" value={`${total_cal_hours}h`} label="In calendar events" color="var(--purple)" bg="var(--lavender)" border="var(--purple-card-border)" />
        <StatCard icon="ti-brain" value={`${focus_slots}h`} label="Focus scheduled" color={vuln_avg >= 70 ? 'var(--red)' : 'var(--amber-badge-text)'} bg="var(--amber-card-bg)" border="var(--amber-card-border)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

        {/* Intervention bar chart by day */}
        <Section title="Interventions by day">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {DAYS.map(day => {
              const total      = sessions_by_day[day]?.total ?? 0
              const redir      = sessions_by_day[day]?.redirected ?? 0
              const totalPct   = Math.round(100 * total / maxSessions)
              const redirPct   = total > 0 ? Math.round(100 * redir / total) : 0
              return (
                <div key={day} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '28px', fontSize: '11px', color: 'var(--muted)', flexShrink: 0 }}>{day}</div>
                  <div style={{ flex: 1, height: '18px', background: 'var(--bg)', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
                    <div style={{ width: `${totalPct}%`, height: '100%', background: 'var(--border)', borderRadius: '4px' }} />
                    <div style={{ position: 'absolute', top: 0, left: 0, width: `${totalPct * redirPct / 100}%`, height: '100%', background: 'var(--green-mid)', borderRadius: '4px' }} />
                  </div>
                  <div style={{ width: '32px', fontSize: '11px', color: 'var(--muted)', textAlign: 'right', flexShrink: 0 }}>
                    {total > 0 ? `${redir}/${total}` : '—'}
                  </div>
                </div>
              )
            })}
          </div>
          <div style={{ marginTop: '10px', display: 'flex', gap: '12px', fontSize: '10px', color: 'var(--muted)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'var(--green-mid)' }} /> Redirected</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'var(--border)' }} /> Total triggers</div>
          </div>
        </Section>

        {/* Hobby gap */}
        <Section title="Watched vs did this week">
          {hobby_gap.length === 0 ? (
            <div style={{ fontSize: '12px', color: 'var(--muted)', padding: '20px 0' }}>No hobby data yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {hobby_gap.map(h => (
                <div key={h.hobby}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text)' }}>{h.hobby}</span>
                    <span style={{ color: 'var(--muted)' }}>
                      {h.did_h}h done · {h.watched_h}h worth consumed
                    </span>
                  </div>
                  <div style={{ height: '8px', background: 'var(--bg)', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
                    <div style={{ width: '100%', height: '100%', background: 'var(--amber-card-bg)', borderRadius: '4px', border: '1px solid var(--amber-card-border)' }} />
                    <div style={{ position: 'absolute', top: 0, left: 0, width: `${Math.min(100, (h.did_h / Math.max(h.watched_h, 0.1)) * 100)}%`, height: '100%', background: 'var(--green-mid)', borderRadius: '4px' }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>

      {/* Calendar events */}
      {cal_connected && (
        <Section title={`Your calendar this week · ${total_cal_hours}h total`}>
          {cal_events.length === 0 ? (
            <div style={{ fontSize: '12px', color: 'var(--muted)' }}>No events this week.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
              {DAYS.map(day => (
                <div key={day}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.5px', marginBottom: '6px' }}>{day.toUpperCase()}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {(cal_by_day[day] ?? []).map((ev, i) => (
                      <div
                        key={i}
                        style={{ background: 'var(--lavender)', border: '1px solid var(--purple-card-border)', borderRadius: '6px', padding: '5px 7px' }}
                      >
                        <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--purple)', lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ev.title}</div>
                        <div style={{ fontSize: '9px', color: 'var(--muted)', marginTop: '2px' }}>{ev.start} – {ev.end}</div>
                      </div>
                    ))}
                    {!(cal_by_day[day] ?? []).length && (
                      <div style={{ fontSize: '10px', color: 'var(--border)', padding: '4px 0' }}>Free</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>
      )}

      {/* Summary blurb */}
      <div style={{ background: 'var(--green-light)', border: '1px solid var(--green-card-border)', borderRadius: '14px', padding: '18px 20px' }}>
        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--green)', marginBottom: '6px' }}>
          <i className="ti ti-sparkles" style={{ marginRight: '6px' }} />
          Week summary
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text)', lineHeight: 1.6 }}>
          {total_sessions === 0
            ? "No interventions recorded this week yet."
            : `You triggered ${total_sessions} intervention${total_sessions !== 1 ? 's' : ''} this week and redirected ${redirected} of them — a ${comply_rate}% comply rate. `}
          {time_saved_h > 0 && `That saved you roughly ${time_saved_h} hours of scrolling. `}
          {cal_connected && total_cal_hours > 0 && `You had ${total_cal_hours}h of scheduled events on your calendar. `}
          {focus_slots > 0 && `You've set ${focus_slots}h of focus blocks for the week.`}
        </div>
      </div>

    </div>
  )
}

function StatCard({ icon, value, label, color, bg, border }) {
  return (
    <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: '14px', padding: '16px 18px' }}>
      <i className={`ti ${icon}`} style={{ fontSize: '18px', color, marginBottom: '8px', display: 'block' }} />
      <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '24px', color: 'var(--text)' }}>{value}</div>
      <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>{label}</div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '18px 20px' }}>
      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted)', letterSpacing: '0.4px', textTransform: 'uppercase', marginBottom: '14px' }}>{title}</div>
      {children}
    </div>
  )
}
