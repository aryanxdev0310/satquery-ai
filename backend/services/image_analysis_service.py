from io import BytesIO
from pathlib import Path
import numpy as np
from PIL import Image
from rasterio.io import MemoryFile
from fastapi import HTTPException, UploadFile
from services.upload_service import validate_image_file


def analyze_rgb_image(file: UploadFile) -> dict:
    """
    Validate image file, read RGB band data via rasterio (for multi-band GeoTIFFs)
    or Pillow (for standard PNG/JPG), and compute RGB image statistics.
    Returns structured analysis dictionary.
    """
    try:
        # 1. Validate image format and content integrity
        validate_image_file(file)

        # 2. Read bytes and determine file size
        file_bytes = file.file.read()
        file.file.seek(0)
        file_size_bytes = len(file_bytes)

        filename = Path(file.filename or "uploaded_image").name
        width = 0
        height = 0
        channels = 0
        format_name = "UNKNOWN"
        r_band = None
        g_band = None
        b_band = None

        # 3. Try rasterio first (handles 5-band GeoTIFFs, 4-band rasters, multiband GIS files)
        try:
            with MemoryFile(file_bytes) as memfile:
                with memfile.open() as src:
                    width = src.width
                    height = src.height
                    channels = src.count
                    format_name = src.driver or "GeoTIFF"
                    read_data = src.read()  # Shape: (C, H, W)

                    if channels >= 3:
                        r_band = read_data[0]
                        g_band = read_data[1]
                        b_band = read_data[2]
                    elif channels == 1:
                        r_band = read_data[0]
                        g_band = read_data[0]
                        b_band = read_data[0]
                    else:
                        r_band = read_data[0]
                        g_band = read_data[0]
                        b_band = read_data[0]
        except Exception:
            pass

        # 4. Fall back to Pillow for standard non-GIS images (PNG, JPEG, WebP)
        if r_band is None:
            img = Image.open(BytesIO(file_bytes))
            width, height = img.size
            format_name = img.format or Path(filename).suffix.lstrip(".").upper() or "UNKNOWN"
            channels = len(img.getbands())

            rgb_img = img.convert("RGB")
            np_arr = np.array(rgb_img)

            r_band = np_arr[:, :, 0]
            g_band = np_arr[:, :, 1]
            b_band = np_arr[:, :, 2]

        avg_r = float(np.mean(r_band))
        avg_g = float(np.mean(g_band))
        avg_b = float(np.mean(b_band))

        min_r = int(np.min(r_band))
        min_g = int(np.min(g_band))
        min_b = int(np.min(b_band))

        max_r = int(np.max(r_band))
        max_g = int(np.max(g_band))
        max_b = int(np.max(b_band))

        return {
            "success": True,
            "filename": filename,
            "width": width,
            "height": height,
            "channels": channels,
            "format": format_name,
            "file_size_bytes": file_size_bytes,
            "avg_r": round(avg_r, 2),
            "avg_g": round(avg_g, 2),
            "avg_b": round(avg_b, 2),
            "min_rgb": [min_r, min_g, min_b],
            "max_rgb": [max_r, max_g, max_b],
            "message": f"Successfully analyzed RGB image statistics for '{filename}'."
        }
    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to process RGB analysis for image '{file.filename}': {str(exc)}"
        )
