from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, File, HTTPException, UploadFile


router = APIRouter(prefix="/upload", tags=["Upload"])

UPLOAD_DIR = Path("uploads")
ALLOWED_EXTENSIONS = {".tif", ".tiff"}


@router.post("")
async def upload_file(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    extension = Path(file.filename).suffix.lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Only .tif and .tiff files are supported",
        )

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

    safe_filename = f"{uuid4().hex}{extension}"
    file_path = UPLOAD_DIR / safe_filename

    with file_path.open("wb") as buffer:
        while chunk := await file.read(1024 * 1024):
            buffer.write(chunk)

    return {
        "status": "success",
        "filename": safe_filename,
        "path": str(file_path),
        "original_filename": file.filename,
    }