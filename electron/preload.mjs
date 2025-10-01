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
  // You can expose other APIs you need here.
  // ...
})

// Also expose raw ipcRenderer for debugging
contextBridge.exposeInMainWorld('electronAPI', {
  ipcRenderer: ipcRenderer
})
