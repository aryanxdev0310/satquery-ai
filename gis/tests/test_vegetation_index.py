import os
import sys

sys.path.insert(
    0,
    os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
)

import numpy as np

from src.vegetation_index import calculate_ndvi


def test_calculate_ndvi():
    red = np.array([[0.2, 0.6]], dtype="float64")
    nir = np.array([[0.8, 0.4]], dtype="float64")

    result = calculate_ndvi(red, nir)

    expected = np.array([[0.6, -0.2]], dtype="float64")

    np.testing.assert_allclose(result, expected)


def test_calculate_ndvi_handles_zero_denominator():
    red = np.array([[0.0]], dtype="float64")
    nir = np.array([[0.0]], dtype="float64")

    result = calculate_ndvi(red, nir)

    assert result[0, 0] == -1.0