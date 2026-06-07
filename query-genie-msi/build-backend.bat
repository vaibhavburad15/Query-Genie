@echo off
echo ========================================
echo Building Query Genie Backend
echo ========================================

cd ..\backend

echo.
echo [1/4] Installing Python dependencies...
pip install -r requirements.txt

echo.
echo [2/4] Building backend with PyInstaller...
pyinstaller --clean ^
    --onefile ^
    --name query-genie-backend ^
    --add-data "sql_system_prompt.py;." ^
    --add-data "extended_models.py;." ^
    --add-data ".env;." ^
    --hidden-import "fastapi" ^
    --hidden-import "uvicorn" ^
    --hidden-import "uvicorn.logging" ^
    --hidden-import "uvicorn.loops" ^
    --hidden-import "uvicorn.loops.auto" ^
    --hidden-import "uvicorn.protocols" ^
    --hidden-import "uvicorn.protocols.http" ^
    --hidden-import "uvicorn.protocols.http.auto" ^
    --hidden-import "uvicorn.protocols.websockets" ^
    --hidden-import "uvicorn.protocols.websockets.auto" ^
    --hidden-import "uvicorn.lifespan" ^
    --hidden-import "uvicorn.lifespan.on" ^
    --hidden-import "sqlalchemy" ^
    --hidden-import "sqlalchemy.ext.declarative" ^
    --hidden-import "langchain" ^
    --hidden-import "langchain_groq" ^
    --hidden-import "langchain_community" ^
    --hidden-import "mysql.connector" ^
    --hidden-import "psycopg2" ^
    --hidden-import "oracledb" ^
    --hidden-import "pyodbc" ^
    --hidden-import "pymongo" ^
    --hidden-import "redis" ^
    --hidden-import "requests" ^
    --collect-all "langchain" ^
    --collect-all "langchain_community" ^
    --collect-all "langchain_groq" ^
    --collect-all "fastapi" ^
    --collect-all "uvicorn" ^
    --noconfirm ^
    backend_runner.py

if errorlevel 1 (
    echo.
    echo ERROR: PyInstaller build failed!
    pause
    exit /b 1
)

echo.
echo [3/4] Copying backend executable to Electron resources...
if not exist "..\query-genie-msi\resources\backend" mkdir "..\query-genie-msi\resources\backend"
copy /Y "dist\query-genie-backend.exe" "..\query-genie-msi\resources\backend\"

echo.
echo [4/4] Copying database and additional files...
copy /Y "users.db" "..\query-genie-msi\resources\backend\" 2>nul || echo users.db not found, will be created on first run
copy /Y ".env" "..\query-genie-msi\resources\backend\"

if not exist "..\query-genie-msi\resources\backend\imported_sources" mkdir "..\query-genie-msi\resources\backend\imported_sources"

echo.
echo ========================================
echo Backend build complete!
echo ========================================
echo Output: query-genie-msi\resources\backend\query-genie-backend.exe
echo ========================================

cd ..\query-genie-msi
