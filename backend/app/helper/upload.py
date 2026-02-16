from typing import Any, Coroutine

from fastapi import UploadFile, File
import shutil
from pathlib import Path

UPLOAD_DIR= Path('uploads')
UPLOAD_DIR.mkdir(exist_ok=True)


async def upload_document(file: UploadFile = File(...)) -> Path:
    file_path = UPLOAD_DIR / file.filename
    with open(file_path, 'wb') as buffer:
        shutil.copyfileobj(file.file, buffer)
    print(f"file_path {file_path}")
    return file_path