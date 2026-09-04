import shutil
from io import BytesIO
from pathlib import Path
from PIL import Image
from rasterio.io import MemoryFile
from fastapi import HTTPException, UploadFile

# Base directory resolution
BACKEND_DIR = Path(__file__).resolve().parent.parent
PROJECT_ROOT = BACKEND_DIR.parent

# Save uploaded demo images inside data/demo/uploads/
UPLOAD_DIR = PROJECT_ROOT / "data" / "demo" / "uploads"

ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".tif", ".tiff", ".webp", ".jp2", ".bmp"}


def validate_image_file(file: UploadFile) -> None:
    """
    Validate that the uploaded file has an image extension
    and contains valid raster or image binary data.
    Supports standard image formats as well as multi-band GeoTIFF rasters.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="Uploaded file must have a valid filename.")

    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file extension '{ext}'. Allowed image extensions: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )

    file_bytes = file.file.read()
    file.file.seek(0)

    # 1. Try rasterio first (handles multi-band GeoTIFF / GIS rasters)
    try:
        with MemoryFile(file_bytes) as mem:
            with mem.open() as src:
                if src.count >= 1 and src.width > 0 and src.height > 0:
                    return
    except Exception:
        pass

    # 2. Fall back to Pillow for standard images
    try:
        image = Image.open(BytesIO(file_bytes))
        image.verify()
        file.file.seek(0)
    except Exception:
        file.file.seek(0)
        raise HTTPException(
            status_code=400,
            detail="File validation failed. Uploaded file is corrupted or not a valid image."
        )


def save_uploaded_image(file: UploadFile) -> dict:
    """
    Validate image file, save it to data/demo/uploads/,
    and return upload status metadata.
    """
    validate_image_file(file)

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

    filename = Path(file.filename).name
    destination_path = UPLOAD_DIR / filename

    with destination_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_size = destination_path.stat().st_size

    try:
        relative_path = str(destination_path.relative_to(PROJECT_ROOT)).replace("\\", "/")
    except ValueError:
        relative_path = str(destination_path).replace("\\", "/")

    return {
        "success": True,
        "filename": filename,
        "file_path": relative_path,
        "identifier": filename,
        "message": f"Successfully uploaded image '{filename}'.",
        "file_size_bytes": file_size
    }
