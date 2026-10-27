import shutil
import uuid
from pathlib import Path

from fastapi import UploadFile, HTTPException, status

from app.config.setting import MAX_UPLOAD_MB
from app.helper.RagPipeline import SUPPORTED_EXTENSIONS

UPLOAD_DIR= Path('uploads')
UPLOAD_DIR.mkdir(exist_ok=True)


async def upload_document(file: UploadFile) -> Path:
    original_name = Path(file.filename or '').name
    ext = Path(original_name).suffix.lower()
    if ext not in SUPPORTED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported file type '{ext}'. Supported: {', '.join(sorted(SUPPORTED_EXTENSIONS))}"
        )

    if file.size is not None and file.size > MAX_UPLOAD_MB * 1024 * 1024:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                            detail=f"File is larger than {MAX_UPLOAD_MB}MB")

    # unique name so concurrent uploads of the same file name never overwrite each other
    file_path = UPLOAD_DIR / f"{uuid.uuid4().hex}{ext}"
    with open(file_path, 'wb') as buffer:
        shutil.copyfileobj(file.file, buffer)
    return file_path
