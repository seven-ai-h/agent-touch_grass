import { useState, useEffect, useRef } from 'react'

function cleanAgentText(text) {
  return text
    // strip XML calendar tags and their content
    .replace(/<create_event>[\s\S]*?<\/create_event>/g, '')
    .replace(/<delete_events>[\s\S]*?<\/delete_events>/g, '')
    .replace(/<create_event>[\s\S]*/g, '')
    .replace(/<delete_events>[\s\S]*/g, '')
    // strip first-person scheduling claims the model shouldn't make ("I've scheduled/added...")
    .replace(/[^.!?]*\bI'?ve?\s+(scheduled|added|created|booked|removed|cleared)\b[^.!?]*[.!?]/gi, '')
    .replace(/[^.!?]*\bI('ll| will)\s+(schedule|add|create|book|remove|clear)\b[^.!?]*[.!?]/gi, '')
    .replace(/your schedule now (looks|is)[^.!?\n]*([\s\S]*?)\n\n/gi, '')
    .replace(/here('s| is) (how it looks|your schedule|the schedule)[^.!?\n]*/gi, '')
    .replace(/ask me for the next day[^.!?\n]*/gi, '')
    .replace(/is there anything else[^.!?\n]*/gi, '')
    .replace(/let me know if[^.!?\n]*/gi, '')
    // strip bullet/numbered list lines that echo calendar events
    .replace(/^[\s]*[-•*]\s+.*(at \d|from \d|\d:\d{2})[^\n]*/gm, '')
    .replace(/^\s*\d+\.\s+.*(at \d|from \d|\d:\d{2})[^\n]*/gm, '')
    // strip leaked system-prompt fragments
    .replace(/\[CALENDAR\][^\n]*/g, '')
    .replace(/^(STRICT OUTPUT|CALENDAR TOOL|How to respond|Their hobbies|Their schedule|Upcoming calendar|Other (things|activities)|RIGHT NOW|today=)[^\n]*/gim, '')
    .replace(/\bTo (CREATE|DELETE|CLEAR|add|delete)[^\n]*/gi, '')
    .replace(/^\s*(append|end with|put the tag|scheduling|clearing|Rules:|pick a free)[^\n]*/gim, '')
    // strip raw JSON blobs
    .replace(/\{"title"[\s\S]*?\}/g, '')
    // strip any remaining lone tags
    .replace(/<\/?[a-z_]+>/g, '')
    // collapse extra blank lines
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function AgentBubble({ text }) {
  const clean = cleanAgentText(text)
  return (
    <div style={{ alignSelf: 'flex-start', maxWidth: '85%' }}>
      <div style={{ background: 'var(--chat-agent-bg)', borderRadius: '14px 14px 14px 4px', padding: '10px 13px', fontSize: '13px', lineHeight: 1.5, color: 'var(--text)', fontFamily: 'inherit' }}>
        {clean}
      </div>
    </div>
  )
}

function UserBubble({ text }) {
  return (
    <div style={{ alignSelf: 'flex-end', maxWidth: '85%' }}>
      <div style={{ background: 'var(--green)', borderRadius: '14px 14px 4px 14px', padding: '10px 13px', fontSize: '13px', lineHeight: 1.5, color: '#fff' }}>
        {text}
      </div>
    </div>
  )
}

function SystemBubble({ text }) {
  return (
    <div style={{ alignSelf: 'center' }}>
      <div style={{ background: 'var(--green-light)', border: '1px solid var(--green-card-border)', borderRadius: '20px', padding: '6px 14px', fontSize: '11px', fontWeight: 600, color: 'var(--green)', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <i className="ti ti-calendar-check" style={{ fontSize: '12px' }} />
        {text}
      </div>
    </div>
  )
}

function TypingDots() {
  return (
    <div style={{ alignSelf: 'flex-start' }}>
      <div style={{ background: 'var(--chat-agent-bg)', borderRadius: '14px 14px 14px 4px', padding: '12px 16px', display: 'flex', gap: '5px', alignItems: 'center' }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: '6px', height: '6px', borderRadius: '50%', background: 'var(--muted)',
            animation: 'bounce 1.2s ease-in-out infinite',
            animationDelay: `${i * 0.2}s`,
          }} />
        ))}
      </div>
    </div>
  )
}

function RedirectCard({ suggestion, onAccept, onOverride }) {
  const parts = [
    suggestion.place,
    suggestion.distance && `${suggestion.distance}`,
    suggestion.open_until && `open until ${suggestion.open_until}`,
  ].filter(Boolean).join(' · ')

  return (
    <div style={{ alignSelf: 'flex-start', maxWidth: '90%', background: 'var(--green-light)', border: '1px solid var(--green-card-border)', borderRadius: '12px', padding: '12px' }}>
      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--green)', letterSpacing: '0.4px', textTransform: 'uppercase', marginBottom: '6px' }}>
        Redirect Suggestion
      </div>
      {suggestion.hobby && (
        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', marginBottom: '4px', textTransform: 'capitalize' }}>
          {suggestion.hobby.replace(/_/g, ' ')}
        </div>
      )}
      {parts && <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '4px' }}>{parts}</div>}
      {suggestion.drill && <div style={{ fontSize: '12px', color: 'var(--text)', marginBottom: '10px' }}>{suggestion.drill}</div>}
      {suggestion.suggestion && <div style={{ fontSize: '12px', color: 'var(--text)', marginBottom: '10px' }}>{suggestion.suggestion}</div>}

      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={onAccept}
          style={{ flex: 1, padding: '8px', background: 'var(--green)', color: '#fff', fontSize: '12px', fontWeight: 600, borderRadius: '50px', border: 'none', cursor: 'pointer' }}
        >
          Let's go
        </button>
        <button
          onClick={onOverride}
          style={{ flex: 1, padding: '8px', background: 'transparent', color: 'var(--muted)', fontSize: '12px', border: '1.5px solid var(--border)', borderRadius: '50px', cursor: 'pointer' }}
        >
          Maybe later
        </button>
      </div>
    </div>
  )
}

function VulnPill({ score }) {
  if (!score) return null
  const high = score >= 70
  const mid  = score >= 45
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      background: high ? 'var(--red-badge-bg)' : mid ? 'var(--amber-badge-bg)' : 'var(--green-light)',
      color: high ? 'var(--red)' : mid ? 'var(--amber-badge-text)' : 'var(--green)',
      fontSize: '11px', fontWeight: 600, borderRadius: '50px', padding: '5px 10px',
    }}>
      <i className="ti ti-alert-circle" style={{ fontSize: '13px' }} />
      Score: {score} — {high ? 'high risk' : mid ? 'moderate' : 'low risk'}
    </div>
  )
}

const APPS = [
  { id: 'tiktok.com',     label: 'TikTok',     icon: 'ti-brand-tiktok' },
  { id: 'instagram.com',  label: 'Instagram',  icon: 'ti-brand-instagram' },
  { id: 'youtube.com',    label: 'YouTube',    icon: 'ti-brand-youtube' },
  { id: 'twitter.com',    label: 'X / Twitter', icon: 'ti-brand-x' },
]


export default function InterventionPopup({ userId: propUserId }) {
  const userId = propUserId || localStorage.getItem('user_id') || '00000000-0000-0000-0000-000000000001'

  // setup state — shown before chat starts
  const [configured, setConfigured]   = useState(false)
  const [appTriggered, setAppTriggered] = useState('tiktok.com')
  const [battery, setBattery]         = useState(null)

  const [messages, setMessages]       = useState([])
  const [sessionId, setSessionId]     = useState(null)
  const [vulnScore, setVulnScore]     = useState(null)
  const [redirect, setRedirect]       = useState(null)
  const [input, setInput]             = useState('')
  const [loading, setLoading]         = useState(false)
  const [done, setDone]               = useState(false)
  const bottomRef                     = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading, redirect])

  async function sendToAgent(history) {
    setLoading(true)
    try {
      const res = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id:      userId,
          session_id:   sessionId,
          app_triggered: appTriggered,
          battery,
          location:     null,
          messages:     history,
        }),
      })
      const data = await res.json()
      if (data.session_id)   setSessionId(data.session_id)
      if (data.vulnerability_score) setVulnScore(data.vulnerability_score)

      const newMessages = [...history]

      // agent text — only show if there's something after cleaning
      const cleaned = data.message ? cleanAgentText(data.message) : ''
      if (cleaned) newMessages.push({ role: 'assistant', content: cleaned })

      // calendar confirmation as a separate system bubble
      if (data.event_created) {
        const ev = data.event_created
        const label = [ev.title, ev.date, ev.start_time ? `at ${ev.start_time}` : ''].filter(Boolean).join(' · ')
        newMessages.push({ role: 'system', content: `✓ Added to calendar: ${label}` })
      }

      // safety net: model produced nothing useful and no calendar action happened
      if (!cleaned && !data.event_created) {
        newMessages.push({ role: 'assistant', content: 'Close the tab and do something real.' })
      }

      setMessages(newMessages)

      if (data.redirect_suggestion) {
        setRedirect(data.redirect_suggestion)
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Something went wrong. Go touch grass anyway.' }])
    } finally {
      setLoading(false)
    }
  }

  async function handleSend() {
    if (!input.trim() || loading || done) return
    const userMsg = { role: 'user', content: input.trim() }
    const history = [...messages, userMsg]
    setMessages(history)
    setInput('')
    await sendToAgent(history)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  async function recordOutcome(outcome, accepted) {
    if (!sessionId) return
    await fetch(`/api/agent/outcome?session_id=${sessionId}&outcome=${outcome}&accepted=${accepted}`, {
      method: 'POST'
    })
    setDone(true)
  }

  function handleSimulate() {
    setConfigured(true)
    sendToAgent([])
  }

  if (!configured) {
    return (
      <div style={{ height: 'calc(100vh - 47px)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#e5e7eb' }}>
        <div style={{ background: 'var(--card)', borderRadius: '16px', padding: '32px', width: '360px', boxShadow: '0 8px 32px rgba(0,0,0,.12)', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '16px', color: 'var(--green)', marginBottom: '4px' }}>🌱 Simulate intervention</div>
            <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Pick what triggered it and your battery level — this affects the vulnerability score.</div>
          </div>

          {/* App picker */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '10px' }}>App opened</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {APPS.map(a => (
                <button
                  key={a.id}
                  onClick={() => setAppTriggered(a.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '7px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                    border: `1.5px solid ${appTriggered === a.id ? 'var(--green)' : 'var(--border)'}`,
                    background: appTriggered === a.id ? 'var(--green-light)' : 'transparent',
                    color: appTriggered === a.id ? 'var(--green)' : 'var(--muted)',
                    cursor: 'pointer',
                  }}
                >
                  <i className={`ti ${a.icon}`} style={{ fontSize: '13px' }} />
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          {/* Battery input */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '10px' }}>Battery level</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="number"
                min="0"
                max="100"
                placeholder="e.g. 15"
                value={battery ?? ''}
                onChange={e => {
                  const v = e.target.value === '' ? null : Math.min(100, Math.max(0, Number(e.target.value)))
                  setBattery(v)
                }}
                style={{
                  width: '90px', padding: '8px 12px', borderRadius: '10px', fontSize: '13px',
                  border: '1.5px solid var(--border)', outline: 'none', background: 'transparent',
                  color: 'var(--text)',
                }}
                onFocus={e => { e.target.style.borderColor = 'var(--green)' }}
                onBlur={e  => { e.target.style.borderColor = 'var(--border)' }}
              />
              <span style={{ fontSize: '13px', color: 'var(--muted)' }}>%</span>
              {battery === null && <span style={{ fontSize: '11px', color: 'var(--muted)' }}>leave blank = unknown</span>}
              {battery !== null && battery < 20 && <span style={{ fontSize: '11px', color: 'var(--red)' }}>+20 to score</span>}
              {battery !== null && battery >= 20 && battery < 35 && <span style={{ fontSize: '11px', color: '#f97316' }}>+10 to score</span>}
            </div>
          </div>

          <button
            onClick={handleSimulate}
            style={{ padding: '10px', borderRadius: '10px', background: 'var(--green)', color: '#fff', fontWeight: 700, fontSize: '13px', border: 'none', cursor: 'pointer' }}
          >
            Simulate →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ height: 'calc(100vh - 47px)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#e5e7eb' }}>
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }
      `}</style>

      {/* Mock browser window */}
      <div style={{ maxWidth: '860px', width: '100%', height: '580px', borderRadius: '16px', background: 'var(--browser-bg)', display: 'flex', overflow: 'hidden', boxShadow: '0 16px 64px rgba(0,0,0,.18)' }}>

        {/* Left — blurred page */}
        <div style={{ flex: 1, background: 'linear-gradient(135deg, var(--browser-page) 0%, #6b7280 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '22px', color: '#fff', opacity: 0.40, fontWeight: 600 }}>{appTriggered}</span>
        </div>

        {/* Right panel */}
        <div style={{ width: '360px', flexShrink: 0, background: 'var(--card)', boxShadow: '-8px 0 32px rgba(0,0,0,.12)', display: 'flex', flexDirection: 'column' }}>

          {/* Header */}
          <div style={{ borderBottom: '1px solid var(--border)', padding: '18px 18px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '16px' }}>🌱</span>
                <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '15px', color: 'var(--green)' }}>touch grass</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  onClick={() => { setConfigured(false); setMessages([]); setVulnScore(null); setRedirect(null); setDone(false); setSessionId(null) }}
                  style={{ fontSize: '10px', color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                  title="Change app or battery"
                >reset</button>
                <button
                  onClick={() => recordOutcome('overridden', false)}
                  style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid var(--border)', background: 'transparent', color: 'var(--muted)', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >✕</button>
              </div>
            </div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginBottom: '8px' }}>
              {done ? 'See you on the other side.' : 'Hey — hold on a second.'}
            </div>
            <VulnPill score={vulnScore} />
          </div>

          {/* Chat body */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {messages.map((m, i) => (
              m.role === 'assistant' ? <AgentBubble  key={i} text={m.content} /> :
              m.role === 'system'    ? <SystemBubble key={i} text={m.content} /> :
                                       <UserBubble   key={i} text={m.content} />
            ))}

            {loading && <TypingDots />}

            {redirect && !done && (
              <RedirectCard
                suggestion={redirect}
                onAccept={() => recordOutcome('redirected', true)}
                onOverride={() => recordOutcome('overridden', false)}
              />
            )}

            {done && (
              <div style={{ alignSelf: 'center', fontSize: '12px', color: 'var(--muted)', padding: '12px 0' }}>
                Session recorded.
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ borderTop: '1px solid var(--border)', padding: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading || done || !!redirect}
              placeholder={done ? 'Session closed.' : redirect ? 'Make a choice above.' : 'Reply to the agent...'}
              style={{ flex: 1, padding: '8px 14px', border: '1.5px solid var(--border)', borderRadius: '20px', fontSize: '13px', outline: 'none', background: 'transparent', color: 'var(--text)', opacity: (done || !!redirect) ? 0.5 : 1 }}
              onFocus={e => { e.target.style.borderColor = 'var(--green)' }}
              onBlur={e  => { e.target.style.borderColor = 'var(--border)' }}
            />
            <button
              onClick={handleSend}
              disabled={loading || done || !!redirect}
              style={{ width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0, background: 'var(--green)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer', opacity: (loading || done || !!redirect) ? 0.5 : 1 }}
            >
              <i className="ti ti-send" style={{ fontSize: '14px' }} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
