from io import BytesIO
from pathlib import Path
import numpy as np

from PIL import Image
from rasterio.io import MemoryFile
from fastapi import UploadFile

from services.upload_service import validate_image_file


def compute_spectral_index(band_num: np.ndarray, band_den: np.ndarray) -> tuple[float, float, float]:
    """
    Safely computes spectral index = (band_num - band_den) / (band_num + band_den).
    Handles zero division safely and returns (mean, min, max).
    """
    b_num = band_num.astype(float)
    b_den = band_den.astype(float)

    denominator = b_num + b_den
    numerator = b_num - b_den

    valid_mask = denominator != 0
    index_map = np.zeros_like(numerator, dtype=float)
    index_map[valid_mask] = numerator[valid_mask] / denominator[valid_mask]
    index_map = np.clip(index_map, -1.0, 1.0)

    mean_val = float(np.mean(index_map))
    min_val = float(np.min(index_map))
    max_val = float(np.max(index_map))

    return round(mean_val, 4), round(min_val, 4), round(max_val, 4)


def analyze_multispectral_image(file: UploadFile) -> dict:
    """
    Inspect uploaded satellite image for genuine multispectral bands (NIR, SWIR),
    reading original raster bands via rasterio/GDAL-compatible memory processing.
    Calculates NDVI, NDWI, and NDBI where required bands are available.
    """
    validate_image_file(file)

    file_bytes = file.file.read()
    file.file.seek(0)

    filename = Path(file.filename or "satellite_scene").name
    num_channels = 0
    width = 0
    height = 0
    bands_arr = None

    # 1. Try reading with rasterio first (preserves all multi-band GeoTIFF channels)
    try:
        with MemoryFile(file_bytes) as memfile:
            with memfile.open() as src:
                width = src.width
                height = src.height
                num_channels = src.count
                read_data = src.read()  # Shape: (C, H, W)
                bands_arr = np.transpose(read_data, (1, 2, 0))  # Shape: (H, W, C)
    except Exception:
        pass

    # 2. Fall back to Pillow for standard non-GIS image formats (PNG, JPG, WebP)
    if bands_arr is None:
        img = Image.open(BytesIO(file_bytes))
        width, height = img.size
        raw_arr = np.array(img)

        if raw_arr.ndim == 2:
            num_channels = 1
            bands_arr = raw_arr[:, :, np.newaxis]
        elif raw_arr.ndim == 3:
            num_channels = raw_arr.shape[2]
            bands_arr = raw_arr
        else:
            num_channels = len(img.getbands())
            bands_arr = raw_arr

    # Determine detected band labels
    if num_channels == 1:
        detected_bands = ["Single Band (Grayscale)"]
        multispectral_capable = False
    elif num_channels == 3:
        detected_bands = ["Red", "Green", "Blue"]
        multispectral_capable = False
    elif num_channels == 4:
        detected_bands = ["Red", "Green", "Blue", "NIR"]
        multispectral_capable = True
    elif num_channels >= 5:
        detected_bands = ["Red", "Green", "Blue", "NIR", "SWIR"]
        if num_channels > 5:
            detected_bands.extend([f"Band {i+1}" for i in range(5, num_channels)])
        multispectral_capable = True
    else:
        detected_bands = [f"Band {i+1}" for i in range(num_channels)]
        multispectral_capable = num_channels >= 4

    indices = {}
    has_nir = num_channels >= 4
    has_swir = num_channels >= 5

    # 1. NDVI = (NIR - Red) / (NIR + Red)
    if has_nir:
        red_band = bands_arr[:, :, 0]
        nir_band = bands_arr[:, :, 3]
        mean_val, min_val, max_val = compute_spectral_index(nir_band, red_band)
        indices["ndvi"] = {
            "available": True,
            "mean": mean_val,
            "min": min_val,
            "max": max_val,
            "message": "NDVI successfully calculated using NIR (Band 4) and Red (Band 1)."
        }
    else:
        indices["ndvi"] = {
            "available": False,
            "mean": None,
            "min": None,
            "max": None,
            "message": "NDVI cannot be calculated. Requires a Near-Infrared (NIR) band (Band 4), which is unavailable in this image."
        }

    # 2. NDWI = (Green - NIR) / (Green + NIR)
    if has_nir:
        green_band = bands_arr[:, :, 1]
        nir_band = bands_arr[:, :, 3]
        mean_val, min_val, max_val = compute_spectral_index(green_band, nir_band)
        indices["ndwi"] = {
            "available": True,
            "mean": mean_val,
            "min": min_val,
            "max": max_val,
            "message": "NDWI successfully calculated using Green (Band 2) and NIR (Band 4)."
        }
    else:
        indices["ndwi"] = {
            "available": False,
            "mean": None,
            "min": None,
            "max": None,
            "message": "NDWI cannot be calculated. Requires a Near-Infrared (NIR) band (Band 4), which is unavailable in this image."
        }

    # 3. NDBI = (SWIR - NIR) / (SWIR + NIR)
    if has_swir:
        swir_band = bands_arr[:, :, 4]
        nir_band = bands_arr[:, :, 3]
        mean_val, min_val, max_val = compute_spectral_index(swir_band, nir_band)
        indices["ndbi"] = {
            "available": True,
            "mean": mean_val,
            "min": min_val,
            "max": max_val,
            "message": "NDBI successfully calculated using SWIR (Band 5) and NIR (Band 4)."
        }
    else:
        missing_bands = []
        if not has_nir:
            missing_bands.append("NIR")
        if not has_swir:
            missing_bands.append("SWIR")
        indices["ndbi"] = {
            "available": False,
            "mean": None,
            "min": None,
            "max": None,
            "message": f"NDBI cannot be calculated. Missing required bands: {', '.join(missing_bands)}."
        }

    if multispectral_capable:
        status = "Multispectral Bands Detected"
        explanation = f"Multispectral satellite scene analyzed with {num_channels} bands. Spectral indices calculated for available bands."
    else:
        status = f"Standard RGB Image ({num_channels} Channels)"
        explanation = "The uploaded file is a standard 3-channel RGB image (Red, Green, Blue). Genuine multispectral spectral indices (NDVI, NDWI, NDBI) require NIR and SWIR bands and cannot be calculated from standard RGB channels."

    return {
        "success": True,
        "filename": filename,
        "width": width,
        "height": height,
        "channels": num_channels,
        "detected_bands": detected_bands,
        "multispectral_capable": multispectral_capable,
        "indices": indices,
        "status": status,
        "explanation": explanation
    }
