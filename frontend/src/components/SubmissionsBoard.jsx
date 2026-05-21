import React, { useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { useSubmissions } from '../contexts/SubmissionsContext'

const availabilityOptions = ['Multiple daily', 'Once daily', 'Every couple of days', 'Weekly', 'Other']
const communicationOptions = ['Chat', 'Voice Call', 'Video Call', 'Async Check-ins', 'Other']

// Small inline composer used when reaching out with a message
function Composer({ onSend, onCancel, initialMessage = '' }) {
  const [message, setMessage] = useState(initialMessage)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', minWidth: '260px' }}>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Write a short message to introduce yourself (optional)"
        style={{ width: '100%', minHeight: '70px', padding: '0.5rem', borderRadius: '8px', border: '1px solid #ccc' }}
      />
      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
        <button type="button" className="btn" onClick={() => onSend(message)}>Send</button>
        <button type="button" className="btn" onClick={() => onSend('')}>Skip</button>
      </div>
    </div>
  )
}

function SubmissionsBoard() {
  const { requests, addRequest, cancelRequest, viewerId } = useSubmissions()
  const [submissions, setSubmissions] = useState([])
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(true)
  const [submissionsError, setSubmissionsError] = useState('')
  const [filterAvailability, setFilterAvailability] = useState('')
  const [filterComms, setFilterComms] = useState([])
  const [filterLookingFor, setFilterLookingFor] = useState('')
  const [ageMin, setAgeMin] = useState('')
  const [ageMax, setAgeMax] = useState('')
  const [timezoneSearch, setTimezoneSearch] = useState('')
  const [bestId, setBestId] = useState(null)
  // requests are now stored in context
  const [openComposerId, setOpenComposerId] = useState(null)
  const [openCancelId, setOpenCancelId] = useState(null)

  const listRef = useRef(null)

  useEffect(() => {
    let isMounted = true

    async function loadSubmissions() {
      setIsLoadingSubmissions(true)
      setSubmissionsError('')

      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/submissions`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Could not load submissions.')
        }

        const normalizedSubmissions = (data.submissions || []).map((submission) => ({
          ...submission,
          createdAt: submission.created_at,
          ownerId: submission.user_id,
          lookingFor: [
            submission.looking_for1,
            submission.looking_for2,
            submission.looking_for3,
            submission.looking_for4,
            submission.looking_for5,
          ].filter(Boolean),
          communication: typeof submission.communication === 'string'
            ? submission.communication.split(',').map((item) => item.trim()).filter(Boolean)
            : submission.communication,
        }))

        if (isMounted) {
          setSubmissions(normalizedSubmissions)
        }
      } catch (error) {
        if (isMounted) {
          setSubmissionsError(error.message)
          setSubmissions([])
        }
      } finally {
        if (isMounted) {
          setIsLoadingSubmissions(false)
        }
      }
    }

    loadSubmissions()

    return () => {
      isMounted = false
    }
  }, [])

  const toggleComm = (label) => {
    setFilterComms((prev) => (prev.includes(label) ? prev.filter((c) => c !== label) : [...prev, label]))
  }

  // Basic scoring function to pick best match for given filters
  const scoreSubmission = (s) => {
    let score = 0
    // availability exact match
    if (filterAvailability && s.availability) {
      const subAvail = s.availability === 'Other' ? s.otherAvailability || '' : s.availability
      if (subAvail && subAvail.toLowerCase().includes(filterAvailability.toLowerCase())) score += 3
    }
    // communication overlap
    if (filterComms.length) {
      const comms = Array.isArray(s.communication) ? s.communication : (s.communication ? [s.communication] : [])
      for (const c of filterComms) if (comms.includes(c)) score += 2
    }
    // lookingFor keywords
    if (filterLookingFor.trim()) {
      const keywords = filterLookingFor.toLowerCase().split(',').map((k) => k.trim()).filter(Boolean)
      const target = (Array.isArray(s.lookingFor) ? s.lookingFor.join(' ') : String(s.lookingFor || '')).toLowerCase()
      for (const k of keywords) if (target.includes(k)) score += 1
    }
    // age range
    const age = Number(s.age)
    if (ageMin && !isNaN(ageMin) && age >= Number(ageMin)) score += 1
    if (ageMax && !isNaN(ageMax) && age <= Number(ageMax)) score += 1
    // timezone fuzzy match
    if (timezoneSearch && s.timezone && s.timezone.toLowerCase().includes(timezoneSearch.toLowerCase())) score += 1

    return score
  }

  const filtered = useMemo(() => {
    if (!submissions || submissions.length === 0) return []
    return submissions.filter((s) => {
      // availability filter
      if (filterAvailability) {
        const subAvail = s.availability === 'Other' ? s.otherAvailability || '' : s.availability || ''
        if (!subAvail.toLowerCase().includes(filterAvailability.toLowerCase())) return false
      }
      // communication filter - require that submission has all selected comms
      if (filterComms.length) {
        const comms = Array.isArray(s.communication) ? s.communication : (s.communication ? [s.communication] : [])
        for (const c of filterComms) if (!comms.includes(c)) return false
      }
      // lookingFor keywords - require at least one
      if (filterLookingFor.trim()) {
        const keywords = filterLookingFor.toLowerCase().split(',').map((k) => k.trim()).filter(Boolean)
        const target = (Array.isArray(s.lookingFor) ? s.lookingFor.join(' ') : String(s.lookingFor || '')).toLowerCase()
        if (!keywords.some((k) => target.includes(k))) return false
      }
      // age range
      const age = Number(s.age)
      if (ageMin && !isNaN(ageMin) && age < Number(ageMin)) return false
      if (ageMax && !isNaN(ageMax) && age > Number(ageMax)) return false
      // timezone
      if (timezoneSearch && s.timezone && !s.timezone.toLowerCase().includes(timezoneSearch.toLowerCase())) return false

      return true
    })
  }, [submissions, filterAvailability, filterComms, filterLookingFor, ageMin, ageMax, timezoneSearch])

  const findBest = () => {
    if (filtered.length === 0) return setBestId(null)
    let best = null
    let bestScore = -1
    for (const s of filtered) {
      const sc = scoreSubmission(s)
      if (sc > bestScore) {
        bestScore = sc
        best = s
      }
    }
    setBestId(best ? best.id : null)
    // scroll into view
    setTimeout(() => {
      const el = document.getElementById(`submission-${best?.id}`)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 120)
  }

  const clearFilters = () => {
    setFilterAvailability('')
    setFilterComms([])
    setFilterLookingFor('')
    setAgeMin('')
    setAgeMax('')
    setTimezoneSearch('')
    setBestId(null)
  }

  const requestConnection = (id, message = '') => {
    // delegate to context
    addRequest(id, message)
    setOpenComposerId(null)
    toast.success('Connection request sent' + (message ? ' with your message.' : '.'))
  }

  const openComposer = (id) => {
    setOpenComposerId(id)
  }

  return (
    <section className="section">
      <h2>Submissions Board</h2>

      {isLoadingSubmissions ? (
        <p>Loading submissions...</p>
      ) : submissionsError ? (
        <p>{submissionsError}</p>
      ) : (!submissions || submissions.length === 0) ? (
        <p>No submissions yet. Be the first to submit the questionnaire!</p>
      ) : (
        <>
          <div style={{ marginBottom: '1rem', display: 'grid', gap: '0.5rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <label>
                Availability:
                <select value={filterAvailability} onChange={(e) => setFilterAvailability(e.target.value)} style={{ marginLeft: '0.5rem' }}>
                  <option value="">Any</option>
                  {availabilityOptions.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                Age between:
                <input type="number" placeholder="min" value={ageMin} onChange={(e) => setAgeMin(e.target.value)} style={{ width: '80px' }} />
                —
                <input type="number" placeholder="max" value={ageMax} onChange={(e) => setAgeMax(e.target.value)} style={{ width: '80px' }} />
              </label>

              <label>
                Timezone contains:
                <input value={timezoneSearch} onChange={(e) => setTimezoneSearch(e.target.value)} placeholder="UTC +X" style={{ marginLeft: '0.5rem' }} />
              </label>
            </div>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div>
                <div style={{ marginBottom: '0.25rem' }}>Preferred Communication (must include):</div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {communicationOptions.map((c) => (
                    <label key={c} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                      <input type="checkbox" checked={filterComms.includes(c)} onChange={() => toggleComm(c)} />
                      <small>{c}</small>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ flex: 1 }}>
                <label>Looking for keywords (comma separated):
                  <input placeholder="e.g. accountability, study, design" value={filterLookingFor} onChange={(e) => setFilterLookingFor(e.target.value)} style={{ marginLeft: '0.5rem', width: '60%' }} />
                </label>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="button" onClick={clearFilters} className="btn">Clear Filters</button>
                <button type="button" onClick={findBest} className="btn">Find Best Match</button>
              </div>
            </div>
          </div>

          <div ref={listRef} className="submissions-list">
            {filtered.map((s) => {
              const isBest = bestId === s.id
              const mySentRequest = requests.find((r) => r.submissionId === s.id && r.fromId === viewerId && r.status === 'pending')
              const requested = !!mySentRequest
              return (
                <article
                  id={`submission-${s.id}`}
                  key={s.id}
                  className="card"
                  style={{
                    position: 'relative',
                    paddingBottom: '2.4rem', // room for the action button / composer
                    border: isBest ? '2px solid var(--sage)' : undefined,
                    boxShadow: isBest ? '0 6px 18px rgba(0,0,0,0.06)' : undefined
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <strong>{s.title}</strong>
                    <small style={{ color: '#666' }}>{new Date(s.createdAt).toLocaleString()}</small>
                  </div>
                  <p style={{ margin: '0.5rem 0' }}>{s.description}</p>
                  <div style={{ fontSize: '0.95rem', color: '#333' }}>
                    <div>Age: {s.age}</div>
                    <div>Gender: {s.gender === 'Other' ? s.otherGender : s.gender}</div>
                    <div>Availability: {s.availability === 'Other' ? s.otherAvailability : s.availability}</div>
                    <div>Communication: {Array.isArray(s.communication) ? s.communication.join(', ') : s.communication}</div>
                    <div>Looking for: {Array.isArray(s.lookingFor) ? s.lookingFor.filter(Boolean).join(', ') : s.lookingFor}</div>
                    <div>Timezone: {s.timezone}</div>
                  </div>
                  <div style={{ position: 'absolute', right: '12px', bottom: '12px' }}>
                    {openComposerId === s.id ? (
                      <Composer
                        onSend={(msg) => requestConnection(s.id, msg)}
                        onCancel={() => setOpenComposerId(null)}
                        initialMessage={mySentRequest?.message || ''}
                      />
                    ) : openCancelId === s.id ? (
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        
                        <button
                          type="button"
                          className="btn"
                          onClick={() => {
                            // cancel the viewer's sent request for this submission
                            console.log('[SubmissionsBoard] cancel clicked for', mySentRequest?.id)
                            if (mySentRequest) {
                              const ok = cancelRequest(mySentRequest.id)
                              if (ok) toast.success('Request cancelled')
                              else toast.error('Failed to cancel')
                            }
                            setOpenCancelId(null)
                          }}
                        >
                          Cancel Request
                        </button>
                        <button type="button" className="btn" onClick={() => setOpenCancelId(null)}>Keep</button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="btn"
                        onClick={() => {
                          if (requested) {
                            // open cancel confirmation
                            setOpenCancelId(s.id)
                            setOpenComposerId(null)
                          } else {
                            openComposer(s.id)
                          }
                        }}
                      >
                        {requested ? 'Request Sent' : 'Reach Out'}
                      </button>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        </>
      )}
    </section>
  )
}

export default SubmissionsBoard
