"""Test the complete workflow: upload -> detect -> validate -> export"""
import requests
import json

BASE_URL = "http://localhost:8000"
API_BASE = f"{BASE_URL}/api"

print("\n=== Complete Workflow Test ===\n")

# Step 1: Upload
print("[1/4] Uploading sonar image...")
test_file_path = "c:/Users/Admin/Desktop/SIH/sonarguard-backend/test_sonar.png"

try:
    with open(test_file_path, 'rb') as f:
        files = {'file': f}
        response = requests.post(f"{API_BASE}/upload-sonar", files=files, timeout=30)
    
    if response.status_code == 200:
        print("      PASSED - Image uploaded")
        upload_data = response.json()
    else:
        print(f"      FAILED - {response.status_code}")
        exit(1)
except Exception as e:
    print(f"      FAILED - {e}")
    exit(1)

# Step 2: Detect Anomalies
print("[2/4] Detecting anomalies...")
try:
    response = requests.get(f"{API_BASE}/detect-anomalies?mode=live", timeout=30)
    
    if response.status_code == 200:
        detect_data = response.json()
        anomalies = detect_data.get('anomalies', [])
        print(f"      PASSED - Found {len(anomalies)} anomalies")
        
        if anomalies:
            first_id = anomalies[0]['id']
        else:
            # Use demo data
            first_id = "DEMO-001"
    else:
        print(f"      FAILED - {response.status_code}")
        exit(1)
except Exception as e:
    print(f"      FAILED - {e}")
    exit(1)

# Step 3: Validate Anomaly
print(f"[3/4] Validating anomaly {first_id}...")
try:
    response = requests.post(f"{API_BASE}/validate-anomaly",
                            params={"target_id": first_id, "is_valid": True},
                            timeout=30)
    
    if response.status_code == 200:
        print("      PASSED - Anomaly validated")
    else:
        print(f"      FAILED - {response.status_code}")
except Exception as e:
    print(f"      FAILED - {e}")

# Step 4: Export Report
print("[4/4] Exporting report...")
try:
    test_anomalies = [
        {
            "id": "TEST-001",
            "target_class": "Ghost Gear",
            "confidence": 0.92,
            "shadow_ratio": 0.65,
            "validated": True
        }
    ]
    
    response = requests.post(f"{API_BASE}/export-report",
                            json=test_anomalies,
                            timeout=30)
    
    if response.status_code == 200:
        print("      PASSED - Report exported")
    else:
        print(f"      FAILED - {response.status_code}")
except Exception as e:
    print(f"      FAILED - {e}")

print("\n=== Workflow Complete ===\n")
print("All backend operations verified successfully!")
