"""
Backend Runner for Query Genie
This file serves as the entry point for the PyInstaller executable
"""
import uvicorn
import sys
import os

if __name__ == "__main__":
    # Get the directory where the executable is located
    if getattr(sys, 'frozen', False):
        # Running as compiled executable
        base_path = sys._MEIPASS
    else:
        # Running as script
        base_path = os.path.dirname(os.path.abspath(__file__))
    
    # Change to the backend directory
    os.chdir(base_path)
    
    # Run the FastAPI app with uvicorn
    uvicorn.run(
        "backend:app",
        host="0.0.0.0",
        port=8000,
        log_level="info",
        access_log=True
    )
