// Mock data for plant monitoring system
import { addHours, subHours, format } from 'date-fns';

// Generate mock historical data for the last 24 hours
const generateHistoricalData = (baseValue, variance = 5, hours = 24) => {
  const data = [];
  const now = new Date();
  
  for (let i = hours; i >= 0; i--) {
    const timestamp = subHours(now, i);
    const randomVariation = (Math.random() - 0.5) * variance;
    data.push({
      timestamp: timestamp.toISOString(),
      time: format(timestamp, 'HH:mm'),
      value: Math.max(0, baseValue + randomVariation)
    });
  }
  return data;
};

// Current sensor readings
export const currentReadings = {
  waterLevel: {
    value: 75,
    unit: '%',
    status: 'good', // good, warning, critical
    lastUpdated: new Date().toISOString(),
    threshold: { min: 30, max: 100 }
  },
  temperature: {
    value: 24.5,
    unit: '°C',
    status: 'good',
    lastUpdated: new Date().toISOString(),
    threshold: { min: 18, max: 28 }
  },
  soilMoisture: {
    value: 65,
    unit: '%',
    status: 'warning',
    lastUpdated: new Date().toISOString(),
    threshold: { min: 40, max: 80 }
  },
  soilPH: {
    value: 6.8,
    unit: 'pH',
    status: 'good',
    lastUpdated: new Date().toISOString(),
    threshold: { min: 6.0, max: 7.5 }
  },
  light: {
    value: 850,
    unit: 'lux',
    status: 'good',
    lastUpdated: new Date().toISOString(),
    threshold: { min: 500, max: 2000 }
  }
};

// Historical data for charts
export const historicalData = {
  waterLevel: generateHistoricalData(75, 10),
  temperature: generateHistoricalData(24.5, 3),
  soilMoisture: generateHistoricalData(65, 8),
  soilPH: generateHistoricalData(6.8, 0.5),
  light: generateHistoricalData(850, 200)
};

// Plant information
export const plantInfo = {
  name: "Monstera Deliciosa",
  type: "Tropical Houseplant",
  location: "Living Room",
  plantedDate: "2024-01-15",
  lastWatered: subHours(new Date(), 2).toISOString(),
  nextWatering: addHours(new Date(), 22).toISOString(),
  healthScore: 85
};

// Active alerts
export const alerts = [
  {
    id: 1,
    type: 'warning',
    sensor: 'soilMoisture',
    message: 'Soil moisture is getting low',
    timestamp: subHours(new Date(), 1).toISOString(),
    acknowledged: false
  },
  {
    id: 2,
    type: 'info',
    sensor: 'light',
    message: 'Optimal light conditions detected',
    timestamp: subHours(new Date(), 3).toISOString(),
    acknowledged: true
  }
];

// Simulate real-time updates
export const simulateRealTimeUpdate = () => {
  // Water level varies between 70-80%
  currentReadings.waterLevel.value = 70 + Math.random() * 10;
  
  // Temperature varies between 23-26°C
  currentReadings.temperature.value = 23 + Math.random() * 3;
  
  // Soil moisture varies between 60-70%
  currentReadings.soilMoisture.value = 60 + Math.random() * 10;
  
  // Soil pH varies between 6.5-7.0
  currentReadings.soilPH.value = 6.5 + Math.random() * 0.5;
  
  // Light varies between 800-900 lux
  currentReadings.light.value = 800 + Math.random() * 100;
  
  // Update timestamps
  Object.keys(currentReadings).forEach(key => {
    currentReadings[key].lastUpdated = new Date().toISOString();
  });
  
  return currentReadings;
};