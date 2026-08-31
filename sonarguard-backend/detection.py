"""
Classical CV-based sonar anomaly detection pipeline.

This module implements a real, image-derived detection system using:
1. Candidate generation: Adaptive thresholding + contour detection
2. Verification: Shadow ratio, shape score, size score
3. Classification: Heuristic-based (NOT trained ML) bucket assignment

Designed to be swappable with a trained YOLO/U-Net model in the future.
"""

import numpy as np
from PIL import Image, ImageFilter, ImageEnhance
import cv2
from datetime import datetime
from typing import List, Tuple, Dict
import random


class SonarDetectionPipeline:
    """
    Classical CV-based detection pipeline for sonar imagery.
    
    Hyperparameters:
    - MIN_CONTOUR_AREA: Filter noise contours below this pixel area (default: 50)
    - MAX_CONTOUR_AREA: Flag implausibly large contours (default: 50000)
    - SHADOW_THRESHOLD_RATIO: Darkness ratio for shadow detection (default: 0.6)
    - SHADOW_STRIP_HEIGHT: Pixels to examine below bbox for shadow (default: 20)
    - CONFIDENCE_WEIGHTS: (shape=0.35, size=0.35, shadow=0.3) normalized confidence
    """
    
    def __init__(
        self,
        min_contour_area: int = 50,
        max_contour_area: int = 50000,
        shadow_threshold_ratio: float = 0.6,
        shadow_strip_height: int = 20,
    ):
        self.min_contour_area = min_contour_area
        self.max_contour_area = max_contour_area
        self.shadow_threshold_ratio = shadow_threshold_ratio
        self.shadow_strip_height = shadow_strip_height
        self.target_counter = 0  # For unique ID generation
    
    def detect(self, image_array: np.ndarray, metadata: Dict = None) -> List[Dict]:
        """
        Run full detection pipeline on a grayscale sonar image.
        
        Args:
            image_array: Grayscale numpy array (H, W) or PIL Image
            metadata: Optional dict with 'latitude', 'longitude', 'timestamp'
        
        Returns:
            List of anomaly dicts with real, image-derived metrics
        """
        # Convert PIL to numpy if needed
        if isinstance(image_array, Image.Image):
            image_array = np.array(image_array)
        
        # Ensure grayscale
        if len(image_array.shape) == 3:
            image_array = cv2.cvtColor(image_array, cv2.COLOR_BGR2GRAY)
        
        # Preprocess
        preprocessed = self._preprocess(image_array)
        
        # Generate candidates
        candidates = self._generate_candidates(preprocessed)
        
        # Verify each candidate and compute metrics
        anomalies = []
        for candidate in candidates:
            anomaly = self._verify_candidate(candidate, image_array, metadata)
            if anomaly is not None:
                anomalies.append(anomaly)
        
        # Sort by confidence descending
        anomalies.sort(key=lambda x: x['confidence'], reverse=True)
        return anomalies
    
    def _preprocess(self, image: np.ndarray) -> np.ndarray:
        """
        Preprocess sonar image: histogram equalization, denoise, contrast boost.
        
        Args:
            image: Grayscale uint8 numpy array
        
        Returns:
            Preprocessed uint8 array
        """
        # Histogram equalization for better contrast
        image = cv2.equalizeHist(image)
        
        # Denoise (non-local means, or faster median blur)
        image = cv2.medianBlur(image, 5)
        
        # Light contrast boost
        pil_img = Image.fromarray(image)
        enhancer = ImageEnhance.Contrast(pil_img)
        pil_img = enhancer.enhance(1.3)
        image = np.array(pil_img)
        
        return image
    
    def _generate_candidates(self, image: np.ndarray) -> List[Dict]:
        """
        Generate candidate bounding boxes using adaptive thresholding + contours.
        
        JUDGMENT CALL: Using Otsu's method (automatic threshold) to binarize.
        If image is too dark/light, adaptive thresholding can be substituted.
        
        Args:
            image: Preprocessed grayscale uint8 array
        
        Returns:
            List of candidate dicts: {x, y, w, h, contour, contour_area}
        """
        # Otsu's binarization
        _, binary = cv2.threshold(image, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        # Find contours
        contours, _ = cv2.findContours(binary, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
        
        candidates = []
        for contour in contours:
            area = cv2.contourArea(contour)
            
            # Filter by size
            if area < self.min_contour_area or area > self.max_contour_area:
                continue
            
            # Get bounding rect
            x, y, w, h = cv2.boundingRect(contour)
            
            candidates.append({
                'x': x,
                'y': y,
                'w': w,
                'h': h,
                'contour': contour,
                'contour_area': area,
            })
        
        return candidates
    
    def _verify_candidate(self, candidate: Dict, original_image: np.ndarray, metadata: Dict = None) -> Dict:
        """
        Verify a candidate and compute real metrics: shadow ratio, shape score, size score.
        
        Args:
            candidate: Candidate from _generate_candidates
            original_image: Original grayscale uint8 array
            metadata: Optional metadata (lat, lon, timestamp)
        
        Returns:
            Anomaly dict (matching Anomaly Pydantic model) or None if rejected
        """
        x, y, w, h = candidate['x'], candidate['y'], candidate['w'], candidate['h']
        contour = candidate['contour']
        contour_area = candidate['contour_area']
        
        # --- SHADOW RATIO COMPUTATION ---
        # JUDGMENT CALL: Assume shadow falls BELOW the object (typical for sonar geometry).
        # Look at a strip of pixels immediately below the bbox and compare darkness.
        shadow_ratio = self._compute_shadow_ratio(original_image, x, y, w, h)
        
        # --- SHAPE SCORE ---
        # JUDGMENT CALL: Combine aspect ratio, solidity, and contour approximation
        # to estimate if the shape looks like debris vs. natural texture.
        shape_score = self._compute_shape_score(contour, w, h, contour_area)
        
        # --- SIZE SCORE ---
        # JUDGMENT CALL: Normalize pixel dimensions. Very small = noise (low score),
        # plausible mid-range = high score, very large = artifact (medium score).
        size_score = self._compute_size_score(w, h, original_image.shape)
        
        # --- CONFIDENCE SCORE (weighted average) ---
        # JUDGMENT CALL: Weights chosen to emphasize shape (35%) and size (35%)
        # with shadow as a secondary confirmation (30%).
        confidence = (
            0.35 * shape_score +
            0.35 * size_score +
            0.30 * shadow_ratio
        )
        
        # Clamp to [0, 1]
        confidence = min(1.0, max(0.0, confidence))
        
        # --- TARGET CLASS HEURISTIC ---
        # JUDGMENT CALL: Simple aspect-ratio and size buckets.
        # This is NOT a trained classifier; it's a rule-based heuristic.
        target_class = self._classify_target(w, h, contour_area, shadow_ratio)
        
        # --- LOCATION ESTIMATES ---
        # Since no real GPS metadata is attached, use image-relative positions
        # and make it clear these are estimates.
        if metadata and 'latitude' in metadata and 'longitude' in metadata:
            latitude = metadata['latitude']
            longitude = metadata['longitude']
            location_confidence = True
        else:
            # Fake estimate based on image position (clearly not real GPS)
            latitude = 40.71 + (x / original_image.shape[1]) * 0.01  # Tiny offset
            longitude = -74.00 + (y / original_image.shape[0]) * 0.01
            location_confidence = False
        
        # Elevation estimate: depth from contour darkness intensity
        avg_intensity = np.mean(original_image[y:y+h, x:x+w])
        elevation_estimate = 30.0 + (avg_intensity / 255.0) * 40.0  # 30-70m range
        
        # --- GENERATE ANOMALY DICT ---
        self.target_counter += 1
        anomaly = {
            'id': f'TGT-{self.target_counter:03d}',
            'target_class': target_class,
            'confidence': round(confidence, 3),
            'bbox_x': int(x),
            'bbox_y': int(y),
            'bbox_width': int(w),
            'bbox_height': int(h),
            'shadow_ratio': round(shadow_ratio, 3),
            'pixel_width': int(w),
            'pixel_height': int(h),
            'elevation_estimate': round(elevation_estimate, 1),
            'latitude': round(latitude, 6),
            'longitude': round(longitude, 6),
            'validated': None,
            'timestamp': datetime.now().isoformat(),
            '_location_estimated': location_confidence == False,  # Internal flag
        }
        
        return anomaly
    
    def _compute_shadow_ratio(self, image: np.ndarray, x: int, y: int, w: int, h: int) -> float:
        """
        Compute acoustic shadow ratio below the object bbox.
        
        JUDGMENT CALL:
        - Shadow region: SHADOW_STRIP_HEIGHT pixels directly below the bbox
        - Shadow threshold: pixels darker than (SHADOW_THRESHOLD_RATIO * average_seafloor_intensity)
        - Result: fraction of shadow region that is "dark enough"
        
        Args:
            image: Original grayscale image
            x, y, w, h: Bounding box coordinates and dimensions
        
        Returns:
            Shadow ratio (0-1)
        """
        img_h, img_w = image.shape
        
        # Sample the "seafloor" baseline: region far from object, same width
        baseline_y_start = max(y + h + 10, 0)
        baseline_y_end = min(baseline_y_start + self.shadow_strip_height, img_h)
        if baseline_y_end <= baseline_y_start:
            return 0.5  # Not enough pixels; neutral estimate
        
        baseline_region = image[baseline_y_start:baseline_y_end, max(x-w, 0):min(x+2*w, img_w)]
        if baseline_region.size == 0:
            return 0.5
        baseline_intensity = np.mean(baseline_region)
        
        # Shadow region: immediately below object
        shadow_y_start = y + h
        shadow_y_end = min(shadow_y_start + self.shadow_strip_height, img_h)
        if shadow_y_end <= shadow_y_start:
            return 0.5
        
        shadow_region = image[shadow_y_start:shadow_y_end, max(x, 0):min(x+w, img_w)]
        if shadow_region.size == 0:
            return 0.5
        
        # Fraction of shadow region darker than threshold
        shadow_threshold = baseline_intensity * self.shadow_threshold_ratio
        dark_pixels = np.sum(shadow_region < shadow_threshold)
        shadow_ratio = dark_pixels / shadow_region.size
        
        return min(1.0, max(0.0, shadow_ratio))
    
    def _compute_shape_score(self, contour, w: int, h: int, contour_area: float) -> float:
        """
        Compute shape score based on contour properties.
        
        JUDGMENT CALL:
        - Aspect ratio: objects with AR between 0.3-3.0 are plausible (nets are elongated, containers are roughly square)
        - Solidity: convexity check; too spiky = natural rock texture (low score)
        - Extent: ratio of contour area to bbox area; filled shapes score higher
        
        Returns:
            Shape score (0-1)
        """
        # Avoid division by zero
        if w == 0 or h == 0 or contour_area == 0:
            return 0.0
        
        bbox_area = w * h
        
        # Aspect ratio score: ideally between 0.3 and 3.0
        aspect_ratio = w / h if h > 0 else 1.0
        ar_score = 1.0 - min(1.0, abs(np.log(aspect_ratio)) / np.log(3.0))
        
        # Extent (fill ratio): extent = contour_area / bbox_area
        extent = contour_area / bbox_area
        # Prefer filled objects, but allow some irregular shapes
        extent_score = min(1.0, extent * 1.5)
        
        # Convexity: solidity = contour_area / convex_hull_area
        hull = cv2.convexHull(contour)
        hull_area = cv2.contourArea(hull)
        solidity = contour_area / hull_area if hull_area > 0 else 0.0
        # Less spiky (higher solidity) = better
        solidity_score = solidity
        
        # Weighted combination
        shape_score = 0.4 * ar_score + 0.3 * extent_score + 0.3 * solidity_score
        return min(1.0, max(0.0, shape_score))
    
    def _compute_size_score(self, w: int, h: int, image_shape: Tuple) -> float:
        """
        Compute size plausibility score.
        
        JUDGMENT CALL:
        - Too small (< 10px): likely noise → low score
        - Plausible range (10-500px): high score
        - Too large (> 500px or > 30% image): likely artifact → medium score
        
        Returns:
            Size score (0-1)
        """
        img_h, img_w = image_shape
        max_dim = max(w, h)
        min_dim = min(w, h)
        
        # Penalize very small objects
        if min_dim < 10:
            return 0.2
        
        # Penalize very large objects or artifacts
        if max_dim > max(img_h, img_w) * 0.3:
            return 0.4
        
        # Plausible range: scale linearly
        if 10 <= max_dim <= 500:
            # Peak at ~50-200px
            optimal_size = 100
            size_dist = abs(max_dim - optimal_size) / optimal_size
            size_score = max(0.5, 1.0 - size_dist * 0.5)
            return min(1.0, size_score)
        
        return 0.6
    
    def _classify_target(self, w: int, h: int, contour_area: float, shadow_ratio: float) -> str:
        """
        Heuristic-based target classification.
        
        JUDGMENT CALL: Simple rules based on aspect ratio, size, and shadow.
        This is NOT a trained classifier and should be clearly labeled as such in docs.
        
        Returns:
            Target class string: "Ghost Gear", "Metal Pipe", "Cargo Container", etc.
        """
        aspect_ratio = w / h if h > 0 else 1.0
        bbox_area = w * h
        
        # Elongated and thin → Net/Ghost Gear
        if aspect_ratio > 2.0 and bbox_area < 10000 and shadow_ratio > 0.5:
            return "Ghost Gear"
        
        # Elongated and thin → Metal Pipe
        if aspect_ratio > 1.8 and h < 100 and shadow_ratio > 0.4:
            return "Metal Pipe"
        
        # Large, blocky → Shipwreck or Cargo Container
        if bbox_area > 15000:
            if shadow_ratio > 0.6:
                return "Shipwreck"
            else:
                return "Cargo Container"
        
        # Compact, medium → Debris Cluster or Container
        if 0.7 < aspect_ratio < 1.5 and 5000 < bbox_area < 15000:
            return "Cargo Container" if shadow_ratio > 0.5 else "Debris Cluster"
        
        # Default fallback
        return "Debris Cluster"


def create_dummy_sonar_for_testing() -> np.ndarray:
    """
    Create a synthetic sonar image with embedded test objects for validation.
    
    Returns:
        Grayscale uint8 numpy array (600, 300) with artificial anomalies
    """
    img = np.ones((300, 600), dtype=np.uint8) * 100  # Seafloor baseline
    
    # Add noise to simulate texture
    noise = np.random.randint(-20, 20, img.shape)
    img = np.clip(img + noise, 0, 255).astype(np.uint8)
    
    # Add test object 1: bright elongated blob (simulates debris)
    cv2.ellipse(img, (150, 100), (50, 20), 0, 0, 360, 180, -1)
    # Shadow below object 1
    cv2.rectangle(img, (120, 125), (180, 145), 40, -1)
    
    # Add test object 2: compact blob (simulates container)
    cv2.circle(img, (400, 120), 40, 160, -1)
    # Shadow below object 2
    cv2.rectangle(img, (360, 165), (440, 185), 50, -1)
    
    # Add test object 3: large irregular shape (simulates wreck)
    pts = np.array([[500, 200], [550, 180], [570, 220], [540, 240]], dtype=np.int32)
    cv2.polylines(img, [pts], True, 140)
    cv2.fillPoly(img, [pts], 150)
    # Shadow below object 3
    cv2.rectangle(img, (495, 245), (575, 265), 45, -1)
    
    return img
