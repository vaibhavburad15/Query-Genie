# -*- mode: python ; coding: utf-8 -*-
import sys
from PyInstaller.utils.hooks import copy_metadata

sys.setrecursionlimit(sys.getrecursionlimit() * 5)

datas = [('backend.py', '.'), ('sql_system_prompt.py', '.'), ('extended_models.py', '.'), ('.env', '.')]
binaries = []
hiddenimports = [
    'fastapi',
    'fastapi.middleware.cors',
    'uvicorn',
    'uvicorn.logging',
    'uvicorn.loops',
    'uvicorn.loops.auto',
    'uvicorn.protocols',
    'uvicorn.protocols.http',
    'uvicorn.protocols.http.auto',
    'uvicorn.protocols.websockets',
    'uvicorn.protocols.websockets.auto',
    'uvicorn.lifespan',
    'uvicorn.lifespan.on',
    'sqlalchemy',
    'sqlalchemy.ext.declarative',
    'sqlalchemy.dialects.mysql.mysqlconnector',
    'sqlalchemy.dialects.postgresql.psycopg2',
    'sqlalchemy.dialects.oracle.oracledb',
    'sqlalchemy.dialects.mssql.pyodbc',
    'ibm_db',
    'ibm_db_sa',
    'ibm_db_sa.ibm_db',
    'langchain_community.utilities',
    'langchain_community.utilities.sql_database',
    'langchain_groq',
    'langchain_groq.chat_models',
    'langchain_core.messages',
    'mysql.connector',
    'psycopg2',
    'oracledb',
    'pyodbc',
    'pymongo',
    'redis',
    'requests',
    'dotenv',
    'email_validator',
    'slowapi',
    'slowapi.util',
    'slowapi.middleware',
    'starlette',
    'starlette.middleware',
    'starlette.middleware.base',
    'passlib',
    'passlib.context',
    'passlib.handlers.bcrypt',
    'bcrypt',
    'openpyxl',
    'multipart',
    'python_multipart',
    'pydantic',
    'pydantic.deprecated.decorator',
]

for package_name in ('langchain-community', 'langchain-groq', 'langchain-core', 'fastapi', 'uvicorn', 'pydantic'):
    datas += copy_metadata(package_name)

excludes = [
    'IPython',
    'matplotlib',
    'notebook',
    'pandas',
    'scipy',
    'sklearn',
    'tensorboard',
    'tensorflow',
    'torch',
    'torchvision',
    'transformers',
]


a = Analysis(
    ['backend_runner.py'],
    pathex=[],
    binaries=binaries,
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=excludes,
    noarchive=False,
    optimize=0,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name='query-genie-backend',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
