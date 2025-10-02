import { app, BrowserWindow, ipcMain, dialog, shell, globalShortcut } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'
import os from 'os'
import { spawn, exec } from 'child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win

// Store active processes
const activeProcesses = new Map()

// Store current bot state for hotkeys
let currentBotState = {
  selectedBot: null,
  isRunning: false,
  processId: null
}

function createWindow() {
  win = new BrowserWindow({
    width: 900,
    height: 700,
    minWidth: 900,
    maxWidth: 900,
    minHeight: 700,
    maxHeight: 700,
    resizable: false,
    frame: false,
    titleBarStyle: 'hidden',
    title: 'Scheduler',
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
    },
  })

  // Register keyboard shortcuts for DevTools
  win.webContents.on('before-input-event', (event, input) => {
    // Ctrl+Shift+I or F12 to toggle DevTools
    if ((input.control && input.shift && input.key.toLowerCase() === 'i') || input.key === 'F12') {
      if (win.webContents.isDevToolsOpened()) {
        win.webContents.closeDevTools()
      } else {
        win.webContents.openDevTools()
      }
      event.preventDefault()
    }
  })

  // Removed test message - no longer needed

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
    // Open DevTools in development
    win.webContents.openDevTools()
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
  
  // Register global hotkeys when window is ready
  registerGlobalHotkeys()
}

// Window control handlers
ipcMain.on('window-minimize', () => {
  console.log('Received minimize message')
  win.minimize()
})

ipcMain.on('window-maximize', () => {
  console.log('Received maximize message')
  if (win.isMaximized()) {
    win.unmaximize()
  } else {
    win.maximize()
  }
})

ipcMain.on('window-close', () => {
  console.log('Received close message')
  win.close()
})

// Global hotkey registration
function registerGlobalHotkeys() {
  try {
    // Register Ctrl+Shift+Z for bot start/stop
    const ret = globalShortcut.register('CommandOrControl+Shift+Z', () => {
      console.log('Global hotkey Ctrl+Shift+Z pressed')
      handleBotToggleHotkey()
    })
    
    if (ret) {
      console.log('✅ Global hotkey Ctrl+Shift+Z registered successfully')
    } else {
      console.log('❌ Failed to register global hotkey')
    }
    
    // Register Ctrl+Shift+X for emergency stop all bots
    const ret2 = globalShortcut.register('CommandOrControl+Shift+X', () => {
      console.log('Global hotkey Ctrl+Shift+X pressed - Emergency stop all bots')
      handleEmergencyStopHotkey()
    })
    
    if (ret2) {
      console.log('✅ Global hotkey Ctrl+Shift+X registered successfully')
    } else {
      console.log('❌ Failed to register emergency stop hotkey')
    }
    
  } catch (error) {
    console.error('Error registering global hotkeys:', error)
  }
}

// Handle bot toggle hotkey
async function handleBotToggleHotkey() {
  try {
    console.log('🔥 HOTKEY PRESSED: Ctrl+Shift+Z')
    console.log('Current bot state:', JSON.stringify(currentBotState, null, 2))
    
    if (!currentBotState.selectedBot) {
      console.log('❌ No bot selected for hotkey toggle')
      // Show notification to user
      if (win && win.webContents) {
        win.webContents.send('hotkey:no-bot-selected')
      }
      return
    }
    
    console.log(`🔄 Hotkey toggle: ${currentBotState.isRunning ? 'stopping' : 'starting'} bot ${currentBotState.selectedBot}`)
    
    if (currentBotState.isRunning) {
      // Stop the bot
      console.log(`🛑 Hotkey: Stopping bot process ${currentBotState.processId}`)
      const result = await stopBotProcess(currentBotState.processId)
      console.log('Stop result:', result)
      
      // Update state after stopping
      currentBotState.isRunning = false
      currentBotState.processId = null
    } else {
      // Start the bot
      console.log(`🚀 Hotkey: Starting bot ${currentBotState.selectedBot}`)
      await startBotProcess(currentBotState.selectedBot)
    }
    
    // Notify renderer process
    if (win && win.webContents) {
      win.webContents.send('hotkey:bot-toggled', {
        botType: currentBotState.selectedBot,
        isRunning: currentBotState.isRunning
      })
    }
    
    console.log('✅ Hotkey handling completed. New state:', JSON.stringify(currentBotState, null, 2))
    
  } catch (error) {
    console.error('❌ Error handling bot toggle hotkey:', error)
    if (win && win.webContents) {
      win.webContents.send('hotkey:error', error.message)
    }
  }
}

// Handle emergency stop hotkey
async function handleEmergencyStopHotkey() {
  try {
    console.log('Emergency stop all bots triggered by hotkey')
    
    // Kill all bot processes
    const result = await killAllBotProcesses()
    
    // Notify renderer process
    if (win && win.webContents) {
      win.webContents.send('hotkey:emergency-stop', result)
    }
    
  } catch (error) {
    console.error('Error handling emergency stop hotkey:', error)
  }
}

// Helper function to start bot process
async function startBotProcess(botType) {
  try {
    // This would need the repository path - we'll get it from the renderer
    console.log(`Starting bot ${botType} via hotkey`)
    
    // Request repository path from renderer
    if (win && win.webContents) {
      win.webContents.send('hotkey:request-repo-path', botType)
    }
    
  } catch (error) {
    console.error('Error starting bot process via hotkey:', error)
  }
}

// Helper function to stop bot process
async function stopBotProcess(processId) {
  try {
    if (!processId) {
      console.log('❌ No process ID provided to stopBotProcess')
      return { success: false, error: 'No process ID provided' }
    }
    
    console.log(`🛑 stopBotProcess called with processId: ${processId}`)
    console.log(`Current activeProcesses:`, Array.from(activeProcesses.keys()))
    
    // Use our existing stop process logic
    const result = await stopProcessInternal(processId)
    console.log('stopProcessInternal result:', result)
    
    return result
    
  } catch (error) {
    console.error('❌ Error stopping bot process via hotkey:', error)
    return { success: false, error: error.message }
  }
}

// Extract the stop process logic into a reusable function
async function stopProcessInternal(processId) {
  const processInfo = activeProcesses.get(processId)
  let killedProcesses = []
  
  console.log(`🛑 Hotkey: Stopping bot process ${processId}`)
  
  // First, try to stop the tracked process with Ctrl+C (SIGINT)
  if (processInfo) {
    const { process: childProcess, botType } = processInfo
    console.log(`Hotkey: Sending Ctrl+C (SIGINT) to process ${processId} (PID: ${childProcess.pid}) for bot type: ${botType}`)
    
    try {
      // Send SIGINT (Ctrl+C) to the process
      childProcess.kill('SIGINT')
      killedProcesses.push(`sent SIGINT to process ${childProcess.pid}`)
      console.log(`Hotkey: Sent SIGINT (Ctrl+C) to process ${childProcess.pid}`)
      
      // Wait for graceful shutdown
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // Check if process is still running
      if (!childProcess.killed) {
        console.log(`Hotkey: Process ${childProcess.pid} still running after SIGINT, trying SIGTERM...`)
        childProcess.kill('SIGTERM')
        killedProcesses.push(`sent SIGTERM to process ${childProcess.pid}`)
        
        // Wait a bit more
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        // If still running, try to kill the process tree
        if (!childProcess.killed) {
          console.log(`Hotkey: Process ${childProcess.pid} still running, killing process tree...`)
          await new Promise((resolve, reject) => {
            exec(`taskkill /PID ${childProcess.pid} /F /T`, (error, stdout, stderr) => {
              if (error && !error.message.includes('not found')) {
                console.error(`Error killing process tree ${childProcess.pid}:`, error)
                reject(error)
              } else {
                console.log(`Killed process tree ${childProcess.pid}`)
                killedProcesses.push(`killed process tree ${childProcess.pid}`)
                resolve()
              }
            })
          })
        } else {
          console.log(`Hotkey: Process ${childProcess.pid} terminated with SIGTERM`)
        }
      } else {
        console.log(`Hotkey: Process ${childProcess.pid} terminated gracefully with SIGINT`)
      }
    } catch (error) {
      console.error(`Hotkey: Error stopping process ${childProcess.pid}:`, error)
      // Try alternative kill method as fallback
      try {
        await new Promise((resolve, reject) => {
          exec(`taskkill /PID ${childProcess.pid} /F /T`, (error, stdout, stderr) => {
            if (error && !error.message.includes('not found')) {
              reject(error)
            } else {
              killedProcesses.push(`fallback kill process ${childProcess.pid}`)
              resolve()
            }
          })
        })
      } catch (altError) {
        console.error(`Hotkey: Fallback kill method also failed for ${childProcess.pid}:`, altError)
      }
    }
    
    activeProcesses.delete(processId)
  }
  
  // Perform targeted cleanup of related processes
  const botProcessesKilled = await killAllRelatedBotProcesses(processId)
  killedProcesses.push(...botProcessesKilled)
  
  return { 
    success: true, 
    killedProcesses: killedProcesses,
    message: `Process stopped: ${killedProcesses.join(', ')}`
  }
}

// Dialog handler for folder selection
ipcMain.handle('dialog:selectFolder', async () => {
  const result = await dialog.showOpenDialog(win, {
    properties: ['openDirectory', 'createDirectory'],
    title: 'Select w101-bots Repository Folder',
    buttonLabel: 'Select Folder'
  })
  return result
})

// User data file path (in project root, gitignored)
const USER_DATA_PATH = path.join(process.env.APP_ROOT, 'user-data.json')

// Load user data from file
ipcMain.handle('load-user-data', async () => {
  try {
    if (fs.existsSync(USER_DATA_PATH)) {
      const data = fs.readFileSync(USER_DATA_PATH, 'utf-8')
      console.log('User data loaded from file')
      return JSON.parse(data)
    }
    console.log('No user data file found')
    return null
  } catch (error) {
    console.error('Error loading user data:', error)
    return null
  }
})

// Save user data to file
ipcMain.handle('save-user-data', async (event, data) => {
  try {
    fs.writeFileSync(USER_DATA_PATH, JSON.stringify(data, null, 2), 'utf-8')
    console.log('User data saved to file:', USER_DATA_PATH)
    return { success: true }
  } catch (error) {
    console.error('Error saving user data:', error)
    return { success: false, error: error.message }
  }
})

// Clear/delete user data file
ipcMain.handle('clear-user-data', async () => {
  try {
    if (fs.existsSync(USER_DATA_PATH)) {
      fs.unlinkSync(USER_DATA_PATH)
      console.log('User data file deleted')
    }
    return { success: true }
  } catch (error) {
    console.error('Error deleting user data:', error)
    return { success: false, error: error.message }
  }
})

// Hotkey-related IPC handlers
ipcMain.handle('hotkey:set-current-bot', async (event, botType) => {
  try {
    currentBotState.selectedBot = botType
    console.log(`Current bot set to: ${botType}`)
    return { success: true }
  } catch (error) {
    console.error('Error setting current bot:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('hotkey:set-bot-state', async (event, isRunning, processId = null) => {
  try {
    currentBotState.isRunning = isRunning
    currentBotState.processId = processId
    console.log(`Bot state updated: running=${isRunning}, processId=${processId}`)
    return { success: true }
  } catch (error) {
    console.error('Error setting bot state:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('hotkey:get-bot-state', async () => {
  try {
    return { 
      success: true, 
      botState: currentBotState 
    }
  } catch (error) {
    console.error('Error getting bot state:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('hotkey:start-bot-with-repo', async (event, botType, repoPath) => {
  try {
    console.log(`Starting bot ${botType} via hotkey with repo path: ${repoPath}`)
    
    // Use the existing terminal:startProcess logic
    const result = await startTerminalProcessInternal(botType, repoPath)
    
    if (result.success) {
      // Update bot state
      currentBotState.selectedBot = botType
      currentBotState.isRunning = true
      currentBotState.processId = result.processId
      
      console.log(`Bot ${botType} started successfully via hotkey`)
    }
    
    return result
    
  } catch (error) {
    console.error('Error starting bot via hotkey:', error)
    return { success: false, error: error.message }
  }
})

// Extract the start process logic into a reusable function
async function startTerminalProcessInternal(botType, repoPath) {
  try {
    const absolutePath = path.resolve(repoPath)
    
    // Check if the path exists
    if (!fs.existsSync(absolutePath)) {
      return { success: false, error: `Repository path does not exist: ${absolutePath}` }
    }
    
    // Check if start.sh exists
    const startScriptPath = path.join(absolutePath, 'start.sh')
    if (!fs.existsSync(startScriptPath)) {
      return { success: false, error: `start.sh script not found in: ${absolutePath}` }
    }
    
    // Generate unique process ID
    const processId = `bot_${botType}_${Date.now()}`
    
    // Start the process with proper signal handling
    const childProcess = spawn('bash', ['./start.sh', `--${botType}`], {
      cwd: absolutePath,
      stdio: ['pipe', 'pipe', 'pipe'],
      // On Windows, we need to create a new process group to properly handle signals
      ...(process.platform === 'win32' && { 
        detached: false,
        windowsHide: false 
      })
    })
    
    // Store process reference
    activeProcesses.set(processId, {
      process: childProcess,
      botType,
      repoPath: absolutePath,
      startTime: Date.now()
    })
    
    // Handle process events
    childProcess.on('close', (code) => {
      console.log(`Bot process ${processId} exited with code ${code}`)
      activeProcesses.delete(processId)
      
      // Update bot state when process exits
      if (currentBotState.processId === processId) {
        currentBotState.isRunning = false
        currentBotState.processId = null
      }
      
      // Notify renderer about process exit
      if (win && win.webContents) {
        win.webContents.send('terminal:process-exit', processId, code)
      }
    })
    
    childProcess.on('error', (error) => {
      console.error(`Bot process ${processId} error:`, error)
      activeProcesses.delete(processId)
      
      // Update bot state on error
      if (currentBotState.processId === processId) {
        currentBotState.isRunning = false
        currentBotState.processId = null
      }
      
      // Notify renderer about process error
      if (win && win.webContents) {
        win.webContents.send('terminal:process-exit', processId, -1)
      }
    })
    
    console.log(`Started bot process ${processId} for ${botType} in ${absolutePath}`)
    
    return { 
      success: true, 
      processId,
      botType,
      repoPath: absolutePath 
    }
    
  } catch (error) {
    console.error('Error starting terminal process:', error)
    return { success: false, error: error.message }
  }
}

// Open bash shell to repository path and run start script
ipcMain.handle('shell:openBash', async (event, repoPath, botType) => {
  try {
    // Resolve the path to absolute path
    const absolutePath = path.resolve(repoPath)
    
    // Check if the path exists
    if (!fs.existsSync(absolutePath)) {
      return { success: false, error: `Repository path does not exist: ${absolutePath}` }
    }
    
    // Check if start.sh exists
    const startScriptPath = path.join(absolutePath, 'start.sh')
    if (!fs.existsSync(startScriptPath)) {
      return { success: false, error: `start.sh script not found in: ${absolutePath}` }
    }
    
    // Determine the shell command based on platform
    let shellCommand
    let shellArgs
    
    if (process.platform === 'win32') {
      // On Windows, create a temporary batch file to run the script
      const batchContent = `@echo off
echo Starting ${botType} bot...
cd /d "${absolutePath}"
echo Current directory: %CD%
echo Running: bash ./start.sh --${botType}
bash ./start.sh --${botType}
echo.
echo Script execution completed. Press any key to close this window.
pause > nul`
      
      const tempDir = os.tmpdir()
      const batchFile = path.join(tempDir, `run_${botType}_bot_${Date.now()}.bat`)
      fs.writeFileSync(batchFile, batchContent)
      
      shellCommand = 'cmd'
      shellArgs = ['/c', 'start', 'cmd', '/k', `${batchFile} && del "${batchFile}"`]
    } else if (process.platform === 'darwin') {
      // On macOS, use Terminal.app
      shellCommand = 'open'
      shellArgs = ['-a', 'Terminal', absolutePath, '--args', '-e', `bash -c "cd '${absolutePath}' && ./start.sh --${botType}; exec bash"`]
    } else {
      // On Linux, use the default terminal
      shellCommand = 'gnome-terminal'
      shellArgs = ['--working-directory', absolutePath, '--', 'bash', '-c', `./start.sh --${botType}; exec bash`]
    }
    
    // Spawn the shell process
    const shellProcess = spawn(shellCommand, shellArgs, {
      cwd: absolutePath,
      detached: true,
      stdio: 'ignore'
    })
    
    // Unref to allow the main process to exit independently
    shellProcess.unref()
    
    console.log(`Opened shell and running start script for ${botType} bot in: ${absolutePath}`)
    return { success: true, path: absolutePath, botType }
    
  } catch (error) {
    console.error('Error opening shell:', error)
    return { success: false, error: error.message }
  }
})

// Terminal process management for embedded terminal
ipcMain.handle('terminal:startProcess', async (event, repoPath, botType) => {
  try {
    const result = await startTerminalProcessInternal(botType, repoPath)
    
    // Update bot state for hotkeys
    if (result.success) {
      currentBotState.selectedBot = botType
      currentBotState.isRunning = true
      currentBotState.processId = result.processId
    }
    
    return result
    
  } catch (error) {
    console.error('Error starting terminal process:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('terminal:stopProcess', async (event, processId) => {
  try {
    const processInfo = activeProcesses.get(processId)
    let killedProcesses = []
    
    console.log(`🛑 Attempting to stop bot process ${processId}`)
    
    // First, try to kill the Python process directly
    if (processInfo) {
      const { process: childProcess, botType } = processInfo
      console.log(`Stopping process ${processId} (PID: ${childProcess.pid}) for bot type: ${botType}`)
      
      try {
        // Use our new direct Python process killing function
        const result = await killPythonProcessDirectly(botType, childProcess.pid)
        killedProcesses.push(...result.killedProcesses)
        console.log(`Python process termination result: ${result.message}`)
        
        // Mark the bash process as killed
        childProcess.kill('SIGTERM')
        killedProcesses.push(`terminated bash process ${childProcess.pid}`)
        
      } catch (error) {
        console.error(`Error stopping process ${childProcess.pid}:`, error)
        // Try alternative kill method as fallback
        try {
          childProcess.kill('SIGTERM')
          killedProcesses.push(`fallback SIGTERM to process ${childProcess.pid}`)
        } catch (altError) {
          console.error(`Fallback kill method also failed for ${childProcess.pid}:`, altError)
        }
      }
      
      activeProcesses.delete(processId)
    }
    
    // Update bot state for hotkeys
    if (currentBotState.processId === processId) {
      currentBotState.isRunning = false
      currentBotState.processId = null
    }
    
    console.log(`✅ Stopped bot process ${processId}. Actions: ${killedProcesses.join(', ')}`)
    return { 
      success: true, 
      killedProcesses: killedProcesses,
      message: `Process stopped: ${killedProcesses.join(', ')}`
    }
    
  } catch (error) {
    console.error('Error stopping terminal process:', error)
    return { success: false, error: error.message }
  }
})

// Helper function to kill related bot processes (targeted approach)
async function killAllRelatedBotProcesses(processId) {
  const killedProcesses = []
  
  // Get bot type from the process info
  const processInfo = activeProcesses.get(processId)
  const botType = processInfo ? processInfo.botType : null
  
  if (!botType) {
    console.log('No bot type found for process, skipping targeted cleanup')
    return killedProcesses
  }
  
  if (process.platform === 'win32') {
    try {
      console.log(`🎯 TARGETED CLEANUP: Killing processes related to bot type: ${botType}`)
      
      // Only kill processes that are specifically related to our bot
      const targetedKillPromises = [
        // Kill bash processes running start.sh with our specific bot type
        new Promise((resolve) => {
          exec(`taskkill /FI "COMMANDLINE eq bash ./start.sh --${botType}" /F /T`, (error, stdout, stderr) => {
            if (!error) {
              killedProcesses.push(`bash start.sh --${botType}`)
              console.log(`🎯 Killed bash start.sh --${botType}`)
            }
            resolve()
          })
        }),
        
        // Kill Python processes running main.py with our specific bot type
        new Promise((resolve) => {
          exec(`taskkill /FI "COMMANDLINE eq python main.py --type ${botType}" /F /T`, (error, stdout, stderr) => {
            if (!error) {
              killedProcesses.push(`python main.py --type ${botType}`)
              console.log(`🎯 Killed python main.py --type ${botType}`)
            }
            resolve()
          })
        }),
        
        // Kill any processes with our specific bot type in command line
        new Promise((resolve) => {
          exec(`wmic process where "commandline like '%${botType}%'" delete`, (error, stdout, stderr) => {
            if (!error) {
              killedProcesses.push(`processes with ${botType}`)
              console.log(`🎯 Killed processes with ${botType}`)
            }
            resolve()
          })
        })
      ]
      
      await Promise.all(targetedKillPromises)
      
      // Wait a moment for processes to terminate
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      console.log(`✅ Targeted cleanup completed for ${botType}`)
      
    } catch (error) {
      console.error('Error in targeted process killing:', error)
    }
  } else {
    // For Unix-like systems
    try {
      await new Promise((resolve) => {
        exec(`pkill -f "start.sh --${botType}"`, (error, stdout, stderr) => {
          if (!error) killedProcesses.push(`bash start.sh --${botType}`)
          resolve()
        })
      })
      
      await new Promise((resolve) => {
        exec(`pkill -f "main.py --type ${botType}"`, (error, stdout, stderr) => {
          if (!error) killedProcesses.push(`python main.py --type ${botType}`)
          resolve()
        })
      })
    } catch (error) {
      console.error('Error killing related bot processes on Unix:', error)
    }
  }
  
  return killedProcesses
}

ipcMain.handle('terminal:sendSignal', async (event, processId, signal) => {
  try {
    const processInfo = activeProcesses.get(processId)
    if (!processInfo) {
      return { success: false, error: 'Process not found' }
    }
    
    const { process: childProcess, botType } = processInfo
    console.log(`Sending signal ${signal} to process ${processId} (PID: ${childProcess.pid}) for bot type: ${botType}`)
    
    if (signal === 'SIGINT') {
      // For Ctrl+C, find and kill the Python process directly
      const result = await killPythonProcessDirectly(botType, childProcess.pid)
      console.log(`✅ Python process termination result: ${result.message}`)
      return { success: true, message: result.message }
    } else {
      // For other signals, use the standard kill method
      childProcess.kill(signal)
      console.log(`✅ Sent signal ${signal} to process ${processId} (PID: ${childProcess.pid})`)
      return { success: true, message: `Sent ${signal} to process ${childProcess.pid}` }
    }
    
  } catch (error) {
    console.error('Error sending signal to process:', error)
    return { success: false, error: error.message }
  }
})

// Function to find and kill Python process directly
async function killPythonProcessDirectly(botType, bashPid) {
  const killedProcesses = []
  
  try {
    console.log(`🔍 Looking for Python process running main.py --type ${botType}`)
    
    if (process.platform === 'win32') {
      // On Windows, use wmic to find the Python process
      const pythonProcesses = await new Promise((resolve, reject) => {
        exec(`wmic process where "commandline like '%python main.py --type ${botType}%'" get processid,commandline /format:csv`, (error, stdout, stderr) => {
          if (error) {
            resolve('')
          } else {
            resolve(stdout)
          }
        })
      })
      
      // Parse the output to get PIDs
      const lines = pythonProcesses.split('\n').filter(line => line.trim() && line.includes('python main.py'))
      console.log(`Found ${lines.length} Python process(es)`)
      
      for (const line of lines) {
        const parts = line.split(',')
        if (parts.length >= 2) {
          const pid = parts[parts.length - 1].trim()
          if (pid && pid !== 'ProcessId') {
            console.log(`🎯 Killing Python process PID: ${pid}`)
            
            await new Promise((resolve) => {
              exec(`taskkill /PID ${pid} /F`, (error, stdout, stderr) => {
                if (!error) {
                  killedProcesses.push(`Python process ${pid}`)
                  console.log(`✅ Successfully killed Python process ${pid}`)
                } else {
                  console.log(`⚠️ Failed to kill Python process ${pid}: ${error.message}`)
                }
                resolve()
              })
            })
          }
        }
      }
      
      // Also try the more specific taskkill command
      await new Promise((resolve) => {
        exec(`taskkill /FI "COMMANDLINE eq python main.py --type ${botType}" /F`, (error, stdout, stderr) => {
          if (!error) {
            killedProcesses.push(`Python process with bot type ${botType}`)
            console.log(`✅ Killed Python process via taskkill filter`)
          } else {
            console.log(`No Python process found via taskkill filter`)
          }
          resolve()
        })
      })
      
    } else {
      // On Unix-like systems, use ps and pkill
      await new Promise((resolve) => {
        exec(`pkill -f "python.*main.py.*--type.*${botType}"`, (error, stdout, stderr) => {
          if (!error) {
            killedProcesses.push(`Python process for ${botType}`)
            console.log(`✅ Killed Python process on Unix`)
          } else {
            console.log(`No Python process found on Unix`)
          }
          resolve()
        })
      })
    }
    
    // If no Python processes were found/killed, kill the bash process tree as fallback
    if (killedProcesses.length === 0) {
      console.log(`⚠️ No Python processes found, killing bash process tree as fallback`)
      await new Promise((resolve) => {
        exec(`taskkill /PID ${bashPid} /F /T`, (error, stdout, stderr) => {
          if (!error) {
            killedProcesses.push(`Bash process tree ${bashPid}`)
            console.log(`✅ Killed bash process tree as fallback`)
          } else {
            console.log(`Failed to kill bash process tree: ${error.message}`)
          }
          resolve()
        })
      })
    }
    
    return {
      success: killedProcesses.length > 0,
      message: killedProcesses.length > 0 
        ? `Killed: ${killedProcesses.join(', ')}`
        : 'No processes found to kill',
      killedProcesses
    }
    
  } catch (error) {
    console.error('Error killing Python process:', error)
    return {
      success: false,
      message: `Error: ${error.message}`,
      killedProcesses
    }
  }
}

ipcMain.handle('terminal:getProcessOutput', async (event, processId) => {
  try {
    const processInfo = activeProcesses.get(processId)
    if (!processInfo) {
      return { success: false, error: 'Process not found' }
    }
    
    const { process: childProcess } = processInfo
    
    // Set up output listeners if not already done
    if (!processInfo.outputListener) {
      processInfo.outputListener = true
      
      childProcess.stdout.on('data', (data) => {
        win.webContents.send('terminal:output', processId, 'stdout', data.toString())
      })
      
      childProcess.stderr.on('data', (data) => {
        win.webContents.send('terminal:output', processId, 'stderr', data.toString())
      })
    }
    
    return { success: true }
    
  } catch (error) {
    console.error('Error getting process output:', error)
    return { success: false, error: error.message }
  }
})

// Utility function to kill all bot processes (for manual cleanup)
async function killAllBotProcesses() {
  const killedProcesses = []
  
  if (process.platform === 'win32') {
    // Kill all possible bot-related processes
    const cleanupPromises = [
      // Kill all bash processes with start.sh
      new Promise((resolve) => {
        exec('wmic process where "commandline like \'%start.sh%\'" delete', (error, stdout, stderr) => {
          if (!error) killedProcesses.push('all start.sh processes')
          resolve()
        })
      }),
      
      // Kill all Python processes with main.py
      new Promise((resolve) => {
        exec('wmic process where "commandline like \'%main.py%\'" delete', (error, stdout, stderr) => {
          if (!error) killedProcesses.push('all main.py processes')
          resolve()
        })
      }),
      
      // Kill all Python processes with bot types
      new Promise((resolve) => {
        exec('wmic process where "commandline like \'%--type%\'" delete', (error, stdout, stderr) => {
          if (!error) killedProcesses.push('all typed bot processes')
          resolve()
        })
      }),
      
      // Kill specific bot types
      new Promise((resolve) => {
        exec('taskkill /FI "COMMANDLINE eq bash ./start.sh --trivia" /F /T', (error, stdout, stderr) => {
          if (!error) killedProcesses.push('trivia bash processes')
          resolve()
        })
      }),
      
      new Promise((resolve) => {
        exec('taskkill /FI "COMMANDLINE eq python main.py --type trivia" /F /T', (error, stdout, stderr) => {
          if (!error) killedProcesses.push('trivia python processes')
          resolve()
        })
      })
    ]
    
    await Promise.all(cleanupPromises)
  } else {
    // For Unix-like systems
    const unixCleanupPromises = [
      new Promise((resolve) => {
        exec('pkill -f "start.sh"', (error, stdout, stderr) => {
          if (!error) killedProcesses.push('all start.sh processes')
          resolve()
        })
      }),
      new Promise((resolve) => {
        exec('pkill -f "main.py"', (error, stdout, stderr) => {
          if (!error) killedProcesses.push('all main.py processes')
          resolve()
        })
      })
    ]
    
    await Promise.all(unixCleanupPromises)
  }
  
  // Clean up our tracked processes
  for (const [processId, processInfo] of activeProcesses) {
    try {
      processInfo.process.kill()
      killedProcesses.push(`tracked process ${processInfo.process.pid}`)
    } catch (error) {
      console.error(`Error killing tracked process ${processId}:`, error)
    }
  }
  activeProcesses.clear()
  
  console.log(`All bot processes cleaned up. Killed: ${killedProcesses.join(', ')}`)
  return killedProcesses
}

// IPC handler for killing all bot processes
ipcMain.handle('terminal:killAllBotProcesses', async () => {
  try {
    const killedProcesses = await killAllBotProcesses()
    return { 
      success: true, 
      killedProcesses,
      message: `Emergency cleanup completed. Killed ${killedProcesses.length} process(es)`
    }
  } catch (error) {
    console.error('Error cleaning up bot processes:', error)
    return { success: false, error: error.message }
  }
})

// Clean up processes on app quit
app.on('before-quit', () => {
  console.log('Cleaning up active processes...')
  for (const [processId, processInfo] of activeProcesses) {
    try {
      processInfo.process.kill()
    } catch (error) {
      console.error(`Error killing process ${processId}:`, error)
    }
  }
  activeProcesses.clear()
})

// Clean up global hotkeys on app quit
app.on('will-quit', () => {
  console.log('Unregistering global hotkeys...')
  globalShortcut.unregisterAll()
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(createWindow)
