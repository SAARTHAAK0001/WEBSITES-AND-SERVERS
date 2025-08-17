import requests
import json
import time
from datetime import datetime, timedelta
from typing import Dict, List, Any
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/frontend/.env')

class PlantMonitoringTester:
    def __init__(self):
        self.base_url = os.getenv('REACT_APP_BACKEND_URL', 'http://localhost:8001')
        if not self.base_url.endswith('/api'):
            self.base_url = f"{self.base_url}/api"
        
        self.session = requests.Session()
        self.test_results = []
        self.alert_ids = []  # Store alert IDs for testing acknowledgment/dismissal
        
        print(f"Testing Plant Monitoring System at: {self.base_url}")
        print("=" * 60)

    def log_test(self, test_name: str, success: bool, details: str = ""):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        self.test_results.append({
            'test': test_name,
            'success': success,
            'details': details
        })
        print(f"{status} {test_name}")
        if details:
            print(f"    Details: {details}")

    def make_request(self, method: str, endpoint: str, **kwargs) -> requests.Response:
        """Make HTTP request with error handling"""
        url = f"{self.base_url}{endpoint}"
        try:
            response = self.session.request(method, url, timeout=30, **kwargs)
            return response
        except requests.exceptions.RequestException as e:
            print(f"Request failed: {e}")
            raise

    def test_current_readings(self):
        """Test GET /api/readings/current endpoint"""
        print("\n🔍 Testing Current Readings Endpoint")
        
        try:
            response = self.make_request('GET', '/readings/current')
            
            if response.status_code == 200:
                data = response.json()
                
                # Check if all 5 sensors are present
                expected_sensors = ['waterLevel', 'temperature', 'soilMoisture', 'soilPH', 'light']
                missing_sensors = [sensor for sensor in expected_sensors if sensor not in data]
                
                if missing_sensors:
                    self.log_test("Current readings - All sensors present", False, 
                                f"Missing sensors: {missing_sensors}")
                else:
                    self.log_test("Current readings - All sensors present", True)
                
                # Validate sensor data structure
                for sensor, reading in data.items():
                    if all(key in reading for key in ['value', 'unit', 'status', 'lastUpdated', 'threshold']):
                        # Check status calculation
                        status_valid = reading['status'] in ['good', 'warning', 'critical']
                        self.log_test(f"Current readings - {sensor} structure", status_valid,
                                    f"Status: {reading['status']}, Value: {reading['value']}{reading['unit']}")
                    else:
                        self.log_test(f"Current readings - {sensor} structure", False,
                                    f"Missing required fields in {sensor} reading")
            else:
                self.log_test("Current readings - HTTP status", False, 
                            f"Expected 200, got {response.status_code}")
                
        except Exception as e:
            self.log_test("Current readings - Request", False, str(e))

    def test_historical_data(self):
        """Test GET /api/readings/history endpoint"""
        print("\n📊 Testing Historical Data Endpoint")
        
        sensors_to_test = ['waterLevel', 'temperature', 'soilMoisture', 'soilPH', 'light']
        
        for sensor in sensors_to_test:
            try:
                # Test with default 24 hours
                response = self.make_request('GET', f'/readings/history?sensor={sensor}&hours=24')
                
                if response.status_code == 200:
                    data = response.json()
                    
                    if isinstance(data, list):
                        self.log_test(f"Historical data - {sensor} (24h)", True, 
                                    f"Retrieved {len(data)} data points")
                        
                        # Validate data structure if data exists
                        if data:
                            first_point = data[0]
                            required_fields = ['timestamp', 'time', 'value']
                            if all(field in first_point for field in required_fields):
                                self.log_test(f"Historical data - {sensor} structure", True)
                            else:
                                self.log_test(f"Historical data - {sensor} structure", False,
                                            f"Missing fields in data point")
                    else:
                        self.log_test(f"Historical data - {sensor} format", False, 
                                    "Expected list format")
                else:
                    self.log_test(f"Historical data - {sensor}", False, 
                                f"HTTP {response.status_code}")
                    
            except Exception as e:
                self.log_test(f"Historical data - {sensor}", False, str(e))
        
        # Test with different time ranges
        try:
            response = self.make_request('GET', '/readings/history?sensor=waterLevel&hours=1')
            if response.status_code == 200:
                self.log_test("Historical data - Custom time range", True, "1 hour range works")
            else:
                self.log_test("Historical data - Custom time range", False, 
                            f"HTTP {response.status_code}")
        except Exception as e:
            self.log_test("Historical data - Custom time range", False, str(e))
        
        # Test invalid sensor type
        try:
            response = self.make_request('GET', '/readings/history?sensor=invalidSensor&hours=24')
            if response.status_code in [400, 422]:  # Should return validation error
                self.log_test("Historical data - Invalid sensor", True, "Properly rejected invalid sensor")
            else:
                self.log_test("Historical data - Invalid sensor", False, 
                            f"Expected 400/422, got {response.status_code}")
        except Exception as e:
            self.log_test("Historical data - Invalid sensor", False, str(e))

    def test_plant_info(self):
        """Test plant information endpoints"""
        print("\n🌱 Testing Plant Information Endpoints")
        
        # Test GET plant info
        try:
            response = self.make_request('GET', '/plant/info')
            
            if response.status_code == 200:
                plant_data = response.json()
                required_fields = ['id', 'name', 'type', 'location', 'thresholds']
                
                if all(field in plant_data for field in required_fields):
                    self.log_test("Plant info - GET structure", True, 
                                f"Plant: {plant_data.get('name', 'Unknown')}")
                    
                    # Store original data for restoration later
                    self.original_plant_data = plant_data
                else:
                    self.log_test("Plant info - GET structure", False, 
                                f"Missing required fields")
            else:
                self.log_test("Plant info - GET", False, f"HTTP {response.status_code}")
                
        except Exception as e:
            self.log_test("Plant info - GET", False, str(e))
        
        # Test PUT plant info update
        try:
            update_data = {
                "name": "Test Monstera Plant",
                "type": "Monstera Deliciosa",
                "location": "Test Garden"
            }
            
            response = self.make_request('PUT', '/plant/info', json=update_data)
            
            if response.status_code == 200:
                updated_plant = response.json()
                
                # Verify updates were applied
                updates_applied = all(
                    updated_plant.get(key) == value 
                    for key, value in update_data.items()
                )
                
                if updates_applied:
                    self.log_test("Plant info - PUT update", True, "Plant info updated successfully")
                else:
                    self.log_test("Plant info - PUT update", False, "Updates not applied correctly")
            else:
                self.log_test("Plant info - PUT update", False, f"HTTP {response.status_code}")
                
        except Exception as e:
            self.log_test("Plant info - PUT update", False, str(e))

    def test_sensor_data_submission(self):
        """Test POST /api/readings/submit endpoint"""
        print("\n📝 Testing Sensor Data Submission")
        
        # Test normal readings
        test_readings = [
            {"sensor_type": "waterLevel", "value": 75.0},  # Good
            {"sensor_type": "temperature", "value": 25.0},  # Good
            {"sensor_type": "soilMoisture", "value": 60.0},  # Good
            {"sensor_type": "soilPH", "value": 6.5},  # Good
            {"sensor_type": "light", "value": 800.0}  # Good
        ]
        
        for reading in test_readings:
            try:
                response = self.make_request('POST', '/readings/submit', json=reading)
                
                if response.status_code == 200:
                    submitted_reading = response.json()
                    
                    # Verify the reading structure
                    required_fields = ['id', 'sensor_type', 'value', 'timestamp', 'status', 'unit']
                    if all(field in submitted_reading for field in required_fields):
                        self.log_test(f"Submit reading - {reading['sensor_type']}", True,
                                    f"Status: {submitted_reading['status']}")
                    else:
                        self.log_test(f"Submit reading - {reading['sensor_type']}", False,
                                    "Missing required fields in response")
                else:
                    self.log_test(f"Submit reading - {reading['sensor_type']}", False,
                                f"HTTP {response.status_code}")
                    
            except Exception as e:
                self.log_test(f"Submit reading - {reading['sensor_type']}", False, str(e))
        
        # Test readings that should trigger alerts
        alert_triggering_readings = [
            {"sensor_type": "waterLevel", "value": 15.0},  # Critical low
            {"sensor_type": "temperature", "value": 35.0},  # Critical high
            {"sensor_type": "soilMoisture", "value": 20.0},  # Critical low
            {"sensor_type": "soilPH", "value": 4.0},  # Critical low
            {"sensor_type": "light", "value": 100.0}  # Critical low
        ]
        
        for reading in alert_triggering_readings:
            try:
                response = self.make_request('POST', '/readings/submit', json=reading)
                
                if response.status_code == 200:
                    submitted_reading = response.json()
                    
                    # Should be critical status
                    if submitted_reading.get('status') == 'critical':
                        self.log_test(f"Alert trigger - {reading['sensor_type']}", True,
                                    f"Critical status triggered for value {reading['value']}")
                    else:
                        self.log_test(f"Alert trigger - {reading['sensor_type']}", False,
                                    f"Expected critical, got {submitted_reading.get('status')}")
                else:
                    self.log_test(f"Alert trigger - {reading['sensor_type']}", False,
                                f"HTTP {response.status_code}")
                    
            except Exception as e:
                self.log_test(f"Alert trigger - {reading['sensor_type']}", False, str(e))
        
        # Test invalid sensor type
        try:
            invalid_reading = {"sensor_type": "invalidSensor", "value": 50.0}
            response = self.make_request('POST', '/readings/submit', json=invalid_reading)
            
            if response.status_code in [400, 422]:
                self.log_test("Submit reading - Invalid sensor type", True, 
                            "Properly rejected invalid sensor type")
            else:
                self.log_test("Submit reading - Invalid sensor type", False,
                            f"Expected 400/422, got {response.status_code}")
        except Exception as e:
            self.log_test("Submit reading - Invalid sensor type", False, str(e))
        
        # Test missing required fields
        try:
            incomplete_reading = {"sensor_type": "waterLevel"}  # Missing value
            response = self.make_request('POST', '/readings/submit', json=incomplete_reading)
            
            if response.status_code in [400, 422]:
                self.log_test("Submit reading - Missing fields", True, 
                            "Properly rejected incomplete data")
            else:
                self.log_test("Submit reading - Missing fields", False,
                            f"Expected 400/422, got {response.status_code}")
        except Exception as e:
            self.log_test("Submit reading - Missing fields", False, str(e))

    def test_alerts_system(self):
        """Test alerts system endpoints"""
        print("\n🚨 Testing Alerts System")
        
        # First, get current alerts
        try:
            response = self.make_request('GET', '/alerts')
            
            if response.status_code == 200:
                alerts = response.json()
                
                if isinstance(alerts, list):
                    self.log_test("Alerts - GET list", True, f"Retrieved {len(alerts)} alerts")
                    
                    # Store alert IDs for testing acknowledgment/dismissal
                    self.alert_ids = [alert['id'] for alert in alerts if 'id' in alert]
                    
                    # Validate alert structure
                    if alerts:
                        first_alert = alerts[0]
                        required_fields = ['id', 'type', 'sensor_type', 'message', 'timestamp', 'acknowledged']
                        if all(field in first_alert for field in required_fields):
                            self.log_test("Alerts - Structure validation", True)
                        else:
                            self.log_test("Alerts - Structure validation", False,
                                        "Missing required fields in alert")
                else:
                    self.log_test("Alerts - GET format", False, "Expected list format")
            else:
                self.log_test("Alerts - GET", False, f"HTTP {response.status_code}")
                
        except Exception as e:
            self.log_test("Alerts - GET", False, str(e))
        
        # Test alert acknowledgment
        if self.alert_ids:
            test_alert_id = self.alert_ids[0]
            try:
                response = self.make_request('POST', f'/alerts/{test_alert_id}/acknowledge')
                
                if response.status_code == 200:
                    self.log_test("Alerts - Acknowledge", True, "Alert acknowledged successfully")
                elif response.status_code == 404:
                    self.log_test("Alerts - Acknowledge", False, "Alert not found")
                else:
                    self.log_test("Alerts - Acknowledge", False, f"HTTP {response.status_code}")
                    
            except Exception as e:
                self.log_test("Alerts - Acknowledge", False, str(e))
        
        # Test alert dismissal
        if len(self.alert_ids) > 1:
            test_alert_id = self.alert_ids[1]
            try:
                response = self.make_request('DELETE', f'/alerts/{test_alert_id}')
                
                if response.status_code == 200:
                    self.log_test("Alerts - Dismiss", True, "Alert dismissed successfully")
                elif response.status_code == 404:
                    self.log_test("Alerts - Dismiss", False, "Alert not found")
                else:
                    self.log_test("Alerts - Dismiss", False, f"HTTP {response.status_code}")
                    
            except Exception as e:
                self.log_test("Alerts - Dismiss", False, str(e))
        
        # Test with invalid alert ID
        try:
            invalid_id = "invalid-alert-id-12345"
            response = self.make_request('POST', f'/alerts/{invalid_id}/acknowledge')
            
            if response.status_code == 404:
                self.log_test("Alerts - Invalid ID handling", True, 
                            "Properly handled invalid alert ID")
            else:
                self.log_test("Alerts - Invalid ID handling", False,
                            f"Expected 404, got {response.status_code}")
        except Exception as e:
            self.log_test("Alerts - Invalid ID handling", False, str(e))

    def test_health_score(self):
        """Test GET /api/health endpoint"""
        print("\n💚 Testing Health Score Endpoint")
        
        try:
            response = self.make_request('GET', '/health')
            
            if response.status_code == 200:
                health_data = response.json()
                
                if 'health_score' in health_data:
                    health_score = health_data['health_score']
                    
                    # Validate health score is between 0 and 100
                    if 0 <= health_score <= 100:
                        self.log_test("Health score - Value range", True, 
                                    f"Health score: {health_score}%")
                    else:
                        self.log_test("Health score - Value range", False,
                                    f"Invalid health score: {health_score}")
                        
                    # Validate it's a number
                    if isinstance(health_score, (int, float)):
                        self.log_test("Health score - Data type", True)
                    else:
                        self.log_test("Health score - Data type", False,
                                    f"Expected number, got {type(health_score)}")
                else:
                    self.log_test("Health score - Response structure", False,
                                "Missing health_score field")
            else:
                self.log_test("Health score - HTTP status", False, 
                            f"Expected 200, got {response.status_code}")
                
        except Exception as e:
            self.log_test("Health score - Request", False, str(e))

    def test_simulation(self):
        """Test POST /api/readings/simulate endpoint"""
        print("\n🎲 Testing Simulation Endpoint")
        
        try:
            response = self.make_request('POST', '/readings/simulate')
            
            if response.status_code == 200:
                sim_data = response.json()
                
                if 'message' in sim_data and 'readings' in sim_data:
                    readings = sim_data['readings']
                    
                    if isinstance(readings, list) and len(readings) == 5:  # Should generate 5 sensor readings
                        self.log_test("Simulation - Generate readings", True,
                                    f"Generated {len(readings)} sensor readings")
                        
                        # Validate each reading structure
                        all_valid = True
                        for reading in readings:
                            required_fields = ['id', 'sensor_type', 'value', 'status', 'unit']
                            if not all(field in reading for field in required_fields):
                                all_valid = False
                                break
                        
                        if all_valid:
                            self.log_test("Simulation - Reading structure", True)
                        else:
                            self.log_test("Simulation - Reading structure", False,
                                        "Invalid reading structure in simulated data")
                    else:
                        self.log_test("Simulation - Reading count", False,
                                    f"Expected 5 readings, got {len(readings) if isinstance(readings, list) else 'invalid'}")
                else:
                    self.log_test("Simulation - Response structure", False,
                                "Missing message or readings field")
            else:
                self.log_test("Simulation - HTTP status", False,
                            f"Expected 200, got {response.status_code}")
                
        except Exception as e:
            self.log_test("Simulation - Request", False, str(e))

    def test_edge_cases(self):
        """Test various edge cases and error conditions"""
        print("\n⚠️  Testing Edge Cases")
        
        # Test extremely high values
        extreme_readings = [
            {"sensor_type": "waterLevel", "value": 999999.0},
            {"sensor_type": "temperature", "value": -50.0},
            {"sensor_type": "soilMoisture", "value": -100.0},
            {"sensor_type": "light", "value": 0.0}
        ]
        
        for reading in extreme_readings:
            try:
                response = self.make_request('POST', '/readings/submit', json=reading)
                
                if response.status_code == 200:
                    submitted_reading = response.json()
                    # Should handle extreme values gracefully
                    self.log_test(f"Edge case - Extreme {reading['sensor_type']}", True,
                                f"Handled extreme value {reading['value']}")
                else:
                    self.log_test(f"Edge case - Extreme {reading['sensor_type']}", False,
                                f"HTTP {response.status_code}")
            except Exception as e:
                self.log_test(f"Edge case - Extreme {reading['sensor_type']}", False, str(e))
        
        # Test malformed JSON
        try:
            response = self.session.post(f"{self.base_url}/readings/submit", 
                                       data="invalid json", 
                                       headers={'Content-Type': 'application/json'})
            
            if response.status_code in [400, 422]:
                self.log_test("Edge case - Malformed JSON", True, "Properly rejected malformed JSON")
            else:
                self.log_test("Edge case - Malformed JSON", False,
                            f"Expected 400/422, got {response.status_code}")
        except Exception as e:
            self.log_test("Edge case - Malformed JSON", False, str(e))

    def run_all_tests(self):
        """Run all test suites"""
        print("🧪 Starting Plant Monitoring System Backend Tests")
        print(f"Target URL: {self.base_url}")
        print("=" * 60)
        
        # Run all test suites
        self.test_current_readings()
        self.test_historical_data()
        self.test_plant_info()
        self.test_sensor_data_submission()
        self.test_alerts_system()
        self.test_health_score()
        self.test_simulation()
        self.test_edge_cases()
        
        # Print summary
        self.print_summary()

    def print_summary(self):
        """Print test results summary"""
        print("\n" + "=" * 60)
        print("🏁 TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if result['success'])
        total = len(self.test_results)
        failed = total - passed
        
        print(f"Total Tests: {total}")
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        if failed > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  • {result['test']}")
                    if result['details']:
                        print(f"    {result['details']}")
        
        print("\n" + "=" * 60)
        
        return passed, failed, total

if __name__ == "__main__":
    tester = PlantMonitoringTester()
    tester.run_all_tests()
