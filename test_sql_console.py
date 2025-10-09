"""
Quick test script for SQL Query Console API endpoints
Run this after starting the backend server
"""

import requests
import json

BASE_URL = "http://localhost:8000"

# You'll need to get a real JWT token from login
# For now, this is a placeholder
JWT_TOKEN = "YOUR_JWT_TOKEN_HERE"

headers = {
    "Authorization": f"Bearer {JWT_TOKEN}",
    "Content-Type": "application/json"
}

def test_get_tables():
    """Test the /api/sql/tables endpoint"""
    print("\n🧪 Testing GET /api/sql/tables...")
    try:
        response = requests.get(f"{BASE_URL}/api/sql/tables", headers=headers)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Success! Found {len(data['data'])} tables")
            if data['data']:
                print(f"   First table: {data['data'][0]['table_name']}")
        else:
            print(f"❌ Failed with status {response.status_code}")
            print(f"   Response: {response.text}")
    except Exception as e:
        print(f"❌ Error: {str(e)}")

def test_execute_query():
    """Test the /api/sql/execute endpoint"""
    print("\n🧪 Testing POST /api/sql/execute...")
    try:
        payload = {
            "query": "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' LIMIT 5",
            "page": 1,
            "page_size": 50
        }
        response = requests.post(f"{BASE_URL}/api/sql/execute", 
                                headers=headers, 
                                json=payload)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Success! Query returned {len(data['data']['rows'])} rows")
            print(f"   Execution time: {data['data']['execution_time']:.3f}s")
        else:
            print(f"❌ Failed with status {response.status_code}")
            print(f"   Response: {response.text}")
    except Exception as e:
        print(f"❌ Error: {str(e)}")

def test_forbidden_query():
    """Test that forbidden queries are blocked"""
    print("\n🧪 Testing forbidden query (should fail)...")
    try:
        payload = {
            "query": "DELETE FROM users WHERE id = 1",  # Should be blocked
            "page": 1,
            "page_size": 50
        }
        response = requests.post(f"{BASE_URL}/api/sql/execute", 
                                headers=headers, 
                                json=payload)
        if response.status_code == 400:
            print(f"✅ Success! Forbidden query blocked as expected")
            print(f"   Error: {response.json().get('detail', 'No detail')}")
        else:
            print(f"⚠️ Warning: Expected 400 but got {response.status_code}")
    except Exception as e:
        print(f"❌ Error: {str(e)}")

def test_saved_queries():
    """Test the /api/sql/saved-queries endpoint"""
    print("\n🧪 Testing GET /api/sql/saved-queries...")
    try:
        response = requests.get(f"{BASE_URL}/api/sql/saved-queries", headers=headers)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Success! Found {len(data['data'])} saved queries")
            if data['data']:
                print(f"   First query: {data['data'][0]['name']}")
        else:
            print(f"❌ Failed with status {response.status_code}")
            print(f"   Response: {response.text}")
    except Exception as e:
        print(f"❌ Error: {str(e)}")

def main():
    print("=" * 60)
    print("SQL Query Console - API Endpoint Tests")
    print("=" * 60)
    
    if JWT_TOKEN == "YOUR_JWT_TOKEN_HERE":
        print("\n⚠️  WARNING: You need to set a real JWT token!")
        print("   1. Login to the application")
        print("   2. Get the JWT token from browser DevTools")
        print("   3. Replace JWT_TOKEN in this script")
        print("\n   Continuing with placeholder token (will likely fail)...\n")
    
    # Run tests
    test_get_tables()
    test_execute_query()
    test_forbidden_query()
    test_saved_queries()
    
    print("\n" + "=" * 60)
    print("Tests completed!")
    print("=" * 60)

if __name__ == "__main__":
    main()
