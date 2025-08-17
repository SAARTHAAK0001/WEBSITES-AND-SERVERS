from fastapi import APIRouter, HTTPException, Query
from typing import Optional, Dict, List
from datetime import datetime
from models import (
    SensorReading, SensorReadingCreate, CurrentReading, Plant, PlantUpdate,
    Alert, AlertCreate, SensorType, HistoricalDataPoint
)
from services import PlantMonitoringService

def create_plant_routes(service: PlantMonitoringService) -> APIRouter:
    router = APIRouter(prefix="/api")

    @router.get("/readings/current", response_model=Dict[str, CurrentReading])
    async def get_current_readings():
        """Get current readings for all sensors"""
        try:
            return await service.get_current_readings()
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    @router.get("/readings/history", response_model=List[HistoricalDataPoint])
    async def get_historical_data(
        sensor: SensorType = Query(..., description="Sensor type"),
        hours: int = Query(24, description="Number of hours of history to retrieve")
    ):
        """Get historical data for a specific sensor"""
        try:
            return await service.get_historical_data(sensor, hours)
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    @router.post("/readings/submit", response_model=SensorReading)
    async def submit_reading(reading: SensorReadingCreate):
        """Submit new sensor reading"""
        try:
            return await service.submit_sensor_reading(
                reading.sensor_type,
                reading.value,
                reading.timestamp
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    @router.get("/plant/info", response_model=Plant)
    async def get_plant_info():
        """Get plant information"""
        try:
            return await service.get_plant_info()
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    @router.put("/plant/info", response_model=Plant)
    async def update_plant_info(updates: PlantUpdate):
        """Update plant information"""
        try:
            update_dict = {k: v for k, v in updates.dict().items() if v is not None}
            return await service.update_plant_info(update_dict)
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    @router.get("/alerts", response_model=List[Alert])
    async def get_alerts():
        """Get all active alerts"""
        try:
            return await service.get_alerts()
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    @router.post("/alerts/{alert_id}/acknowledge")
    async def acknowledge_alert(alert_id: str):
        """Acknowledge an alert"""
        try:
            success = await service.acknowledge_alert(alert_id)
            if not success:
                raise HTTPException(status_code=404, detail="Alert not found")
            return {"message": "Alert acknowledged"}
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    @router.delete("/alerts/{alert_id}")
    async def dismiss_alert(alert_id: str):
        """Dismiss/delete an alert"""
        try:
            success = await service.dismiss_alert(alert_id)
            if not success:
                raise HTTPException(status_code=404, detail="Alert not found")
            return {"message": "Alert dismissed"}
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    @router.get("/health")
    async def get_health_score():
        """Get overall plant health score"""
        try:
            current_readings = await service.get_current_readings()
            health_score = service.calculate_health_score(current_readings)
            return {"health_score": health_score}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    # Simulate real-time data updates endpoint (for demo purposes)
    @router.post("/readings/simulate")
    async def simulate_readings():
        """Generate simulated sensor readings for demo purposes"""
        try:
            import random
            readings = []
            
            for sensor_type in SensorType:
                # Generate realistic values within ranges
                value = {
                    SensorType.WATER_LEVEL: 60 + random.uniform(0, 30),
                    SensorType.TEMPERATURE: 22 + random.uniform(0, 6),
                    SensorType.SOIL_MOISTURE: 50 + random.uniform(0, 30),
                    SensorType.SOIL_PH: 6.0 + random.uniform(0, 1.5),
                    SensorType.LIGHT: 600 + random.uniform(0, 800)
                }[sensor_type]
                
                reading = await service.submit_sensor_reading(sensor_type, value)
                readings.append(reading)
            
            return {"message": "Simulated readings generated", "readings": readings}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    return router