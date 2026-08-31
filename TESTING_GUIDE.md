# SonarGuard - Testing & Validation Guide

Complete guide for testing all SonarGuard features, edge cases, and workflows.

---

## 📋 Prerequisites

### Software Requirements
- Node.js 18+ (`npm --version`)
- Python 3.8+ (`python --version`)
- Git
- Modern web browser (Chrome/Firefox/Edge recommended)

### Installation

**Frontend:**
```bash
cd sonarguard-frontend
npm install
```

**Backend:**
```bash
cd sonarguard-backend
pip install -r requirements.txt
```

---

## 🚀 Quick Start (Both Services)

### Option 1: Windows - Using Batch Script
```bash
START_ALL.bat
# This opens two new command prompts - one for backend, one for frontend
```

### Option 2: Manual Startup

**Terminal 1 - Backend:**
```bash
cd sonarguard-backend
python main.py
# Server runs on http://localhost:8000
# API Docs: http://localhost:8000/docs
```

**Terminal 2 - Frontend:**
```bash
cd sonarguard-frontend
npm run dev
# Frontend runs on http://localhost:3000
```

### Option 3: macOS/Linux - Using Shell Script
```bash
chmod +x START_ALL.sh
./START_ALL.sh
```

---

## ✅ Testing Checklist

### 1. Backend API Endpoints

#### Health Check
```bash
curl http://localhost:8000/api/health
```
**Expected Response:** `{"status": "healthy", "service": "sonarguard"}`

#### Get Anomalies
```bash
curl http://localhost:8000/api/detect-anomalies
```
**Verify:**
- ✓ Response includes 5 sample anomalies
- ✓ Each anomaly has all required fields
- ✓ Confidence values are between 0-1
- ✓ Shadow ratios are between 0-1
- ✓ Base64 sonar image is valid

#### Statistics Endpoint
```bash
curl http://localhost:8000/api/stats
```
**Verify:**
- ✓ Total detections: 5
- ✓ Confirmed: 1 (TGT-002)
- ✓ Rejected: 1 (TGT-004)
- ✓ Pending: 3
- ✓ Average confidence is calculated

#### Export Report
```bash
curl -X POST http://localhost:8000/api/export-report \
  -H "Content-Type: application/json" \
  -d '[{"id":"TGT-001","target_class":"Ghost Gear",...}]'
```
**Verify:**
- ✓ Export timestamp is included
- ✓ Statistics section populated correctly
- ✓ All anomalies included in export

---

### 2. Automated Integration Testing

Run the complete test suite:

```bash
cd sonarguard-backend
python test_integration.py
```

**Tests Included:**
1. ✓ Health Check - API availability
2. ✓ Detect Anomalies - Sample data retrieval
3. ✓ Shadow Ratio Validation - Threshold logic (>40%)
4. ✓ Confidence Scoring - Distribution analysis
5. ✓ Export Report - Data export functionality
6. ✓ Validation Endpoint - Human validation workflow
7. ✓ Statistics Endpoint - Aggregate stats
8. ✓ CORS Headers - Cross-origin support

**Expected Output:**
```
============================================================
SonarGuard API Integration Tests
============================================================
✓ Health Check: PASSED
✓ Detect Anomalies: PASSED
✓ Shadow Ratio Validation: PASSED
✓ Confidence Scoring: PASSED
✓ Export Report: PASSED
✓ Validation Endpoint: PASSED
✓ Statistics Endpoint: PASSED
✓ CORS Headers: PASSED
============================================================
Total: 8 tests
Passed: 8
Failed: 0
Success Rate: 100.0%
============================================================
```

---

### 3. Frontend Features Testing

#### Dashboard
- [ ] Page loads successfully
- [ ] Metrics cards display correct data
- [ ] Charts render properly
- [ ] Recent anomalies table shows data
- [ ] Export button visible and clickable

**Edge Cases:**
- [ ] With 0 anomalies, displays "no detections" gracefully
- [ ] Metrics update when anomalies are accepted/rejected

#### Swath Analyzer
- [ ] Raw sonar image displays
- [ ] Processed image with bounding boxes displays
- [ ] Brightness slider (0-200%) adjusts raw image
- [ ] Contrast slider (0-200%) adjusts raw image
- [ ] Clicking anomaly on canvas selects it
- [ ] Selected anomaly highlights on map
- [ ] Anomaly list shows all detections
- [ ] Clickable anomaly overlays work

**Edge Cases:**
- [ ] Very low brightness (5%) still renders
- [ ] Very high contrast (200%) handles properly
- [ ] Selecting same anomaly twice maintains state
- [ ] Rapid clicking doesn't crash

#### XAI Evidence Panel
- [ ] Panel appears when anomaly selected
- [ ] Shows correct target ID and class
- [ ] Confidence bar displays percentage correctly
- [ ] Shadow ratio bar shows with correct color (green ≥40%, orange <40%)
- [ ] "Accept Detection" button validates anomaly (turns green)
- [ ] "Reject Detection" button rejects anomaly (turns red)
- [ ] Panel updates when switching between anomalies
- [ ] Shows "Explainable AI Evidence Panel" title

**Edge Cases:**
- [ ] Low confidence (<50%) shows warning text
- [ ] High confidence (>80%) shows success text
- [ ] Shadow ratio 39.9% shows as LOW (warning)
- [ ] Shadow ratio 40.1% shows as HIGH (valid)
- [ ] GPS coordinates display 4 decimal places

#### Anomaly Logs
- [ ] All anomalies appear in table
- [ ] Filter by status (Pending/Confirmed/Rejected) works
- [ ] Filter by class works
- [ ] JSON export creates downloadable file
- [ ] CSV export creates downloadable file
- [ ] Delete button removes anomaly from list
- [ ] Multiple filters can be combined
- [ ] Count shows "X of Y" correctly

**Edge Cases:**
- [ ] No filters show all anomalies
- [ ] Accepting an anomaly updates logs immediately
- [ ] Exported JSON is valid and parseable
- [ ] Exported CSV has proper headers
- [ ] Deleting an anomaly updates count

#### Survey Map
- [ ] Map canvas renders
- [ ] Detection pins appear on map
- [ ] Clicking pin shows details
- [ ] Legend displays status colors
- [ ] Pins color-coded (violet=pending, green=confirmed, red=rejected)
- [ ] Geospatial distribution is reasonable

**Edge Cases:**
- [ ] With 0 anomalies, shows "No anomalies" message
- [ ] Selecting same pin twice maintains highlight
- [ ] Coordinates display with 4-6 decimal places

#### System Reports
- [ ] Dashboard loads all metrics
- [ ] Pie chart shows status distribution
- [ ] Bar chart shows class distribution
- [ ] Confidence histogram displays ranges
- [ ] Shadow ratio analysis shows correct split
- [ ] Analysis summary provides recommendations
- [ ] All statistics match dashboard

**Edge Cases:**
- [ ] With 0 confirmed, pie chart only shows pending/rejected
- [ ] With single class, bar chart shows one bar
- [ ] All targets in 80-100% range shows skewed histogram

---

### 4. Shadow Ratio Validation Testing

**Test Case 1: Valid Target (High Shadow Ratio)**
- ID: TGT-002 (Shipwreck)
- Shadow Ratio: 0.72 (72%)
- Expected: ✓ CONFIRMED (green indicator)
- Result: ✅ Should show as valid target

**Test Case 2: Borderline Target (At Threshold)**
- ID: TGT-005 (Debris Cluster)
- Shadow Ratio: 0.44 (44%)
- Expected: ✓ VALID (just above 40%)
- Result: ✅ Should show as valid

**Test Case 3: Low Shadow Ratio (Below Threshold)**
- ID: TGT-004 (Metal Pipe)
- Shadow Ratio: 0.32 (32%)
- Expected: ⚠ NEEDS REVIEW (orange indicator)
- Result: ✅ Should flag for human review

**Test Case 4: Edge Case - Exactly 40%**
- Create test anomaly with shadow_ratio: 0.40
- Expected: ≥40% threshold check should pass
- Result: ✅ Should be treated as valid

---

### 5. Confidence Scoring Testing

**Sample Data Distribution:**
| ID | Class | Confidence | Status | Expected Assessment |
|---|---|---|---|---|
| TGT-001 | Ghost Gear | 92% | Pending | High confidence ✓ |
| TGT-002 | Shipwreck | 87% | Confirmed | High confidence ✓ |
| TGT-003 | Cargo Container | 78% | Pending | Medium confidence ◐ |
| TGT-004 | Metal Pipe | 65% | Rejected | Medium confidence ◐ |
| TGT-005 | Debris Cluster | 81% | Pending | Medium-High confidence ◐ |

**Test Cases:**
- [ ] 92% shows as "High confidence" ✓
- [ ] 78% shows as "Medium - human review recommended"
- [ ] 32% shows as "Low - verify manually" ⚠
- [ ] Average confidence calculated correctly

---

### 6. Data Export Validation

**JSON Export Test:**
1. Click "JSON" button in Anomaly Logs
2. Verify file downloads as `anomalies-TIMESTAMP.json`
3. Open in text editor and verify:
   ```json
   {
     "id": "TGT-001",
     "target_class": "Ghost Gear",
     "confidence": 0.92,
     "shadow_ratio": 0.65,
     ...
   }
   ```
4. Verify all fields present and properly formatted

**CSV Export Test:**
1. Click "CSV" button in Anomaly Logs
2. Verify file downloads as `anomalies-TIMESTAMP.csv`
3. Open in spreadsheet app and verify:
   - Headers: ID, Class, Confidence, Shadow Ratio, Elevation, Latitude, Longitude, Status, Timestamp
   - Data properly formatted and quoted
   - All anomalies included

**Report Export Test:**
1. Go to System Reports page
2. Verify export button visible (if implemented)
3. Test that export includes:
   - Total count
   - Status breakdown
   - Average confidence
   - Shadow ratio analysis

---

### 7. Cross-Browser Testing

Test in each browser:

**Chrome/Edge Chromium:**
- [ ] All features render correctly
- [ ] Performance is smooth (60 FPS)
- [ ] Canvas rendering works
- [ ] Charts display properly

**Firefox:**
- [ ] All features render correctly
- [ ] Performance is smooth
- [ ] Canvas rendering works
- [ ] Charts display properly

**Safari (macOS/iOS):**
- [ ] All features render correctly
- [ ] Glassmorphism effects work
- [ ] Touch interactions work (if testing on iPad)

---

### 8. Performance Testing

#### Load Testing
```bash
# Test with multiple anomalies
# Edit test_integration.py to generate 100+ anomalies
python test_integration.py --stress
```

**Metrics to Monitor:**
- API response time: <500ms
- Frontend render time: <1s
- Dashboard load: <2s
- Export generation: <500ms

#### Memory Testing
1. Open DevTools (F12)
2. Go to Memory/Performance tab
3. Perform these actions repeatedly:
   - Switch between pages
   - Accept/reject anomalies
   - Apply filters
4. Monitor heap growth - should not exceed 100MB

---

### 9. Error Handling Testing

**Test Scenarios:**

1. **Backend Down:**
   - Stop backend server
   - Frontend should show connection error
   - Message should indicate server is down

2. **Invalid JSON Export:**
   - Manually corrupt anomaly data
   - Export should still work or show error message

3. **Network Timeout:**
   - Throttle network (DevTools → Network → Slow 3G)
   - Operations should timeout gracefully after 30s
   - Error message should guide user

4. **Large Dataset:**
   - Load 1000+ anomalies
   - UI should remain responsive
   - Export should still work

---

## 📊 Expected Sample Data

### Sample Anomalies (Default Loaded)

```
TGT-001: Ghost Gear
- Confidence: 92%
- Shadow Ratio: 65%
- Location: 40.7128°N, 74.0060°W
- Elevation: 52.3m
- Status: Pending Review

TGT-002: Shipwreck (CONFIRMED)
- Confidence: 87%
- Shadow Ratio: 72%
- Location: 40.7150°N, 74.0080°W
- Elevation: 65.8m
- Status: Confirmed ✓

TGT-003: Cargo Container
- Confidence: 78%
- Shadow Ratio: 58%
- Location: 40.7120°N, 74.0050°W
- Elevation: 45.2m
- Status: Pending Review

TGT-004: Metal Pipe (REJECTED)
- Confidence: 65%
- Shadow Ratio: 32% ⚠
- Location: 40.7140°N, 74.0070°W
- Elevation: 38.5m
- Status: Rejected ✗

TGT-005: Debris Cluster
- Confidence: 81%
- Shadow Ratio: 44%
- Location: 40.7135°N, 74.0065°W
- Elevation: 55.1m
- Status: Pending Review
```

---

## 🔍 Debugging Tips

### Frontend Issues
```javascript
// Open browser console (F12)
// Check for API errors:
// - Network tab should show 200 responses
// - Check console for JavaScript errors
// - Verify API_URL is correct
```

### Backend Issues
```bash
# Start with verbose logging
python main.py --log-level debug

# Check CORS
# Browser console should show no CORS errors
# Response headers should include Access-Control-* headers
```

### Connection Issues
```bash
# Test backend is running
curl http://localhost:8000/api/health

# Test CORS
curl -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: GET" \
  http://localhost:8000/api/detect-anomalies

# Check ports
# Windows: netstat -ano | findstr :8000
# macOS/Linux: lsof -i :8000
```

---

## 📈 Test Results Summary

After running all tests, you should see:

```
✓ 8/8 API endpoints working
✓ 100+ UI components rendering correctly
✓ Shadow ratio logic validated (40% threshold)
✓ Confidence scoring accurate
✓ Data export formats valid
✓ Cross-origin requests working
✓ Error handling graceful
✓ Performance acceptable
```

---

## 🎯 Success Criteria

System is production-ready when:
- ✅ All 8 API tests pass
- ✅ All UI pages load and function correctly
- ✅ Shadow ratio validation works as specified
- ✅ Data export formats are valid
- ✅ Error messages are helpful
- ✅ Response times < 1 second
- ✅ No console errors

---

## 📞 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Cannot connect to backend" | Check backend is running on :8000; verify no firewall blocks |
| CORS errors in browser | Ensure backend has CORS enabled; check origin header |
| Blank sonar image | Check base64 image generation in backend |
| Charts not rendering | Verify Recharts library installed; check browser console |
| Export not downloading | Check browser download settings; verify JSON is valid |
| High memory usage | Check for memory leaks; restart browser |

---

## 📚 Additional Resources

- API Documentation: http://localhost:8000/docs (FastAPI Swagger UI)
- React Dev Tools: Chrome/Firefox extension
- Tailwind CSS: https://tailwindcss.com/docs
- Recharts: https://recharts.org/

---

**Last Updated:** January 2024  
**Version:** 1.0.0  
**Status:** Ready for Testing ✅
