from fastapi import APIRouter, File, UploadFile
from models.multispectral import MultispectralAnalysisResponse
from services.multispectral_service import analyze_multispectral_image

router = APIRouter(tags=["Multispectral Analysis"])


@router.post("/api/analyze/multispectral", response_model=MultispectralAnalysisResponse)
async def analyze_multispectral(file: UploadFile = File(...)):
    """
    Analyze satellite image for genuine multispectral band capabilities
    and compute spectral indices (NDVI, NDWI, NDBI) if required bands exist.
    """
    return analyze_multispectral_image(file)
