import React, { useEffect, useRef, useState } from 'react'
import { Terminal as XTerm } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebLinksAddon } from '@xterm/addon-web-links'
import '@xterm/xterm/css/xterm.css'
import { FaPlay, FaPause, FaStop, FaExpand, FaCompress } from 'react-icons/fa'

const Terminal = ({ 
  repoPath, 
  botType, 
  isRunning, 
  onStart, 
  onStop, 
  onToggleFullscreen,
  onClose,
  isFullscreen = false,
  className = '' 
}) => {
  const terminalRef = useRef(null)
  const xtermRef = useRef(null)
  const fitAddonRef = useRef(null)
  const processRef = useRef(null)
  const onStopRef = useRef(onStop)
  const [isConnected, setIsConnected] = useState(false)

  // Keep the callback ref updated
  useEffect(() => {
    onStopRef.current = onStop
  }, [onStop])

  useEffect(() => {
    if (!terminalRef.current) return

    // Initialize xterm
    const xterm = new XTerm({
      theme: {
        background: '#1a1a1a',
        foreground: '#e0e0e0',
        cursor: '#ffffff',
        selection: '#404040',
        black: '#000000',
        red: '#ff5555',
        green: '#50fa7b',
        yellow: '#f1fa8c',
        blue: '#8be9fd',
        magenta: '#ff79c6',
        cyan: '#8be9fd',
        white: '#f8f8f2',
        brightBlack: '#6272a4',
        brightRed: '#ff6e6e',
        brightGreen: '#69ff94',
        brightYellow: '#ffffa5',
        brightBlue: '#d6acff',
        brightMagenta: '#ff92df',
        brightCyan: '#a4ffff',
        brightWhite: '#ffffff'
      },
      fontSize: 11,
      fontFamily: '"Cascadia Code", "Fira Code", "Consolas", "Monaco", "Courier New", monospace',
      fontWeight: 'normal',
      cursorBlink: true,
      cursorStyle: 'block',
      scrollback: 1000,
      tabStopWidth: 4,
      bellStyle: 'none'
    })

    const fitAddon = new FitAddon()
    const webLinksAddon = new WebLinksAddon()

    xterm.loadAddon(fitAddon)
    xterm.loadAddon(webLinksAddon)
    xterm.open(terminalRef.current)

    xtermRef.current = xterm
    fitAddonRef.current = fitAddon

    // Fit terminal to container
    setTimeout(() => {
      fitAddon.fit()
    }, 100)

    // Handle window resize
    const handleResize = () => {
      if (fitAddonRef.current) {
        fitAddonRef.current.fit()
      }
    }

    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      // Note: processRef.current contains processId string, not process object
      // Process cleanup is handled by the main process when the component unmounts
      xterm.dispose()
    }
  }, [])

  const startProcess = async () => {
    if (isRunning || !repoPath || !botType) return

    try {
      setIsConnected(true)
      xtermRef.current.clear()
      xtermRef.current.writeln(`🚀 Starting ${botType} bot...`)
      xtermRef.current.writeln(`📁 Repository: ${repoPath}`)
      xtermRef.current.writeln(`⚡ Command: bash ./start.sh --${botType}`)
      xtermRef.current.writeln('─'.repeat(50))

      // Start the process via IPC
      const result = await window.ipcRenderer.invoke('terminal:startProcess', repoPath, botType)
      
      if (result.success) {
        // Store process reference
        processRef.current = result.processId
        
        // Set up output listener
        await window.ipcRenderer.invoke('terminal:getProcessOutput', result.processId)
        
        onStart()
        xtermRef.current.writeln('✅ Bot started successfully!')
        xtermRef.current.writeln('')
      } else {
        xtermRef.current.writeln(`❌ Error: ${result.error}`)
        setIsConnected(false)
      }
    } catch (error) {
      xtermRef.current.writeln(`❌ Error starting bot: ${error.message}`)
      setIsConnected(false)
    }
  }

  const stopProcess = async () => {
    if (!isRunning) return

    try {
      xtermRef.current.writeln('')
      xtermRef.current.writeln('🛑 Stopping bot process...')
      xtermRef.current.writeln('⌨️ Sending Ctrl+C (SIGINT) to the process...')
      xtermRef.current.writeln('⏳ Please wait for graceful shutdown...')
      
      if (processRef.current) {
        const result = await window.ipcRenderer.invoke('terminal:stopProcess', processRef.current)
        if (result.success) {
          xtermRef.current.writeln('')
          xtermRef.current.writeln('✅ Bot stopped successfully')
          
          // Show detailed information about what was done
          if (result.killedProcesses && result.killedProcesses.length > 0) {
            xtermRef.current.writeln(`📋 Actions taken:`)
            result.killedProcesses.forEach(proc => {
              xtermRef.current.writeln(`   • ${proc}`)
            })
          }
          
          if (result.message) {
            xtermRef.current.writeln(`💬 ${result.message}`)
          }
          
          xtermRef.current.writeln('')
          xtermRef.current.writeln('🔍 The bot process should have received Ctrl+C and stopped gracefully.')
          xtermRef.current.writeln('🖱️ Your mouse should stop moving automatically now.')
        } else {
          xtermRef.current.writeln(`⚠️ Warning: ${result.error}`)
          xtermRef.current.writeln('💡 If the bot is still running, try using Ctrl+Shift+X for emergency stop.')
        }
        processRef.current = null
      }
      
      setIsConnected(false)
      onStop()
    } catch (error) {
      xtermRef.current.writeln(`❌ Error stopping bot: ${error.message}`)
      xtermRef.current.writeln('💡 Try using Ctrl+Shift+X for emergency stop if the bot is still running.')
      console.error('Error stopping bot:', error)
    }
  }

  // Handle keyboard input from xterm
  useEffect(() => {
    const terminal = xtermRef.current
    if (!terminal) return

    const handleKey = (event) => {
      const { key, domEvent } = event
      
      // Handle Ctrl+C (SIGINT)
      if (key === '\x03') { // Ctrl+C sends \x03
        if (isRunning && processRef.current) {
          console.log('Manual Ctrl+C pressed - sending SIGINT to process')
          window.ipcRenderer.invoke('terminal:sendSignal', processRef.current, 'SIGINT')
          // Write the ^C to the terminal with visual feedback
          terminal.write('\r\n\x1b[33m^C - Interrupt signal sent to process\x1b[0m\r\n')
        } else {
          // Show that Ctrl+C was pressed but no process is running
          terminal.write('\r\n\x1b[90m^C - No active process to interrupt\x1b[0m\r\n')
        }
        return
      }
      
      // Handle other special keys if needed
      if (key === '\x04') { // Ctrl+D (EOF)
        console.log('Ctrl+D pressed')
        return
      }
      
      // For other keys, we could potentially send them to the process
      // but for now, let's just allow normal terminal interaction
    }

    const keyListener = terminal.onKey(handleKey)

    return () => {
      keyListener.dispose()
    }
  }, [isRunning])

  // Set up output listener - only run once when component mounts
  useEffect(() => {
    if (!window.ipcRenderer) return

    const handleOutput = (event, processId, stream, data) => {
      if (processId === processRef.current && xtermRef.current) {
        if (stream === 'stderr') {
          // Handle stderr output with red color
          xtermRef.current.write(`\x1b[31m${data}\x1b[0m`) // Red color
        } else {
          // Handle stdout output normally
          xtermRef.current.write(data)
        }
      }
    }

    const handleProcessExit = (event, processId, code) => {
      if (processId === processRef.current && xtermRef.current) {
        xtermRef.current.writeln('')
        xtermRef.current.writeln(`\x1b[33mProcess exited with code: ${code}\x1b[0m`)
        setIsConnected(false)
        onStopRef.current()
        processRef.current = null
      }
    }

    // Remove any existing listeners first to prevent duplicates
    window.ipcRenderer.removeAllListeners('terminal:output')
    window.ipcRenderer.removeAllListeners('terminal:process-exit')
    
    // Add the listeners
    window.ipcRenderer.on('terminal:output', handleOutput)
    window.ipcRenderer.on('terminal:process-exit', handleProcessExit)

    return () => {
      if (window.ipcRenderer) {
        window.ipcRenderer.removeAllListeners('terminal:output')
        window.ipcRenderer.removeAllListeners('terminal:process-exit')
      }
    }
  }, []) // Empty dependency array - only run once

  // Cleanup effect to stop any running process when component unmounts
  useEffect(() => {
    return () => {
      // Stop any running process when component unmounts
      if (processRef.current && window.ipcRenderer) {
        window.ipcRenderer.invoke('terminal:stopProcess', processRef.current).catch(error => {
          console.log('Error stopping process on unmount:', error)
        })
      }
    }
  }, [])

  return (
    <>
      <style>{`
        .terminal-container {
          background: #1a1a1a;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
          border: 1px solid #404040;
          margin: 0;
          transition: all 0.3s ease;
          height: 100%;
          display: flex;
          flex-direction: column;
        }
        .terminal-container.dashboard-terminal {
          margin: 0;
          border-radius: 0;
          box-shadow: none;
          border: none;
          background: transparent;
        }
        .terminal-container.fullscreen {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 1000;
          margin: 0;
          border-radius: 0;
          border: none;
          background: #1a1a1a;
        }
        .terminal-header {
          background: #1e1e1e;
          padding: 1px 3px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #404040;
          position: relative;
          min-height: 12px;
          flex-shrink: 0;
        }
        .terminal-title {
          display: flex;
          align-items: center;
          gap: 4px;
          color: #e0e0e0;
          font-weight: 500;
          font-size: 10px;
        }
        .status-indicator {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #ef4444;
          animation: pulse 2s infinite;
        }
        .status-indicator.running {
          background: #22c55e;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .terminal-controls {
          display: flex;
          gap: 6px;
          align-items: center;
        }
        .terminal-btn {
          background: #404040;
          border: 1px solid #555;
          color: #e0e0e0;
          border-radius: 3px;
          padding: 3px 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          min-width: 24px;
          height: 20px;
        }
        .terminal-btn:hover {
          background: #555;
          border-color: #666;
          transform: translateY(-1px);
        }
        .terminal-btn:active {
          transform: translateY(0);
        }
        .terminal-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }
        .terminal-btn.play-btn {
          background: #22c55e;
          border-color: #22c55e;
          color: white;
        }
        .terminal-btn.play-btn:hover:not(:disabled) {
          background: #16a34a;
          border-color: #16a34a;
        }
        .terminal-btn.stop-btn {
          background: #ef4444;
          border-color: #ef4444;
          color: white;
        }
        .terminal-btn.stop-btn:hover {
          background: #dc2626;
          border-color: #dc2626;
        }
        .terminal-btn.close-btn {
          background: transparent;
          border: none;
          color: #bbb;
          font-size: 11px;
          font-weight: bold;
          min-width: 18px;
          padding: 1px 3px;
        }
        .terminal-btn.close-btn:hover {
          background: #ef4444;
          border: 1px solid #ef4444;
          color: white;
        }
        .terminal-btn.maximize-btn {
          background: transparent;
          border: none;
          color: #bbb;
          font-size: 9px;
          min-width: 18px;
          padding: 1px 3px;
        }
        .terminal-btn.maximize-btn:hover {
          background: #555;
          border: 1px solid #666;
          color: #e0e0e0;
        }
        .terminal-content {
          background: #1a1a1a;
          position: relative;
          overflow: hidden;
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        .terminal-content .xterm {
          height: 100% !important;
          flex: 1;
        }
        .terminal-content .xterm-viewport {
          background: #1a1a1a !important;
        }
        .terminal-content .xterm-screen {
          background: #1a1a1a !important;
        }
        .terminal-content .xterm-viewport::-webkit-scrollbar {
          width: 6px;
        }
        .terminal-content .xterm-viewport::-webkit-scrollbar-track {
          background: #2a2a2a;
        }
        .terminal-content .xterm-viewport::-webkit-scrollbar-thumb {
          background: #555;
          border-radius: 3px;
        }
        .terminal-content .xterm-viewport::-webkit-scrollbar-thumb:hover {
          background: #666;
        }
      `}</style>
      <div className={`terminal-container ${className} ${isFullscreen ? 'fullscreen' : ''}`}>
        <div className="terminal-header">
          <div className="terminal-title">
            <span>{botType ? `${botType.charAt(0).toUpperCase() + botType.slice(1)} Bot` : 'Terminal'}</span>
            {isConnected && <span className="status-indicator running"></span>}
          </div>
          <div className="terminal-controls">
            {!isRunning ? (
              <button 
                className="terminal-btn play-btn"
                onClick={startProcess}
                disabled={!repoPath || !botType}
                title="Start Bot"
              >
                <FaPlay />
              </button>
            ) : (
              <button 
                className="terminal-btn stop-btn"
                onClick={stopProcess}
                title="Stop Bot"
              >
                <FaStop />
              </button>
            )}
            <button 
              className="terminal-btn maximize-btn"
              onClick={onToggleFullscreen}
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <FaCompress /> : <FaExpand />}
            </button>
            {onClose && (
              <button 
                className="terminal-btn close-btn"
                onClick={onClose}
                title="Close Terminal"
              >
                ×
              </button>
            )}
          </div>
        </div>
        <div 
          ref={terminalRef} 
          className="terminal-content"
          style={{ height: isFullscreen ? 'calc(100vh - 12px)' : '100%' }}
        />
      </div>
    </>
  )
}

export default Terminal
