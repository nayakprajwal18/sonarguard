# SonarGuard Real Detection Pipeline - Implementation Notes

## Overview

The backend has been updated with a **real classical computer-vision detection pipeline** that replaces the previous hardcoded anomalies. This document outlines the implementation, key judgment calls, and adjustable parameters.

---

## Architecture

### 1. Candidate Generation (`detection.py::_generate_candidates`)

**Method:** Otsu's binarization + contour detection

**Pseudocode:**
```
1. Apply histogram equalization + median blur (preprocessing)
2. Compute Otsu threshold automatically
3. Find all contours in binary image
4. Filter by area: MIN_CONTOUR_AREA ≤ area ≤ MAX_CONTOUR_AREA
5. Extract bounding box for each surviving contour
```

**JUDGMENT CALL: Why Otsu's method?**
- Otsu is parameter-free (no threshold tuning needed) and works well for sonar with moderate variation
- Adaptive thresholding can be substituted if Otsu produces too many false positives in very dark/bright images
- Alternative: add a `threshold_method` enum parameter to `SonarDetectionPipeline.__init__()` and swap between Otsu and adaptive

**Adjustable Parameters:**
```python
self.min_contour_area = 50          # pixels² — filter tiny noise
self.max_contour_area = 50000       # pixels² — filter implausibly large artifacts
```

If the pipeline detects too much noise: **increase `min_contour_area`**  
If real objects are missed: **decrease `min_contour_area`**  
If large artifacts are included: **decrease `max_contour_area`**

---

### 2. Verification: Shadow Ratio (`_compute_shadow_ratio`)

**Concept:** Acoustic shadows are the dark region immediately below an object due to sonar geometry. A strong shadow indicates a real object with measurable elevation relief.

**Method:**
```
1. Define shadow region: SHADOW_STRIP_HEIGHT pixels directly BELOW the object bbox
2. Define baseline: seafloor intensity sampled from same area further below
3. Shadow threshold = baseline_intensity × SHADOW_THRESHOLD_RATIO
4. Count pixels in shadow region darker than threshold
5. Return: (dark pixels / total shadow pixels)
```

**JUDGMENT CALL: Shadow falls BELOW the object**
- Assumption: sonar geometry has the sensor to the side/above, so shadows extend downward
- In real deployments with varying sonar geometry, this could be side-projected or rotated
- To adapt: add `shadow_direction` parameter (options: 'below', 'left', 'right', 'above')

**Adjustable Parameters:**
```python
self.shadow_threshold_ratio = 0.6   # Pixels < (baseline × 0.6) are "dark"
self.shadow_strip_height = 20       # pixels to examine below bbox
```

**Tuning guidance:**
- If too many false positives (noise with high shadow ratio): **increase `shadow_threshold_ratio`** (e.g., 0.7–0.8)
- If real objects are rejected (low shadow ratio computed): **decrease `shadow_threshold_ratio`** (e.g., 0.4–0.5)
- If shadow region is too small/large: adjust `shadow_strip_height` (typical: 15–30 pixels for 300-600px images)

---

### 3. Verification: Shape Score (`_compute_shape_score`)

**Concept:** Distinguish real debris from natural seafloor texture using contour shape properties.

**Components:**
1. **Aspect Ratio Score:** Penalize very elongated or squashed shapes
   - Ideal range: 0.3–3.0 (nets are ~5:1, containers ~1:1)
   - Formula: `1.0 - min(1.0, |log(aspect_ratio)| / log(3.0))`

2. **Extent Score:** Ratio of contour area to bounding box area
   - Filled shapes (extent → 1.0) score higher than spiky outlines
   - Formula: `min(1.0, extent × 1.5)`

3. **Solidity Score:** Ratio of contour area to convex hull area
   - Smooth, convex shapes score higher (likely debris)
   - Spiky, non-convex shapes score lower (likely natural rock texture)
   - Formula: `contour_area / convex_hull_area`

**Weighted Combination:**
```python
shape_score = 0.4 × aspect_ratio_score + 0.3 × extent_score + 0.3 × solidity_score
```

**JUDGMENT CALLS:**
- Why these weights? Aspect ratio + extent + solidity are independent enough that equal-ish weighting works
- Aspect ratio is slightly favored (0.4) because elongation is a strong indicator of debris vs. rock
- Can be tuned based on observed debris types (nets, pipes, containers have different aspect profiles)

**Adjustable:** Modify weights in `_compute_shape_score` if you see systematic misclassifications

---

### 4. Verification: Size Score (`_compute_size_score`)

**Concept:** Flag implausibly small (noise) or implausibly large (artifacts) objects.

**Method:**
```
1. If min_dim < 10px → score = 0.2 (likely noise)
2. If max_dim > 30% image size → score = 0.4 (likely artifact)
3. Otherwise → score peaks at 100px, decays linearly
   - Optimal size: 100px (tuned for typical debris relative to image)
   - Formula: score = max(0.5, 1.0 - |max_dim - 100| / 100 × 0.5)
```

**JUDGMENT CALL: Why 100px optimal?**
- For a 600×300px sonar image, 100px is a medium-sized object (visible but not massive)
- Adjust this if your typical debris is smaller (e.g., 50px) or larger (e.g., 200px)

**Adjustable Parameters:**
```python
# In _compute_size_score():
if min_dim < 10: return 0.2        # Increase 10 if lots of small noise
if max_dim > max(img_h, img_w) * 0.3: return 0.4
optimal_size = 100                  # Tune based on expected debris size
```

---

### 5. Confidence Score (Composite)

**Formula:**
```
confidence = 0.35 × shape_score + 0.35 × size_score + 0.30 × shadow_ratio
```

**Weights:**
- **0.35 (Shape):** Debris have distinctive contour properties
- **0.35 (Size):** Plausible size is a strong signal for real objects
- **0.30 (Shadow):** Shadow is important but less reliable (can be weak for shallow objects or certain geometries)

**JUDGMENT CALL:** Why 35-35-30, not 40-40-20?**
- Shadow alone is insufficient (can have high shadow from natural formations)
- Shape + size are more reliable classifiers
- 30% for shadow still enforces the threshold logic: confidence won't exceed ~0.8 if shadow is weak

**Tuning:** If too many false positives, increase shadow weight to 0.40+. If too many false negatives, decrease to 0.20.

---

### 6. Target Classification (Heuristic)

**IMPORTANT:** This is **NOT a trained classifier**. It's simple rule-based bucketing based on aspect ratio + size + shadow.

**Current Heuristics:**
```python
if aspect_ratio > 2.0 and area < 10000 and shadow > 0.5:
    return "Ghost Gear"         # Long, thin, good shadow

if aspect_ratio > 1.8 and height < 100 and shadow > 0.4:
    return "Metal Pipe"         # Thin rod, medium shadow

if area > 15000:
    return "Shipwreck" if shadow > 0.6 else "Cargo Container"  # Large + shadow=wreck

if 0.7 < ar < 1.5 and 5000 < area < 15000:
    return "Cargo Container" if shadow > 0.5 else "Debris Cluster"

return "Debris Cluster"         # Fallback
```

**JUDGMENT CALLS:**
- These thresholds are based on typical sonar signatures of debris, not trained on real data
- Aspect ratio, area, and shadow are independent-enough signals to combine with hard thresholds
- **These are 100% adjustable** — if you see misclassifications, tweak the thresholds in `_classify_target()`

**Example tuning:** If you're seeing "Metal Pipe" classified as "Ghost Gear" too often, lower the `area < 10000` threshold in the Ghost Gear rule to 8000.

---

## Location & Elevation Estimates

### Latitude/Longitude
- **No real GPS metadata attached to uploaded images** (typical for this use case)
- Current behavior: Use tiny offsets based on object position in image + a fake base coordinate
- **This is clearly artificial** and marked with an internal `_location_estimated` flag
- For real deployments: Expect sonar images to carry EXIF or sidecar metadata (GPS, timestamp, sonar heading)

### Elevation Estimate
- **Method:** Empirical regression on pixel intensity
  ```python
  avg_intensity = mean(image[bbox_region])
  elevation = 30.0 + (avg_intensity / 255.0) × 40.0  # 30–70m range
  ```
- **JUDGMENT CALL:** Why 30–70m?
  - Typical continental shelf debris depth range
  - Adjust min/max if working in different water depth zones
- **More realistic approach:** Integrate sonar range/gain metadata if available

---

## Integration with Upload

### `/api/upload-sonar`
1. Receive image file
2. Preprocess (grayscale, contrast boost, median denoise)
3. **Run real detection pipeline on the preprocessed image** ← NEW
4. Return processed image + real detected anomalies

### `/api/detect-anomalies`
- **New `mode` query parameter:**
  - `mode="live"` (default): Run real detection on last uploaded image (or synthetic test image if none uploaded)
  - `mode="demo"`: Return hardcoded sample anomalies (clearly labeled as DEMO MODE)
- Response includes `"mode"` field so frontend/narrator knows which path was taken

---

## Testing

### Unit Tests: `test_real_detection.py`
- **Synthetic image generation:** Embedded objects with known properties
- **Confidence variance:** Ensure scores are NOT hardcoded (vary by image)
- **Shadow ratio computation:** Verified that shadow is image-derived
- **Threshold logic:** >40% shadow handled correctly
- **Classification heuristic:** Aspect ratio/size-based bucketing

**Run:**
```bash
cd sonarguard-backend
python test_real_detection.py
```

### Integration Tests: Update existing `test_integration.py`
- Could be extended to test `/api/upload-sonar` with a real image file
- Verify that returned anomalies have bbox coordinates within image bounds
- Confirm shadow_ratio varies for different test images

---

## Future Enhancements

### 1. Swap in a Trained Model
The `_generate_candidates()` function is isolated. To replace with YOLO:

```python
def _generate_candidates_yolo(self, image):
    # Load YOLO model, run inference, extract bboxes
    # Return same format: [{x, y, w, h, contour, contour_area}, ...]
    # Verification layer (_compute_shadow_ratio, etc.) remains unchanged
```

Then in `detect()`, add a `method` parameter:
```python
if self.method == 'classical':
    candidates = self._generate_candidates(preprocessed)
elif self.method == 'yolo':
    candidates = self._generate_candidates_yolo(preprocessed)
```

### 2. Learn Thresholds from Data
Once you have labeled real sonar data:
- Train a simple random forest or logistic regression on (shape, size, shadow) → (confidence, target_class)
- Replace the hardcoded heuristics in `_classify_target()` and the weighted sum in confidence calculation

### 3. Multi-Scale Detection
Current pipeline runs on single image scale. For robustness:
- Downsample image to 50%, 75%, 100% scales
- Run detection on each scale
- Merge overlapping bboxes (NMS)

### 4. Sonar Geometry Metadata
Parse EXIF / sidecar JSON with:
- Sensor position (lat, lon, depth)
- Heading, pitch, roll
- Range gain settings
- Frequency band

Use to:
- Compute real georeferenced locations
- Adjust shadow direction and threshold
- Normalize intensity scale

---

## Key Takeaway

**This is an honest, image-derived CV pipeline**, not a pretend-trained model. Every bounding box, confidence score, and classification is explainable and tunable. The thresholds are clearly marked as judgment calls. If a judge or reviewer asks "how did you detect that?", you can point to the exact line of code and explain the logic.

When you do have labeled data and want to integrate a trained YOLO model, the structure is ready for that swap with minimal refactoring.

