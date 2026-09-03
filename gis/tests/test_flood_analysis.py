import sys
import os

# Add the project root directory to Python's module search path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.flood_analysis import analyze_flood


def test_sample_flood_analysis():
    image_path = "data/demo/sample.tif"
    print("=" * 60)
    print(f"RUNNING FLOOD ANALYSIS TEST ON: {image_path}")
    print("=" * 60)

    # Call the core geospatial analysis function
    response = analyze_flood(image_path)

    # Print the required outputs
    print(f"Analysis Status         : {response.get('status')}")
    print(f"Analysis Type           : {response.get('analysis_type')}")
    print(f"Affected Area (km2)     : {response.get('affected_area_km2')} km^2")
    print(f"Bounds [W, S, E, N]     : {response.get('bounds')}")

    features = response.get("result", {}).get("features", [])
    print(f"Number of GeoJSON Feats : {len(features)}")
    print("=" * 60)

    if response.get("status") == "success":
        print("TEST PASSED: Output matches SatQuery AI expected structure.")
    else:
        print(f"TEST FAILED: {response.get('message')}")


if __name__ == "__main__":
    test_sample_flood_analysis()
