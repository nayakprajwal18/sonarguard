"""Test file upload endpoint"""
import requests

BASE_URL = "http://localhost:8000"
API_BASE = f"{BASE_URL}/api"

print("\n=== Testing File Upload ===\n")

# Test uploading the sonar image
test_file_path = "c:/Users/Admin/Desktop/SIH/sonarguard-backend/test_sonar.png"

try:
    with open(test_file_path, 'rb') as f:
        files = {'file': f}
        response = requests.post(f"{API_BASE}/upload-sonar", files=files, timeout=30)
    
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print("Response:")
        print(f"  - Status: {data.get('status')}")
        print(f"  - Message: {data.get('message')}")
        print(f"  - Anomalies detected: {len(data.get('anomalies', []))}")
        
        if data.get('anomalies'):
            print("\nFirst anomaly:")
            first = data['anomalies'][0]
            print(f"  - ID: {first.get('id')}")
            print(f"  - Class: {first.get('target_class')}")
            print(f"  - Confidence: {first.get('confidence'):.2%}")
            print(f"  - Shadow Ratio: {first.get('shadow_ratio'):.2%}")
        
        print("\nFile Upload Test: PASSED")
    else:
        print(f"File Upload Test: FAILED - {response.text}")

except Exception as e:
    print(f"File Upload Test: FAILED - {e}")

print("\n=== Test Complete ===\n")
