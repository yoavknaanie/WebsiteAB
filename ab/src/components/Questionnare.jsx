

// export default Questionnaire
import React, { useState, useEffect } from 'react'

// ======================= CONSTANTS =======================
const availabilityOptions = ['Multiple daily', 'Once daily', 'Every couple of days', 'Weekly', 'Other']

const communicationOptions = [
  { label: 'Chat' },  { label: 'Voice Call' },  { label: 'Video Call' },
  {
    label: 'Async Check-ins',
    info: "Check in and send updates whenever you're free. No need to be online at the same time."
  },
  { label: 'Other' }
]

// timezone options mapped to example cities
const timezoneOptions = [
  { key: '+0', cities: ['London', 'Lisbon', 'Casablanca'] },
  { key: '+1', cities: ['Berlin', 'Paris', 'Rome'] },
  { key: '+2', cities: ['Cairo', 'Athens', 'Johannesburg'] },
  { key: '+3', cities: ['Moscow', 'Riyadh'] },
  { key: '+4', cities: ['Dubai', 'Baku'] },
  { key: '+5', cities: ['Karachi'] },
  { key: '+5:30', cities: ['Mumbai', 'Colombo'] },
  { key: '+6', cities: ['Dhaka'] },
  { key: '+7', cities: ['Bangkok', 'Jakarta'] },
  { key: '+8', cities: ['Beijing', 'Singapore', 'Perth'] },
  { key: '+9', cities: ['Tokyo', 'Seoul'] },
  { key: '+10', cities: ['Sydney', 'Port Moresby'] },
  { key: '-1', cities: ['Azores'] },
  { key: '-2', cities: ['South Georgia'] },
  { key: '-3', cities: ['Buenos Aires'] },
  { key: '-4', cities: ['Santo Domingo'] },
  { key: '-5', cities: ['New York', 'Toronto'] },
  { key: '-6', cities: ['Chicago', 'Mexico City'] },
  { key: '-7', cities: ['Denver'] },
  { key: '-8', cities: ['Los Angeles', 'Vancouver'] },
  { key: '-9', cities: ['Anchorage'] },
  { key: '-10', cities: ['Honolulu'] }
]

// ======================= COMPONENT =======================
function Questionnaire() {
  // ------------------- STATE -------------------
  const [formData, setFormData] = useState({
    title: '', age: null, gender: '', otherGender: '', timezone: '', 
    description: '', goals: '', lookingFor: ['', '', '', '', ''],
    availability: '', otherAvailability: '', communication: [],
    communicationOther: '', constraints: ''
  })
  const [submissions, setSubmissions] = useState([])
  const [hasConstraints, setHasConstraints] = useState(false)
  const [submitted, setSubmitted] = useState(true)
  const [errors, setErrors] = useState({})

  // ------------------- DERIVED -------------------
  const titlePlaceholder = `Ex. ${formData.age || ''}${formData.gender || ''} ${formData.timezone || ''} | Looking for a daily study buddy`.trim()

  // ------------------- EFFECT -------------------
  // UTC timezone string
  const getUTCOffset = () => {
    const offsetMinutes = -new Date().getTimezoneOffset()
    const sign = offsetMinutes >= 0 ? '+' : '-'
    const hours = Math.floor(Math.abs(offsetMinutes) / 60)
    const minutes = Math.abs(offsetMinutes) % 60
    return `UTC ${sign}${hours}${minutes ? `:${minutes.toString().padStart(2,'0')}` : ''}`
  }

  // Set timezone on mount
  useEffect(() => {
    const utcOffset = getUTCOffset()
    setFormData((prev) => ({ ...prev, timezone: utcOffset }))
  }, [])

  // ------------------- HANDLERS -------------------
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    if (type === 'checkbox') {
      setFormData((prev) => {
        const current = prev[name]
        if (checked) return { ...prev, [name]: [...current, value] }
        return { ...prev, [name]: current.filter((v) => v !== value) }
      })
      // clear communication error when user interacts with communication checkboxes
      if (name === 'communication' && checked) {
        setErrors((prev) => ({ ...prev, communication: undefined }))
      }
    } else {
      setFormData({ ...formData, [name]: value })
    }
  }

  const handleLookingForChange = (index, value) => {
    const updated = [...formData.lookingFor]
    updated[index] = value
    setFormData({ ...formData, lookingFor: updated })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setSubmitted(true)
  if (!formData.title) return  // stops submission if empty

    // validate at least one preferred communication selected
    if (!formData.communication || formData.communication.length === 0) {
      setErrors((prev) => ({ ...prev, communication: 'Please select at least one communication method' }))
      return
    }

    setSubmissions([...submissions, formData])
    setFormData({
      title: '', age: null, gender: '', otherGender: '', timezone: formData.timezone,
      description: '', goals: '', lookingFor: ['', '', '', '', ''],
      availability: '', otherAvailability: '', communication: [],
      communicationOther: '', constraints: ''
    })
    setHasConstraints(false)
  }

  // current detected offset (used to show as the default in the select)
  const detected = getUTCOffset()

  // ------------------- RENDER -------------------
  return (
    <section id="questionnaire" className="section">
      <h2>Looking for a Buddy Questionnaire</h2>

      <form onSubmit={handleSubmit}>
        {/* Age + Gender */}
        <div className="row">
          <div className="form-field">
            <label htmlFor="age">Age<span className="req">*</span></label>
            <input type="number" id="age" name="age" value={formData.age} onChange={handleChange} 
              min={18} max={100} required className="form-input"
            />
          </div>

          <div className="form-field">
            <label htmlFor="gender">Gender<span className="req">*</span></label>
            <select id="gender" name="gender" value={formData.gender} onChange={handleChange} 
              required className="form-select"
            >
              <option value="">Select Gender</option>
              <option value="M">M</option>
              <option value="F">F</option>
              <option value="Other">Other</option>
            </select>

            {formData.gender === 'Other' && (
              <div style={{ marginTop: 8 }}>
                <input id="otherGender" type="text" name="otherGender" placeholder="Please specify" 
                  value={formData.otherGender} onChange={handleChange} required className="form-input"
                />
              </div>
            )}
          </div>
        </div>

        {/* Timezone: keep display same (readOnly) but provide an optional dropdown to change it */}
        <div className="form-field">
          <label htmlFor="timezone">Timezone</label>
          <input type="text" id="timezone" name="timezone" value={formData.timezone} readOnly className="form-input" />

          <div style={{ marginTop: 8 }}>
            <label style={{ display: 'block', fontSize: '0.9rem', color: '#444', marginBottom: 6 }}>Change timezone (optional)</label>
            <select id="timezone-select" name="timezone" value={formData.timezone} onChange={handleChange} className="form-select">
              <option value={detected}>{detected} (detected)</option>
              {timezoneOptions.map((t) => {
                const val = `UTC ${t.key}`
                const detected = getUTCOffset()
                const label = `${val} — ${t.cities.join(', ')}${detected === val ? ' (detected)' : ''}`
                return <option key={t.key} value={val}>{label}</option>
              })}
            </select>
            <div style={{ color: '#666', fontSize: '0.9rem', marginTop: 6 }}>
              If your city isn't listed, pick the nearest UTC offset. Selecting an option will update the timezone shown above.
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="form-field">
          <label htmlFor="title">Title<span className="req">*</span></label>
          <input type="text" id="title" name="title" placeholder={titlePlaceholder} 
            value={formData.title} onChange={handleChange} required className="form-input"
          />
        </div>

        {/* Description */}
        <div className="form-field">
          <label htmlFor="description">Description</label>
          <textarea id="description" name="description" value={formData.description}
            onChange={handleChange} className="form-textarea"
          />
        </div>

        {/* Goals */}
        <div className="form-field">
          <label htmlFor="goals">Goals</label>
          <textarea id="goals" name="goals" value={formData.goals} onChange={handleChange}
            className="form-textarea"
          />
        </div>

        {/* Looking for in a Buddy */}
        <div className="form-field">
          <label>Looking for in a Buddy (up to 5):</label>
          {formData.lookingFor.map((item, i) => (
            <input key={i} type="text" placeholder={`#${i + 1}`} value={item}
              onChange={(e) => handleLookingForChange(i, e.target.value)} className="form-input"
            />
          ))}
        </div>

        {/* Availability */}
        <div className="form-field">
          <label htmlFor="availability">Availability<span className="req">*</span></label>
          <select id="availability" name="availability" required value={formData.availability}
            onChange={handleChange} className="form-select"
          >
            <option value="">Select Availability</option>
            {availabilityOptions.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>

          {formData.availability === 'Other' && (
            <textarea name="otherAvailability" value={formData.otherAvailability}
              onChange={handleChange} placeholder="Please describe your availability"
              className="form-textarea" style={{ minHeight: '70px' }}
            />
          )}
        </div>

        {/* Communication */}
        <div className="form-field">
          <label>Preferred Communication<span className="req">*</span></label>
          <div className="checkbox-group">
            {communicationOptions.map((option) => (
              <label key={option.label}>
                <input type="checkbox" name="communication" value={option.label}
                  checked={formData.communication.includes(option.label)}
                  onChange={handleChange}
                />
                <span className="tooltip">
                  {option.label}
                  {option.info && <span className="info-icon">i</span>}
                  {option.info && <span className="tooltip-text">{option.info}</span>}
                </span>
              </label>
            ))}
          </div>

          {formData.communication.includes('Other') && (
            <div style={{ marginTop: 8 }}>
              <label htmlFor="communicationOther">Please specify <span className="req">*</span></label>
              <input id="communicationOther" type="text" name="communicationOther" value={formData.communicationOther}
                onChange={handleChange} placeholder="Please specify other communication methods"
                required className="form-input"
              />
            </div>
          )}

          {errors.communication && <div style={{ color: '#d32f2f', marginTop: 6 }}>{errors.communication}</div>}
        </div>

        {/* Constraints Switch */}
        <div className="form-field">
          <label style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            Availability and Communication Constraints
            <div className="switch-wrapper">
              <input
                type="checkbox"
                checked={hasConstraints}
                onChange={(e) => setHasConstraints(e.target.checked)}
                className="switch-input"
              />
              <span
                className="switch-slider"
                style={{
                  backgroundColor: hasConstraints ? 'var(--sage)' : '#ccc'
                }}
              >
                <span
                  className="switch-knob"
                  style={{
                    transform: hasConstraints ? 'translateX(22px)' : 'translateX(0)'
                  }}
                />
              </span>
            </div>
          </label>
          

          {hasConstraints && (
            <textarea id="constraints" name="constraints" value={formData.constraints} 
              onChange={handleChange} placeholder="Please write here your constraints" 
              className="form-textarea"
            />
          )}
        </div>

        {/* Submit Button */}
        <button type="submit" className="btn">Submit</button>
      </form>

      {/* Submissions */}
      {submissions.length > 0 && (
        <div className="submissions">
          <h3>My Submissions</h3>
          {submissions.map((sub, index) => (
            <div key={index} className="card">
              <strong>{sub.title}</strong> — {sub.description} <br />
              Age: {sub.age}, Gender: {sub.gender === 'Other' ? sub.otherGender : sub.gender} <br />
              Goals: {sub.goals} <br />
              Looking for: {sub.lookingFor.filter(Boolean).join(', ')} <br />
              Availability: {sub.availability === 'Other' ? sub.otherAvailability : sub.availability} <br />
              Communication: {sub.communication.join(', ')} <br />
              Constraints: {sub.constraints} <br />
              Timezone: {sub.timezone}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

export default Questionnaire
