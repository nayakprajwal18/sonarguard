from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import base64
import io
from datetime import datetime
from typing import List
from PIL import Image, ImageEnhance, ImageFilter
import numpy as np
import random
import json

# Import modules
from models import AnomalyDetectionResponse, SonarImage, Anomaly

app = FastAPI(
    title="SonarGuard API",
    description="AI-Powered Underwater Marine Debris Detection System",
    version="1.0.0",
    docs_url="/docs",
    openapi_url="/openapi.json"
)

# CORS middleware - Allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Sample sonar image generator
def generate_sample_sonar_image():
    """Generate a synthetic sonar swath image"""
    width, height = 600, 300
    img = Image.new('L', (width, height), color=50)
    pixels = img.load()
    
    # Add noise to simulate sonar clutter
    for i in range(width):
        for j in range(height):
            noise = random.randint(-30, 30)
            pixels[i, j] = max(0, min(255, 50 + noise))
    
    # Add some patterns to simulate seafloor variation
    for i in range(0, width, 50):
        for j in range(height):
            intensity = 100 + random.randint(-20, 20)
            for k in range(10):
                if i + k < width:
                    pixels[i + k, j] = max(0, min(255, intensity))
    
    # Convert to base64
    buffered = io.BytesIO()
    img.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode()
    return f"data:image/png;base64,{img_str}"

# Mock anomaly generator
def generate_sample_anomalies():
    """Generate sample detected anomalies with realistic parameters"""
    anomalies = [
        {
            "id": "TGT-001",
            "target_class": "Ghost Gear",
            "confidence": 0.92,
            "bbox_x": 80,
            "bbox_y": 120,
            "bbox_width": 100,
            "bbox_height": 80,
            "shadow_ratio": 0.65,
            "pixel_width": 100,
            "pixel_height": 80,
            "elevation_estimate": 52.3,
            "latitude": 40.7128,
            "longitude": -74.0060,
            "validated": None,
            "timestamp": datetime.now().isoformat(),
        },
        {
            "id": "TGT-002",
            "target_class": "Shipwreck",
            "confidence": 0.87,
            "bbox_x": 250,
            "bbox_y": 100,
            "bbox_width": 150,
            "bbox_height": 120,
            "shadow_ratio": 0.72,
            "pixel_width": 150,
            "pixel_height": 120,
            "elevation_estimate": 65.8,
            "latitude": 40.7150,
            "longitude": -74.0080,
            "validated": True,
            "timestamp": datetime.now().isoformat(),
        },
        {
            "id": "TGT-003",
            "target_class": "Cargo Container",
            "confidence": 0.78,
            "bbox_x": 450,
            "bbox_y": 140,
            "bbox_width": 90,
            "bbox_height": 70,
            "shadow_ratio": 0.58,
            "pixel_width": 90,
            "pixel_height": 70,
            "elevation_estimate": 45.2,
            "latitude": 40.7120,
            "longitude": -74.0050,
            "validated": None,
            "timestamp": datetime.now().isoformat(),
        },
        {
            "id": "TGT-004",
            "target_class": "Metal Pipe",
            "confidence": 0.65,
            "bbox_x": 150,
            "bbox_y": 200,
            "bbox_width": 50,
            "bbox_height": 60,
            "shadow_ratio": 0.32,
            "pixel_width": 50,
            "pixel_height": 60,
            "elevation_estimate": 38.5,
            "latitude": 40.7140,
            "longitude": -74.0070,
            "validated": False,
            "timestamp": datetime.now().isoformat(),
        },
        {
            "id": "TGT-005",
            "target_class": "Debris Cluster",
            "confidence": 0.81,
            "bbox_x": 350,
            "bbox_y": 220,
            "bbox_width": 110,
            "bbox_height": 50,
            "shadow_ratio": 0.44,
            "pixel_width": 110,
            "pixel_height": 50,
            "elevation_estimate": 55.1,
            "latitude": 40.7135,
            "longitude": -74.0065,
            "validated": None,
            "timestamp": datetime.now().isoformat(),
        },
    ]
    return anomalies

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "SonarGuard API - AI-Powered Underwater Debris Detection",
        "version": "1.0.0",
        "status": "online"
    }

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "sonarguard"}

@app.post("/api/upload-sonar")
async def upload_sonar(file: UploadFile = File(...)):
    """Upload and process sonar image"""
    try:
        contents = await file.read()
        img = Image.open(io.BytesIO(contents))
        
        # Image normalization and enhancement
        if img.mode != 'L':
            img = img.convert('L')
        
        # Contrast enhancement
        enhancer = ImageEnhance.Contrast(img)
        img = enhancer.enhance(1.5)
        
        # Noise reduction (mock with blur)
        img = img.filter(ImageFilter.MedianFilter(size=3))
        
        # Convert to base64
        buffered = io.BytesIO()
        img.save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode()
        processed_image = f"data:image/png;base64,{img_str}"
        
        return {
            "status": "success",
            "message": "Sonar image uploaded and processed",
            "processed_image": processed_image,
            "filename": file.filename,
            "size": len(contents)
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/detect-anomalies")
async def detect_anomalies():
    """Detect anomalies in sonar image - returns mock data with sample image"""
    try:
        # Generate sample sonar image
        sonar_image = generate_sample_sonar_image()
        
        # Generate sample anomalies
        anomalies = generate_sample_anomalies()
        
        return AnomalyDetectionResponse(
            status="success",
            message="Anomaly detection complete",
            sonar_image=sonar_image,
            anomalies=anomalies,
            detection_count=len(anomalies),
            processing_time_ms=random.randint(500, 2000)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/validate-anomaly")
async def validate_anomaly(target_id: str, is_valid: bool):
    """Validate an anomaly (human-in-the-loop)"""
    return {
        "status": "success",
        "target_id": target_id,
        "validation": "accepted" if is_valid else "rejected",
        "timestamp": datetime.now().isoformat()
    }

@app.post("/api/export-report")
async def export_report(anomalies_data: List[dict]):
    """Export anomalies as JSON/CSV"""
    try:
        # Summary stats
        confirmed = sum(1 for a in anomalies_data if a.get("validated") == True)
        rejected = sum(1 for a in anomalies_data if a.get("validated") == False)
        pending = sum(1 for a in anomalies_data if a.get("validated") is None)
        
        # Calculate shadow ratio stats
        high_shadow = sum(1 for a in anomalies_data if a.get("shadow_ratio", 0) >= 0.4)
        low_shadow = len(anomalies_data) - high_shadow
        
        # Average confidence
        avg_confidence = sum(a.get("confidence", 0) for a in anomalies_data) / len(anomalies_data) if anomalies_data else 0
        
        report = {
            "export_timestamp": datetime.now().isoformat(),
            "total_anomalies": len(anomalies_data),
            "statistics": {
                "confirmed_detections": confirmed,
                "rejected_detections": rejected,
                "pending_review": pending,
                "average_confidence": round(avg_confidence * 100, 2),
                "high_shadow_ratio_targets": high_shadow,
                "low_shadow_ratio_targets": low_shadow,
            },
            "anomalies": anomalies_data
        }
        return report
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/stats")
async def get_statistics():
    """Get system statistics"""
    try:
        anomalies = generate_sample_anomalies()
        confirmed = sum(1 for a in anomalies if a.get("validated") == True)
        rejected = sum(1 for a in anomalies if a.get("validated") == False)
        pending = sum(1 for a in anomalies if a.get("validated") is None)
        
        return {
            "total_detections": len(anomalies),
            "confirmed": confirmed,
            "rejected": rejected,
            "pending": pending,
            "average_confidence": round(sum(a["confidence"] for a in anomalies) / len(anomalies) * 100, 2) if anomalies else 0,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
