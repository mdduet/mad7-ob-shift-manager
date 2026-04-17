/**
 * API Integration Example
 * Shows how to use PackmanAPIService in your MAD7 application
 * 
 * To use:
 * 1. Copy .env.example to .env and add your credentials
 * 2. Include this in index.html before your main script:
 *    <script src="js/api-service.js"></script>
 *    <script src="js/api-integration-example.js"></script>
 */

// Initialize API Service with Packman configuration
let packmanAPI;

// Ensure PackmanAPIService is available before creating instance
if (typeof PackmanAPIService === 'undefined') {
  console.error('❌ PackmanAPIService not loaded - check that api-service.js is loaded first');
} else {
  packmanAPI = new PackmanAPIService({
    baseUrl: 'https://insights.prod-eu.pack.aft.a2z.com/packman',
    oauthUrl: 'https://midway-auth.amazon.com/SSO/redirect',
    facilityCode: 'MAD7',
    timeout: 30000
  });
  console.log('✅ PackmanAPIService instance created');
}

/**
 * Example 1: Initialize API and authenticate
 */
async function initializePackman() {
  console.log('📡 Initializing Packman API...');
  
  // Check if packmanAPI is available
  if (!packmanAPI) {
    console.error('❌ PackmanAPIService not initialized');
    return false;
  }
  
  // Check if already authenticated
  if (packmanAPI.isAuthenticated) {
    console.log('✅ Already authenticated with Packman');
    console.log('Status:', packmanAPI.getStatus());
    return true;
  }

  // Attempt authentication
  const success = await packmanAPI.authenticate();
  
  if (success) {
    console.log('✅ Packman authentication successful');
    console.log('💡 Try: fetchFloorData() or fetchWorkerProfile("your-login")');
    // Now you can fetch data
    return true;
  } else {
    console.error('❌ Packman authentication failed');
    // Fallback to mock/local data
    console.log('💡 Using fallback test mode - try: getMockFloorData()');
    return false;
  }
}

/**
 * Quick test function - shows if API is working
 */
async function testPackmanAPI() {
  console.log('🧪 Testing Packman API integration...\n');
  
  // Initialize
  await initializePackman();
  
  // Test fetch
  console.log('\n📊 Fetching test data...');
  const data = await fetchFloorData();
  
  if (data) {
    console.log('✅ API is working! Data received:', data);
  } else {
    console.error('❌ API test failed');
  }
}

/**
 * Example 2: Fetch recent floor data
 */
async function fetchFloorData() {
  try {
    console.log('📊 Fetching floor data from Packman...');
    
    const data = await packmanAPI.getRecentFloorData({
      facilityCode: 'MAD7',
      limit: 500
    });

    console.log('✅ Floor data received:', data);
    return data;

  } catch (error) {
    console.error('❌ Error fetching floor data:', error);
    // Fallback to mock data
    return getMockFloorData();
  }
}

/**
 * Example 3: Fetch worker profile
 */
async function fetchWorkerProfile(login) {
  try {
    console.log(`👤 Fetching profile for ${login}...`);
    
    const profile = await packmanAPI.getWorkerProfile(login);
    
    console.log('✅ Worker profile received:', profile);
    return profile;

  } catch (error) {
    console.error(`❌ Error fetching profile for ${login}:`, error);
    return null;
  }
}

/**
 * Example 4: Fetch shift schedule
 */
async function fetchSchedule(startDate, endDate) {
  try {
    console.log(`📅 Fetching schedule from ${startDate} to ${endDate}...`);
    
    const schedule = await packmanAPI.getShiftSchedule({
      facilityCode: 'MAD7',
      startDate,
      endDate
    });

    console.log('✅ Schedule received:', schedule);
    return schedule;

  } catch (error) {
    console.error('❌ Error fetching schedule:', error);
    return [];
  }
}

/**
 * Example 5: Fetch process metrics
 */
async function fetchProcessMetrics(processId, timeRange = '1h') {
  try {
    console.log(`📈 Fetching metrics for ${processId}...`);
    
    const metrics = await packmanAPI.getProcessMetrics(processId, {
      timeRange,
      facilityCode: 'MAD7'
    });

    console.log('✅ Metrics received:', metrics);
    return metrics;

  } catch (error) {
    console.error(`❌ Error fetching metrics for ${processId}:`, error);
    return null;
  }
}

/**
 * Example 6: Handle authentication errors gracefully
 */
async function fetchWithRetry(endpoint, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await endpoint();
    } catch (error) {
      console.warn(`⚠️ Attempt ${i + 1}/${retries} failed:`, error.message);
      
      if (i === retries - 1) {
        throw error;
      }
      
      // Exponential backoff
      await new Promise(resolve => 
        setTimeout(resolve, Math.pow(2, i) * 1000)
      );
    }
  }
}

/**
 * Example 7: Mock data fallback (for local development)
 */
function getMockFloorData() {
  console.log('⚠️ Using mock floor data (development mode)');
  
  return {
    facility: 'MAD7',
    timestamp: new Date().toISOString(),
    stations: [
      {
        id: 'ws_pick_01',
        name: 'Pick Station 1',
        active_workers: 3,
        capacity: 5,
        current_rate: 245,
        target_rate: 250
      },
      {
        id: 'ws_pack_02',
        name: 'Pack Station 2',
        active_workers: 4,
        capacity: 5,
        current_rate: 185,
        target_rate: 200
      }
    ]
  };
}

// ══════════════════════════════════════════════════════════
// EXPOSE ALL API FUNCTIONS TO WINDOW (GLOBAL SCOPE)
// ══════════════════════════════════════════════════════════
window.packmanAPI = packmanAPI;
window.initializePackman = initializePackman;
window.testPackmanAPI = testPackmanAPI;
window.fetchFloorData = fetchFloorData;
window.fetchWorkerProfile = fetchWorkerProfile;
window.fetchSchedule = fetchSchedule;
window.fetchProcessMetrics = fetchProcessMetrics;
window.getMockFloorData = getMockFloorData;

// ✅ Display available commands in console on load
console.log('%c✅ Packman API integration loaded!', 'color: green; font-weight: bold;');
console.log('%cAvailable commands:', 'color: blue; font-weight: bold;');
console.log('  • initializePackman() - Initialize and authenticate');
console.log('  • testPackmanAPI() - Run full API test');
console.log('  • fetchFloorData() - Get floor data');
console.log('  • fetchWorkerProfile("login") - Get worker info');
console.log('  • getMockFloorData() - Get test data');
console.log('  • packmanAPI.getStatus() - Check API status');

// Auto-initialize when page loads
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 Initializing MAD7 with API integration...');
  
  const apiReady = await initializePackman();
  
  if (apiReady) {
    console.log('✅ API ready - will fetch live data');
  } else {
    console.log('⚠️ API unavailable - using mock data');
  }
});
