import { useEffect } from 'react'
import './TitleBar.css'

const TitleBar = () => {
  useEffect(() => {
    console.log('TitleBar rendered, ipcRenderer available:', !!window.ipcRenderer)
  }, [])

  const handleMinimize = () => {
    if (window.ipcRenderer && window.ipcRenderer.minimizeWindow) {
      window.ipcRenderer.minimizeWindow()
    } else if (window.ipcRenderer && window.ipcRenderer.send) {
      window.ipcRenderer.send('window-minimize')
    }
  }

  const handleMaximize = () => {
    if (window.ipcRenderer && window.ipcRenderer.maximizeWindow) {
      window.ipcRenderer.maximizeWindow()
    } else if (window.ipcRenderer && window.ipcRenderer.send) {
      window.ipcRenderer.send('window-maximize')
    }
  }

  const handleClose = () => {
    console.log('Close button clicked')
    console.log('window.ipcRenderer:', window.ipcRenderer)
    
    if (window.ipcRenderer) {
      if (typeof window.ipcRenderer.closeWindow === 'function') {
        console.log('Calling closeWindow()')
        window.ipcRenderer.closeWindow()
      } else if (typeof window.ipcRenderer.send === 'function') {
        console.log('Calling send("window-close")')
        window.ipcRenderer.send('window-close')
      } else {
        console.error('No valid close method found on ipcRenderer')
      }
    } else {
      console.error('window.ipcRenderer not available - likely running in browser, not Electron')
      // Fallback for browser testing
      if (window.close) {
        window.close()
      }
    }
  }

  return (
    <div className="titlebar">
      <div className="titlebar-drag-region">
        <div className="titlebar-title">Scheduler</div>
      </div>
      <div className="titlebar-controls">
        <button className="titlebar-button" onClick={handleMinimize} aria-label="Minimize">
          <svg width="10" height="10" viewBox="0 0 12 12">
            <rect y="5" width="12" height="2" fill="currentColor" />
          </svg>
        </button>
        <button className="titlebar-button" onClick={handleMaximize} aria-label="Maximize">
          <svg width="10" height="10" viewBox="0 0 12 12">
            <rect x="1" y="1" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>
        <button className="titlebar-button titlebar-close" onClick={handleClose} aria-label="Close">
          <svg width="10" height="10" viewBox="0 0 12 12">
            <line x1="1" y1="1" x2="11" y2="11" stroke="currentColor" strokeWidth="1.5" />
            <line x1="11" y1="1" x2="1" y2="11" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default TitleBar