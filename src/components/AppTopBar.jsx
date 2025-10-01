import { useState, useEffect } from 'react'
import { FaCog, FaMoon } from 'react-icons/fa'
import { BsSunFill } from 'react-icons/bs'

const AppTopBar = () => {
  const [theme, setTheme] = useState('light')

  useEffect(() => {
    // Get initial theme from document
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light'
    setTheme(currentTheme)
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
  }

  const handleSettings = () => {
    // Settings functionality to be implemented
    console.log('Settings clicked')
  }

  return (
    <div 
      style={{
        position: 'fixed',
        top: '32px',
        left: 0,
        right: 0,
        height: '48px',
        backgroundColor: 'var(--color-bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        zIndex: 999
      }}
    >
      <div style={{ flex: 1 }}></div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Theme Toggle */}
        <button 
          style={{
            width: '32px',
            height: '32px',
            border: 'none',
            background: 'transparent',
            color: 'var(--color-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '6px',
            transition: 'all 150ms ease-out'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-surface)'
            e.currentTarget.style.color = 'var(--color-fg)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.color = 'var(--color-muted)'
          }}
          onClick={toggleTheme}
          aria-label="Toggle theme"
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? (
            <FaMoon style={{ width: '16px', height: '16px' }} />
          ) : (
            <BsSunFill style={{ width: '16px', height: '16px' }} />
          )}
        </button>

        {/* Settings Button */}
        <button 
          style={{
            width: '32px',
            height: '32px',
            border: 'none',
            background: 'transparent',
            color: 'var(--color-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '6px',
            transition: 'all 150ms ease-out'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-surface)'
            e.currentTarget.style.color = 'var(--color-fg)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.color = 'var(--color-muted)'
          }}
          onClick={handleSettings}
          aria-label="Settings"
          title="Settings"
        >
          <FaCog style={{ width: '16px', height: '16px' }} />
        </button>
      </div>
    </div>
  )
}

export default AppTopBar
