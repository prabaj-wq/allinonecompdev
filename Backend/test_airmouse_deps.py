#!/usr/bin/env python3
"""
Test script to verify air mouse dependencies are working
"""

def test_imports():
    """Test all required imports for air mouse functionality"""
    try:
        print("Testing imports...")
        
        # Test OpenCV
        import cv2
        print("✅ OpenCV imported successfully")
        
        # Test MediaPipe
        import mediapipe as mp
        print("✅ MediaPipe imported successfully")
        
        # Test pynput
        from pynput import mouse
        from pynput.mouse import Button
        print("✅ pynput imported successfully")
        
        # Test numpy
        import numpy as np
        print("✅ NumPy imported successfully")
        
        # Test basic functionality
        mp_hands = mp.solutions.hands
        hands = mp_hands.Hands(
            static_image_mode=False,
            max_num_hands=1,
            min_detection_confidence=0.7,
            min_tracking_confidence=0.5
        )
        print("✅ MediaPipe Hands initialized successfully")
        
        mouse_controller = mouse.Controller()
        print("✅ pynput mouse controller initialized successfully")
        
        print("\n🎉 All dependencies are working correctly!")
        return True
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    success = test_imports()
    exit(0 if success else 1)
