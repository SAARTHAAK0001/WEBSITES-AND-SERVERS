import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
apiClient.interceptors.request.use(
  (config) => {
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for logging and error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
    return response;
  },
  (error) => {
    console.error('❌ API Response Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export class PlantMonitoringAPI {
  // Current readings
  static async getCurrentReadings() {
    try {
      const response = await apiClient.get('/readings/current');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch current readings:', error);
      throw error;
    }
  }

  // Historical data
  static async getHistoricalData(sensor, hours = 24) {
    try {
      const response = await apiClient.get('/readings/history', {
        params: { sensor, hours }
      });
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch historical data for ${sensor}:`, error);
      throw error;
    }
  }

  // Submit sensor reading
  static async submitReading(sensorType, value, timestamp = null) {
    try {
      const response = await apiClient.post('/readings/submit', {
        sensor_type: sensorType,
        value,
        timestamp
      });
      return response.data;
    } catch (error) {
      console.error('Failed to submit sensor reading:', error);
      throw error;
    }
  }

  // Simulate readings (for demo)
  static async simulateReadings() {
    try {
      const response = await apiClient.post('/readings/simulate');
      return response.data;
    } catch (error) {
      console.error('Failed to simulate readings:', error);
      throw error;
    }
  }

  // Plant information
  static async getPlantInfo() {
    try {
      const response = await apiClient.get('/plant/info');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch plant info:', error);
      throw error;
    }
  }

  static async updatePlantInfo(updates) {
    try {
      const response = await apiClient.put('/plant/info', updates);
      return response.data;
    } catch (error) {
      console.error('Failed to update plant info:', error);
      throw error;
    }
  }

  // Alerts
  static async getAlerts() {
    try {
      const response = await apiClient.get('/alerts');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
      throw error;
    }
  }

  static async acknowledgeAlert(alertId) {
    try {
      const response = await apiClient.post(`/alerts/${alertId}/acknowledge`);
      return response.data;
    } catch (error) {
      console.error(`Failed to acknowledge alert ${alertId}:`, error);
      throw error;
    }
  }

  static async dismissAlert(alertId) {
    try {
      const response = await apiClient.delete(`/alerts/${alertId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to dismiss alert ${alertId}:`, error);
      throw error;
    }
  }

  // Health score
  static async getHealthScore() {
    try {
      const response = await apiClient.get('/health');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch health score:', error);
      throw error;
    }
  }
}

export default PlantMonitoringAPI;