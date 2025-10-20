from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
import cv2
import mediapipe as mp
import autopy
import numpy as np
import threading
import time
import io
import base64
from typing import Dict, Any
import json
import subprocess
import sys
import os

router = APIRouter(prefix="/api/airmouse", tags=["airmouse"])

# Global variables for air mouse control
airmouse_process = None
airmouse_active = False
cap = None
hands = None
mp_hands = None
mp_draw = None

class AirMouseController:
    def __init__(self):
        self.active = False
        self.cap = None
        self.hands = None
        self.mp_hands = None
        self.mp_draw = None
        self.prev_x = 0
        self.prev_y = 0
        self.smooth_factor = 0.2
        
    def initialize(self):
        """Initialize MediaPipe and camera"""
        try:
            # Initialize MediaPipe Hand module
            self.mp_hands = mp.solutions.hands
            self.hands = self.mp_hands.Hands(
                static_image_mode=False,
                max_num_hands=1,
                min_detection_confidence=0.7,
                min_tracking_confidence=0.5
            )
            self.mp_draw = mp.solutions.drawing_utils
            
            # Initialize camera
            self.cap = cv2.VideoCapture(0)
            if not self.cap.isOpened():
                raise Exception("Could not open camera")
                
            # Set camera properties for better performance
            self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
            self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
            self.cap.set(cv2.CAP_PROP_FPS, 30)
            
            return True
        except Exception as e:
            print(f"Failed to initialize air mouse: {e}")
            return False
    
    def process_frame(self):
        """Process a single frame and return the processed image"""
        if not self.cap or not self.cap.isOpened():
            return None
            
        success, img = self.cap.read()
        if not success:
            return None
            
        # Mirror the image
        img = cv2.flip(img, 1)
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        results = self.hands.process(img_rgb)
        
        # Draw hand landmarks and process gestures
        if results.multi_hand_landmarks:
            for hand_landmarks in results.multi_hand_landmarks:
                # Draw landmarks
                self.mp_draw.draw_landmarks(
                    img, hand_landmarks, self.mp_hands.HAND_CONNECTIONS
                )
                
                if self.active:
                    # Get coordinates of the index finger tip
                    x, y = hand_landmarks.landmark[8].x, hand_landmarks.landmark[8].y
                    screen_x, screen_y = autopy.screen.size()
                    
                    # Map coordinates to screen
                    screen_x = min(max(screen_x * x, 0), screen_x - 1)
                    screen_y = min(max(screen_y * y, 0), screen_y - 1)
                    
                    # Smooth the mouse movement
                    smooth_x = self.prev_x + (screen_x - self.prev_x) * self.smooth_factor
                    smooth_y = self.prev_y + (screen_y - self.prev_y) * self.smooth_factor
                    
                    try:
                        autopy.mouse.move(smooth_x, smooth_y)
                    except:
                        pass  # Ignore mouse movement errors
                    
                    # Update previous coordinates
                    self.prev_x, self.prev_y = smooth_x, smooth_y
                    
                    # Get coordinates for click detection
                    thumb_x, thumb_y = hand_landmarks.landmark[4].x, hand_landmarks.landmark[4].y
                    middle_x, middle_y = hand_landmarks.landmark[12].x, hand_landmarks.landmark[12].y
                    
                    # Calculate distances for click detection
                    distance_index_thumb = ((x - thumb_x) ** 2 + (y - thumb_y) ** 2) ** 0.5
                    distance_middle_thumb = ((middle_x - thumb_x) ** 2 + (middle_y - thumb_y) ** 2) ** 0.5
                    
                    # Click threshold
                    click_threshold = 0.05
                    
                    # Perform clicks
                    try:
                        if distance_index_thumb < click_threshold:
                            autopy.mouse.click(autopy.mouse.Button.LEFT)
                        if distance_middle_thumb < click_threshold:
                            autopy.mouse.click(autopy.mouse.Button.RIGHT)
                    except:
                        pass  # Ignore click errors
        
        # Add status indicator
        status_color = (0, 255, 0) if self.active else (128, 128, 128)
        status_text = "HANDS FREE: ON" if self.active else "HANDS FREE: OFF"
        cv2.putText(img, status_text, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, status_color, 2)
        
        return img
    
    def start(self):
        """Start air mouse control"""
        self.active = True
        
    def stop(self):
        """Stop air mouse control"""
        self.active = False
        
    def cleanup(self):
        """Clean up resources"""
        self.active = False
        if self.cap:
            self.cap.release()
        self.cap = None

# Global controller instance
controller = AirMouseController()

def generate_frames():
    """Generate video frames for streaming"""
    while True:
        if not controller.cap:
            time.sleep(0.1)
            continue
            
        frame = controller.process_frame()
        if frame is None:
            time.sleep(0.1)
            continue
            
        # Encode frame as JPEG
        ret, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
        if not ret:
            continue
            
        frame_bytes = buffer.tobytes()
        
        # Yield frame in multipart format
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

@router.post("/start")
async def start_airmouse():
    """Start the air mouse functionality"""
    global controller
    
    try:
        if not controller.cap:
            if not controller.initialize():
                raise HTTPException(status_code=500, detail="Failed to initialize camera")
        
        controller.start()
        return {"status": "success", "message": "Air mouse started", "active": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start air mouse: {str(e)}")

@router.post("/stop")
async def stop_airmouse():
    """Stop the air mouse functionality"""
    global controller
    
    try:
        controller.stop()
        return {"status": "success", "message": "Air mouse stopped", "active": False}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to stop air mouse: {str(e)}")

@router.get("/status")
async def get_airmouse_status():
    """Get current air mouse status"""
    return {
        "active": controller.active,
        "camera_initialized": controller.cap is not None and controller.cap.isOpened() if controller.cap else False
    }

@router.get("/stream")
async def video_stream():
    """Stream video feed from camera"""
    if not controller.cap:
        if not controller.initialize():
            raise HTTPException(status_code=500, detail="Failed to initialize camera")
    
    return StreamingResponse(
        generate_frames(),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )

@router.post("/toggle")
async def toggle_airmouse():
    """Toggle air mouse on/off"""
    global controller
    
    try:
        if controller.active:
            controller.stop()
            return {"status": "success", "message": "Air mouse stopped", "active": False}
        else:
            if not controller.cap:
                if not controller.initialize():
                    raise HTTPException(status_code=500, detail="Failed to initialize camera")
            controller.start()
            return {"status": "success", "message": "Air mouse started", "active": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to toggle air mouse: {str(e)}")

@router.post("/cleanup")
async def cleanup_airmouse():
    """Clean up air mouse resources"""
    global controller
    
    try:
        controller.cleanup()
        return {"status": "success", "message": "Air mouse cleaned up"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to cleanup air mouse: {str(e)}")
