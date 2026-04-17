/**
 * API Service - Packman Integration
 * Handles all communication with Amazon Packman floor data system
 * 
 * Authentication: OAuth 2.0 via Midway SSO
 * Endpoints: https://insights.prod-eu.pack.aft.a2z.com/packman/
 */

class PackmanAPIService {
  constructor(config = {}) {
    // Configuration - can be overridden with environment variables
    this.config = {
      baseUrl: config.baseUrl || 'https://insights.prod-eu.pack.aft.a2z.com/packman',
      oauthUrl: config.oauthUrl || 'https://midway-auth.amazon.com/SSO/redirect',
      facilityCode: config.facilityCode || 'MAD7',
      tokenRefreshInterval: config.tokenRefreshInterval || 3600000, // 1 hour
      timeout: config.timeout || 30000, // 30 seconds
      ...config
    };

    // Runtime state
    this.accessToken = localStorage.getItem('packman_access_token') || null;
    this.refreshToken = localStorage.getItem('packman_refresh_token') || null;
    this.tokenExpiry = parseInt(localStorage.getItem('packman_token_expiry') || '0');
    this.isAuthenticated = this.accessToken !== null;

    // Initialize token refresh if we have a token
    if (this.isAuthenticated) {
      this.scheduleTokenRefresh();
    }
  }

  /**
   * Authenticate with Packman via OAuth 2.0
   * @returns {Promise<boolean>}
   */
  async authenticate() {
    try {
      console.log('🔐 Authenticating with Packman...');
      
      // In production, this would handle the OAuth flow
      // For MVP: we'll implement a simpler token request pattern
      const response = await this.makeRequest('/auth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          // In real implementation, these come from OAuth callback
          code: this.getOAuthCode(),
          redirect_uri: this.getRedirectUri()
        })
      });

      if (response.access_token) {
        this.setTokens(response.access_token, response.refresh_token, response.expires_in);
        this.isAuthenticated = true;
        this.scheduleTokenRefresh();
        console.log('✅ Authentication successful');
        return true;
      }
      
      throw new Error('No access token received');
    } catch (error) {
      console.error('❌ Authentication failed:', error);
      return false;
    }
  }

  /**
   * Get OAuth authorization code (from callback)
   * @protected
   */
  getOAuthCode() {
    // In production: extract from URL parameters after OAuth redirect
    const params = new URLSearchParams(window.location.search);
    return params.get('code') || null;
  }

  /**
   * Get OAuth redirect URI
   * @protected
   */
  getRedirectUri() {
    return window.location.origin + window.location.pathname;
  }

  /**
   * Refresh access token
   * @protected
   */
  async refreshAccessToken() {
    if (!this.refreshToken) {
      console.warn('⚠️ No refresh token available');
      return false;
    }

    try {
      console.log('🔄 Refreshing access token...');
      const response = await this.makeRequest('/auth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          grant_type: 'refresh_token',
          refresh_token: this.refreshToken
        })
      });

      if (response.access_token) {
        this.setTokens(response.access_token, response.refresh_token, response.expires_in);
        console.log('✅ Token refreshed');
        return true;
      }
      
      throw new Error('Token refresh failed');
    } catch (error) {
      console.error('❌ Token refresh error:', error);
      this.logout();
      return false;
    }
  }

  /**
   * Set tokens in memory and localStorage
   * @protected
   */
  setTokens(accessToken, refreshToken, expiresIn) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.tokenExpiry = Date.now() + (expiresIn * 1000);

    // Persist to localStorage
    localStorage.setItem('packman_access_token', accessToken);
    if (refreshToken) {
      localStorage.setItem('packman_refresh_token', refreshToken);
    }
    localStorage.setItem('packman_token_expiry', this.tokenExpiry.toString());
  }

  /**
   * Schedule automatic token refresh before expiry
   * @protected
   */
  scheduleTokenRefresh() {
    const timeToExpiry = this.tokenExpiry - Date.now();
    const refreshBefore = 60000; // 1 minute before expiry

    if (timeToExpiry > refreshBefore) {
      const delayMs = timeToExpiry - refreshBefore;
      setTimeout(() => this.refreshAccessToken(), delayMs);
    }
  }

  /**
   * Get recent floor data
   * @param {Object} options - Filter options
   * @returns {Promise<Object>}
   */
  async getRecentFloorData(options = {}) {
    const params = new URLSearchParams({
      fc: options.facilityCode || this.config.facilityCode,
      limit: options.limit || 1000,
      ...options
    });

    return this.makeRequest(`/recent?${params.toString()}`, {
      method: 'GET'
    });
  }

  /**
   * Get worker profile data
   * @param {string} login - Worker login ID
   * @returns {Promise<Object>}
   */
  async getWorkerProfile(login) {
    if (!login) throw new Error('Worker login required');
    
    return this.makeRequest(`/worker/${login}`, {
      method: 'GET'
    });
  }

  /**
   * Get shift schedule
   * @param {Object} options - Date range and filters
   * @returns {Promise<Array>}
   */
  async getShiftSchedule(options = {}) {
    const params = new URLSearchParams({
      facility: options.facilityCode || this.config.facilityCode,
      startDate: options.startDate || new Date().toISOString().split('T')[0],
      endDate: options.endDate || new Date().toISOString().split('T')[0],
      ...options
    });

    return this.makeRequest(`/schedule?${params.toString()}`, {
      method: 'GET'
    });
  }

  /**
   * Get process-specific metrics
   * @param {string} processId - Process identifier
   * @param {Object} options - Time range and filters
   * @returns {Promise<Object>}
   */
  async getProcessMetrics(processId, options = {}) {
    if (!processId) throw new Error('Process ID required');

    const params = new URLSearchParams({
      process: processId,
      timeRange: options.timeRange || '1h',
      facility: options.facilityCode || this.config.facilityCode,
      ...options
    });

    return this.makeRequest(`/metrics/${processId}?${params.toString()}`, {
      method: 'GET'
    });
  }

  /**
   * Generic HTTP request handler with auth and error handling
   * @protected
   */
  async makeRequest(endpoint, options = {}) {
    // Check token expiry and refresh if needed
    if (this.isAuthenticated && Date.now() >= this.tokenExpiry - 300000) {
      await this.refreshAccessToken();
    }

    const url = this.config.baseUrl + endpoint;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': this.isAuthenticated ? `Bearer ${this.accessToken}` : '',
      ...options.headers
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
        credentials: 'include' // For cross-domain cookies
      });

      clearTimeout(timeoutId);

      // Handle authentication errors
      if (response.status === 401) {
        console.warn('⚠️ Unauthorized - attempting token refresh...');
        await this.refreshAccessToken();
        return this.makeRequest(endpoint, options); // Retry
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Handle empty responses
      const text = await response.text();
      return text ? JSON.parse(text) : {};

    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  }

  /**
   * Logout and clear tokens
   */
  logout() {
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = 0;
    this.isAuthenticated = false;

    localStorage.removeItem('packman_access_token');
    localStorage.removeItem('packman_refresh_token');
    localStorage.removeItem('packman_token_expiry');

    console.log('✅ Logout successful');
  }

  /**
   * Get current authentication status
   * @returns {Object}
   */
  getStatus() {
    return {
      isAuthenticated: this.isAuthenticated,
      tokenExpiry: new Date(this.tokenExpiry),
      expiresIn: Math.max(0, this.tokenExpiry - Date.now()),
      facility: this.config.facilityCode
    };
  }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PackmanAPIService;
}
