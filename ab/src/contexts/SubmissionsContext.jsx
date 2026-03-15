import React, { createContext, useContext, useEffect, useState } from 'react'

const SubmissionsContext = createContext(null)

const STORAGE_SUBMISSIONS = 'ab_submissions_v1'
const STORAGE_REQUESTS = 'ab_requests_v1'
const STORAGE_CONVERSATIONS = 'ab_conversations_v1'
const STORAGE_VIEWER = 'ab_viewer_v1'

function makeId(prefix = '') {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export function SubmissionsProvider({ children }) {
  const [submissions, setSubmissions] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_SUBMISSIONS)
      return raw ? JSON.parse(raw) : []
    } catch (e) {
      console.error('Failed to read submissions from localStorage', e)
      return []
    }
  })

  const [requests, setRequests] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_REQUESTS)
      return raw ? JSON.parse(raw) : []
    } catch (e) {
      console.error('Failed to read requests from localStorage', e)
      return []
    }
  })

  const [conversations, setConversations] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_CONVERSATIONS)
      return raw ? JSON.parse(raw) : []
    } catch (e) {
      console.error('Failed to read conversations from localStorage', e)
      return []
    }
  })

  const [viewerId, setViewerId] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_VIEWER)
      if (raw) return raw
      const id = makeId('u_')
      localStorage.setItem(STORAGE_VIEWER, id)
      return id
    } catch (e) {
      console.error('Failed to read/create viewer id', e)
      return makeId('u_')
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_SUBMISSIONS, JSON.stringify(submissions))
    } catch (e) {
      console.error('Failed to write submissions to localStorage', e)
    }
  }, [submissions])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_REQUESTS, JSON.stringify(requests))
    } catch (e) {
      console.error('Failed to write requests to localStorage', e)
    }
  }, [requests])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_CONVERSATIONS, JSON.stringify(conversations))
    } catch (e) {
      console.error('Failed to write conversations to localStorage', e)
    }
  }, [conversations])

  // Submissions
  const addSubmission = (submission) => {
    const record = {
      id: makeId('s_'),
      createdAt: new Date().toISOString(),
      ownerId: viewerId,
      ...submission
    }
    setSubmissions((prev) => [record, ...prev])
    return record.id
  }

  const clearSubmissions = () => setSubmissions([])

  // Requests
  const addRequest = (submissionId, message = '') => {
    const req = {
      id: makeId('r_'),
      submissionId,
      fromId: viewerId,
      message,
      status: 'pending', // pending | accepted | cancelled | declined
      createdAt: new Date().toISOString()
    }
    setRequests((prev) => [req, ...prev])
    return req.id
  }

  const cancelRequest = (requestId) => {
    console.log('[SubmissionsContext] cancelRequest called for', requestId)
    setRequests((prev) => prev.map((r) => (r.id === requestId ? { ...r, status: 'cancelled' } : r)))
    return true
  }

  const declineRequest = (requestId) => {
    setRequests((prev) => prev.map((r) => (r.id === requestId ? { ...r, status: 'declined' } : r)))
  }

  // Accept a request: mark accepted and create/return a conversation id
  const acceptRequest = (requestId) => {
    const req = requests.find((r) => r.id === requestId)
    if (!req) return null
    setRequests((prev) => prev.map((r) => (r.id === requestId ? { ...r, status: 'accepted' } : r)))
    // create conversation between submission owner and fromId
    const submission = submissions.find((s) => s.id === req.submissionId)
    const participants = [req.fromId, submission?.ownerId || viewerId]
    // check if conversation exists
    let conv = conversations.find((c) => c.submissionId === req.submissionId && c.participants?.includes(req.fromId) && c.participants?.includes(submission?.ownerId))
    if (conv) return conv.id
    const convRecord = {
      id: makeId('c_'),
      submissionId: req.submissionId,
      participants,
      messages: [],
      createdAt: new Date().toISOString()
    }
    setConversations((prev) => [convRecord, ...prev])
    return convRecord.id
  }

  const addMessage = (conversationId, fromId, text) => {
    const msg = { id: makeId('m_'), fromId, text, createdAt: new Date().toISOString() }
    setConversations((prev) => prev.map((c) => (c.id === conversationId ? { ...c, messages: [...c.messages, msg] } : c)))
    return msg.id
  }

  // Helpers
  const getSentRequests = () => requests.filter((r) => r.fromId === viewerId)
  const getRequestsForSubmission = (submissionId) => requests.filter((r) => r.submissionId === submissionId && r.status === 'pending')

  // (removed demo data helper)

  return (
    <SubmissionsContext.Provider value={{
      submissions,
      addSubmission,
      clearSubmissions,
      requests,
      addRequest,
      cancelRequest,
      declineRequest,
      acceptRequest,
      getSentRequests,
      getRequestsForSubmission,
      conversations,
      addMessage,
      viewerId
    }}>
      {children}
    </SubmissionsContext.Provider>
  )
}

export function useSubmissions() {
  const ctx = useContext(SubmissionsContext)
  if (!ctx) throw new Error('useSubmissions must be used within SubmissionsProvider')
  return ctx
}

export default SubmissionsContext
