import { useState, useEffect } from 'react'
import './BotConfigForm.css'

const BotConfigForm = ({ bot, onSubmit, initialConfig, onValidChange }) => {
  const [formData, setFormData] = useState({
    username: initialConfig?.username || '',
    password: initialConfig?.password || ''
  })

  const [errors, setErrors] = useState({})

  // Check if form is valid and notify parent
  const isValid = formData.username.trim() && formData.password.trim()
  
  useEffect(() => {
    if (onValidChange) {
      onValidChange(isValid)
    }
  }, [isValid, onValidChange])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validate = () => {
    const newErrors = {}
    
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required'
    }
    
    if (!formData.password.trim()) {
      newErrors.password = 'Password is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (validate()) {
      onSubmit(formData)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bot-config-form">
      <div className="form-description">
        <p>Enter your Wizard101 credentials to connect the <strong>{bot?.name}</strong> bot.</p>
      </div>

      <div className="form-group">
        <label htmlFor="username" className="form-label">
          Wizard101 Username
        </label>
        <input
          type="text"
          id="username"
          name="username"
          className={`form-input ${errors.username ? 'error' : ''}`}
          value={formData.username}
          onChange={handleChange}
          placeholder="Enter your username"
          autoComplete="username"
        />
        {errors.username && (
          <span className="form-error">{errors.username}</span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="password" className="form-label">
          Password
        </label>
        <input
          type="password"
          id="password"
          name="password"
          className={`form-input ${errors.password ? 'error' : ''}`}
          value={formData.password}
          onChange={handleChange}
          placeholder="Enter your password"
          autoComplete="current-password"
        />
        {errors.password && (
          <span className="form-error">{errors.password}</span>
        )}
      </div>

      <div className="form-note">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
        <span>Your credentials are stored locally and never shared.</span>
      </div>
    </form>
  )
}

export default BotConfigForm
