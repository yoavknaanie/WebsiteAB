import React, { useMemo, useState } from 'react'
import { useSubmissions } from '../contexts/SubmissionsContext'
import toast from 'react-hot-toast'

function ChatBox({ conversation, viewerId, onSend }) {
  const [text, setText] = useState('')
  if (!conversation) return <div>No conversation</div>

  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, maxHeight: 360, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {conversation.messages.length === 0 ? (
          <div style={{ color: '#666' }}>No messages yet. Start the conversation.</div>
        ) : (
          conversation.messages.map((m) => (
            <div key={m.id} style={{ alignSelf: m.fromId === viewerId ? 'flex-end' : 'flex-start', background: m.fromId === viewerId ? 'var(--sage)' : '#efefef', color: m.fromId === viewerId ? '#fff' : '#000', padding: '8px 10px', borderRadius: 8, maxWidth: '80%' }}>
              {m.text}
              <div style={{ fontSize: '0.7rem', color: 'rgba(0,0,0,0.5)', marginTop: 6 }}>{new Date(m.createdAt).toLocaleString()}</div>
            </div>
          ))
        )}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a message" style={{ flex: 1, padding: '0.6rem', borderRadius: 8, border: '1px solid #ddd' }} />
        <button className="btn" onClick={() => { if (text.trim()) { onSend(text.trim()); setText('') } }}>Send</button>
      </div>
    </div>
  )
}

function MyBoard() {
  const { submissions, requests, viewerId, getSentRequests, addMessage, conversations, acceptRequest, cancelRequest } = useSubmissions()
  const mySubs = useMemo(() => submissions.filter((s) => s.ownerId === viewerId), [submissions, viewerId])
  const sent = getSentRequests()

  const [openSubmissionId, setOpenSubmissionId] = useState(null)
  const [activeConvId, setActiveConvId] = useState(null)
  const [tab, setTab] = useState('my') // 'my' or 'sent'

  const requestsBySubmission = (id) => requests.filter((r) => r.submissionId === id && r.status === 'pending')

  const handleAccept = (requestId) => {
    const convId = acceptRequest(requestId)
    toast.success('Request accepted')
    if (convId) setActiveConvId(convId)
  }

  const handleCancelSent = (requestId) => {
    console.log('[MyBoard] cancel request clicked', requestId)
    const ok = cancelRequest(requestId)
    if (ok) toast.success('Request cancelled')
    else toast.error('Could not cancel request')
  }

  const conv = conversations.find((c) => c.id === activeConvId)

  return (
    <section className="section">
      <h2>My Board</h2>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button className={`btn`} onClick={() => setTab('my')}>My Submissions</button>
        <button className={`btn`} onClick={() => setTab('sent')}>Sent Requests</button>
      </div>

      {tab === 'my' ? (
        <div>
          {mySubs.length === 0 ? (
            <div>
              <p>You have not created any submissions yet.</p>
            </div>
          ) : (
            mySubs.map((s) => (
              <div key={s.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>{s.title}</strong>
                    <div style={{ color: '#666' }}>{s.description}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <div style={{ fontSize: '0.9rem' }}>{requests.filter((r) => r.submissionId === s.id && r.status === 'pending').length} requests</div>
                    <button
                      className="btn"
                      style={{ width: 'auto' }}
                      onClick={() => {
                        const newId = openSubmissionId === s.id ? null : s.id
                        setOpenSubmissionId(newId)
                        // show quick feedback so it's clear the click worked
                        if (newId) {
                          toast.success('Opened requests')
                        }
                      }}
                    >
                      View requests
                    </button>
                  </div>
                </div>

                {openSubmissionId === s.id && (
                  <div style={{ marginTop: 8 }}>
                    {requestsBySubmission(s.id).length === 0 ? <div>No pending requests.</div> : (
                      requestsBySubmission(s.id).map((r) => (
                        <div key={r.id} style={{ borderTop: '1px solid #eee', paddingTop: 8, marginTop: 8 }}>
                          <div><strong>From:</strong> {r.fromId}</div>
                          {r.message && <div style={{ marginTop: 6 }}>{r.message}</div>}
                          <div style={{ marginTop: 6, display: 'flex', gap: 8 }}>
                            <button className="btn" onClick={() => handleAccept(r.id)}>Accept</button>
                            <button className="btn" onClick={() => { cancelRequest(r.id); toast('Request declined') }}>Decline</button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))
          )}

          {activeConvId && (
            <div style={{ marginTop: 18 }}>
              <h3>Chat</h3>
              <ChatBox conversation={conv} viewerId={viewerId} onSend={(text) => { addMessage(activeConvId, viewerId, text) }} />
            </div>
          )}
        </div>
      ) : (
        <div>
          <h3>Requests you sent</h3>
          {sent.length === 0 ? (
            <div>
              <p>You have not sent any requests.</p>
            </div>
          ) : (
            sent.map((r) => {
              const submission = submissions.find((s) => s.id === r.submissionId)
              return (
                <div key={r.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>{submission?.title || '—'}</strong>
                    <div style={{ color: '#666' }}>{r.message || <em>No message</em>}</div>
                    <div style={{ fontSize: '0.85rem', color: '#666' }}>Status: {r.status}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {r.status === 'pending' && <button className="btn" onClick={() => handleCancelSent(r.id)}>Cancel</button>}
                    {r.status === 'accepted' && <button className="btn" onClick={() => {
                      // open conversation if exists
                      const conv = conversations.find((c) => c.submissionId === r.submissionId && c.participants.includes(r.fromId))
                      if (conv) setActiveConvId(conv.id)
                    }}>Open chat</button>}
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}
    </section>
  )
}

export default MyBoard
