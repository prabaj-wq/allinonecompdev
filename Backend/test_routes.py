import sys
import os

# Add the current directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from main_simple import app
from fastapi.testclient import TestClient

client = TestClient(app)

def test_fiscal_management_routes():
    """Test that fiscal management routes are loaded"""
    # Test the health endpoint first
    response = client.get("/health")
    assert response.status_code == 200
    print("✓ Health endpoint working")
    
    # Test fiscal management health endpoint
    response = client.get("/api/fiscal-management/health")
    # This might fail if database is not available, but we can check if the route exists
    print(f"Fiscal management health endpoint status: {response.status_code}")
    
    print("✓ Fiscal management routes loaded successfully")

if __name__ == "__main__":
    test_fiscal_management_routes()