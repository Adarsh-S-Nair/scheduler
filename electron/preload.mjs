const { contextBridge, ipcRenderer } = require('electron')

console.log('Preload script loaded')

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('ipcRenderer', {
  on(...args) {
    const [channel, listener] = args
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
  },
  off(...args) {
    const [channel, ...omit] = args
    return ipcRenderer.off(channel, ...omit)
  },
  removeAllListeners(channel) {
    return ipcRenderer.removeAllListeners(channel)
  },
  send(...args) {
    const [channel, ...omit] = args
    return ipcRenderer.send(channel, ...omit)
  },
  invoke(...args) {
    const [channel, ...omit] = args
    return ipcRenderer.invoke(channel, ...omit)
  },
  // Window controls
  minimizeWindow: () => {
    console.log('Preload: minimizeWindow called')
    ipcRenderer.send('window-minimize')
  },
  maximizeWindow: () => {
    console.log('Preload: maximizeWindow called')
    ipcRenderer.send('window-maximize')
  },
  closeWindow: () => {
    console.log('Preload: closeWindow called')
    ipcRenderer.send('window-close')
  },
  // Shell operations
  openBashShell: (repoPath, botType) => {
    return ipcRenderer.invoke('shell:openBash', repoPath, botType)
  },
  // Terminal operations
  startTerminalProcess: (repoPath, botType) => {
    return ipcRenderer.invoke('terminal:startProcess', repoPath, botType)
  },
  stopTerminalProcess: (processId) => {
    return ipcRenderer.invoke('terminal:stopProcess', processId)
  },
  sendTerminalSignal: (processId, signal) => {
    return ipcRenderer.invoke('terminal:sendSignal', processId, signal)
  },
  getTerminalOutput: (processId) => {
    return ipcRenderer.invoke('terminal:getProcessOutput', processId)
  },
  killAllBotProcesses: () => {
    return ipcRenderer.invoke('terminal:killAllBotProcesses')
  },
  // Hotkey-related methods
  setCurrentBot: (botType) => {
    return ipcRenderer.invoke('hotkey:set-current-bot', botType)
  },
  setBotState: (isRunning, processId) => {
    return ipcRenderer.invoke('hotkey:set-bot-state', isRunning, processId)
  },
  getBotState: () => {
    return ipcRenderer.invoke('hotkey:get-bot-state')
  },
  startBotWithRepo: (botType, repoPath) => {
    return ipcRenderer.invoke('hotkey:start-bot-with-repo', botType, repoPath)
  },
  // You can expose other APIs you need here.
  // ...
})

// Also expose raw ipcRenderer for debugging
contextBridge.exposeInMainWorld('electronAPI', {
  ipcRenderer: ipcRenderer
})
