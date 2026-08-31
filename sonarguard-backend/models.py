from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class Anomaly(BaseModel):
    """Detected sonar anomaly model"""
    id: str
    target_class: str
    confidence: float = Field(ge=0, le=1)
    bbox_x: int
    bbox_y: int
    bbox_width: int
    bbox_height: int
    shadow_ratio: float = Field(ge=0, le=1)
    pixel_width: int
    pixel_height: int
    elevation_estimate: float
    latitude: float
    longitude: float
    validated: Optional[bool] = None
    timestamp: str

class SonarImage(BaseModel):
    """Sonar image model"""
    filename: str
    size: int
    base64_data: str

class AnomalyDetectionResponse(BaseModel):
    """Response from anomaly detection endpoint"""
    status: str
    message: str
    sonar_image: str
    anomalies: List[Anomaly]
    detection_count: int
    processing_time_ms: int

class ValidationRequest(BaseModel):
    """Human validation request"""
    target_id: str
    is_valid: bool
    reviewer_notes: Optional[str] = None

class ExportRequest(BaseModel):
    """Export report request"""
    anomalies: List[Anomaly]
    format: str = "json"  # json or csv
