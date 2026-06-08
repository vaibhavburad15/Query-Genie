"""
Backend Runner for Query Genie
This file serves as the entry point for the PyInstaller executable
"""
import uvicorn
import sys
import os

if __name__ == "__main__":
    # Get the directory where bundled data is extracted (for module imports)
    if getattr(sys, 'frozen', False):
        # Running as compiled executable
        base_path = str(getattr(sys, "_MEIPASS", os.path.dirname(os.path.abspath(sys.executable))))

        # EXE_DIR = directory containing the actual .exe file
        # This is where writable files (users.db, audit.log, etc.) should live
        exe_dir = os.path.dirname(os.path.abspath(sys.executable))
        os.environ["QUERY_GENIE_DATA_DIR"] = exe_dir
    else:
        # Running as script
        base_path = os.path.dirname(os.path.abspath(__file__))

    # Change CWD to base_path so Python can find bundled modules
    os.chdir(base_path)

    # Run the FastAPI app with uvicorn
    uvicorn.run(
        "backend:app",
        host="0.0.0.0",
        port=8000,
        log_level="info",
        access_log=True
    )
