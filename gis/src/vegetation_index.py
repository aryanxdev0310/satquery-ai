import numpy as np


def calculate_ndvi(red: np.ndarray, nir: np.ndarray) -> np.ndarray:
    """
    Calculate the Normalized Difference Vegetation Index (NDVI).

    NDVI = (NIR - Red) / (NIR + Red)

    Returns -1.0 where the denominator is zero.
    """
    red = red.astype("float64")
    nir = nir.astype("float64")

    denominator = nir + red

    result = np.full_like(denominator, -1.0, dtype="float64")
    valid = denominator != 0
    np.divide(nir - red, denominator, out=result, where=valid)
    return result