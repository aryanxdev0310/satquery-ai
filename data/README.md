# SatQuery AI - Dataset Specification & Guide
**Responsible Role:** Member 6 (Dataset + Testing + Demo)

## 1. Expected Satellite Data Format
True scientific flood detection relies on spectral reflectance characteristics of water versus land, soil, and vegetation.

The geospatial flood analysis engine (gis/src/flood_analysis.py) requires:
- **File Format:** GeoTIFF (.tif or .tiff).
- **Georeferencing:** The raster MUST contain a valid Coordinate Reference System (CRS) such as EPSG:4326 (WGS 84) or a projected UTM coordinate system (EPSG:326xx).
- **Spectral Bands:** At minimum, the raster must provide multispectral bands corresponding to Sentinel-2:
  - **B3 (Green - 560 nm):** Raster band labeled 'B3' (or Band 3 in standard 13-band Sentinel-2).
  - **B8 (NIR - 842 nm):** Raster band labeled 'B8' (or Band 8 in standard 13-band Sentinel-2).
  - **B11 (SWIR - 1610 nm):** Raster band labeled 'B11' (or Band 12 in standard 13-band Sentinel-2).

## 2. Scientific Index: MNDWI
Water bodies are delineated using the **Modified Normalized Difference Water Index (MNDWI)** (Xu, 2006):
MNDWI = (Green - SWIR) / (Green + SWIR) = (B3 - B11) / (B3 + B11)

- Pixels where MNDWI > 0.0 are classified as water/flood inundation.
- The water mask is vectorized into GeoJSON polygons and reprojected to EPSG:4326 for Leaflet map display.
- Affected flood area is calculated in square kilometers (km^2) using metric projections.

## 3. Why Standard RGB Images (PNG / JPEG) Cannot Detect Floods
Ordinary photographs or screenshot images (like data/demo_rgb.png):
1. **Lack Spatial Metadata:** They have no Coordinate Reference System (CRS), pixel resolution, or geographic bounding coordinates.
2. **Lack Multispectral Bands:** Standard RGB images contain only 3 bands (Red, Green, Blue). They completely lack the Near-Infrared (NIR) and Short-Wave Infrared (SWIR) bands required to distinguish water from shadowed terrain, asphalt, or dark soil.
3. **Graceful Handling:** SatQuery AI safely catches this without crashing, returning:
   status: 'error',
   message: 'Image has no Coordinate Reference System (CRS). Geospatial analysis requires georeferenced data.'

## 4. Included Demo Datasets
- data/demo/sample.tif: GeoTIFF (Sentinel-2, 13 bands, EPSG:4326). Spain flood event (Sen1Floods11). Used for successful flood detection demo.
- data/demo_rgb.png: Standard PNG (RGB, no CRS). Used for testing robust error handling and reporting.

## 5. Directory Structure
data/
|-- README.md           # This specification document
|-- demo/
|   -- sample.tif      # Valid 13-band Sentinel-2 demo dataset
|-- demo_rgb.png        # RGB sample for error handling validation
-- .gitkeep
