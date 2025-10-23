#!/usr/bin/env python3
"""
Test the specific BackoOy cash entry question with enhanced AI integration
"""

import requests
import json

def test_backooy_cash_question():
    """Test the AI with the specific BackoOy cash entry question"""
    
    # Your exact question
    test_query = "hey can you tell me what is the reason the entry in the account cash is posted in the backooy entity in the period january 2025?"
    
    payload = {
        "messages": [
            {
                "role": "user", 
                "content": test_query
            }
        ],
        "industry_context": "Technology & Software",
        "company_name": "FinFusion",  # Your actual company name from logs
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
            
            print("🤖 Enhanced AI Response for BackoOy Cash Entry:")
            print("=" * 60)
            print(result.get('output', 'No output'))
            print("\n" + "=" * 60)
            
            if result.get('system_data'):
                print("\n📊 System Data Retrieved:")
                system_data = result['system_data']
                
                if system_data.get('recent_entries'):
                    print(f"\n✅ Found {len(system_data['recent_entries'])} entries from table: {system_data.get('table_used')}")
                    
                    # Show the BackoOy entry specifically
                    for entry in system_data['recent_entries']:
                        if 'BACKO' in str(entry.get('entity_code', '')) or 'BackoOy' in str(entry.get('entity_name', '')):
                            print(f"\n🎯 BackoOy Entry Found:")
                            print(f"   Entity: {entry.get('entity_name')} ({entry.get('entity_code')})")
                            print(f"   Account: {entry.get('account_name')} ({entry.get('account_code')})")
                            print(f"   Amount: {entry.get('amount')} {entry.get('currency')}")
                            print(f"   Period: {entry.get('period_name')}")
                            print(f"   Date: {entry.get('transaction_date')}")
                            print(f"   Description: {entry.get('description')}")
                            break
            
            if result.get('suggestions'):
                print("\n💡 AI Suggestions:")
                for suggestion in result['suggestions']:
                    print(f"- {suggestion}")
                    
        else:
            print(f"❌ Error: {response.status_code}")
            print(response.text)
            
    except Exception as e:
        print(f"❌ Connection Error: {e}")
        print("Make sure your backend is running and try the chatbot in the UI")

if __name__ == "__main__":
    test_backooy_cash_question()
