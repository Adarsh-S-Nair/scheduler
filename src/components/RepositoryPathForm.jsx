import { useState } from 'react'
import Button from './Button'

const RepositoryPathForm = ({ onSubmit, initialPath = '../w101-bots' }) => {
  const [repoPath, setRepoPath] = useState(initialPath)
  const [error, setError] = useState('')

  const handleBrowse = async () => {
    // In Electron, we can use the dialog API to select a folder
    if (window.ipcRenderer) {
      try {
        const result = await window.ipcRenderer.invoke('dialog:selectFolder')
        if (result && !result.canceled && result.filePaths.length > 0) {
          setRepoPath(result.filePaths[0])
          setError('')
        }
      } catch (err) {
        console.error('Error selecting folder:', err)
        setError('Failed to open folder browser')
      }
    } else {
      // Fallback for non-Electron environment (browser)
      alert('Folder selection is only available in the desktop app')
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!repoPath.trim()) {
      setError('Repository path is required')
      return
    }
    
    onSubmit({ repoPath: repoPath.trim() })
  }

  const handleChange = (e) => {
    setRepoPath(e.target.value)
    if (error) setError('')
  }

  return (
    <form onSubmit={handleSubmit} className="repo-path-form" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ marginBottom: '4px' }}>
        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-muted)', lineHeight: 1.5 }}>
          Specify the path to your <strong>w101-bots</strong> repository.
        </p>
        <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--color-muted)' }}>
          This is where the bot code will be checked out.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label htmlFor="repoPath" style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-fg)' }}>
          Repository Path
        </label>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch' }}>
          <input
            type="text"
            id="repoPath"
            name="repoPath"
            style={{
              flex: 1,
              padding: '10px 12px',
              fontSize: '0.9rem',
              color: 'var(--color-input-fg)',
              backgroundColor: 'var(--color-input-bg)',
              border: `1px solid ${error ? 'var(--color-danger)' : 'var(--color-border)'}`,
              borderRadius: '6px',
              outline: 'none',
              transition: 'all 150ms ease-out',
              fontFamily: 'inherit',
              boxSizing: 'border-box'
            }}
            value={repoPath}
            onChange={handleChange}
            placeholder="../w101-bots"
          />
          <Button
            type="button"
            variant="secondary"
            onClick={handleBrowse}
            style={{ flexShrink: 0, minWidth: '90px' }}
          >
            Browse
          </Button>
        </div>
        {error && (
          <span style={{ fontSize: '0.8rem', color: 'var(--color-danger)', marginTop: '-2px' }}>{error}</span>
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
        <span>The path can be relative to this application or an absolute path.</span>
      </div>
    </form>
  )
}

export default RepositoryPathForm
