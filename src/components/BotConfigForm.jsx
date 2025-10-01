import { useState, useEffect } from 'react'

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
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ marginBottom: '4px' }}>
        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-muted)', lineHeight: 1.5 }}>
          Enter your Wizard101 credentials to connect the <strong>{bot?.name}</strong> bot.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label htmlFor="username" style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-fg)' }}>
          Wizard101 Username
        </label>
        <input
          type="text"
          id="username"
          name="username"
          style={{
            width: '100%',
            padding: '10px 12px',
            fontSize: '0.9rem',
            color: 'var(--color-input-fg)',
            backgroundColor: 'var(--color-input-bg)',
            border: `1px solid ${errors.username ? 'var(--color-danger)' : 'var(--color-border)'}`,
            borderRadius: '6px',
            outline: 'none',
            transition: 'all 150ms ease-out',
            fontFamily: 'inherit',
            boxSizing: 'border-box'
          }}
          value={formData.username}
          onChange={handleChange}
          placeholder="Enter your username"
          autoComplete="username"
        />
        {errors.username && (
          <span style={{ fontSize: '0.8rem', color: 'var(--color-danger)', marginTop: '-2px' }}>{errors.username}</span>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label htmlFor="password" style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-fg)' }}>
          Password
        </label>
        <input
          type="password"
          id="password"
          name="password"
          style={{
            width: '100%',
            padding: '10px 12px',
            fontSize: '0.9rem',
            color: 'var(--color-input-fg)',
            backgroundColor: 'var(--color-input-bg)',
            border: `1px solid ${errors.password ? 'var(--color-danger)' : 'var(--color-border)'}`,
            borderRadius: '6px',
            outline: 'none',
            transition: 'all 150ms ease-out',
            fontFamily: 'inherit',
            boxSizing: 'border-box'
          }}
          value={formData.password}
          onChange={handleChange}
          placeholder="Enter your password"
          autoComplete="current-password"
        />
        {errors.password && (
          <span style={{ fontSize: '0.8rem', color: 'var(--color-danger)', marginTop: '-2px' }}>{errors.password}</span>
        )}
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '8px',
        padding: '10px 12px',
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '6px',
        fontSize: '0.8rem',
        color: 'var(--color-muted)',
        lineHeight: 1.5
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: '1px', opacity: 0.7 }}>
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
