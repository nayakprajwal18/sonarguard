"""
Simple endpoint verification script - no Unicode issues
"""
import requests
import json

BASE_URL = "http://localhost:8000"
API_BASE = f"{BASE_URL}/api"

print("\n=== SonarGuard API Endpoint Verification ===\n")

# Test 1: Health Check
print("[1/5] Testing Health Check endpoint...")
try:
    response = requests.get(f"{API_BASE}/health", timeout=5)
    if response.status_code == 200:
        print("    PASSED - Health check healthy")
    else:
        print(f"    FAILED - Status {response.status_code}")
except Exception as e:
    print(f"    FAILED - {e}")

# Test 2: Detect Anomalies (no upload)
print("[2/5] Testing Detect Anomalies endpoint...")
try:
    response = requests.get(f"{API_BASE}/detect-anomalies", timeout=10)
    if response.status_code == 200:
        data = response.json()
        if "anomalies" in data and "status" in data:
            count = len(data.get("anomalies", []))
            print(f"    PASSED - Got {count} anomalies")
        else:
            print("    FAILED - Missing response fields")
    else:
        print(f"    FAILED - Status {response.status_code}")
except Exception as e:
    print(f"    FAILED - {e}")

# Test 3: Stats endpoint
print("[3/5] Testing Statistics endpoint...")
try:
    response = requests.get(f"{API_BASE}/stats", timeout=5)
    if response.status_code == 200:
        data = response.json()
        print("    PASSED - Stats retrieved")
    else:
        print(f"    FAILED - Status {response.status_code}")
except Exception as e:
    print(f"    FAILED - {e}")

# Test 4: Validate Anomaly endpoint (POST)
print("[4/5] Testing Validate Anomaly endpoint...")
try:
    response = requests.post(f"{API_BASE}/validate-anomaly", 
                            params={"target_id": "DEMO-001", "is_valid": True},
                            timeout=5)
    if response.status_code == 200:
        print("    PASSED - Validation accepted")
    else:
        print(f"    FAILED - Status {response.status_code}")
except Exception as e:
    print(f"    FAILED - {e}")

# Test 5: Export Report endpoint (POST)
print("[5/5] Testing Export Report endpoint...")
try:
    test_data = [
        {
            "id": "TEST-001",
            "target_class": "Ghost Gear",
            "confidence": 0.92,
            "validated": True
        }
    ]
    response = requests.post(f"{API_BASE}/export-report",
                            json=test_data,
                            timeout=5)
    if response.status_code == 200:
        print("    PASSED - Report exported")
    else:
        print(f"    FAILED - Status {response.status_code}")
except Exception as e:
    print(f"    FAILED - {e}")

print("\n=== Verification Complete ===\n")
