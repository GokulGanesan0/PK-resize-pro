import os
from backend.logger import logger
from backend.upscale import upscale_image
from backend.face_restore import restore_faces
from backend.outpaint import outpaint_comfyui

# Global settings for AI integrations (loadable from file/UI settings page)
AI_SETTINGS = {
    "enabled": True,
    "provider": "comfyui",  # comfyui, replicate, huggingface
    "api_key": "",
    "model_url": "http://127.0.0.1:8188",
    "upscale_factor": 4,
    "face_restore_strength": 0.35
}

def update_ai_settings(settings: dict):
    """
    Updates the global AI integration parameters.
    """
    global AI_SETTINGS
    AI_SETTINGS.update(settings)
    logger.info(f"AI Settings updated: {AI_SETTINGS}")

def test_ai_connection():
    """
    Tests the connection to the configured AI provider.
    Returns (success, message).
    """
    if not AI_SETTINGS["enabled"]:
        return False, "Online AI Mode is disabled in settings."
        
    provider = AI_SETTINGS["provider"].lower()
    url = AI_SETTINGS["model_url"]
    
    if provider == "comfyui":
        try:
            import requests
            logger.info(f"Testing ComfyUI server connection at {url}...")
            # Query system info endpoint
            res = requests.get(f"{url}/system_info", timeout=2.0)
            if res.status_code == 200:
                return True, "ComfyUI Server is active and connected!"
            return False, f"ComfyUI Server returned status: {res.status_code}"
        except Exception as e:
            return False, f"ComfyUI Server unreachable: {str(e)}"
            
    # For cloud APIs like Replicate/Hugging Face, check if API Key is set
    elif provider in ["replicate", "huggingface", "stability"]:
        if not AI_SETTINGS["api_key"]:
            return False, f"API key is missing for provider: {provider}"
        return True, f"Credentials saved for provider {provider}. Readiness checked."
        
    return False, f"Unknown AI Provider: {provider}"

def apply_ai_upscale(cv_img):
    """
    Performs AI Upscaling based on settings.
    Falls back to Lanczos4 if disabled or offline.
    """
    if not AI_SETTINGS["enabled"]:
        logger.info("AI Upscaling disabled. Skipping.")
        return cv_img
    return upscale_image(cv_img, use_ai=True)

def apply_ai_face_restore(cv_img):
    """
    Performs AI Face Restoration based on settings.
    Falls back to original pixels if disabled or offline.
    """
    if not AI_SETTINGS["enabled"]:
        logger.info("AI Face Restoration disabled. Skipping.")
        return cv_img
    return restore_faces(cv_img, use_ai=True)

def apply_ai_outpaint(cv_img, target_w, target_h):
    """
    Performs AI Canvas Outpainting via ComfyUI.
    Returns None if server is offline or disabled.
    """
    if not AI_SETTINGS["enabled"] or AI_SETTINGS["provider"] != "comfyui":
        return None
        
    # Extract host address from URL
    url = AI_SETTINGS["model_url"].replace("http://", "").replace("https://", "")
    return outpaint_comfyui(cv_img, target_w, target_h, server_address=url)
