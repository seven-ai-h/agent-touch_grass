import { useState, useEffect, useCallback, Fragment } from 'react'

const DAYS  = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const HOURS = Array.from({ length: 17 }, (_, i) => i + 6)  // 6am – 10pm

function hourLabel(h) {
  if (h === 0)  return '12am'
  if (h < 12)  return `${h}am`
  if (h === 12) return '12pm'
  return `${h - 12}pm`
}

const BLOCK_STYLE = {
  focus:   { background: 'var(--green-mid)', border: '1px solid var(--green)' },
  leisure: { background: 'var(--amber-card-bg)', border: '1px solid var(--amber-card-border)' },
  empty:   { background: 'var(--bg)',            border: '1px solid var(--border)' },
}

// build a lookup: calEvents[day][hour] = title
function buildEventMap(events) {
  const map = {}
  for (const ev of events) {
    for (let h = ev.start_hour; h < ev.end_hour; h++) {
      if (!map[ev.day]) map[ev.day] = {}
      // only store title on the first hour slot so label isn't repeated
      map[ev.day][h] = h === ev.start_hour ? ev.title : ''
    }
  }
  return map
}

export default function SchedulePanel({ userId }) {
  const [grid, setGrid]           = useState({})
  const [mode, setMode]           = useState('focus')
  const [saved, setSaved]         = useState(true)
  const [saving, setSaving]       = useState(false)
  const [loading, setLoading]     = useState(true)
  const [calConnected, setCalConnected] = useState(false)
  const [calEvents, setCalEvents] = useState({})  // {day: {hour: title}}
  const [justConnected, setJustConnected] = useState(false)

  const apiPath = useCallback(
    base => userId ? `${base}?user_id=${userId}` : base,
    [userId]
  )

  // detect redirect back from Google OAuth
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('calendar') === 'connected') {
      setJustConnected(true)
      window.history.replaceState({}, '', '/')
    }
  }, [])

  // load schedule + calendar events
  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetch(apiPath('/api/schedule')).then(r => r.json()),
      fetch(apiPath('/api/calendar/events')).then(r => r.json()),
    ]).then(([schedData, calData]) => {
      const normalised = {}
      Object.entries(schedData).forEach(([day, hours]) => {
        normalised[String(day)] = hours
      })
      setGrid(normalised)
      setSaved(true)
      setCalConnected(calData.connected)
      setCalEvents(calData.connected ? buildEventMap(calData.events) : {})
    }).finally(() => setLoading(false))
  }, [userId, apiPath])

  function cellType(dayIdx, hour) {
    return grid[String(dayIdx)]?.[String(hour)] ?? null
  }

  function toggleCell(dayIdx, hour) {
    const key  = String(dayIdx)
    const hkey = String(hour)
    const cur  = grid[key]?.[hkey] ?? null
    setGrid(prev => {
      const day = { ...(prev[key] ?? {}) }
      if (cur === mode) delete day[hkey]
      else day[hkey] = mode
      return { ...prev, [key]: day }
    })
    setSaved(false)
  }

  function clearDay(dayIdx) {
    setGrid(prev => ({ ...prev, [String(dayIdx)]: {} }))
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true)
    try {
      await fetch(apiPath('/api/schedule'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schedule: grid }),
      })
      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  function connectGoogle() {
    if (!userId) return
    window.location.href = `/api/auth/google/connect?user_id=${userId}`
  }

  if (loading) {
    return (
      <div style={{ color: 'var(--muted)', fontSize: '13px', padding: '40px', textAlign: 'center' }}>
        Loading schedule…
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ fontSize: '16px', fontWeight: 600 }}>Weekly Schedule</div>
          <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>
            Paint focus and leisure blocks. Agent respects these windows.
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Google Calendar connect / status */}
          {calConnected ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--green)', background: 'var(--green-light)', border: '1px solid var(--green-card-border)', borderRadius: '20px', padding: '6px 14px' }}>
              <i className="ti ti-calendar-check" />
              Google Calendar synced
            </div>
          ) : (
            <button
              onClick={connectGoogle}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, padding: '7px 16px', borderRadius: '20px', border: '1.5px solid var(--border)', background: '#fff', cursor: 'pointer', color: 'var(--text)' }}
            >
              <i className="ti ti-brand-google" style={{ color: '#4285F4' }} />
              Connect Google Calendar
            </button>
          )}

          {/* Mode toggles */}
          {['focus', 'leisure'].map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                padding: '7px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                border: `1.5px solid ${mode === m ? (m === 'focus' ? 'var(--green)' : 'var(--amber)') : 'var(--border)'}`,
                background: mode === m ? (m === 'focus' ? 'var(--green)' : 'var(--amber)') : 'transparent',
                color: mode === m ? '#fff' : 'var(--muted)',
                cursor: 'pointer', transition: 'all 0.12s',
              }}
            >
              <i className={`ti ${m === 'focus' ? 'ti-brain' : 'ti-coffee'}`} style={{ marginRight: '5px' }} />
              {m === 'focus' ? 'Focus' : 'Leisure'}
            </button>
          ))}

          <button
            onClick={handleSave}
            disabled={saved || saving}
            style={{
              padding: '7px 20px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
              background: saved ? 'var(--green-light)' : 'var(--green)',
              color: saved ? 'var(--green)' : '#fff',
              border: `1.5px solid ${saved ? 'var(--green-card-border)' : 'var(--green)'}`,
              cursor: saved ? 'default' : 'pointer', transition: 'all 0.12s',
            }}
          >
            {saving ? 'Saving…' : saved
              ? <><i className="ti ti-check" style={{ marginRight: '4px' }} />Saved</>
              : 'Save changes'}
          </button>
        </div>
      </div>

      {/* Just-connected banner */}
      {justConnected && (
        <div style={{ background: 'var(--green-light)', border: '1px solid var(--green-card-border)', borderRadius: '10px', padding: '10px 16px', fontSize: '13px', color: 'var(--green)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className="ti ti-circle-check" />
          Google Calendar connected! Your events are now shown on the grid.
        </div>
      )}

      {/* Legend */}
      <div style={{ display: 'flex', gap: '16px', fontSize: '11px', color: 'var(--muted)', flexWrap: 'wrap' }}>
        <LegendDot color="var(--green-mid)" border="var(--green)" label="Focus — phone triggers intervention" />
        <LegendDot color="var(--amber-card-bg)" border="var(--amber-card-border)" label="Leisure — relaxed mode" />
        {calConnected && <LegendDot color="var(--lavender)" border="var(--purple-card-border)" label="Google Calendar event" />}
        <LegendDot color="var(--bg)" border="var(--border)" label="Unscheduled" />
      </div>

      {/* Grid */}
      <div style={{ overflowX: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '48px repeat(7, 1fr)', minWidth: '580px' }}>

          {/* Day headers */}
          <div />
          {DAYS.map((day, di) => (
            <div
              key={day}
              onClick={() => clearDay(di)}
              title={`Clear ${day}`}
              style={{ textAlign: 'center', paddingBottom: '8px', fontSize: '11px', fontWeight: 600, color: 'var(--muted)', letterSpacing: '0.5px', cursor: 'pointer', userSelect: 'none' }}
            >
              {day.toUpperCase()}
              <div style={{ fontSize: '9px', fontWeight: 400, color: 'var(--border)', marginTop: '1px' }}>tap to clear</div>
            </div>
          ))}

          {/* Hour rows */}
          {HOURS.map(hour => (
            <Fragment key={hour}>
              <div
                style={{ fontSize: '10px', color: 'var(--muted)', textAlign: 'right', paddingRight: '8px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', flexShrink: 0 }}
              >
                {hourLabel(hour)}
              </div>

              {DAYS.map((_, di) => {
                const blockType  = cellType(di, hour)
                const calTitle   = calEvents[di]?.[hour]
                const hasCalEvent = calEvents[di]?.[hour] !== undefined

                let cellBg, cellBorder
                if (blockType) {
                  cellBg     = BLOCK_STYLE[blockType].background
                  cellBorder = BLOCK_STYLE[blockType].border
                } else if (hasCalEvent) {
                  cellBg     = 'var(--lavender)'
                  cellBorder = '1px solid var(--purple-card-border)'
                } else {
                  cellBg     = BLOCK_STYLE.empty.background
                  cellBorder = BLOCK_STYLE.empty.border
                }

                return (
                  <div
                    key={`${di}-${hour}`}
                    onClick={() => toggleCell(di, hour)}
                    style={{
                      height: '32px', background: cellBg, border: cellBorder,
                      cursor: 'pointer', transition: 'background 0.08s',
                      margin: '1px', borderRadius: '4px',
                      overflow: 'hidden', position: 'relative',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.opacity = '0.75' }}
                    onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
                  >
                    {calTitle && (
                      <div style={{
                        position: 'absolute', inset: 0, padding: '0 4px',
                        fontSize: '9px', fontWeight: 600, color: 'var(--purple)',
                        display: 'flex', alignItems: 'center',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        pointerEvents: 'none',
                      }}>
                        {calTitle}
                      </div>
                    )}
                  </div>
                )
              })}
            </Fragment>
          ))}
        </div>
      </div>

      <ScheduleSummary grid={grid} />
    </div>
  )
}

function LegendDot({ color, border, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
      <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: color, border: `1px solid ${border}` }} />
      {label}
    </div>
  )
}

function ScheduleSummary({ grid }) {
  let focusCount = 0, leisureCount = 0
  Object.values(grid).forEach(hours => {
    Object.values(hours).forEach(type => {
      if (type === 'focus')   focusCount++
      if (type === 'leisure') leisureCount++
    })
  })

  return (
    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
      <div style={{ background: 'var(--green-light)', border: '1px solid var(--green-card-border)', borderRadius: '12px', padding: '14px 20px', fontSize: '12px' }}>
        <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '20px', color: 'var(--green)', marginRight: '6px' }}>{focusCount}h</span>
        <span style={{ color: 'var(--green-dark)' }}>focus scheduled / week</span>
      </div>
      <div style={{ background: 'var(--amber-card-bg)', border: '1px solid var(--amber-card-border)', borderRadius: '12px', padding: '14px 20px', fontSize: '12px' }}>
        <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '20px', color: 'var(--amber)', marginRight: '6px' }}>{leisureCount}h</span>
        <span style={{ color: 'var(--amber-badge-text)' }}>leisure windows / week</span>
      </div>
    </div>
  )
}
