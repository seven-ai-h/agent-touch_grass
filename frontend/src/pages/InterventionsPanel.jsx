import { useState, useEffect, useCallback } from 'react'

function formatTime(iso) {
  const d = new Date(iso)
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })
}

function OutcomeBadge({ outcome, accepted }) {
  if (outcome === 'redirected' || accepted === true) {
    return <span style={{ background: 'var(--green-light)', color: 'var(--green)', border: '1px solid var(--green-card-border)', borderRadius: '20px', padding: '2px 10px', fontSize: '10px', fontWeight: 700 }}>Redirected</span>
  }
  if (outcome === 'overridden' || accepted === false) {
    return <span style={{ background: 'var(--red-badge-bg)', color: 'var(--red)', border: '1px solid #FECACA', borderRadius: '20px', padding: '2px 10px', fontSize: '10px', fontWeight: 700 }}>Overridden</span>
  }
  if (outcome === 'leisure_window') {
    return <span style={{ background: 'var(--amber-badge-bg)', color: 'var(--amber-badge-text)', border: '1px solid var(--amber-card-border)', borderRadius: '20px', padding: '2px 10px', fontSize: '10px', fontWeight: 700 }}>Leisure window</span>
  }
  return <span style={{ background: 'var(--bg)', color: 'var(--muted)', border: '1px solid var(--border)', borderRadius: '20px', padding: '2px 10px', fontSize: '10px', fontWeight: 700 }}>Pending</span>
}

function VulnDot({ score }) {
  const color = score >= 70 ? 'var(--vuln-now)' : score >= 50 ? 'var(--vuln-mid)' : 'var(--vuln-low)'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, flexShrink: 0 }} />
      <span style={{ fontSize: '11px', color: 'var(--muted)' }}>{score ?? '—'}</span>
    </div>
  )
}

function Transcript({ messages }) {
  if (!messages.length) return null
  return (
    <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {messages.map((m, i) => (
        <div
          key={i}
          style={{
            alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '80%',
            background: m.role === 'user' ? 'var(--green-light)' : 'var(--chat-agent-bg)',
            color: 'var(--text)',
            borderRadius: m.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
            padding: '7px 11px',
            fontSize: '12px',
            lineHeight: 1.45,
          }}
        >
          {m.content}
        </div>
      ))}
    </div>
  )
}

function InterventionCard({ item }) {
  const [expanded, setExpanded] = useState(false)
  const sugg = item.redirect_suggestion

  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '14px', overflow: 'hidden' }}>
      {/* Card header */}
      <div
        onClick={() => setExpanded(e => !e)}
        style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
      >
        {/* App icon */}
        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--bg)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <i className={`ti ${item.app_icon}`} style={{ fontSize: '17px', color: 'var(--muted)' }} />
        </div>

        {/* App + time */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{item.app}</div>
          <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>{formatTime(item.created_at)}</div>
        </div>

        {/* Vuln score */}
        <VulnDot score={item.vulnerability_score} />

        {/* Outcome */}
        <OutcomeBadge outcome={item.outcome} accepted={item.accepted} />

        {/* Expand chevron */}
        {item.messages.length > 0 && (
          <i className={`ti ${expanded ? 'ti-chevron-up' : 'ti-chevron-down'}`} style={{ fontSize: '14px', color: 'var(--muted)', flexShrink: 0 }} />
        )}
      </div>

      {/* Expanded: transcript + suggestion */}
      {expanded && (
        <div style={{ borderTop: '1px solid var(--border)', padding: '14px 18px', background: 'var(--context-bg)', display: 'flex', flexDirection: 'column' }}>
          <Transcript messages={item.messages} />

          {sugg && (
            <div style={{ marginTop: '12px', background: 'var(--green-light)', border: '1px solid var(--green-card-border)', borderRadius: '10px', padding: '10px 14px', fontSize: '12px', color: 'var(--text)', lineHeight: 1.5 }}>
              <i className="ti ti-arrow-right" style={{ color: 'var(--green)', marginRight: '6px' }} />
              {sugg.hobby && <strong>{sugg.hobby.replace(/_/g, ' ')}</strong>}
              {sugg.place && ` · ${sugg.place}`}
              {sugg.drill && ` · ${sugg.drill}`}
              {sugg.suggestion && ` · ${sugg.suggestion}`}
            </div>
          )}

          <div style={{ marginTop: '10px', display: 'flex', gap: '16px', fontSize: '10px', color: 'var(--muted)' }}>
            {item.battery != null && <span><i className="ti ti-battery" style={{ marginRight: '3px' }} />{item.battery}%</span>}
            {item.location   && <span><i className="ti ti-map-pin" style={{ marginRight: '3px' }} />{item.location}</span>}
          </div>
        </div>
      )}
    </div>
  )
}

export default function InterventionsPanel({ userId }) {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)

  const apiPath = useCallback(
    base => userId ? `${base}?user_id=${userId}` : base,
    [userId]
  )

  useEffect(() => {
    setLoading(true)
    fetch(apiPath('/api/interventions'))
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
  }, [userId, apiPath])

  if (loading) return <div style={{ color: 'var(--muted)', fontSize: '13px', padding: '40px', textAlign: 'center' }}>Loading…</div>

  const { items, total, accepted, overridden, accept_rate } = data

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Header */}
      <div>
        <div style={{ fontSize: '16px', fontWeight: 600 }}>Interventions</div>
        <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>Every time the agent stepped in.</div>
      </div>

      {/* Stat strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
        <StatChip icon="ti-list" value={total} label="Total" color="var(--text)" />
        <StatChip icon="ti-check" value={`${accept_rate}%`} label="Accept rate" color="var(--green)" />
        <StatChip icon="ti-x" value={overridden} label="Overridden" color="var(--red)" />
      </div>

      {/* List */}
      {items.length === 0 ? (
        <div style={{ fontSize: '13px', color: 'var(--muted)', padding: '40px', textAlign: 'center' }}>No interventions yet.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {items.map(item => <InterventionCard key={item.id} item={item} />)}
        </div>
      )}
    </div>
  )
}

function StatChip({ icon, value, label, color }) {
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
      <i className={`ti ${icon}`} style={{ fontSize: '20px', color }} />
      <div>
        <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '22px', color: 'var(--text)' }}>{value}</div>
        <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{label}</div>
      </div>
    </div>
  )
}
