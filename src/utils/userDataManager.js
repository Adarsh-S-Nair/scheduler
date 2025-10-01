/**
 * User data manager for handling user-specific configuration
 * 
 * Currently uses localStorage for persistence.
 * In the future, this can be migrated to file-based storage using Electron's fs module
 * to write to a user-data.json file in the app's user data directory.
 * 
 * When migrating to file-based storage:
 * - Add user-data.json to .gitignore (already prepared)
 * - Use electron's app.getPath('userData') for storage location
 * - Replace localStorage calls with fs.readFileSync/writeFileSync
 */
const USER_DATA_KEY = 'scheduler_user_data';

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
 * @returns {Object} User data
 */
export const initializeUserData = () => {
  const existing = getUserData();
  
  if (!existing) {
    const initialData = {
      ...defaultUserData,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
    };
    saveUserData(initialData);
    console.log('User data initialized');
    return initialData;
  }
  
  return existing;
};

/**
 * Get user data from localStorage
 * @returns {Object|null} User data or null if not found
 */
export const getUserData = () => {
  try {
    const data = localStorage.getItem(USER_DATA_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error reading user data:', error);
    return null;
  }
};

/**
 * Save user data to localStorage
 * @param {Object} data - User data to save
 */
export const saveUserData = (data) => {
  try {
    const updatedData = {
      ...data,
      lastModified: new Date().toISOString()
    };
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(updatedData));
    console.log('User data saved');
  } catch (error) {
    console.error('Error saving user data:', error);
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
export const clearUserData = () => {
  localStorage.removeItem(USER_DATA_KEY);
  console.log('User data cleared');
};

export default {
  initializeUserData,
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
