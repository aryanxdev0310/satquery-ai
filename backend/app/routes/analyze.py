from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.services.analysis_service import analyze_image


router = APIRouter(prefix="/analyze", tags=["Analyze"])

UPLOAD_DIR = Path("uploads")
ALLOWED_EXTENSIONS = {".tif", ".tiff"}


@router.post("")
async def analyze_file(
    file: UploadFile = File(...),
    query: str = Form(...),
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    if not query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")

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

    try:
        result = analyze_image(str(file_path), query)
        return result

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Analysis failed: {str(exc)}",
        )