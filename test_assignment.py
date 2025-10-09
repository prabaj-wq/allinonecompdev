#!/usr/bin/env python3

import requests
import json
import sys

def test_assignment():
    print("=== Testing Element Assignment ===")
    
    base_url = "http://localhost:3000"  # Frontend URL that proxies to backend
    
    try:
        # 1. Get current entities
        print("1. Getting current entities...")
        response = requests.get(f"{base_url}/api/axes-entity/entities?company_name=Default%20Company")
        
        if response.status_code != 200:
            print(f"❌ Failed to get entities: {response.status_code}")
            print(response.text)
            return
            
        data = response.json()
        entities = data.get('entities', [])
        
        if not entities:
            print("❌ No entities found")
            return
            
        entity = entities[0]
        print(f"✅ Found entity: {entity.get('name')} (ID: {entity.get('id')})")
        print(f"   Current node_id: {entity.get('node_id')}")
        
        # 2. Try to assign entity to node 5 (Kolkata)
        print("\n2. Assigning entity to node 5 (Kolkata)...")
        entity_id = entity['id']
        update_data = {"node_id": 5}
        
        response = requests.put(
            f"{base_url}/api/axes-entity/entities/{entity_id}?company_name=Default%20Company",
            headers={"Content-Type": "application/json"},
            json=update_data
        )
        
        if response.status_code != 200:
            print(f"❌ Assignment failed: {response.status_code}")
            print(response.text)
            return
            
        result = response.json()
        print(f"✅ Assignment successful!")
        print(f"   Updated node_id: {result.get('node_id')}")
        
        # 3. Verify by querying entities with node_id=5
        print("\n3. Querying entities with node_id=5...")
        response = requests.get(f"{base_url}/api/axes-entity/entities?company_name=Default%20Company&hierarchy_id=1&node_id=5")
        
        if response.status_code != 200:
            print(f"❌ Query failed: {response.status_code}")
            print(response.text)
            return
            
        data = response.json()
        assigned_entities = data.get('entities', [])
        
        print(f"✅ Query successful!")
        print(f"   Found {len(assigned_entities)} entities assigned to node 5")
        
        for ent in assigned_entities:
            print(f"   - {ent.get('name')} (ID: {ent.get('id')}, node_id: {ent.get('node_id')})")
            
        # 4. Check hierarchy structure
        print("\n4. Checking hierarchy structure...")
        response = requests.get(f"{base_url}/api/axes-entity/hierarchy-structure/1?company_name=Default%20Company")
        
        if response.status_code != 200:
            print(f"❌ Structure query failed: {response.status_code}")
            print(response.text)
            return
            
        structure = response.json()
        print(f"✅ Structure query successful!")
        
        # Find node 5 in the structure
        def find_node_entities(nodes, target_id):
            for node in nodes:
                if node['id'] == target_id:
                    return node.get('entities', [])
                if node.get('children'):
                    result = find_node_entities(node['children'], target_id)
                    if result is not None:
                        return result
            return None
        
        node_5_entities = find_node_entities(structure.get('nodes', []), 5)
        if node_5_entities is not None:
            print(f"   Node 5 (Kolkata) has {len(node_5_entities)} entities in structure:")
            for ent in node_5_entities:
                print(f"   - {ent.get('name')} (ID: {ent.get('id')})")
        else:
            print("   ❌ Could not find node 5 in hierarchy structure")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_assignment()
