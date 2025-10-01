import { useState } from 'react'
import Button from './Button'
import './RepositoryPathForm.css'

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
    <form onSubmit={handleSubmit} className="repo-path-form">
      <div className="form-description">
        <p>Specify the path to your <strong>w101-bots</strong> repository.</p>
        <p className="form-hint">This is where the bot code will be checked out.</p>
      </div>

      <div className="form-group">
        <label htmlFor="repoPath" className="form-label">
          Repository Path
        </label>
        <div className="path-input-group">
          <input
            type="text"
            id="repoPath"
            name="repoPath"
            className={`form-input ${error ? 'error' : ''}`}
            value={repoPath}
            onChange={handleChange}
            placeholder="../w101-bots"
          />
          <Button
            type="button"
            variant="secondary"
            onClick={handleBrowse}
            className="browse-button"
          >
            Browse
          </Button>
        </div>
        {error && (
          <span className="form-error">{error}</span>
        )}
      </div>

      <div className="path-examples">
        <div className="example-title">Common paths:</div>
        <div className="example-paths">
          <button
            type="button"
            className="example-path"
            onClick={() => {
              setRepoPath('../w101-bots')
              setError('')
            }}
          >
            ../w101-bots
          </button>
          <button
            type="button"
            className="example-path"
            onClick={() => {
              setRepoPath('./w101-bots')
              setError('')
            }}
          >
            ./w101-bots
          </button>
        </div>
      </div>

      <div className="form-note">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
