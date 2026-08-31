"""
Integration tests for SonarGuard API endpoints
Tests all critical workflows and edge cases
"""

import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8000"
API_BASE = f"{BASE_URL}/api"

class TestSonarGuardAPI:
    """Test suite for SonarGuard API"""
    
    def __init__(self):
        self.base_url = API_BASE
        self.test_results = []
    
    def test_health_check(self):
        """Test health check endpoint"""
        print("\n[TEST] Health Check...")
        try:
            response = requests.get(f"{BASE_URL}/api/health")
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "healthy"
            print("✓ Health check passed")
            self.test_results.append(("Health Check", "PASSED"))
            return True
        except Exception as e:
            print(f"✗ Health check failed: {e}")
            self.test_results.append(("Health Check", "FAILED"))
            return False
    
    def test_detect_anomalies(self):
        """Test anomaly detection endpoint"""
        print("\n[TEST] Detect Anomalies...")
        try:
            response = requests.get(f"{self.base_url}/detect-anomalies")
            assert response.status_code == 200
            data = response.json()
            
            # Verify response structure
            assert "status" in data
            assert "anomalies" in data
            assert "sonar_image" in data
            assert data["status"] == "success"
            
            # Verify anomaly data
            anomalies = data["anomalies"]
            assert len(anomalies) > 0, "Should have sample anomalies"
            
            # Verify each anomaly has required fields
            for anomaly in anomalies:
                assert "id" in anomaly
                assert "target_class" in anomaly
                assert "confidence" in anomaly
                assert 0 <= anomaly["confidence"] <= 1
                assert "shadow_ratio" in anomaly
                assert 0 <= anomaly["shadow_ratio"] <= 1
                assert "latitude" in anomaly
                assert "longitude" in anomaly
                assert "elevation_estimate" in anomaly
            
            print(f"✓ Detected {len(anomalies)} anomalies")
            self.test_results.append(("Detect Anomalies", "PASSED"))
            return True
        except Exception as e:
            print(f"✗ Detect anomalies failed: {e}")
            self.test_results.append(("Detect Anomalies", "FAILED"))
            return False
    
    def test_shadow_ratio_validation(self):
        """Test shadow ratio threshold logic"""
        print("\n[TEST] Shadow Ratio Validation...")
        try:
            response = requests.get(f"{self.base_url}/detect-anomalies")
            data = response.json()
            anomalies = data["anomalies"]
            
            threshold = 0.4
            high_shadow_count = 0
            low_shadow_count = 0
            
            for anomaly in anomalies:
                shadow_ratio = anomaly["shadow_ratio"]
                if shadow_ratio >= threshold:
                    high_shadow_count += 1
                else:
                    low_shadow_count += 1
            
            print(f"  High shadow ratio (≥40%): {high_shadow_count}")
            print(f"  Low shadow ratio (<40%): {low_shadow_count}")
            
            assert high_shadow_count + low_shadow_count == len(anomalies)
            print("✓ Shadow ratio validation passed")
            self.test_results.append(("Shadow Ratio Validation", "PASSED"))
            return True
        except Exception as e:
            print(f"✗ Shadow ratio validation failed: {e}")
            self.test_results.append(("Shadow Ratio Validation", "FAILED"))
            return False
    
    def test_confidence_scoring(self):
        """Test confidence score distribution"""
        print("\n[TEST] Confidence Scoring...")
        try:
            response = requests.get(f"{self.base_url}/detect-anomalies")
            data = response.json()
            anomalies = data["anomalies"]
            
            confidence_ranges = {
                "0-20%": 0,
                "20-40%": 0,
                "40-60%": 0,
                "60-80%": 0,
                "80-100%": 0,
            }
            
            for anomaly in anomalies:
                conf = anomaly["confidence"]
                if conf < 0.2:
                    confidence_ranges["0-20%"] += 1
                elif conf < 0.4:
                    confidence_ranges["20-40%"] += 1
                elif conf < 0.6:
                    confidence_ranges["40-60%"] += 1
                elif conf < 0.8:
                    confidence_ranges["60-80%"] += 1
                else:
                    confidence_ranges["80-100%"] += 1
            
            print("  Confidence distribution:")
            for range_label, count in confidence_ranges.items():
                print(f"    {range_label}: {count}")
            
            print("✓ Confidence scoring passed")
            self.test_results.append(("Confidence Scoring", "PASSED"))
            return True
        except Exception as e:
            print(f"✗ Confidence scoring failed: {e}")
            self.test_results.append(("Confidence Scoring", "FAILED"))
            return False
    
    def test_export_report(self):
        """Test export report endpoint"""
        print("\n[TEST] Export Report...")
        try:
            # First get anomalies
            response = requests.get(f"{self.base_url}/detect-anomalies")
            anomalies = response.json()["anomalies"]
            
            # Export report
            export_response = requests.post(
                f"{self.base_url}/export-report",
                json=anomalies
            )
            assert export_response.status_code == 200
            report = export_response.json()
            
            # Verify report structure
            assert "export_timestamp" in report
            assert "total_anomalies" in report
            assert "statistics" in report
            assert "anomalies" in report
            
            stats = report["statistics"]
            assert "confirmed_detections" in stats
            assert "rejected_detections" in stats
            assert "pending_review" in stats
            assert "average_confidence" in stats
            assert "high_shadow_ratio_targets" in stats
            assert "low_shadow_ratio_targets" in stats
            
            print(f"  Total anomalies: {report['total_anomalies']}")
            print(f"  Confirmed: {stats['confirmed_detections']}")
            print(f"  Rejected: {stats['rejected_detections']}")
            print(f"  Pending: {stats['pending_review']}")
            print(f"  Avg Confidence: {stats['average_confidence']}%")
            
            print("✓ Export report passed")
            self.test_results.append(("Export Report", "PASSED"))
            return True
        except Exception as e:
            print(f"✗ Export report failed: {e}")
            self.test_results.append(("Export Report", "FAILED"))
            return False
    
    def test_validation_endpoint(self):
        """Test validation endpoint"""
        print("\n[TEST] Validation Endpoint...")
        try:
            response = requests.post(
                f"{self.base_url}/validate-anomaly",
                params={"target_id": "TGT-001", "is_valid": True}
            )
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "success"
            assert data["target_id"] == "TGT-001"
            
            print("✓ Validation endpoint passed")
            self.test_results.append(("Validation Endpoint", "PASSED"))
            return True
        except Exception as e:
            print(f"✗ Validation endpoint failed: {e}")
            self.test_results.append(("Validation Endpoint", "FAILED"))
            return False
    
    def test_statistics_endpoint(self):
        """Test statistics endpoint"""
        print("\n[TEST] Statistics Endpoint...")
        try:
            response = requests.get(f"{self.base_url}/stats")
            assert response.status_code == 200
            data = response.json()
            
            assert "total_detections" in data
            assert "confirmed" in data
            assert "rejected" in data
            assert "pending" in data
            assert "average_confidence" in data
            
            print(f"  Total Detections: {data['total_detections']}")
            print(f"  Confirmed: {data['confirmed']}")
            print(f"  Rejected: {data['rejected']}")
            print(f"  Pending: {data['pending']}")
            print(f"  Avg Confidence: {data['average_confidence']}%")
            
            print("✓ Statistics endpoint passed")
            self.test_results.append(("Statistics Endpoint", "PASSED"))
            return True
        except Exception as e:
            print(f"✗ Statistics endpoint failed: {e}")
            self.test_results.append(("Statistics Endpoint", "FAILED"))
            return False
    
    def test_cors_headers(self):
        """Test CORS headers"""
        print("\n[TEST] CORS Headers...")
        try:
            response = requests.options(
                f"{self.base_url}/detect-anomalies",
                headers={"Origin": "http://localhost:3000"}
            )
            
            assert "access-control-allow-origin" in response.headers
            print(f"  CORS Origin: {response.headers.get('access-control-allow-origin')}")
            print("✓ CORS headers passed")
            self.test_results.append(("CORS Headers", "PASSED"))
            return True
        except Exception as e:
            print(f"✗ CORS headers failed: {e}")
            self.test_results.append(("CORS Headers", "FAILED"))
            return False
    
    def run_all_tests(self):
        """Run all tests"""
        print("\n" + "="*60)
        print("SonarGuard API Integration Tests")
        print("="*60)
        print(f"Started at: {datetime.now().isoformat()}")
        print(f"API Base URL: {self.base_url}")
        
        # Run all tests
        self.test_health_check()
        self.test_detect_anomalies()
        self.test_shadow_ratio_validation()
        self.test_confidence_scoring()
        self.test_export_report()
        self.test_validation_endpoint()
        self.test_statistics_endpoint()
        self.test_cors_headers()
        
        # Print summary
        print("\n" + "="*60)
        print("Test Summary")
        print("="*60)
        
        passed = sum(1 for _, result in self.test_results if result == "PASSED")
        failed = sum(1 for _, result in self.test_results if result == "FAILED")
        
        for test_name, result in self.test_results:
            status_symbol = "✓" if result == "PASSED" else "✗"
            print(f"{status_symbol} {test_name}: {result}")
        
        print("="*60)
        print(f"Total: {len(self.test_results)} tests")
        print(f"Passed: {passed}")
        print(f"Failed: {failed}")
        print(f"Success Rate: {(passed/len(self.test_results)*100):.1f}%")
        print("="*60)
        
        return failed == 0

if __name__ == "__main__":
    tester = TestSonarGuardAPI()
    success = tester.run_all_tests()
    exit(0 if success else 1)
