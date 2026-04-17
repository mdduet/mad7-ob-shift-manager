# Packman API Integration Guide

## Overview

This guide explains how the MAD7 tool integrates with Amazon's Packman floor data system via OAuth 2.0 authentication.

## Architecture

```
┌─────────────────────────────────────────┐
│      MAD7 Web Application              │
│  (index.html + JavaScript)              │
└────────────────┬────────────────────────┘
                 │
                 │ Uses
                 ↓
┌─────────────────────────────────────────┐
│   PackmanAPIService (api-service.js)    │
│                                         │
│  - OAuth 2.0 Token Management           │
│  - API Request Handler                  │
│  - Error Retry Logic                    │
│  - Local Token Persistence              │
└────────────────┬────────────────────────┘
                 │
                 │ Makes HTTPS requests
                 ↓
┌─────────────────────────────────────────┐
│    Packman API (Amazon Internal)        │
│                                         │
│  Endpoints:                             │
│  - /recent (floor data)                 │
│  - /worker/{id} (profiles)              │
│  - /schedule (shifts)                   │
│  - /metrics/{id} (performance)          │
└─────────────────────────────────────────┘
```

## Setup Instructions

### 1. Configure Environment Variables

```bash
# Create .env file (copy from .env.example)
cp .env.example .env

# Edit .env with your credentials
# DO NOT commit .env to git
```

### 2. What to Add to .env

```env
PACKMAN_BASE_URL=https://insights.prod-eu.pack.aft.a2z.com/packman
PACKMAN_OAUTH_URL=https://midway-auth.amazon.com/SSO/redirect
PACKMAN_FACILITY_CODE=MAD7

# Get these from Amazon SSO admin panel
OAUTH_CLIENT_ID=your-client-id
OAUTH_CLIENT_SECRET=your-client-secret
```

### 3. Include Scripts in index.html

```html
<!-- Before your main script, add: -->
<script src="js/api-service.js"></script>
<script src="js/api-integration-example.js"></script>
```

## API Methods

### Authentication

```javascript
// Check if authenticated
packmanAPI.isAuthenticated  // true/false

// Get OAuth code (handles automatically on redirect)
await packmanAPI.authenticate()

// Logout
packmanAPI.logout()

// Get status
packmanAPI.getStatus()
// Returns: { isAuthenticated, tokenExpiry, expiresIn, facility }
```

### Fetch Data

```javascript
// Get recent floor data
const floorData = await packmanAPI.getRecentFloorData({
  facilityCode: 'MAD7',
  limit: 1000
});

// Get worker profile
const profile = await packmanAPI.getWorkerProfile('jdoe001');

// Get shift schedule
const schedule = await packmanAPI.getShiftSchedule({
  facilityCode: 'MAD7',
  startDate: '2026-04-17',
  endDate: '2026-04-24'
});

// Get process metrics
const metrics = await packmanAPI.getProcessMetrics('OB_Pick_Arsaw', {
  timeRange: '1h',
  facilityCode: 'MAD7'
});
```

## Security Features

### Token Management
- ✅ Automatic token refresh before expiry
- ✅ Tokens stored in localStorage (encrypted by browser)
- ✅ Silent refresh - no user action needed

### Credentials
- ✅ `.env` file never committed to git
- ✅ Environment variables used for secrets
- ✅ `.gitignore` prevents accidents

### Error Handling
- ✅ Automatic retry on failures
- ✅ Graceful fallback to mock data
- ✅ Comprehensive error logging

### Request Safety
- ✅ 30-second timeout per request
- ✅ Automatic 401 handling (re-auth + retry)
- ✅ CORS support with credentials

## Error Handling

### Typical Error Cases

```javascript
// API returns 401 Unauthorized
// → Service automatically refreshes token
// → Retries request
// → If still fails, logs user out

// Network timeout (30 seconds)
// → Error thrown to caller
// → Can implement retry logic

// Authentication fails
// → Falls back to mock data
// → Logs user out
// → Guide user to login

try {
  const data = await packmanAPI.getRecentFloorData();
  updateUI(data);
} catch (error) {
  console.error('Failed to fetch:', error);
  // Show fallback UI
  showMockData();
}
```

## Testing Locally

### With Mock Data (No API Needed)
```bash
# Edit index.html - comment out API calls
# Use mock data functions
# Test UI/UX without Packman access
```

### With Real API
```bash
# 1. Get OAuth credentials from Amazon SSO
# 2. Add to .env file
# 3. Run from corporate network (or VPN)
# 4. Authenticate when prompted
# 5. Should see live Packman data
```

## Troubleshooting

### "401 Unauthorized"
- Check if token has expired
- Verify OAuth client ID/secret in .env
- Token refresh might be needed

### "CORS Error"
- Packman might need corporate proxy
- Check if running on corporate network
- Try VPN connection

### "Network Timeout"
- Increase timeout in config
- Check internet connection
- Packman service might be down

### "localStorage is undefined"
- Usually in server-side render context
- Use memory cache instead
- Check browser environment

## Next Steps

1. **Test Locally** - Use `.env.example` first
2. **Get Credentials** - Work with Amazon SSO team
3. **Update .env** - Add real OAuth credentials
4. **Integrate** - Replace mock data calls with API
5. **Deploy** - Ensure .env is set on production server

## File Structure

```
MAD7-OBShiftManager/
├── index.html                    # Main app
├── js/
│   ├── api-service.js           # API client (core)
│   └── api-integration-example.js # Usage examples
├── .env.example                  # Template (commit this)
├── .env                          # Secrets (NEVER commit)
├── .gitignore                    # Excludes .env
└── README.md
```

## Important Security Notes

⚠️ **NEVER:**
- Commit `.env` file to git
- Share OAuth credentials
- Log tokens in console (production)
- Hardcode secrets in code

✅ **ALWAYS:**
- Use environment variables
- Rotate credentials regularly
- Review logs for suspicious activity
- Test error scenarios

## Questions?

- See `api-integration-example.js` for code examples
- Check console logs (with 🔐🔄📡 emojis for debugging)
- Review error handling patterns

---

**Status:** Ready for OAuth integration  
**Version:** 1.0  
**Updated:** 2026-04-17
