import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'

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
