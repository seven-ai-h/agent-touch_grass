import { useState } from 'react'

const MESSAGES = [
  {
    id: 1, type: 'agent',
    text: 'You closed this tab 8 minutes ago. What\'s actually going on right now?',
  },
  {
    id: 2, type: 'user',
    text: 'I just need a break, I\'ve been studying all day.',
  },
  {
    id: 3, type: 'agent',
    text: 'Fair — you put in real work. But here\'s the thing:',
  },
  {
    id: 4, type: 'context-card',
  },
  {
    id: 5, type: 'agent',
    text: 'You\'ve watched 2.3hr of basketball content today and haven\'t left your apartment. Willard Park is open until midnight — 6 min away.',
  },
  {
    id: 6, type: 'redirect-card',
  },
  {
    id: 7, type: 'actions',
  },
]

function AgentBubble({ text }) {
  return (
    <div style={{ alignSelf: 'flex-start', maxWidth: '85%' }}>
      <div style={{
        background: 'var(--chat-agent-bg)',
        borderRadius: '14px 14px 14px 4px',
        padding: '10px 13px',
        fontSize: '13px', lineHeight: 1.5, color: 'var(--text)',
      }}>{text}</div>
    </div>
  )
}

function UserBubble({ text }) {
  return (
    <div style={{ alignSelf: 'flex-end', maxWidth: '85%' }}>
      <div style={{
        background: 'var(--green)',
        borderRadius: '14px 14px 4px 14px',
        padding: '10px 13px',
        fontSize: '13px', lineHeight: 1.5, color: '#fff',
      }}>{text}</div>
    </div>
  )
}

function ContextCard() {
  return (
    <div style={{
      alignSelf: 'flex-start', maxWidth: '90%',
      background: 'var(--context-bg)',
      border: '1px solid var(--border)',
      borderRadius: '12px', padding: '12px',
      display: 'flex', flexDirection: 'column', gap: '8px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: '18px', height: '18px', borderRadius: '4px', background: 'var(--google-blue)', flexShrink: 0 }} />
        <span style={{ fontSize: '12px', color: 'var(--text)', lineHeight: 1.4 }}>
          <strong>CS161 Final</strong> — tomorrow 9:00am (<strong>9hr 46min away</strong>)
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: '18px', height: '18px', borderRadius: '4px', background: 'var(--google-green)', flexShrink: 0 }} />
        <span style={{ fontSize: '12px', color: 'var(--text)', lineHeight: 1.4 }}>
          Avg sleep this week: <strong>5.2 hours</strong>
        </span>
      </div>
    </div>
  )
}

function RedirectCard() {
  return (
    <div style={{
      alignSelf: 'flex-start', maxWidth: '90%',
      background: 'var(--green-light)',
      border: '1px solid var(--green-card-border)',
      borderRadius: '12px', padding: '12px',
    }}>
      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--green)', letterSpacing: '0.4px', textTransform: 'uppercase', marginBottom: '8px' }}>
        Redirect Suggestion
      </div>
      <div style={{ fontSize: '12px', color: 'var(--text)', lineHeight: 1.5, marginBottom: '10px' }}>
        Willard Park · 0.4mi · open until midnight<br />
        Drill: weak-hand layup, 3 sets of 10
      </div>
      <button style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        background: 'var(--green)', color: '#fff',
        fontSize: '11px', fontWeight: 600,
        borderRadius: '50px', border: 'none',
        padding: '7px 14px',
      }}>
        <i className="ti ti-map-pin" style={{ fontSize: '13px' }} />
        Get directions
      </button>
    </div>
  )
}

function ActionRow() {
  return (
    <div style={{ display: 'flex', gap: '8px', alignSelf: 'stretch' }}>
      <button style={{
        flex: 1, padding: '9px 12px',
        border: '1.5px solid var(--border)', background: 'transparent',
        color: 'var(--muted)', fontSize: '12px', fontWeight: 500,
        borderRadius: '50px',
      }}>
        I'll scroll for 15 min
      </button>
      <button style={{
        flex: 1, padding: '9px 12px',
        border: 'none', background: 'var(--green)',
        color: '#fff', fontSize: '12px', fontWeight: 600,
        borderRadius: '50px',
      }}>
        Let's go
      </button>
    </div>
  )
}

export default function InterventionPopup() {
  const [input, setInput] = useState('')

  return (
    <div style={{
      height: 'calc(100vh - 47px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#e5e7eb',
    }}>
      {/* Mock browser window */}
      <div style={{
        maxWidth: '860px', width: '100%', height: '580px',
        borderRadius: '16px', background: 'var(--browser-bg)',
        display: 'flex', overflow: 'hidden',
        boxShadow: '0 16px 64px rgba(0,0,0,.18)',
      }}>

        {/* Left — blurred page */}
        <div style={{
          flex: 1,
          background: 'linear-gradient(135deg, var(--browser-page) 0%, #6b7280 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: '22px', color: '#fff', opacity: 0.40, fontWeight: 600 }}>tiktok.com</span>
        </div>

        {/* Right panel — agent */}
        <div style={{
          width: '360px', flexShrink: 0,
          background: 'var(--card)',
          boxShadow: '-8px 0 32px rgba(0,0,0,.12)',
          display: 'flex', flexDirection: 'column',
        }}>

          {/* Header */}
          <div style={{ borderBottom: '1px solid var(--border)', padding: '18px 18px 14px' }}>
            {/* Top row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '16px' }}>🌱</span>
                <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '15px', color: 'var(--green)' }}>touch grass</span>
              </div>
              <button style={{
                width: '28px', height: '28px', borderRadius: '50%',
                border: '1px solid var(--border)', background: 'transparent',
                color: 'var(--muted)', fontSize: '14px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>✕</button>
            </div>

            {/* Title & subtitle */}
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginBottom: '3px' }}>
              Hey — hold on a second.
            </div>
            <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '10px' }}>
              11:04pm · CS161 final in 9hr 46min
            </div>

            {/* Vulnerability pill */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '5px',
              background: 'var(--red-badge-bg)', color: 'var(--red)',
              fontSize: '11px', fontWeight: 600,
              borderRadius: '50px', padding: '5px 10px',
            }}>
              <i className="ti ti-alert-circle" style={{ fontSize: '13px' }} />
              Score: 87 — high risk
            </div>
          </div>

          {/* Chat body */}
          <div style={{
            flex: 1, overflowY: 'auto',
            padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px',
          }}>
            {MESSAGES.map(msg => {
              if (msg.type === 'agent')        return <AgentBubble   key={msg.id} text={msg.text} />
              if (msg.type === 'user')         return <UserBubble    key={msg.id} text={msg.text} />
              if (msg.type === 'context-card') return <ContextCard   key={msg.id} />
              if (msg.type === 'redirect-card')return <RedirectCard  key={msg.id} />
              if (msg.type === 'actions')      return <ActionRow     key={msg.id} />
              return null
            })}
          </div>

          {/* Chat input */}
          <div style={{ borderTop: '1px solid var(--border)', padding: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Reply to the agent..."
              style={{
                flex: 1, padding: '8px 14px',
                border: '1.5px solid var(--border)', borderRadius: '20px',
                fontSize: '13px', outline: 'none', background: 'transparent',
                color: 'var(--text)',
              }}
              onFocus={e  => { e.target.style.borderColor = 'var(--green)' }}
              onBlur={e   => { e.target.style.borderColor = 'var(--border)' }}
            />
            <button style={{
              width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
              background: 'var(--green)', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff',
            }}>
              <i className="ti ti-send" style={{ fontSize: '14px' }} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
