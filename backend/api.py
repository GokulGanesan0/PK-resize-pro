import os
import sys
import threading
import subprocess
from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

# Ensure parent path is in path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.config import OUTPUT_DIR, INPUT_DIR
from backend.logger import logger
from backend.main import get_input_files
from backend.border_remove import remove_white_borders
from backend.upscale import upscale_image
from backend.face_restore import restore_faces
from backend.enhance import enhance_image
from backend.resize_export import resize_and_fit, save_png_with_300dpi
from backend.zip_export import create_zip_archive

app = FastAPI(title="Poster Resize Pro API Server")

# Allow CORS for Tauri dev server and frontend frameworks
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global status tracker
process_status = {
    "is_running": False,
    "progress": 0,
    "current_file": "",
    "processed": 0,
    "failed": 0,
    "logs": [],
    "outputs": [],
    "zip_file": None,
    "error": None
}

class ProcessRequest(BaseModel):
    input_path: str
    output_path: Optional[str] = OUTPUT_DIR
    size: Optional[str] = "A4"
    orientation: Optional[str] = "portrait"
    scale_mode: Optional[str] = "smart"
    upscale: Optional[bool] = True
    enhance: Optional[bool] = True
    face_restore: Optional[bool] = False
    zip_outputs: Optional[bool] = True

def add_server_log(msg: str):
    logger.info(msg)
    process_status["logs"].append(msg)

def async_pipeline_worker(req: ProcessRequest):
    global process_status
    process_status["is_running"] = True
    process_status["progress"] = 0
    process_status["processed"] = 0
    process_status["failed"] = 0
    process_status["logs"] = []
    process_status["outputs"] = []
    process_status["zip_file"] = None
    process_status["error"] = None
    
    add_server_log("Web Server Pipeline initiated...")
    
    try:
        input_files = get_input_files(req.input_path)
        if not input_files:
            raise ValueError(f"No valid image files found at: {req.input_path}")
            
        total_files = len(input_files)
        add_server_log(f"Found {total_files} file(s) to process.")
        
        for idx, file_path in enumerate(input_files, start=1):
            filename = os.path.basename(file_path)
            process_status["current_file"] = filename
            add_server_log(f"Processing image {idx}/{total_files}: {filename}")
            
            try:
                import cv2
                img = cv2.imread(file_path)
                if img is None:
                    raise ValueError(f"Failed to read image: {filename}")
                    
                # 1. Border remove
                img = remove_white_borders(img)
                
                # 2. AI Upscale
                if req.upscale:
                    img = upscale_image(img, use_ai=True)
                    
                # 3. Face restore
                if req.face_restore:
                    img = restore_faces(img, use_ai=True)
                    
                # 4. Enhance
                if req.enhance:
                    img = enhance_image(img)
                    
                # 5. Fit & resize
                img = resize_and_fit(
                    img,
                    size_key=req.size,
                    orientation=req.orientation,
                    scale_mode=req.scale_mode
                )
                
                # 6. Save PNG
                out_filename = f"Image_{idx:02d}.png"
                out_path = os.path.join(req.output_path, out_filename)
                
                if save_png_with_300dpi(img, out_path):
                    process_status["processed"] += 1
                    process_status["outputs"].append(out_filename)
                    add_server_log(f"Successfully processed and exported: {out_filename}")
                else:
                    raise IOError("Failed to save image file.")
                    
            except Exception as e:
                process_status["failed"] += 1
                add_server_log(f"Error processing {filename}: {str(e)}")
                
            process_status["progress"] = int((idx / total_files) * 100)
            
        # 7. Zip outputs
        if req.zip_outputs and process_status["outputs"]:
            add_server_log("Compiling zip archive...")
            zip_filename = "PosterResizePro_Output.zip"
            zip_path = os.path.join(req.output_path, zip_filename)
            output_filepaths = [os.path.join(req.output_path, f) for f in process_status["outputs"]]
            
            if create_zip_archive(output_filepaths, zip_path):
                process_status["zip_file"] = zip_filename
                add_server_log(f"ZIP package created: {zip_filename}")
            else:
                add_server_log("Failed to compile ZIP archive.")
                
        add_server_log("Web Server Pipeline execution completed!")
        
    except Exception as e:
        process_status["error"] = str(e)
        add_server_log(f"Pipeline crashed: {str(e)}")
        
    finally:
        process_status["is_running"] = False
        process_status["progress"] = 100

@app.post("/process")
def trigger_process(req: ProcessRequest, background_tasks: BackgroundTasks):
    if process_status["is_running"]:
        raise HTTPException(status_code=400, detail="A processing task is already running.")
        
    # Start process in background thread
    background_tasks.add_task(async_pipeline_worker, req)
    return {"status": "started", "message": "Pipeline triggered asynchronously in background."}

@app.get("/status")
def get_status():
    return process_status

@app.post("/open-output")
def open_output(output_path: Optional[str] = OUTPUT_DIR):
    if not os.path.exists(output_path):
        os.makedirs(output_path, exist_ok=True)
        
    try:
        if sys.platform == "win32":
            os.startfile(output_path)
        elif sys.platform == "darwin":
            subprocess.run(["open", output_path])
        else:
            subprocess.run(["xdg-open", output_path])
        return {"status": "success", "message": f"Opened output folder: {output_path}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to open output directory: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api:app", host="127.0.0.1", port=8000, reload=True)
