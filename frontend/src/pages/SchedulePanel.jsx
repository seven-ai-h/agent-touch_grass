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
  focus:   { background: 'var(--green-light)', border: '2px solid var(--green)',        icon: '⚡', iconColor: 'var(--green)' },
  leisure: { background: 'var(--amber-card-bg)', border: '2px solid var(--amber)',      icon: '★', iconColor: 'var(--amber)' },
  empty:   { background: 'var(--bg)',            border: '1px solid var(--border)',     icon: '',  iconColor: '' },
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
  const [weekOffset, setWeekOffset] = useState(0)  // 0 = this week, 1 = next, -1 = last

  // Compute Monday of the displayed week
  function getMondayOfWeek(offset = 0) {
    const d = new Date()
    const monday = new Date(d)
    monday.setDate(d.getDate() - ((d.getDay() + 6) % 7) + offset * 7)
    monday.setHours(0, 0, 0, 0)
    return monday
  }

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

  // fetch schedule + cal events whenever the displayed week changes
  useEffect(() => {
    setLoading(true)
    setSaved(true)
    const monday    = getMondayOfWeek(weekOffset)
    const mondayStr = monday.toISOString().split('T')[0]

    const schedUrl = userId
      ? `/api/schedule?user_id=${userId}&week_start=${mondayStr}`
      : `/api/schedule?week_start=${mondayStr}`
    const calUrl = userId
      ? `/api/calendar/events?user_id=${userId}&week_start=${mondayStr}`
      : `/api/calendar/events?week_start=${mondayStr}`

    Promise.all([
      fetch(schedUrl).then(r => r.json()),
      fetch(calUrl).then(r => r.json()),
    ]).then(([schedData, calData]) => {
      const normalised = {}
      Object.entries(schedData).forEach(([day, hours]) => {
        normalised[String(day)] = hours
      })
      setGrid(normalised)
      setCalConnected(calData.connected)
      setCalEvents(calData.connected ? buildEventMap(calData.events) : {})
    }).finally(() => setLoading(false))
  }, [userId, apiPath, weekOffset])

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
    const mondayStr = getMondayOfWeek(weekOffset).toISOString().split('T')[0]
    const saveUrl = userId
      ? `/api/schedule?user_id=${userId}&week_start=${mondayStr}`
      : `/api/schedule?week_start=${mondayStr}`
    try {
      await fetch(saveUrl, {
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ fontSize: '16px', fontWeight: 600 }}>Weekly Schedule</div>
            {/* Week navigation */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                onClick={() => setWeekOffset(w => w - 1)}
                style={{ width: '26px', height: '26px', borderRadius: '6px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px' }}
                title="Previous week"
              >‹</button>
              <button
                onClick={() => setWeekOffset(0)}
                style={{ padding: '3px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: weekOffset === 0 ? 'var(--green-light)' : 'transparent', color: weekOffset === 0 ? 'var(--green)' : 'var(--muted)', cursor: 'pointer', fontSize: '11px', fontWeight: 600 }}
                title="Go to current week"
              >Today</button>
              <button
                onClick={() => setWeekOffset(w => w + 1)}
                style={{ width: '26px', height: '26px', borderRadius: '6px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px' }}
                title="Next week"
              >›</button>
            </div>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>
            Paint focus and leisure blocks for this week. Changes only affect the week you're viewing.
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Google Calendar connect / status */}
          {calConnected ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--green)', background: 'var(--green-light)', border: '1px solid var(--green-card-border)', borderRadius: '20px', padding: '6px 14px' }}>
                <i className="ti ti-calendar-check" />
                Google Calendar synced
              </div>
              <button
                onClick={connectGoogle}
                style={{ fontSize: '11px', color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
              >
                Reconnect
              </button>
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
        <LegendDot color="var(--green-light)" border="var(--green)" label="⚡ Focus block" />
        <LegendDot color="var(--amber-card-bg)" border="var(--amber)" label="★ Leisure block" />
        {calConnected && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--bg)', borderLeft: '3px solid var(--purple)', border: '1px solid var(--border)', borderLeft: '3px solid var(--purple)' }} />
            <span>Google Calendar event</span>
          </div>
        )}
        <LegendDot color="var(--bg)" border="var(--border)" label="Unscheduled" />
      </div>

      {/* Grid */}
      <div style={{ overflowX: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '48px repeat(7, 1fr)', minWidth: '580px' }}>

          {/* Day headers */}
          <div />
          {DAYS.map((day, di) => {
            const monday = getMondayOfWeek(weekOffset)
            const cellDate = new Date(monday)
            cellDate.setDate(monday.getDate() + di)
            const isToday = cellDate.toDateString() === new Date().toDateString()
            const dateLabel = `${cellDate.getMonth() + 1}/${cellDate.getDate()}`
            return (
              <div
                key={day}
                onClick={() => clearDay(di)}
                title={`Clear ${day}`}
                style={{ textAlign: 'center', paddingBottom: '8px', fontSize: '11px', fontWeight: 600, color: isToday ? 'var(--green)' : 'var(--muted)', letterSpacing: '0.5px', cursor: 'pointer', userSelect: 'none' }}
              >
                {day.toUpperCase()}
                <div style={{ fontSize: '10px', fontWeight: isToday ? 700 : 400, color: isToday ? 'var(--green)' : 'var(--muted)', marginTop: '2px' }}>{dateLabel}</div>
                <div style={{ fontSize: '9px', fontWeight: 400, color: 'var(--border)', marginTop: '1px' }}>tap to clear</div>
              </div>
            )
          })}

          {/* Hour rows */}
          {HOURS.map(hour => (
            <Fragment key={hour}>
              <div
                style={{ fontSize: '10px', color: 'var(--muted)', textAlign: 'right', paddingRight: '8px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', flexShrink: 0 }}
              >
                {hourLabel(hour)}
              </div>

              {DAYS.map((_, di) => {
                const blockType   = cellType(di, hour)
                const calTitle    = calEvents[di]?.[hour]        // non-empty string = first slot of event
                const hasCalEvent = calEvents[di]?.[hour] !== undefined  // any slot of event

                const cellBg     = blockType ? BLOCK_STYLE[blockType].background : BLOCK_STYLE.empty.background
                const cellBorder = blockType ? BLOCK_STYLE[blockType].border      : BLOCK_STYLE.empty.border

                return (
                  <div
                    key={`${di}-${hour}`}
                    onClick={() => toggleCell(di, hour)}
                    style={{
                      height: '32px', background: cellBg,
                      border: cellBorder,
                      borderLeft: hasCalEvent ? '3px solid var(--purple)' : undefined,
                      cursor: 'pointer', transition: 'background 0.08s',
                      margin: '1px', borderRadius: '4px',
                      overflow: 'hidden', position: 'relative',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.opacity = '0.75' }}
                    onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
                  >
                    {/* Block type icon — top-right corner, always visible */}
                    {blockType && (
                      <span style={{
                        position: 'absolute', top: '2px', right: '3px',
                        fontSize: '9px', color: BLOCK_STYLE[blockType].iconColor,
                        opacity: 0.85, pointerEvents: 'none', lineHeight: 1,
                      }}>
                        {BLOCK_STYLE[blockType].icon}
                      </span>
                    )}
                    {/* Calendar event title — first slot only, left-aligned */}
                    {calTitle && (
                      <div style={{
                        position: 'absolute', inset: 0,
                        paddingLeft: '5px', paddingRight: '14px',
                        fontSize: '8px', fontWeight: 700,
                        color: blockType ? 'var(--purple)' : 'var(--purple)',
                        display: 'flex', alignItems: 'center',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        pointerEvents: 'none',
                      }}>
                        {calTitle}
                      </div>
                    )}
                    {/* Continuation bar for multi-slot cal events (no title) */}
                    {hasCalEvent && !calTitle && (
                      <div style={{
                        position: 'absolute', inset: 0,
                        background: 'rgba(139,92,246,0.06)',
                        pointerEvents: 'none',
                      }} />
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
