# SonarGuard

Marine debris detection system for sonar imagery using classical computer vision + human validation.

## Features

- Real-time sonar image analysis with bounding box detection
- Explainable AI: shadow ratio, shape, and size scoring
- Human-in-the-loop validation (accept/reject decisions)
- Anomaly logs with JSON/CSV export
- Geospatial visualization and analytics dashboard

## Quick Start

```bash
# Run everything
cd SIH
RUN.bat
```

Backend: http://localhost:8000  
Frontend: http://localhost:5173

## Detection Pipeline

Uses classical computer vision (not ML) for transparency:

1. **Preprocessing**: Contrast enhancement + median denoise
2. **Candidate Generation**: Otsu thresholding + contour detection
3. **Verification**: Validate against 3 metrics:
   - Shadow Ratio (acoustic shadow darkness)
   - Shape Score (aspect ratio + solidity)
   - Size Score (pixel dimensions plausibility)
4. **Confidence**: `0.35 × shape + 0.35 × size + 0.30 × shadow`

Why classical CV?
- Explainable: every detection decision is interpretable
- No training data required
- CPU-only, <2 seconds per image
- Ready for ML swap (YOLO/U-Net can replace candidate generation)

## Tech Stack

**Frontend:** React 18 + Vite + Tailwind CSS + Recharts  
**Backend:** FastAPI + Python 3.11 + Pillow + NumPy

## Project Structure

```
sonarguard-backend/    # FastAPI app
├── main.py
├── models.py
├── detection.py
└── requirements.txt

sonarguard-frontend/   # React app
├── src/
│   ├── components/
│   ├── services/
│   └── App.jsx
├── package.json
├── vite.config.js
└── tailwind.config.js
```

## API Endpoints

**Detection:**
- `POST /api/upload-sonar` - Upload and analyze sonar image
- `GET /api/detect-anomalies` - Get detections with demo/synthetic fallback

**Validation:**
- `POST /api/validate-anomaly` - Submit accept/reject decision
- `POST /api/export-report` - Export anomalies as JSON/CSV

## Mission Statement

"Explainable AI for marine debris detection — AI flags, evidence backs it, humans decide."
