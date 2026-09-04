from pydantic import BaseModel
from typing import List, Optional, Dict


class IndexStats(BaseModel):
    available: bool
    mean: Optional[float] = None
    min: Optional[float] = None
    max: Optional[float] = None
    message: str


class MultispectralAnalysisResponse(BaseModel):
    success: bool
    filename: str
    width: int
    height: int
    channels: int
    detected_bands: List[str]
    multispectral_capable: bool
    indices: Dict[str, IndexStats]
    status: str
    explanation: str
