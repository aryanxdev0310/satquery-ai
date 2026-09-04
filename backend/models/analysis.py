from pydantic import BaseModel
from typing import List


class ImageAnalysisResponse(BaseModel):
    success: bool
    filename: str
    width: int
    height: int
    channels: int
    format: str
    file_size_bytes: int
    avg_r: float
    avg_g: float
    avg_b: float
    min_rgb: List[int]
    max_rgb: List[int]
    message: str
