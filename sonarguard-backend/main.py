from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import base64
import io
import time
from datetime import datetime
from typing import List, Optional
from PIL import Image, ImageEnhance, ImageFilter
import numpy as np

# Import our detection pipeline and models
from detection import SonarDetectionPipeline, create_dummy_sonar_for_testing
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

# Global detection pipeline instance
detection_pipeline = SonarDetectionPipeline()

# In-memory storage for last uploaded image (for demo/fallback)
last_uploaded_image = None
last_uploaded_anomalies = None

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

def generate_sample_anomalies():
    """
    Fallback: Return hardcoded sample anomalies for demo mode only.
    This is clearly labeled so it's never confused with real detection.
    """
    anomalies = [
        {
            "id": "DEMO-001",
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
            "id": "DEMO-002",
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
            "id": "DEMO-003",
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
            "id": "DEMO-004",
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
            "id": "DEMO-005",
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
    """
    Upload sonar image and run real detection pipeline.
    
    1. Loads and preprocesses the image
    2. Runs classical CV detection (thresholding + contours + verification)
    3. Returns processed image + real, image-derived anomalies
    """
    global last_uploaded_image, last_uploaded_anomalies
    
    try:
        start_time = time.time()
        contents = await file.read()
        
        # Load image
        img = Image.open(io.BytesIO(contents))
        
        # Convert to grayscale
        if img.mode != 'L':
            img = img.convert('L')
        
        # Preprocess: contrast enhancement + denoise
        enhancer = ImageEnhance.Contrast(img)
        img = enhancer.enhance(1.5)
        img = img.filter(ImageFilter.MedianFilter(size=3))
        
        # Convert to numpy for detection
        img_array = np.array(img)
        
        # Run real detection pipeline
        anomalies = detection_pipeline.detect(img_array, metadata=None)
        
        # Store for fallback
        last_uploaded_image = img
        last_uploaded_anomalies = anomalies
        
        # Convert processed image to base64
        buffered = io.BytesIO()
        img.save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode()
        processed_image = f"data:image/png;base64,{img_str}"
        
        processing_time_ms = int((time.time() - start_time) * 1000)
        
        return {
            "status": "success",
            "message": f"Sonar image processed: {len(anomalies)} anomalies detected",
            "processed_image": processed_image,
            "filename": file.filename,
            "size": len(contents),
            "detections": anomalies,
            "mode": "live",
            "processing_time_ms": processing_time_ms,
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing image: {str(e)}")

@app.get("/api/detect-anomalies")
async def detect_anomalies(mode: str = "live"):
    """
    Detect anomalies in sonar image.
    
    - mode="live": If last_uploaded_image exists, run real detection on it.
                   Otherwise fallback to demo with synthetic test image.
    - mode="demo": Always return hardcoded sample data (clearly labeled).
    
    Returns AnomalyDetectionResponse with mode field indicating which path was taken.
    """
    try:
        start_time = time.time()
        
        if mode == "demo":
            # Explicit demo mode: return hardcoded sample anomalies
            demo_anomalies = generate_sample_anomalies()
            synthetic_img = create_dummy_sonar_for_testing()
            
            # Convert synthetic image to base64
            pil_synthetic = Image.fromarray(synthetic_img)
            buffered = io.BytesIO()
            pil_synthetic.save(buffered, format="PNG")
            img_str = base64.b64encode(buffered.getvalue()).decode()
            sonar_image = f"data:image/png;base64,{img_str}"
            
            processing_time_ms = int((time.time() - start_time) * 1000)
            
            return AnomalyDetectionResponse(
                status="success",
                message="DEMO MODE: Showing hardcoded sample anomalies (not real detection)",
                sonar_image=sonar_image,
                anomalies=demo_anomalies,
                detection_count=len(demo_anomalies),
                processing_time_ms=processing_time_ms,
                mode="demo",
            ).dict()
        
        else:  # mode="live" (default)
            if last_uploaded_image is not None:
                # Run real detection on last uploaded image
                img_array = np.array(last_uploaded_image)
                anomalies = detection_pipeline.detect(img_array, metadata=None)
                
                # Clean up internal flags
                for anomaly in anomalies:
                    anomaly.pop('_location_estimated', None)
            else:
                # No image uploaded yet: fallback to synthetic test image with real detection
                synthetic_img = create_dummy_sonar_for_testing()
                anomalies = detection_pipeline.detect(synthetic_img, metadata=None)
                for anomaly in anomalies:
                    anomaly.pop('_location_estimated', None)
                # Convert to PIL for consistency
                last_uploaded_image = Image.fromarray(synthetic_img)
            
            # Convert image to base64
            buffered = io.BytesIO()
            last_uploaded_image.save(buffered, format="PNG")
            img_str = base64.b64encode(buffered.getvalue()).decode()
            sonar_image = f"data:image/png;base64,{img_str}"
            
            processing_time_ms = int((time.time() - start_time) * 1000)
            
            return AnomalyDetectionResponse(
                status="success",
                message=f"Real detection: {len(anomalies)} anomalies detected using classical CV pipeline",
                sonar_image=sonar_image,
                anomalies=anomalies,
                detection_count=len(anomalies),
                processing_time_ms=processing_time_ms,
                mode="live",
            ).dict()
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Detection error: {str(e)}")

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
    """Get system statistics from last detection"""
    try:
        # Use last detected anomalies if available, otherwise run fresh
        if last_uploaded_anomalies is not None:
            anomalies = last_uploaded_anomalies
        else:
            # Fallback: run detection on synthetic image
            synthetic_img = create_dummy_sonar_for_testing()
            anomalies = detection_pipeline.detect(synthetic_img, metadata=None)
            for anomaly in anomalies:
                anomaly.pop('_location_estimated', None)
        
        confirmed = sum(1 for a in anomalies if a.get("validated") == True)
        rejected = sum(1 for a in anomalies if a.get("validated") == False)
        pending = sum(1 for a in anomalies if a.get("validated") is None)
        
        avg_confidence = sum(a.get("confidence", 0) for a in anomalies) / len(anomalies) if anomalies else 0
        
        return {
            "total_detections": len(anomalies),
            "confirmed": confirmed,
            "rejected": rejected,
            "pending": pending,
            "average_confidence": round(avg_confidence * 100, 2),
            "mode": "live",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
