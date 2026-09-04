from fastapi import APIRouter, File, UploadFile
from models.upload import UploadResponse
from services.upload_service import save_uploaded_image

router = APIRouter(tags=["Upload"])


@router.post("/api/upload", response_model=UploadResponse)
async def upload_image(file: UploadFile = File(...)):
    """
    Endpoint for satellite image upload.
    Validates image binary content and saves file to data/demo/uploads/.
    """
    return save_uploaded_image(file)