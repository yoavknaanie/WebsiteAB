import React, { useMemo, useState } from 'react'
import { useSubmissions } from '../contexts/SubmissionsContext'

function ChatBox({ conversation, viewerId, onSend }) {
  const [text, setText] = useState('')
  if (!conversation) return <div>No conversation</div>

  const last = conversation.messages[conversation.messages.length - 1]

  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: '0.9rem', color: '#666' }}>
        {conversation.messages.length === 0 ? 'No messages yet' : `Last: ${last.text} — ${new Date(last.createdAt).toLocaleString()}`}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a message" style={{ flex: 1, padding: '0.6rem', borderRadius: 8, border: '1px solid #ddd' }} />
        <button className="btn" onClick={() => { if (text.trim()) { onSend(text.trim()); setText('') } }}>Send</button>
      </div>
      <div style={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {conversation.messages.map((m) => (
          <div key={m.id} style={{ alignSelf: m.fromId === viewerId ? 'flex-end' : 'flex-start', background: m.fromId === viewerId ? 'var(--sage)' : '#efefef', color: m.fromId === viewerId ? '#fff' : '#000', padding: '8px 10px', borderRadius: 8, maxWidth: '80%' }}>
            {m.text}
            <div style={{ fontSize: '0.7rem', color: 'rgba(0,0,0,0.5)', marginTop: 6 }}>{new Date(m.createdAt).toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Chats() {
  const { conversations, submissions, viewerId, addMessage } = useSubmissions()
  const myConvs = useMemo(() => conversations.filter((c) => c.participants?.includes(viewerId)), [conversations, viewerId])
  const [activeConvId, setActiveConvId] = useState(null)

  const openConv = (id) => setActiveConvId((prev) => (prev === id ? null : id))

  return (
    <section className="section">
      <h2>Your Chats</h2>
      {myConvs.length === 0 ? (
        <div>
          <p>You have no active chats yet.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {myConvs.map((c) => {
            const submission = submissions.find((s) => s.id === c.submissionId)
            const other = c.participants.find((p) => p !== viewerId) || '—'
            const last = c.messages[c.messages.length - 1]
            return (
              <div key={c.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>{submission?.title || 'Conversation'}</strong>
                    <div style={{ color: '#666' }}>{submission?.description ? submission.description.slice(0, 120) : ''}</div>
                    <div style={{ fontSize: '0.85rem', color: '#666', marginTop: 6 }}>{last ? `${last.text.slice(0, 80)} — ${new Date(last.createdAt).toLocaleString()}` : 'No messages yet'}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <div style={{ fontSize: '0.85rem', color: '#666' }}>{other}</div>
                    <button className="btn" onClick={() => openConv(c.id)}>{activeConvId === c.id ? 'Close' : 'Open'}</button>
                  </div>
                </div>

                {activeConvId === c.id && (
                  <div style={{ marginTop: 12 }}>
                    <ChatBox conversation={c} viewerId={viewerId} onSend={(text) => addMessage(c.id, viewerId, text)} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
