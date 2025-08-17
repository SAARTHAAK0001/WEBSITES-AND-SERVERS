from datetime import datetime, timedelta
from typing import Dict, List, Optional
from models import (
    SensorReading, CurrentReading, Plant, Alert, 
    SensorType, StatusType, AlertType, SENSOR_UNITS,
    ThresholdRange, HistoricalDataPoint
)
from motor.motor_asyncio import AsyncIOMotorDatabase
import random
from dateutil import tz
from bson import ObjectId

class PlantMonitoringService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.default_plant_id = "default_plant"

    async def initialize_default_plant(self):
        """Initialize default plant if it doesn't exist"""
        existing_plant = await self.db.plants.find_one({"id": self.default_plant_id})
        if not existing_plant:
            default_plant = Plant(id=self.default_plant_id)
            await self.db.plants.insert_one(default_plant.dict())
            
            # Generate some initial historical data
            await self._generate_initial_data()

    async def _generate_initial_data(self):
        """Generate 24 hours of historical sensor data for demo purposes"""
        now = datetime.utcnow()
        base_values = {
            SensorType.WATER_LEVEL: 75,
            SensorType.TEMPERATURE: 24.5,
            SensorType.SOIL_MOISTURE: 65,
            SensorType.SOIL_PH: 6.8,
            SensorType.LIGHT: 850
        }
        
        variances = {
            SensorType.WATER_LEVEL: 10,
            SensorType.TEMPERATURE: 3,
            SensorType.SOIL_MOISTURE: 8,
            SensorType.SOIL_PH: 0.5,
            SensorType.LIGHT: 200
        }

        readings = []
        for hours_ago in range(24, 0, -1):
            timestamp = now - timedelta(hours=hours_ago)
            
            for sensor_type in SensorType:
                base_value = base_values[sensor_type]
                variance = variances[sensor_type]
                value = max(0, base_value + random.uniform(-variance, variance))
                
                status = self._calculate_status(value, sensor_type)
                
                reading = SensorReading(
                    sensor_type=sensor_type,
                    value=value,
                    timestamp=timestamp,
                    plant_id=self.default_plant_id,
                    status=status,
                    unit=SENSOR_UNITS[sensor_type]
                )
                readings.append(reading.dict())
        
        if readings:
            await self.db.sensor_readings.insert_many(readings)

    def _calculate_status(self, value: float, sensor_type: SensorType) -> StatusType:
        """Calculate sensor status based on thresholds"""
        # Using default thresholds - in real implementation, would fetch from plant record
        thresholds = {
            SensorType.WATER_LEVEL: {"min": 30, "max": 100},
            SensorType.TEMPERATURE: {"min": 18, "max": 28},
            SensorType.SOIL_MOISTURE: {"min": 40, "max": 80},
            SensorType.SOIL_PH: {"min": 6.0, "max": 7.5},
            SensorType.LIGHT: {"min": 500, "max": 2000}
        }
        
        threshold = thresholds[sensor_type]
        min_val, max_val = threshold["min"], threshold["max"]
        
        if value < min_val * 0.8 or value > max_val * 1.2:
            return StatusType.CRITICAL
        elif value < min_val or value > max_val:
            return StatusType.WARNING
        else:
            return StatusType.GOOD

    async def get_current_readings(self) -> Dict[str, CurrentReading]:
        """Get latest readings for all sensors"""
        current_readings = {}
        
        for sensor_type in SensorType:
            # Get the most recent reading for this sensor
            latest_reading = await self.db.sensor_readings.find_one(
                {"sensor_type": sensor_type, "plant_id": self.default_plant_id},
                sort=[("timestamp", -1)]
            )
            
            if latest_reading:
                # Get thresholds from plant record
                plant = await self.db.plants.find_one({"id": self.default_plant_id})
                thresholds = plant["thresholds"] if plant else {}
                sensor_threshold = thresholds.get(sensor_type, {"min": 0, "max": 100})
                
                current_readings[sensor_type] = CurrentReading(
                    value=latest_reading["value"],
                    unit=latest_reading["unit"],
                    status=latest_reading["status"],
                    lastUpdated=latest_reading["timestamp"].isoformat(),
                    threshold=ThresholdRange(
                        min=sensor_threshold["min"],
                        max=sensor_threshold["max"]
                    )
                )
            else:
                # Fallback to simulated data if no readings exist
                current_readings[sensor_type] = self._generate_simulated_reading(sensor_type)
        
        return current_readings

    def _generate_simulated_reading(self, sensor_type: SensorType) -> CurrentReading:
        """Generate simulated reading for demo purposes"""
        base_values = {
            SensorType.WATER_LEVEL: 75,
            SensorType.TEMPERATURE: 24.5,
            SensorType.SOIL_MOISTURE: 65,
            SensorType.SOIL_PH: 6.8,
            SensorType.LIGHT: 850
        }
        
        thresholds = {
            SensorType.WATER_LEVEL: ThresholdRange(min=30, max=100),
            SensorType.TEMPERATURE: ThresholdRange(min=18, max=28),
            SensorType.SOIL_MOISTURE: ThresholdRange(min=40, max=80),
            SensorType.SOIL_PH: ThresholdRange(min=6.0, max=7.5),
            SensorType.LIGHT: ThresholdRange(min=500, max=2000)
        }
        
        value = base_values[sensor_type] + random.uniform(-2, 2)
        status = self._calculate_status(value, sensor_type)
        
        return CurrentReading(
            value=value,
            unit=SENSOR_UNITS[sensor_type],
            status=status,
            lastUpdated=datetime.utcnow().isoformat(),
            threshold=thresholds[sensor_type]
        )

    async def get_historical_data(self, sensor_type: SensorType, hours: int = 24) -> List[HistoricalDataPoint]:
        """Get historical data for a specific sensor"""
        since = datetime.utcnow() - timedelta(hours=hours)
        
        readings = await self.db.sensor_readings.find(
            {
                "sensor_type": sensor_type,
                "plant_id": self.default_plant_id,
                "timestamp": {"$gte": since}
            },
            sort=[("timestamp", 1)]
        ).to_list(1000)
        
        historical_data = []
        for reading in readings:
            timestamp = reading["timestamp"]
            historical_data.append(HistoricalDataPoint(
                timestamp=timestamp.isoformat(),
                time=timestamp.strftime("%H:%M"),
                value=reading["value"]
            ))
        
        return historical_data

    async def submit_sensor_reading(self, sensor_type: SensorType, value: float, timestamp: Optional[datetime] = None) -> SensorReading:
        """Submit new sensor reading and check for alerts"""
        if timestamp is None:
            timestamp = datetime.utcnow()
        
        status = self._calculate_status(value, sensor_type)
        
        reading = SensorReading(
            sensor_type=sensor_type,
            value=value,
            timestamp=timestamp,
            plant_id=self.default_plant_id,
            status=status,
            unit=SENSOR_UNITS[sensor_type]
        )
        
        # Store reading
        await self.db.sensor_readings.insert_one(reading.dict())
        
        # Generate alert if needed
        if status in [StatusType.WARNING, StatusType.CRITICAL]:
            await self._generate_alert(sensor_type, value, status)
        
        return reading

    async def _generate_alert(self, sensor_type: SensorType, value: float, status: StatusType):
        """Generate alert for problematic sensor readings"""
        alert_type = AlertType.CRITICAL if status == StatusType.CRITICAL else AlertType.WARNING
        
        messages = {
            (SensorType.WATER_LEVEL, AlertType.WARNING): f"Water level is getting low ({value}%)",
            (SensorType.WATER_LEVEL, AlertType.CRITICAL): f"Water level critically low ({value}%)",
            (SensorType.TEMPERATURE, AlertType.WARNING): f"Temperature outside optimal range ({value}°C)",
            (SensorType.TEMPERATURE, AlertType.CRITICAL): f"Temperature at dangerous level ({value}°C)",
            (SensorType.SOIL_MOISTURE, AlertType.WARNING): f"Soil moisture needs attention ({value}%)",
            (SensorType.SOIL_MOISTURE, AlertType.CRITICAL): f"Soil moisture critically low ({value}%)",
            (SensorType.SOIL_PH, AlertType.WARNING): f"Soil pH outside optimal range ({value})",
            (SensorType.SOIL_PH, AlertType.CRITICAL): f"Soil pH at dangerous level ({value})",
            (SensorType.LIGHT, AlertType.WARNING): f"Light level needs adjustment ({value} lux)",
            (SensorType.LIGHT, AlertType.CRITICAL): f"Light level critically inadequate ({value} lux)"
        }
        
        message = messages.get((sensor_type, alert_type), f"{sensor_type} needs attention")
        
        alert = Alert(
            type=alert_type,
            sensor_type=sensor_type,
            message=message,
            plant_id=self.default_plant_id,
            reading_value=value
        )
        
        await self.db.alerts.insert_one(alert.dict())

    async def get_alerts(self) -> List[Alert]:
        """Get all active alerts"""
        alerts = await self.db.alerts.find(
            {"plant_id": self.default_plant_id},
            sort=[("timestamp", -1)]
        ).to_list(100)
        
        return [Alert(**alert) for alert in alerts]

    async def acknowledge_alert(self, alert_id: str) -> bool:
        """Acknowledge an alert"""
        result = await self.db.alerts.update_one(
            {"id": alert_id},
            {"$set": {"acknowledged": True}}
        )
        return result.modified_count > 0

    async def dismiss_alert(self, alert_id: str) -> bool:
        """Delete/dismiss an alert"""
        result = await self.db.alerts.delete_one({"id": alert_id})
        return result.deleted_count > 0

    async def get_plant_info(self) -> Plant:
        """Get plant information"""
        plant_data = await self.db.plants.find_one({"id": self.default_plant_id})
        if plant_data:
            return Plant(**plant_data)
        else:
            # Return default plant
            default_plant = Plant(id=self.default_plant_id)
            await self.db.plants.insert_one(default_plant.dict())
            return default_plant

    async def update_plant_info(self, updates: dict) -> Plant:
        """Update plant information"""
        await self.db.plants.update_one(
            {"id": self.default_plant_id},
            {"$set": updates}
        )
        return await self.get_plant_info()

    def calculate_health_score(self, current_readings: Dict[str, CurrentReading]) -> int:
        """Calculate overall plant health score"""
        if not current_readings:
            return 0
        
        good_count = sum(1 for reading in current_readings.values() if reading.status == StatusType.GOOD)
        total_sensors = len(current_readings)
        return round((good_count / total_sensors) * 100)