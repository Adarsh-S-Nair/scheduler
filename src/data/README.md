# Data Directory

## Files Overview

### `bots.json`
**Purpose:** General bot definitions available to all users.

This file contains the catalog of all available bots in the application. It should be:
- ✅ Committed to git
- ✅ Shared across all users
- ✅ Read-only for the application

**Structure:**
```json
[
  {
    "id": "unique-bot-id",
    "name": "Display Name",
    "description": "What this bot does",
    "icon": "icon-identifier"
  }
]
```

### `nav.js`
**Purpose:** Navigation menu configuration.

Contains the application's navigation structure and menu items.

## User-Specific Data

User-specific data (like which bots are activated, bot configurations, preferences, etc.) is **NOT** stored in this directory.

**Current Implementation:**
- User data is stored in browser `localStorage`
- Managed by `src/utils/userDataManager.js`
- Automatically initialized on first app launch

**Future Implementation:**
When migrating to file-based storage:
- User data will be stored in a `user-data.json` file
- Location: Electron's user data directory (`app.getPath('userData')`)
- This file will be gitignored and unique to each user


