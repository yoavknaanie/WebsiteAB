// import React, { useState, useEffect } from 'react'

// function Questionnaire() {
//   const [formData, setFormData] = useState({
//     title: '',
//     age: null,
//     gender: '',
//     otherGender: '',
//     timezone: '',
//     description: '',
//     goals: '',
//     lookingFor: ['', '', '', '', ''],
//     availability: '',
//     otherAvailability: '',
//     communication: [],
//     communicationOther: '',
//     constraints: ''
//   })

//   const [submissions, setSubmissions] = useState([])

//   const getUTCOffset = () => {
//   const offsetMinutes = -new Date().getTimezoneOffset()
//   const sign = offsetMinutes >= 0 ? '+' : '-'
//   const hours = Math.floor(Math.abs(offsetMinutes) / 60)
//   const minutes = Math.abs(offsetMinutes) % 60

//   return `UTC ${sign}${hours}${minutes ? `:${minutes.toString().padStart(2, '0')}` : ''}`
// }

//   // Auto-detect timezone
//   useEffect(() => {
//     const utcOffset = getUTCOffset()
//     setFormData((prev) => ({ ...prev, timezone: utcOffset }))
//   }, [])


//   const availabilityOptions = ['Multiple daily', 'Once daily', 'Every couple of days', 'Weekly', 'Other']
//   // const communicationOptions = ['Chat', 'Voice Call', 'Video Call', 'Async Check-ins', 'Other']
//   const communicationOptions = [ { label: 'Chat' }, { label: 'Voice Call' }, { label: 'Video Call' },
//   { 
//     label: 'Async Check-ins', 
//     info: "Check in and send updates whenever you're free. No need to be online at the same time." 
//   },
//   { label: 'Other' }
//   ]

//   const [hasConstraints, setHasConstraints] = useState(false)
//   const titlePlaceholder =
//   `Ex. ${formData.age || ''}${formData.gender || ''} ${formData.timezone || ''} | Seeking a daily study buddy`.trim()

//   const handleChange = (e) => {
//     const { name, value, type, checked } = e.target
//     if (type === 'checkbox') {
//       setFormData((prev) => {
//         const current = prev[name]
//         if (checked) {
//           return { ...prev, [name]: [...current, value] }
//         } else {
//           return { ...prev, [name]: current.filter((v) => v !== value) }
//         }
//       })
//     } else {
//       setFormData({ ...formData, [name]: value })
//     }
//   }

//   const handleLookingForChange = (index, value) => {
//     const updated = [...formData.lookingFor]
//     updated[index] = value
//     setFormData({ ...formData, lookingFor: updated })
//   }

//   const handleSubmit = (e) => {
//     e.preventDefault()
//     setSubmissions([...submissions, formData])
//     setFormData((prev) => ({
//       title: '',
//       age: 18,
//       gender: '',
//       otherGender: '',
//       timezone: prev.timezone,
//       description: '',
//       goals: '',
//       lookingFor: ['', '', '', '', ''],
//       availability: '',
//       communication: [],
//       constraints: ''
//     }))
//   }

//   const fieldStyle = {
//     display: 'flex',
//     flexDirection: 'column',
//     gap: '0.25rem',
//     marginBottom: '1rem'
//   }

//   const inputStyle = {
//     width: '100%',
//     padding: '0.8rem',
//     borderRadius: '8px',
//     border: '1px solid #ccc',
//     fontSize: '1rem',
//     boxSizing: 'border-box'
//   }

//   const switchWrapper = {
//   position: 'relative',
//   width: '46px',
//   height: '24px'
// }

// const switchInput = {
//   opacity: 0,
//   width: 0,
//   height: 0
// }

// const switchSlider = {
//   position: 'absolute',
//   cursor: 'pointer',
//   top: 0,
//   left: 0,
//   right: 0,
//   bottom: 0,
//   backgroundColor: '#ccc',
//   borderRadius: '999px',
//   transition: '0.3s'
// }

// const switchKnob = {
//   position: 'absolute',
//   height: '18px',
//   width: '18px',
//   left: '3px',
//   bottom: '3px',
//   backgroundColor: 'white',
//   borderRadius: '50%',
//   transition: '0.3s'
// }

// const tooltipStyle = {
//   position: 'relative',
//   display: 'inline-block'
// }

// const tooltipTextStyle = {
//   visibility: 'hidden',
//   width: '220px',
//   backgroundColor: '#333',
//   color: '#fff',
//   textAlign: 'left',
//   borderRadius: '6px',
//   padding: '0.5rem',
//   position: 'absolute',
//   zIndex: 10,
//   bottom: '125%', // position above
//   left: '50%',
//   transform: 'translateX(-50%)',
//   opacity: 0,
//   transition: 'opacity 0.3s',
//   fontSize: '0.85rem',
//   lineHeight: 1.4
// }

// const tooltipTextVisibleStyle = {
//   ...tooltipTextStyle,
//   visibility: 'visible',
//   opacity: 1
// }

// const infoIconStyle = {
//   display: 'inline-flex',           // makes it a flex container
//   alignItems: 'center',             // vertically center
//   justifyContent: 'center',         // horizontally center
//   width: '16px',                     // square dimensions
//   height: '16px',
//   borderRadius: '50%',               // perfect circle
//   backgroundColor: 'var(--sage)',   // grey/green circle
//   color: 'var(--bg)',               // white "i"
//   fontSize: '0.75rem',
//   fontWeight: 'bold',
//   marginLeft: '0.25rem',
//   cursor: 'pointer',
//   lineHeight: 1,                     // ensures vertical centering
//   textAlign: 'center'
// }


//   return (
//     <section id="questionnaire" style={{ padding: '4rem 2rem', maxWidth: '700px', margin: '0 auto' }}>
//       <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Looking for a Buddy Questionnaire</h2>

//       <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
//         {/* Age + Gender */}
//         <div style={{ display: 'flex', gap: '1rem' }}>
//           {/* Age */}
//           <div style={{ ...fieldStyle, flex: 1 }}>
//             <label htmlFor="age">Age</label>
//             <input
//               type="number"
//               id="age"
//               name="age"
//               value={formData.age}
//               onChange={handleChange}
//               min={18}
//               max={100}
//               required
//               style={inputStyle}
//             />
//           </div>

//           {/* Gender */}
//           <div style={{ ...fieldStyle, flex: 1 }}>
//             <label htmlFor="gender">Gender</label>
//             <select
//               id="gender"
//               name="gender"
//               value={formData.gender}
//               onChange={handleChange}
//               required
//               style={inputStyle}
//             >
//               <option value="">Select Gender</option>
//               <option value="M">M</option>
//               <option value="F">F</option>
//               <option value="Other">Other</option>
//             </select>

//             {formData.gender === 'Other' && (
//               <input
//                 type="text"
//                 name="otherGender"
//                 placeholder="Please specify"
//                 value={formData.otherGender}
//                 onChange={handleChange}
//                 style={{ ...inputStyle, marginTop: '0.5rem' }}
//               />
//             )}
//           </div>
//         </div>


//         {/* Timezone */}
//         <div style={fieldStyle}>
//           <label htmlFor="timezone">Timezone</label>
//           <input
//             type="text"
//             id="timezone"
//             name="timezone"
//             value={formData.timezone}
//             readOnly
//             style={inputStyle}
//           />
//         </div>

//         {/* Title / Summary */}
//         <div style={fieldStyle}>
//           <label htmlFor="title">Title</label>
//           <input
//             type="text"
//             id="title"
//             name="title"
//             placeholder={titlePlaceholder}
//             value={formData.title}
//             onChange={handleChange}
//             required
//             style={inputStyle}
//           />
//         </div>

//         {/* Short Description */}
//         <div style={fieldStyle}>
//           <label htmlFor="description">Description</label>
//           <textarea
//             id="description"
//             name="description"
//             value={formData.description}
//             onChange={handleChange}
//             style={{ ...inputStyle, minHeight: '80px' }}
//           />
//         </div>

//         {/* Goals */}
//         <div style={fieldStyle}>
//           <label htmlFor="goals">Goals</label>
//           <textarea id="goals" name="goals" value={formData.goals} onChange={handleChange} style={inputStyle} />
//         </div>

//         {/* Looking for in a Buddy */}
//         <div style={fieldStyle}>
//           <label>Looking for in a Buddy (up to 5):</label>
//           {formData.lookingFor.map((item, i) => (
//             <input
//               key={i}
//               type="text"
//               placeholder={`#${i + 1}`}
//               value={item}
//               onChange={(e) => handleLookingForChange(i, e.target.value)}
//               style={inputStyle}
//             />
//           ))}
//         </div>

//         {/* Availability */}
//         <div style={fieldStyle}>
//           <label htmlFor="availability">Availability</label>
//           <select
//             id="availability"
//             name="availability"
//             value={formData.availability}
//             onChange={handleChange}
//             style={inputStyle}
//           >
//             <option value="">Select Availability</option>
//             {availabilityOptions.map((a) => <option key={a} value={a}>{a}</option>)}
//           </select>

//             {formData.availability === 'Other' && (
//               <textarea
//                 name="availabilityOther"
//                 value={formData.availabilityOther}
//                 onChange={handleChange}
//                 placeholder="Please describe your availability"
//                 style={{ ...inputStyle, marginTop: '0.5rem', minHeight: '70px' }}
//               />
//             )}
//         </div>

//         {/* Communication */}
//         {/* <div style={fieldStyle}>
//           <label>Communication</label>
//           <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
//             {communicationOptions.map((option) => (
//               <label key={option}>
//                 <input
//                   type="checkbox"
//                   name="communication"
//                   value={option}
//                   checked={formData.communication.includes(option)}
//                   onChange={handleChange}
//                 /> {option}
//               </label>
//             ))}
//           </div>
//         </div> */}
//         {/* Communication */}
//         <div style={fieldStyle}>
//           <label>Preferred Communication</label>

//           <div
//             style={{
//               display: 'flex',
//               gap: '0.75rem 1.25rem',
//               flexWrap: 'wrap'
//             }}
//           >
//             {communicationOptions.map((option) => (
//             <label
//               key={option.label}
//               style={{
//                 display: 'flex',
//                 alignItems: 'center',
//                 gap: '0.4rem',
//                 cursor: 'pointer'
//               }}
//             >
//               <input
//                 type="checkbox"
//                 name="communication"
//                 value={option.label}
//                 checked={formData.communication.includes(option.label)}
//                 onChange={handleChange}
//                 style={{
//                   transform: 'scale(1.15)',
//                   cursor: 'pointer'
//                 }}
//               />
//               <span style={tooltipStyle}>
//                 {option.label}
//                 {option.info && (
//                   <span
//                     style={infoIconStyle}
//                     onMouseEnter={(e) => {
//                       e.currentTarget.nextSibling.style.visibility = 'visible'
//                       e.currentTarget.nextSibling.style.opacity = 1
//                     }}
//                     onMouseLeave={(e) => {
//                       e.currentTarget.nextSibling.style.visibility = 'hidden'
//                       e.currentTarget.nextSibling.style.opacity = 0
//                     }}
//                   >
//                     i
//                   </span>
//                 )}
//                 {option.info && (
//                   <span style={tooltipTextStyle}>{option.info}</span>
//                 )}
//               </span>
//             </label>
//           ))}
//           </div>

//           {formData.communication.includes('Other') && (
//             <input
//               type="text"
//               name="communicationOther"
//               value={formData.communicationOther}
//               onChange={handleChange}
//               placeholder="Please specify other communication methods"
//               style={{ ...inputStyle, marginTop: '0.5rem' }}
//             />
//           )}
//         </div>


//         {/* Other Fields */}
//         <div style={fieldStyle}>
//           <label style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
//             Availability and Communication Constraints

//             <div style={switchWrapper}>
//               <input
//                 type="checkbox"
//                 checked={hasConstraints}
//                 onChange={(e) => setHasConstraints(e.target.checked)}
//                 style={switchInput}
//               />

//               <span
//                 style={{
//                   ...switchSlider,
//                   backgroundColor: hasConstraints ? 'var(--sage)' : '#ccc'
//                 }}
//               >
//                 <span
//                   style={{
//                     ...switchKnob,
//                     transform: hasConstraints ? 'translateX(22px)' : 'translateX(0)'
//                   }}
//                 />
//               </span>
//             </div>
//           </label>

//           {hasConstraints && (
//             <textarea
//               id="constraints"
//               name="constraints"
//               value={formData.constraints}
//               onChange={handleChange}
//               placeholder="Please write here your constraints"
//               style={{ ...inputStyle, minHeight: '80px' }}
//             />
//           )}
//         </div>

//         {/* Submit */}
//         <button type="submit" style={{
//           padding: '0.7rem 1.2rem',
//           borderRadius: '999px',
//           backgroundColor: 'var(--sage)',
//           color: 'white',
//           border: 'none',
//           fontWeight: 600,
//           fontSize: '1.05rem',
//           letterSpacing: '0.02rem',
//           cursor: 'pointer',
//           marginTop: '1rem'
//         }}>Submit</button>
//       </form>

//       {/* Submissions */}
//       {submissions.length > 0 && (
//         <div style={{ marginTop: '2rem' }}>
//           <h3>My Submissions</h3>
//           {submissions.map((sub, index) => (
//             <div key={index} style={{ padding: '1rem', border: '1px solid #ddd', borderRadius: '12px', marginBottom: '1rem' }}>
//               <strong>{sub.title}</strong> — {sub.description} <br />
//               Age: {sub.age}, Gender: {sub.gender === 'Other' ? sub.otherGender : sub.gender} <br />
//               Goals: {sub.goals} <br />
//               Looking for: {sub.lookingFor.filter(Boolean).join(', ')} <br />
//               Availability: {sub.availability} <br />
//               Communication: {sub.communication.join(', ')} <br />
//               Constraints: {sub.constraints} <br />
//               Timezone: {sub.timezone}
//             </div>
//           ))}
//         </div>
//       )}
//     </section>
//   )
// }

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
    setSubmissions([...submissions, formData])
    setFormData({
      title: '', age: null, gender: '', otherGender: '', timezone: formData.timezone,
      description: '', goals: '', lookingFor: ['', '', '', '', ''],
      availability: '', otherAvailability: '', communication: [],
      communicationOther: '', constraints: ''
    })
    setHasConstraints(false)
  }

  // ------------------- RENDER -------------------
  return (
    <section id="questionnaire" className="section">
      <h2>Looking for a Buddy Questionnaire</h2>

      <form onSubmit={handleSubmit}>
        {/* Age + Gender */}
        <div className="row">
          <div className="form-field">
            <label htmlFor="age">Age</label>
            <input type="number" id="age" name="age" value={formData.age} onChange={handleChange} 
              min={18} max={100} required className="form-input"
            />
          </div>

          <div className="form-field">
            <label htmlFor="gender">Gender</label>
            <select id="gender" name="gender" value={formData.gender} onChange={handleChange} 
              required className="form-select"
            >
              <option value="">Select Gender</option>
              <option value="M">M</option>
              <option value="F">F</option>
              <option value="Other">Other</option>
            </select>

            {formData.gender === 'Other' && (
              <input type="text" name="otherGender" placeholder="Please specify" 
                value={formData.otherGender} onChange={handleChange} className="form-input"
              />
            )}
          </div>
        </div>

        {/* Timezone */}
        <div className="form-field">
          <label htmlFor="timezone">Timezone</label>
          <input type="text" id="timezone" name="timezone" value={formData.timezone} 
            readOnly className="form-input"
          />
        </div>

        {/* Title */}
        <div className="form-field">
          <label htmlFor="title">Title</label>
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
          <label htmlFor="availability">Availability</label>
          <select id="availability" name="availability" value={formData.availability} 
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
          <label>Preferred Communication</label>
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
            <input type="text" name="communicationOther" value={formData.communicationOther} 
              onChange={handleChange} placeholder="Please specify other communication methods" 
              className="form-input"
            />
          )}
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
