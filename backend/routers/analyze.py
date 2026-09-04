from fastapi import APIRouter, File, UploadFile
from models.analysis import ImageAnalysisResponse
from services.image_analysis_service import analyze_rgb_image

router = APIRouter(tags=["Analysis"])


@router.post("/api/analyze", response_model=ImageAnalysisResponse)
async def analyze_image(file: UploadFile = File(...)):
    """
    Accept an uploaded RGB image file, validate file integrity,
    and return structural & RGB color band statistics.
    """
    return analyze_rgb_image(file)
