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
from backend.utils import get_input_files
from backend.batch_process import run_batch_pipeline

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
    
    def progress_tracker(percent, filename):
        process_status["progress"] = percent
        process_status["current_file"] = filename
        add_server_log(f"Processed image: {filename} ({percent}%)")

    try:
        res = run_batch_pipeline(
            input_source=req.input_path,
            output_dir=req.output_path,
            size_key=req.size,
            orientation=req.orientation,
            scale_mode=req.scale_mode,
            upscale=req.upscale,
            enhance=req.enhance,
            face_restore=req.face_restore,
            zip_outputs=req.zip_outputs,
            progress_callback=progress_tracker
        )
        
        process_status["processed"] = res["processed"]
        process_status["failed"] = res["failed"]
        process_status["outputs"] = res["outputs"]
        process_status["zip_file"] = res["zip"]
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
