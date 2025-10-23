#!/usr/bin/env python3
"""
Test script to verify AI chatbot system data integration
"""

import requests
import json

def test_ai_chatbot_integration():
    """Test the AI chatbot with system data integration"""
    
    # Test query about BackoOy entity
    test_query = "can you tell me why the entry in the entity BackoOy is posted on January 2025?"
    
    payload = {
        "messages": [
            {
                "role": "user", 
                "content": test_query
            }
        ],
        "industry_context": "Technology & Software",
        "company_name": "Default Company",  # Replace with your actual company name
        "current_page": "data-input",
        "user_context": {
            "current_page": "data-input",
            "analyze_journals": True,
            "analyze_entities": True,
            "analyze_processes": False
        }
    }
    
    try:
        # Make request to AI chat API
        response = requests.post(
            'http://localhost:8000/api/ai-chat/query',
            json=payload,
            headers={'Content-Type': 'application/json'}
        )
        
        if response.status_code == 200:
            result = response.json()
            
            print("🤖 AI Response:")
            print("=" * 50)
            print(result.get('output', 'No output'))
            print("\n" + "=" * 50)
            
            if result.get('system_data'):
                print("\n📊 System Data Retrieved:")
                print(json.dumps(result['system_data'], indent=2))
            
            if result.get('suggestions'):
                print("\n💡 Suggestions:")
                for suggestion in result['suggestions']:
                    print(f"- {suggestion}")
                    
        else:
            print(f"❌ Error: {response.status_code}")
            print(response.text)
            
    except Exception as e:
        print(f"❌ Connection Error: {e}")
        print("Make sure your backend is running on http://localhost:8000")

if __name__ == "__main__":
    test_ai_chatbot_integration()
