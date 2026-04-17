/**
 * MAD7 ↔ Packman API Integration
 * Connects Packman API data to MAD7 floor management
 * 
 * This file bridges the API responses to MAD7's expected data format
 */

/**
 * Transform Packman API floor data to MAD7 format
 * Packman: { stations: [{ id, name, active_workers, capacity, rates }] }
 * MAD7: { station: { login, station, task, process } }
 */
function transformPackmanToMAD7(packmanData) {
  if (!packmanData || !packmanData.stations) {
    console.error('❌ Invalid Packman data structure');
    return {};
  }

  const mad7Format = {};
  
  packmanData.stations.forEach(station => {
    // For each active worker in the station
    if (station.active_workers && station.active_workers > 0) {
      // Generate mock worker logins for demonstration
      // In a real scenario, you'd get actual worker data from another API endpoint
      for (let i = 0; i < Math.min(station.active_workers, 1); i++) {
        const mockLogin = `worker_${station.id}_${i}`;
        const stationId = station.id;
        
        mad7Format[stationId] = {
          login: mockLogin,
          station: stationId,
          task: 'active_task',
          process: station.name || stationId,
          rate: station.current_rate,
          target: station.target_rate
        };
      }
    }
  });

  return mad7Format;
}

/**
 * Fetch live floor data from Packman and update MAD7
 */
async function fetchAndUpdateFloor() {
  try {
    console.log('🔄 Fetching live floor data from Packman...');
    
    // Get the API instance
    const api = getPackmanAPI();
    if (!api) {
      console.error('❌ Packman API not available');
      return false;
    }
    
    // Make sure we're authenticated
    if (!api.isAuthenticated) {
      console.log('🔐 Authenticating first...');
      await api.authenticate();
    }

    // Fetch real data
    console.log('📡 Calling Packman API...');
    const packmanData = await api.getRecentFloorData({
      facilityCode: 'MAD7',
      limit: 500
    });

    if (!packmanData) {
      console.error('❌ No data from Packman');
      return false;
    }

    // Transform to MAD7 format
    const mad7Data = transformPackmanToMAD7(packmanData);
    
    // Update the app's global state
    S.floorWorkers = mad7Data;
    syncFloorWorkersToSM();
    
    console.log('✅ Floor data updated from Packman:', mad7Data);
    
    // Refresh the UI
    buildFloorTabs();
    renderOverview();
    
    // Show success message
    const count = Object.keys(mad7Data).length;
    toast(`📊 Live data: ${count} stations active`);
    
    return true;

  } catch (error) {
    console.error('❌ Error fetching live data:', error);
    // Fallback: use mock/pasted data
    console.log('⚠️ Falling back to manual data entry');
    return false;
  }
}

/**
 * Auto-fetch floor data on app load
 */
async function autoInitializeFloorData() {
  console.log('🚀 Initializing floor data source...');
  
  // Try live API first
  const success = await fetchAndUpdateFloor();
  
  if (!success) {
    console.log('💡 Waiting for manual floor data paste...');
    console.log('💡 Or run: fetchAndUpdateFloor() to retry');
  }
}

/**
 * Add a button to the UI for manual live data refresh
 */
function addLiveFloorButton() {
  const floorSection = document.querySelector('[data-section="floor"]') || 
                      document.getElementById('page-floor');
  
  if (!floorSection) return;
  
  // Create refresh button
  const btn = document.createElement('button');
  btn.className = 'btn primary';
  btn.innerHTML = '🔄 Refresh Live Data';
  btn.onclick = fetchAndUpdateFloor;
  btn.style.marginBottom = '12px';
  btn.title = 'Fetch latest data from Packman API';
  
  // Insert at the top of the section
  const topArea = floorSection.querySelector('.scroll') || floorSection;
  if (topArea) {
    topArea.insertBefore(btn, topArea.firstChild);
  }
  
  console.log('✅ Live refresh button added');
}

// Make functions available globally
window.fetchAndUpdateFloor = fetchAndUpdateFloor;
window.transformPackmanToMAD7 = transformPackmanToMAD7;
window.autoInitializeFloorData = autoInitializeFloorData;
window.addLiveFloorButton = addLiveFloorButton;

// Initialize on page load
console.log('✅ MAD7 ↔ Packman integration ready');
document.addEventListener('DOMContentLoaded', () => {
  addLiveFloorButton();
  // Uncomment to auto-fetch on load:
  // autoInitializeFloorData();
});
