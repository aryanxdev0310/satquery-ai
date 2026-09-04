from pydantic import BaseModel
from typing import Optional


class UploadResponse(BaseModel):
    success: bool
    filename: str
    file_path: str
    identifier: str
    message: str
    file_size_bytes: Optional[int] = None
