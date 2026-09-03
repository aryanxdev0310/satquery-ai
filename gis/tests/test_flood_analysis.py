import os
import sys

sys.path.insert(
    0,
    os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
)

from src.flood_analysis import analyze_flood


def test_sample_flood_analysis():
    image_path = "gis/data/demo/sample.tif"

    response = analyze_flood(image_path)

    assert isinstance(response, dict)

    assert response["status"] == "success"
    assert response["analysis_type"] == "flood_detection"

    assert isinstance(response["affected_area_km2"], (int, float))
    assert response["affected_area_km2"] >= 0

    bounds = response["bounds"]
    assert isinstance(bounds, list)
    assert len(bounds) == 4

    west, south, east, north = bounds
    assert west < east
    assert south < north

    result = response["result"]
    assert result["type"] == "FeatureCollection"

    features = result["features"]
    assert isinstance(features, list)

    for feature in features:
        assert feature["type"] == "Feature"
        assert "geometry" in feature
        assert "properties" in feature

def test_missing_file_returns_error():
    response = analyze_flood("data/demo/does_not_exist.tif")

    assert response["status"] == "error"
    assert response["analysis_type"] == "flood_detection"
    assert response["affected_area_km2"] == 0.0
    assert response["bounds"] is None
    assert response["result"]["features"] == []

def test_missing_crs_returns_error(tmp_path):
    import rasterio
    from rasterio.transform import from_origin
    import numpy as np

    image_path = tmp_path / "no_crs.tif"

    profile = {
        "driver": "GTiff",
        "height": 10,
        "width": 10,
        "count": 13,
        "dtype": "int16",
        "transform": from_origin(0, 10, 1, 1),
    }

    with rasterio.open(image_path, "w", **profile) as dst:
        data = np.ones((10, 10), dtype="int16")

        for band_number in range(1, 14):
            dst.write(data, band_number)

    response = analyze_flood(str(image_path))

    assert response["status"] == "error"
    assert response["analysis_type"] == "flood_detection"
    assert response["affected_area_km2"] == 0.0
    assert response["bounds"] is None
    assert response["result"]["features"] == []

def test_missing_required_bands_returns_error(tmp_path):
    import rasterio
    from rasterio.transform import from_origin
    import numpy as np

    image_path = tmp_path / "missing_bands.tif"

    profile = {
        "driver": "GTiff",
        "height": 10,
        "width": 10,
        "count": 2,
        "dtype": "int16",
        "crs": "EPSG:4326",
        "transform": from_origin(0, 10, 1, 1),
    }

    with rasterio.open(image_path, "w", **profile) as dst:
        data = np.ones((10, 10), dtype="int16")
        dst.write(data, 1)
        dst.write(data, 2)

    response = analyze_flood(str(image_path))

    assert response["status"] == "error"
    assert response["analysis_type"] == "flood_detection"
    assert response["affected_area_km2"] == 0.0
    assert response["bounds"] is None
    assert response["result"]["features"] == []