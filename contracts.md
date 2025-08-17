# Plant Monitoring System - API Contracts & Backend Integration Plan

## Overview
This document defines the API contracts and integration plan for replacing mock data with real backend endpoints.

## Current Mock Data (to be replaced)

### 1. Current Readings (`mockData.js: currentReadings`)
**Mock Structure:**
```javascript
{
  waterLevel: { value: 75, unit: '%', status: 'good', lastUpdated: ISO_DATE, threshold: {min: 30, max: 100} },
  temperature: { value: 24.5, unit: '°C', status: 'good', lastUpdated: ISO_DATE, threshold: {min: 18, max: 28} },
  soilMoisture: { value: 65, unit: '%', status: 'warning', lastUpdated: ISO_DATE, threshold: {min: 40, max: 80} },
  soilPH: { value: 6.8, unit: 'pH', status: 'good', lastUpdated: ISO_DATE, threshold: {min: 6.0, max: 7.5} },
  light: { value: 850, unit: 'lux', status: 'good', lastUpdated: ISO_DATE, threshold: {min: 500, max: 2000} }
}
```

### 2. Historical Data (`mockData.js: historicalData`)
24-hour arrays for each sensor with `{timestamp, time, value}` objects

### 3. Plant Info (`mockData.js: plantInfo`)
Plant metadata, watering schedule, health score

### 4. Alerts (`mockData.js: alerts`)
Active alerts array with type, sensor, message, timestamp

## API Endpoints to Implement

### 1. Current Readings
**GET** `/api/readings/current`
- Returns current sensor readings with calculated status
- Auto-calculates status based on thresholds
- Updates `lastUpdated` timestamp

### 2. Historical Data
**GET** `/api/readings/history?sensor={sensor}&hours={hours}`
- Parameters: sensor (waterLevel|temperature|soilMoisture|soilPH|light), hours (default: 24)
- Returns array of historical readings
- Format: `[{timestamp, value, sensor_type}]`

### 3. Plant Information
**GET** `/api/plant/info`
- Returns plant details and care schedule
**PUT** `/api/plant/info` 
- Updates plant information

### 4. Alerts Management
**GET** `/api/alerts`
- Returns active alerts
**POST** `/api/alerts/{id}/acknowledge`
- Acknowledges specific alert
**DELETE** `/api/alerts/{id}`
- Dismisses/deletes alert

### 5. Real-time Sensor Data Submission
**POST** `/api/readings/submit`
- Accepts sensor data from IoT devices
- Body: `{sensor_type, value, timestamp?}`
- Triggers alert generation if thresholds exceeded

## Database Models

### 1. SensorReading
```python
{
  "_id": ObjectId,
  "sensor_type": str,  # waterLevel, temperature, soilMoisture, soilPH, light
  "value": float,
  "timestamp": datetime,
  "plant_id": str,
  "status": str  # good, warning, critical
}
```

### 2. Plant
```python
{
  "_id": ObjectId,
  "name": str,
  "type": str,
  "location": str,
  "planted_date": datetime,
  "last_watered": datetime,
  "next_watering": datetime,
  "thresholds": {
    "waterLevel": {"min": float, "max": float},
    "temperature": {"min": float, "max": float},
    "soilMoisture": {"min": float, "max": float},
    "soilPH": {"min": float, "max": float},
    "light": {"min": float, "max": float}
  }
}
```

### 3. Alert
```python
{
  "_id": ObjectId,
  "type": str,  # critical, warning, info, success
  "sensor_type": str,
  "message": str,
  "timestamp": datetime,
  "acknowledged": bool,
  "plant_id": str,
  "reading_value": float
}
```

## Backend Implementation Plan

### Phase 1: Basic CRUD Operations
1. Create MongoDB models and connection
2. Implement current readings endpoint with mock data generation
3. Add historical data storage and retrieval
4. Basic plant information management

### Phase 2: Real-time Features
1. Sensor data submission endpoint
2. Automatic status calculation based on thresholds
3. Alert generation system
4. Real-time data updates

### Phase 3: Advanced Features
1. Health score calculation algorithm
2. Watering schedule predictions
3. Data aggregation and statistics
4. Alert acknowledgment and management

## Frontend Integration Changes

### Files to Update:
1. **Dashboard.jsx** - Replace `simulateRealTimeUpdate()` with API calls
2. **MetricCard.jsx** - No changes needed
3. **HistoricalChart.jsx** - Update data fetching to use API
4. **AlertsPanel.jsx** - Connect alert actions to API endpoints

### Key Integration Points:
1. Replace `import { currentReadings, ... } from '../mockData'` with API calls
2. Add API service layer (`/src/services/api.js`)
3. Implement error handling and loading states
4. Add WebSocket connection for real-time updates (optional)

## Status Calculation Logic
```python
def calculate_status(value, sensor_type, thresholds):
    min_val, max_val = thresholds[sensor_type]["min"], thresholds[sensor_type]["max"]
    
    if value < min_val * 0.8 or value > max_val * 1.2:
        return "critical"
    elif value < min_val or value > max_val:
        return "warning"
    else:
        return "good"
```

## Health Score Algorithm
```python
def calculate_health_score(current_readings):
    good_count = sum(1 for reading in current_readings.values() if reading["status"] == "good")
    total_sensors = len(current_readings)
    return round((good_count / total_sensors) * 100)
```

## Testing Strategy
1. **Backend Testing**: Unit tests for all endpoints and business logic
2. **Integration Testing**: Test full data flow from sensor submission to frontend display
3. **Real-time Testing**: Verify live updates and alert generation
4. **Edge Cases**: Test threshold boundaries and error conditions

This contract ensures seamless transition from mock data to real backend implementation while maintaining all existing frontend functionality.