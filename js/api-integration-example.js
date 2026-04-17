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
const packmanAPI = new PackmanAPIService({
  baseUrl: 'https://insights.prod-eu.pack.aft.a2z.com/packman',
  oauthUrl: 'https://midway-auth.amazon.com/SSO/redirect',
  facilityCode: 'MAD7',
  timeout: 30000
});

/**
 * Example 1: Initialize API and authenticate
 */
async function initializePackman() {
  console.log('📡 Initializing Packman API...');
  
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
    // Now you can fetch data
    return true;
  } else {
    console.error('❌ Packman authentication failed');
    // Fallback to mock/local data
    return false;
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

/**
 * Usage in your application:
 * 
 * When component loads:
 * - Call initializePackman()
 * - Try fetching from API
 * - Fallback to mock data if authentication fails
 * 
 * Update current queries like:
 * OLD: parseFloor() using hardcoded data
 * NEW: 
 *   const data = await fetchFloorData();
 *   parseFloor(data);
 */

// Example: Auto-initialize when page loads
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 Initializing MAD7 with API integration...');
  
  const apiReady = await initializePackman();
  
  if (apiReady) {
    console.log('✅ API ready - will fetch live data');
  } else {
    console.log('⚠️ API unavailable - using mock data');
  }
});
