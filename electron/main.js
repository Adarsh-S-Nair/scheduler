import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

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

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    frame: false,
    titleBarStyle: 'hidden',
    title: 'Scheduler',
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
    },
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
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

// Dialog handler for folder selection
ipcMain.handle('dialog:selectFolder', async () => {
  const result = await dialog.showOpenDialog(win, {
    properties: ['openDirectory', 'createDirectory'],
    title: 'Select w101-bots Repository Folder',
    buttonLabel: 'Select Folder'
  })
  return result
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
