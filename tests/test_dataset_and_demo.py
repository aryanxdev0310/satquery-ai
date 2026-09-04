import os
import sys
from pathlib import Path
import pytest

# Ensure root directory is in sys.path
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))
if str(ROOT_DIR / 'gis') not in sys.path:
    sys.path.insert(0, str(ROOT_DIR / 'gis'))

from backend.ai.query_router import route_query
from src.flood_analysis import analyze_flood


class TestDatasetIntegrity:
    def test_sample_geotiff_exists_and_valid(self):
        sample_path = ROOT_DIR / 'data' / 'demo' / 'sample.tif'
        assert sample_path.exists(), f'Missing {sample_path}'

        import rasterio
        with rasterio.open(str(sample_path)) as src:
            assert src.count == 13, f'Expected 13 bands, got {src.count}'
            assert src.crs is not None, 'Image must have valid CRS'
            assert src.width > 0 and src.height > 0
            assert 'B3' in src.descriptions
            assert 'B8' in src.descriptions
            assert 'B11' in src.descriptions

    def test_normal_rgb_image_handled_gracefully(self):
        rgb_path = ROOT_DIR / 'data' / 'demo_rgb.png'
        if rgb_path.exists():
            result = analyze_flood(str(rgb_path))
            assert result['status'] == 'error'
            assert result['analysis_type'] == 'flood_detection'
            assert 'CRS' in result['message']
            assert result['affected_area_km2'] == 0.0
            assert result['result']['features'] == []


class TestEndToEndPipeline:
    def test_query_to_flood_detection_pipeline(self):
        # 1. Natural language query from user
        user_query = 'Which areas are flooded in this satellite image?'
        query_result = route_query(user_query)

        assert query_result['analysis_type'] == 'flood_detection'
        assert query_result['confidence'] >= 0.8

        # 2. Geospatial Flood Analysis on demo dataset
        sample_path = ROOT_DIR / 'data' / 'demo' / 'sample.tif'
        flood_result = analyze_flood(str(sample_path))

        assert flood_result['status'] == 'success'
        assert flood_result['analysis_type'] == 'flood_detection'
        assert flood_result['affected_area_km2'] > 0
        assert len(flood_result['bounds']) == 4

        geojson = flood_result['result']
        assert geojson['type'] == 'FeatureCollection'
        assert len(geojson['features']) > 0

    def test_non_flood_query_routing(self):
        query_result = route_query('Show vegetation health index')
        assert query_result['analysis_type'] == 'ndvi'

        query_result_unknown = route_query('What is the capital of France?')
        assert query_result_unknown['analysis_type'] == 'unknown'
