#!/usr/bin/env python3

import requests
import json

def debug_database():
    print("=== Database Debug ===")
    
    base_url = "http://localhost:3000"
    
    try:
        # 1. Get all entities to see current state
        print("1. Getting all entities...")
        response = requests.get(f"{base_url}/api/axes-entity/entities?company_name=Default%20Company")
        
        if response.status_code == 200:
            data = response.json()
            entities = data.get('entities', [])
            print(f"✅ Found {len(entities)} entities:")
            for entity in entities:
                print(f"   - {entity.get('name')} (ID: {entity.get('id')}, node_id: {entity.get('node_id')})")
        else:
            print(f"❌ Failed: {response.status_code} - {response.text}")
            return
            
        # 2. Try to assign entity to node 10
        if entities:
            entity = entities[0]
            print(f"\n2. Assigning entity {entity['id']} to node 10...")
            
            response = requests.put(
                f"{base_url}/api/axes-entity/entities/{entity['id']}?company_name=Default%20Company",
                headers={"Content-Type": "application/json"},
                json={"node_id": 10}
            )
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ Assignment successful! Updated node_id: {result.get('node_id')}")
            else:
                print(f"❌ Assignment failed: {response.status_code} - {response.text}")
                return
                
        # 3. Query entities with node_id=10
        print(f"\n3. Querying entities with node_id=10...")
        response = requests.get(f"{base_url}/api/axes-entity/entities?company_name=Default%20Company&hierarchy_id=1&node_id=10")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Query successful!")
            print(f"   Raw response: {json.dumps(data, indent=2)}")
            
            assigned_entities = data.get('entities', [])
            print(f"   Found {len(assigned_entities)} entities with node_id=10")
            
            for ent in assigned_entities:
                print(f"   - {ent.get('name')} (ID: {ent.get('id')}, node_id: {ent.get('node_id')})")
        else:
            print(f"❌ Query failed: {response.status_code} - {response.text}")
            
        # 4. Get all entities again to verify the assignment persisted
        print(f"\n4. Getting all entities again to verify persistence...")
        response = requests.get(f"{base_url}/api/axes-entity/entities?company_name=Default%20Company")
        
        if response.status_code == 200:
            data = response.json()
            entities = data.get('entities', [])
            print(f"✅ Found {len(entities)} entities after assignment:")
            for entity in entities:
                print(f"   - {entity.get('name')} (ID: {entity.get('id')}, node_id: {entity.get('node_id')})")
        else:
            print(f"❌ Failed: {response.status_code} - {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    debug_database()
