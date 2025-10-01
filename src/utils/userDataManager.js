/**
 * User data manager for handling user-specific configuration
 * 
 * Uses file-based storage in the project directory (gitignored).
 */
const USER_DATA_FILE = 'user-data.json';

// Default user data structure
const defaultUserData = {
  activeBots: [], // Array of bot IDs that are activated
  botConfigs: {}, // Bot-specific configurations { botId: { config } }
  repositoryPath: '../w101-bots', // Path to w101-bots repository
  preferences: {
    theme: 'light',
    notifications: true
  },
  createdAt: null,
  lastModified: null
};

/**
 * Initialize user data if it doesn't exist
 * @returns {Promise<Object>} User data
 */
export const initializeUserData = async () => {
  // Load data from file first
  const existing = await loadUserData();
  
  if (!existing) {
    // No existing data, create new
    const initialData = {
      ...defaultUserData,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
    };
    await saveUserData(initialData);
    console.log('User data initialized in file');
    return initialData;
  }
  
  console.log('User data loaded from file');
  return existing;
};

/**
 * Get user data from cached memory
 * @returns {Object|null} User data or null if not found
 */
export const getUserData = () => {
  try {
    // Return cached data from memory
    return window.__userData || null;
  } catch (error) {
    console.error('Error reading user data:', error);
    return null;
  }
};

/**
 * Save user data to file
 * @param {Object} data - User data to save
 */
export const saveUserData = async (data) => {
  try {
    const updatedData = {
      ...data,
      lastModified: new Date().toISOString()
    };
    
    // Save to file (Electron only)
    if (window.ipcRenderer && window.ipcRenderer.invoke) {
      await window.ipcRenderer.invoke('save-user-data', updatedData);
      window.__userData = updatedData;
      console.log('User data saved to file');
    } else {
      console.warn('File system not available - running in browser mode without persistence');
      window.__userData = updatedData;
    }
  } catch (error) {
    console.error('Error saving user data:', error);
  }
};

/**
 * Load user data from file (async for Electron)
 * @returns {Promise<Object|null>}
 */
export const loadUserData = async () => {
  try {
    if (window.ipcRenderer && window.ipcRenderer.invoke) {
      const data = await window.ipcRenderer.invoke('load-user-data');
      window.__userData = data;
      console.log('Loaded user data from file:', data);
      return data;
    }
    
    console.warn('ipcRenderer not available - running in browser mode');
    return null;
  } catch (error) {
    console.error('Error loading user data:', error);
    return null;
  }
};

/**
 * Check if a bot is active
 * @param {string} botId - Bot ID to check
 * @returns {boolean}
 */
export const isBotActive = (botId) => {
  const userData = getUserData();
  return userData?.activeBots?.includes(botId) || false;
};

/**
 * Activate a bot
 * @param {string} botId - Bot ID to activate
 */
export const activateBot = (botId) => {
  const userData = getUserData() || defaultUserData;
  
  if (!userData.activeBots.includes(botId)) {
    userData.activeBots.push(botId);
    saveUserData(userData);
    console.log(`Bot ${botId} activated`);
  }
};

/**
 * Deactivate a bot
 * @param {string} botId - Bot ID to deactivate
 */
export const deactivateBot = (botId) => {
  const userData = getUserData() || defaultUserData;
  
  userData.activeBots = userData.activeBots.filter(id => id !== botId);
  saveUserData(userData);
  console.log(`Bot ${botId} deactivated`);
};

/**
 * Get bot configuration
 * @param {string} botId - Bot ID
 * @returns {Object|null}
 */
export const getBotConfig = (botId) => {
  const userData = getUserData();
  return userData?.botConfigs?.[botId] || null;
};

/**
 * Save bot configuration
 * @param {string} botId - Bot ID
 * @param {Object} config - Bot configuration
 */
export const saveBotConfig = (botId, config) => {
  const userData = getUserData() || defaultUserData;
  
  userData.botConfigs[botId] = config;
  saveUserData(userData);
  console.log(`Configuration saved for bot ${botId}`);
};

/**
 * Get all active bots
 * @returns {Array<string>}
 */
export const getActiveBots = () => {
  const userData = getUserData();
  return userData?.activeBots || [];
};

/**
 * Get repository path
 * @returns {string}
 */
export const getRepositoryPath = () => {
  const userData = getUserData();
  return userData?.repositoryPath || '../w101-bots';
};

/**
 * Save repository path
 * @param {string} path - Repository path
 */
export const saveRepositoryPath = (path) => {
  const userData = getUserData() || defaultUserData;
  
  userData.repositoryPath = path;
  saveUserData(userData);
  console.log(`Repository path saved: ${path}`);
};

/**
 * Clear all user data (use with caution!)
 */
export const clearUserData = async () => {
  try {
    if (window.ipcRenderer && window.ipcRenderer.invoke) {
      await window.ipcRenderer.invoke('clear-user-data');
      window.__userData = null;
      console.log('User data file deleted');
    } else {
      window.__userData = null;
      console.log('User data cleared from memory');
    }
  } catch (error) {
    console.error('Error clearing user data:', error);
  }
};

export default {
  initializeUserData,
  loadUserData,
  getUserData,
  saveUserData,
  isBotActive,
  activateBot,
  deactivateBot,
  getBotConfig,
  saveBotConfig,
  getActiveBots,
  getRepositoryPath,
  saveRepositoryPath,
  clearUserData
};
