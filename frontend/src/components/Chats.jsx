import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate, useSearchParams } from 'react-router-dom'

const POLLING_INTERVAL_MS = 5000

function getCurrentUserId() {
  const token = sessionStorage.getItem('token')
  if (!token) return null

  try {
    const payload = token.split('.')[1]
    const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/')
    const paddedPayload = normalizedPayload.padEnd(normalizedPayload.length + ((4 - (normalizedPayload.length % 4)) % 4), '=')
    const decodedPayload = JSON.parse(window.atob(paddedPayload))
    return decodedPayload.userId
  } catch {
    return null
  }
}

function formatDate(value) {
  return value ? new Date(value).toLocaleString() : ''
}

function ChatSidebar({ chats, activeChatId, onSelectChat }) {
  if (chats.length === 0) {
    return (
      <aside style={styles.sidebar}>
        <p style={styles.emptyText}>No chats yet.</p>
      </aside>
    )
  }

  return (
    <aside style={styles.sidebar}>
      {chats.map((chat) => (
        <button
          key={chat.id}
          type="button"
          style={{
            ...styles.chatListButton,
            ...(Number(activeChatId) === Number(chat.id) ? styles.activeChatListButton : {}),
          }}
          onClick={() => onSelectChat(chat.id)}
        >
          <strong>{chat.other_username || 'Accountability buddy'}</strong>
          <span>{chat.submission_title || 'Conversation'}</span>
          <small>{chat.last_message_body || 'No messages yet'}</small>
        </button>
      ))}
    </aside>
  )
}

function ChatMessages({ activeChat, messages, currentUserId, isLoading }) {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (!activeChat) {
    return <div style={styles.placeholder}>Select a chat to read messages.</div>
  }

  if (isLoading) {
    return <div style={styles.placeholder}>Loading messages...</div>
  }

  return (
    <div style={styles.messagesPane}>
      {messages.length === 0 ? (
        <div style={styles.placeholder}>No messages yet.</div>
      ) : (
        messages.map((message) => {
          const isMine = Number(message.sender_id) === Number(currentUserId)
          return (
            <div
              key={message.id}
              style={{
                ...styles.messageBubble,
                ...(isMine ? styles.myMessageBubble : styles.theirMessageBubble),
              }}
            >
              <div>{message.body}</div>
              <small style={styles.messageMeta}>
                {message.sender_username} - {formatDate(message.created_at)}
              </small>
            </div>
          )
        })
      )}
      <div ref={bottomRef} />
    </div>
  )
}

function MessageInput({ disabled, onSend }) {
  const [message, setMessage] = useState('')

  const handleSubmit = (event) => {
    event.preventDefault()
    const trimmedMessage = message.trim()
    if (!trimmedMessage) return

    onSend(trimmedMessage)
    setMessage('')
  }

  return (
    <form style={styles.messageForm} onSubmit={handleSubmit}>
      <textarea
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        placeholder="Write a message"
        disabled={disabled}
        style={styles.messageTextarea}
      />
      <button type="submit" className="btn" disabled={disabled || !message.trim()}>
        Send
      </button>
    </form>
  )
}

export default function Chats() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [chats, setChats] = useState([])
  const [messages, setMessages] = useState([])
  const [activeChatId, setActiveChatId] = useState(searchParams.get('chatId'))
  const [isLoadingChats, setIsLoadingChats] = useState(true)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [chatsError, setChatsError] = useState('')
  const [messagesError, setMessagesError] = useState('')
  const [isSending, setIsSending] = useState(false)

  const token = sessionStorage.getItem('token')
  const currentUserId = getCurrentUserId()

  const activeChat = useMemo(
    () => chats.find((chat) => Number(chat.id) === Number(activeChatId)),
    [chats, activeChatId],
  )

  const loadChats = useCallback(async () => {
    if (!token) return

    setChatsError('')

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/chats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Could not load chats.')
      }

      setChats(data.chats || [])

      if (!activeChatId && data.chats?.length) {
        setActiveChatId(data.chats[0].id)
        setSearchParams({ chatId: data.chats[0].id })
      }
    } catch (error) {
      setChatsError(error.message)
    } finally {
      setIsLoadingChats(false)
    }
  }, [activeChatId, setSearchParams, token])

  const loadMessages = useCallback(async (chatId, { silent = false } = {}) => {
    if (!token || !chatId) return

    if (!silent) {
      setIsLoadingMessages(true)
    }
    setMessagesError('')

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/chats/${chatId}/messages`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Could not load messages.')
      }

      setMessages(data.messages || [])
    } catch (error) {
      setMessagesError(error.message)
    } finally {
      if (!silent) {
        setIsLoadingMessages(false)
      }
    }
  }, [token])

  useEffect(() => {
    if (!token) {
      setIsLoadingChats(false)
      return
    }

    loadChats()
  }, [loadChats, token])

  useEffect(() => {
    const chatIdFromUrl = searchParams.get('chatId')
    if (chatIdFromUrl && chatIdFromUrl !== activeChatId) {
      setActiveChatId(chatIdFromUrl)
    }
  }, [activeChatId, searchParams])

  useEffect(() => {
    if (!activeChatId) {
      setMessages([])
      return
    }

    loadMessages(activeChatId)

    const intervalId = window.setInterval(() => {
      loadMessages(activeChatId, { silent: true })
    }, POLLING_INTERVAL_MS)

    return () => window.clearInterval(intervalId)
  }, [activeChatId, loadMessages, token])

  const selectChat = (chatId) => {
    setActiveChatId(chatId)
    setSearchParams({ chatId })
  }

  const sendMessage = async (message) => {
    if (!activeChatId || !token) return

    setIsSending(true)

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/chats/${activeChatId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Could not send message.')
      }

      setMessages((previousMessages) => [...previousMessages, data.message])
      loadChats()
    } catch (error) {
      toast.error(error.message)
    } finally {
      setIsSending(false)
    }
  }

  if (!token) {
    return (
      <section className="section">
        <h2>Your Chats</h2>
        <p>Please log in to view your chats.</p>
        <button type="button" className="btn" onClick={() => navigate('/login')}>
          Log In
        </button>
      </section>
    )
  }

  return (
    <section className="section">
      <h2>Your Chats</h2>

      {isLoadingChats ? (
        <p>Loading chats...</p>
      ) : chatsError ? (
        <p>{chatsError}</p>
      ) : (
        <div style={styles.chatShell}>
          <ChatSidebar chats={chats} activeChatId={activeChatId} onSelectChat={selectChat} />

          <main style={styles.chatPanel}>
            <header style={styles.chatHeader}>
              <strong>{activeChat?.other_username || 'Conversation'}</strong>
              <span>{activeChat?.submission_title || ''}</span>
            </header>

            {messagesError && <p style={styles.errorText}>{messagesError}</p>}

            <ChatMessages
              activeChat={activeChat}
              messages={messages}
              currentUserId={currentUserId}
              isLoading={isLoadingMessages}
            />

            <MessageInput disabled={!activeChat || isSending} onSend={sendMessage} />
          </main>
        </div>
      )}
    </section>
  )
}

const styles = {
  chatShell: {
    display: 'grid',
    gridTemplateColumns: 'minmax(180px, 260px) minmax(0, 1fr)',
    gap: '1rem',
    alignItems: 'stretch',
  },
  sidebar: {
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    minHeight: '520px',
    maxHeight: '70vh',
    overflowY: 'auto',
    padding: '0.5rem',
    backgroundColor: '#fff',
  },
  chatListButton: {
    width: '100%',
    display: 'grid',
    gap: '0.25rem',
    padding: '0.75rem',
    border: '1px solid transparent',
    borderRadius: '8px',
    backgroundColor: 'transparent',
    textAlign: 'left',
    cursor: 'pointer',
    color: 'var(--dark)',
  },
  activeChatListButton: {
    borderColor: 'var(--sage)',
    backgroundColor: '#f4f7ef',
  },
  chatPanel: {
    minHeight: '520px',
    maxHeight: '70vh',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    display: 'grid',
    gridTemplateRows: 'auto minmax(0, 1fr) auto',
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  chatHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '1rem',
    padding: '1rem',
    borderBottom: '1px solid #e5e7eb',
  },
  messagesPane: {
    padding: '1rem',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  messageBubble: {
    maxWidth: '75%',
    padding: '0.75rem 0.9rem',
    borderRadius: '8px',
    overflowWrap: 'anywhere',
  },
  myMessageBubble: {
    alignSelf: 'flex-end',
    backgroundColor: 'var(--sage)',
    color: '#fff',
  },
  theirMessageBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#f3f4f6',
    color: 'var(--dark)',
  },
  messageMeta: {
    display: 'block',
    marginTop: '0.35rem',
    opacity: 0.75,
  },
  messageForm: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) auto',
    gap: '0.75rem',
    padding: '1rem',
    borderTop: '1px solid #e5e7eb',
  },
  messageTextarea: {
    minHeight: '52px',
    maxHeight: '120px',
    resize: 'vertical',
    padding: '0.75rem',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    font: 'inherit',
  },
  placeholder: {
    padding: '1rem',
    color: '#666',
  },
  emptyText: {
    color: '#666',
    margin: '0.5rem',
  },
  errorText: {
    margin: '0.75rem 1rem 0',
    color: '#b91c1c',
  },
}
