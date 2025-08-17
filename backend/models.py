from pydantic import BaseModel, Field
from typing import Dict, List, Optional
from datetime import datetime
from enum import Enum
import uuid

class SensorType(str, Enum):
    WATER_LEVEL = "waterLevel"
    TEMPERATURE = "temperature"
    SOIL_MOISTURE = "soilMoisture"
    SOIL_PH = "soilPH"
    LIGHT = "light"

class StatusType(str, Enum):
    GOOD = "good"
    WARNING = "warning"
    CRITICAL = "critical"

class AlertType(str, Enum):
    CRITICAL = "critical"
    WARNING = "warning"
    INFO = "info"
    SUCCESS = "success"

class ThresholdRange(BaseModel):
    min: float
    max: float

class SensorReading(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    sensor_type: SensorType
    value: float
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    plant_id: str = "default_plant"
    status: StatusType
    unit: str

class SensorReadingCreate(BaseModel):
    sensor_type: SensorType
    value: float
    timestamp: Optional[datetime] = None

class CurrentReading(BaseModel):
    value: float
    unit: str
    status: StatusType
    lastUpdated: str
    threshold: ThresholdRange

class PlantThresholds(BaseModel):
    waterLevel: ThresholdRange = ThresholdRange(min=30, max=100)
    temperature: ThresholdRange = ThresholdRange(min=18, max=28)
    soilMoisture: ThresholdRange = ThresholdRange(min=40, max=80)
    soilPH: ThresholdRange = ThresholdRange(min=6.0, max=7.5)
    light: ThresholdRange = ThresholdRange(min=500, max=2000)

class Plant(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str = "Monstera Deliciosa"
    type: str = "Tropical Houseplant"
    location: str = "Living Room"
    planted_date: datetime = Field(default_factory=lambda: datetime(2024, 1, 15))
    last_watered: datetime = Field(default_factory=datetime.utcnow)
    next_watering: datetime = Field(default_factory=datetime.utcnow)
    thresholds: PlantThresholds = Field(default_factory=PlantThresholds)

class PlantUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    location: Optional[str] = None
    last_watered: Optional[datetime] = None

class Alert(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: AlertType
    sensor_type: SensorType
    message: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    acknowledged: bool = False
    plant_id: str = "default_plant"
    reading_value: float

class AlertCreate(BaseModel):
    type: AlertType
    sensor_type: SensorType
    message: str
    reading_value: float

class HistoricalDataPoint(BaseModel):
    timestamp: str
    time: str
    value: float

# Sensor unit mappings
SENSOR_UNITS = {
    SensorType.WATER_LEVEL: "%",
    SensorType.TEMPERATURE: "°C",
    SensorType.SOIL_MOISTURE: "%",
    SensorType.SOIL_PH: "pH",
    SensorType.LIGHT: "lux"
}