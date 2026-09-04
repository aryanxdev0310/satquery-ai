# SatQuery AI - Demo Runner
# Role: Member 6 (Dataset + Testing + Demo)

import sys
import json
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))
if str(ROOT_DIR / "gis") not in sys.path:
    sys.path.insert(0, str(ROOT_DIR / "gis"))

from backend.ai.query_router import route_query
from src.flood_analysis import analyze_flood


def main():
    print("=" * 70)
    print("       SATQUERY AI - DEMO RUNNER (DATASET + TESTING + DEMO)")
    print("=" * 70)

    # -------------------------------------------------------------
    # Step 1: AI Natural Language Query Classification
    # -------------------------------------------------------------
    query = "Which areas are flooded in this satellite image?"
    print("\n[1] AI Natural Language Query Router:")
    print(f'    User Query       : "{query}"')
    q_res = route_query(query)
    print(f'    Target Analysis  : {q_res["analysis_type"]}')
    print(f'    Confidence Score : {q_res["confidence"] * 100:.1f}%')

    # -------------------------------------------------------------
    # Step 2: Dataset Verification (Sentinel-2 GeoTIFF)
    # -------------------------------------------------------------
    sample_file = ROOT_DIR / "data" / "demo" / "sample.tif"
    if not sample_file.exists():
        sample_file = ROOT_DIR / "gis" / "data" / "demo" / "sample.tif"

    print("\n[2] Satellite Demo Dataset Verification:")
    print(f"    Dataset Path     : {sample_file}")

    import rasterio
    with rasterio.open(str(sample_file)) as src:
        print(f"    Format & Size    : GeoTIFF ({src.width} x {src.height} pixels)")
        print(f"    Bands Count      : {src.count} spectral bands")
        print(f"    CRS              : {src.crs}")
        print(f"    Descriptions     : {src.descriptions}")

    # -------------------------------------------------------------
    # Step 3: Flood Detection (MNDWI Execution)
    # -------------------------------------------------------------
    print("\n[3] Running Geospatial Flood Analysis (MNDWI Index):")
    f_res = analyze_flood(str(sample_file), threshold=0.0)

    if f_res["status"] == "success":
        feat_count = len(f_res["result"]["features"])
        area = f_res["affected_area_km2"]
        bounds = f_res["bounds"]
        print("    Status           : SUCCESS [OK]")
        print(f"    Affected Area    : {area:.4f} km2")
        print(f"    Flood Polygons   : {feat_count} vectorized features")
        print(f"    Leaflet Bounds   : {bounds}")

        out_geojson = ROOT_DIR / "data" / "demo" / "flood_output.geojson"
        out_geojson.parent.mkdir(parents=True, exist_ok=True)
        with open(out_geojson, "w", encoding="utf-8") as f:
            json.dump(f_res["result"], f, indent=2)
        print(f"    Exported GeoJSON : {out_geojson}")
    else:
        print(f"    Status           : FAILED - {f_res.get('message')}")

    # -------------------------------------------------------------
    # Step 4: Graceful Handling of Normal RGB Images
    # -------------------------------------------------------------
    rgb_file = ROOT_DIR / "data" / "demo_rgb.png"
    print("\n[4] Handling Normal Non-Georeferenced RGB Image (demo_rgb.png):")
    if rgb_file.exists():
        rgb_res = analyze_flood(str(rgb_file))
        print(f"    Status           : {rgb_res['status'].upper()} (Handled safely without crash)")
        print(f"    Reported Reason  : {rgb_res.get('message')}")

    print("\n" + "=" * 70)
    print(" DEMO COMPLETED SUCCESSFULLY!")
    print(" Tip: Run 'py demo_server.py' to open the interactive browser map UI!")
    print("=" * 70)


if __name__ == "__main__":
    main()
