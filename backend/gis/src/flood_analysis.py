import os
import numpy as np
import rasterio
from rasterio.errors import RasterioIOError
from rasterio.features import shapes
from rasterio.warp import calculate_default_transform, reproject, Resampling, transform_geom


def analyze_flood(image_path: str, threshold: float = 0.0) -> dict:
    """
    Analyzes a satellite GeoTIFF to detect water and flood-affected areas.

    Parameters:
    -----------
    image_path : str
        Path to the input satellite raster image (GeoTIFF).
    threshold : float, default 0.0
        MNDWI threshold for water detection. In scientific literature (Xu 2006),
        values > 0.0 distinguish open water surfaces from soil and built-up land.

    Returns:
    --------
    dict
        A dictionary matching the required SatQuery AI backend format:
        {
            "analysis_type": "flood_detection",
            "status": "success" | "error",
            "affected_area_km2": float,
            "bounds": [west, south, east, north],
            "result": {
                "type": "FeatureCollection",
                "features": [...]
            }
        }
    """
    # -------------------------------------------------------------------------
    # 1. Validate File Existence
    # -------------------------------------------------------------------------
    if not os.path.exists(image_path):
        return {
            "analysis_type": "flood_detection",
            "status": "error",
            "message": f"File not found at '{image_path}'.",
            "affected_area_km2": 0.0,
            "bounds": None,
            "result": {"type": "FeatureCollection", "features": []}
        }

    try:
        with rasterio.open(image_path) as src:
            # -----------------------------------------------------------------
            # 2. Inspect CRS and Image Metadata
            # -----------------------------------------------------------------
            crs = src.crs
            if not crs:
                return {
                    "analysis_type": "flood_detection",
                    "status": "error",
                    "message": "Image has no Coordinate Reference System (CRS). Geospatial analysis requires georeferenced data.",
                    "affected_area_km2": 0.0,
                    "bounds": None,
                    "result": {"type": "FeatureCollection", "features": []}
                }

            # -----------------------------------------------------------------
            # 3. Dynamically Identify Required Bands (B3, B8, B11)
            # -----------------------------------------------------------------
            # Never assume fixed band numbers. Sentinel-2 includes B8A between
            # B8 and B9, placing B11 at raster band 12. We inspect band descriptions.
            descriptions = [d.strip().upper() if d else "" for d in (src.descriptions or [])]

            band_indices = {}
            for name in ["B3", "B8", "B11"]:
                if name in descriptions:
                    # rasterio uses 1-based indexing
                    band_indices[name] = descriptions.index(name) + 1
                else:
                    # Fallback to standard 13-band Sentinel-2 layout if descriptions are absent
                    standard_s2 = {"B3": 3, "B8": 8, "B11": 12}
                    if src.count >= 12:
                        band_indices[name] = standard_s2.get(name)
                    else:
                        band_indices[name] = None

            missing_bands = [name for name, idx in band_indices.items() if idx is None or idx > src.count]
            if missing_bands:
                return {
                    "analysis_type": "flood_detection",
                    "status": "error",
                    "message": (
                        f"Unsupported image: Required spectral bands {missing_bands} could not be identified. "
                        f"This image has {src.count} band(s). True flood detection requires multispectral Green, NIR, and SWIR bands."
                    ),
                    "affected_area_km2": 0.0,
                    "bounds": None,
                    "result": {"type": "FeatureCollection", "features": []}
                }

            # -----------------------------------------------------------------
            # 4. Read Spectral Bands into NumPy Arrays
            # -----------------------------------------------------------------
            green = src.read(band_indices["B3"]).astype("float64")
            nir = src.read(band_indices["B8"]).astype("float64")
            swir = src.read(band_indices["B11"]).astype("float64")

            # -----------------------------------------------------------------
            # 5. Handle NoData and Invalid Values
            # -----------------------------------------------------------------
            nodata = src.nodata
            valid_mask = np.isfinite(green) & np.isfinite(nir) & np.isfinite(swir)
            if nodata is not None:
                valid_mask &= (green != nodata) & (nir != nodata) & (swir != nodata)

            # -----------------------------------------------------------------
            # 6. Compute Spectral Water Indices (Safely avoiding division by zero)
            # -----------------------------------------------------------------
            # NDWI = (Green - NIR) / (Green + NIR)    [McFeeters, 1996]
            # MNDWI = (Green - SWIR) / (Green + SWIR)  [Xu, 2006]
            denom_ndwi = green + nir
            denom_mndwi = green + swir

            ndwi = np.where(
                valid_mask & (denom_ndwi != 0),
                (green - nir) / denom_ndwi,
                -1.0
            )

            mndwi = np.where(
                valid_mask & (denom_mndwi != 0),
                (green - swir) / denom_mndwi,
                -1.0
            )

            # -----------------------------------------------------------------
            # 7. Create Binary Water / Flood Mask
            # -----------------------------------------------------------------
            # Pixels where MNDWI is greater than the threshold are classified as water.
            # uint8 mask: 1 for water/flood, 0 for non-water.
            water_mask = (valid_mask & (mndwi > threshold)).astype(np.uint8)
            water_pixels_count = int(np.sum(water_mask == 1))

            # -----------------------------------------------------------------
            # 8. Compute Affected Area in Square Kilometres (Projected Metric CRS)
            # -----------------------------------------------------------------
            # If the image CRS is geographic (degrees like EPSG:4326), we MUST NOT
            # compute area using degrees. We reproject the mask into the appropriate
            # UTM zone (which uses metric units: meters).
            if crs.is_geographic:
                center_lon = (src.bounds.left + src.bounds.right) / 2.0
                center_lat = (src.bounds.bottom + src.bounds.top) / 2.0

                # Calculate standard UTM zone number from longitude
                utm_zone = int((center_lon + 180) // 6) + 1
                # EPSG 326xx for Northern hemisphere, 327xx for Southern hemisphere
                utm_epsg = 32600 + utm_zone if center_lat >= 0 else 32700 + utm_zone
                projected_crs = f"EPSG:{utm_epsg}"

                # Compute reprojected raster transform and dimensions
                dst_transform, dst_width, dst_height = calculate_default_transform(
                    src.crs, projected_crs, src.width, src.height, *src.bounds
                )
                dst_mask = np.zeros((dst_height, dst_width), dtype=np.uint8)

                reproject(
                    source=water_mask,
                    destination=dst_mask,
                    src_transform=src.transform,
                    src_crs=src.crs,
                    dst_transform=dst_transform,
                    dst_crs=projected_crs,
                    resampling=Resampling.nearest
                )

                # Pixel resolution in meters
                pixel_area_m2 = abs(dst_transform[0] * dst_transform[4])
                projected_water_pixels = int(np.sum(dst_mask == 1))
                affected_area_km2 = round((projected_water_pixels * pixel_area_m2) / 1e6, 4)
            else:
                # The image is already in a projected metric CRS
                pixel_area_m2 = abs(src.transform[0] * src.transform[4])
                affected_area_km2 = round((water_pixels_count * pixel_area_m2) / 1e6, 4)

            # -----------------------------------------------------------------
            # 9. Extract Polygons and Format as GeoJSON FeatureCollection
            # -----------------------------------------------------------------
            # Vectorize only pixels where mask == 1
            features = []
            if water_pixels_count > 0:
                raw_shapes = shapes(
                    water_mask,
                    mask=(water_mask == 1),
                    transform=src.transform
                )

                for geom, val in raw_shapes:
                    # Leaflet expects GeoJSON in standard WGS84 (EPSG:4326)
                    if crs != "EPSG:4326":
                        geom = transform_geom(src.crs, "EPSG:4326", geom)

                    features.append({
                        "type": "Feature",
                        "geometry": geom,
                        "properties": {
                            "class": "flood_water",
                            "index_used": "MNDWI",
                            "threshold": threshold
                        }
                    })

            # -----------------------------------------------------------------
            # 10. Prepare Bounds in [west, south, east, north] (EPSG:4326)
            # -----------------------------------------------------------------
            if crs == "EPSG:4326":
                bounds = [
                    round(src.bounds.left, 6),
                    round(src.bounds.bottom, 6),
                    round(src.bounds.right, 6),
                    round(src.bounds.top, 6)
                ]
            else:
                # Reproject bounding box corner points to EPSG:4326 for Leaflet map bounds
                corners_geom = {
                    "type": "Polygon",
                    "coordinates": [[
                        [src.bounds.left, src.bounds.bottom],
                        [src.bounds.right, src.bounds.bottom],
                        [src.bounds.right, src.bounds.top],
                        [src.bounds.left, src.bounds.top],
                        [src.bounds.left, src.bounds.bottom]
                    ]]
                }
                trans_corners = transform_geom(src.crs, "EPSG:4326", corners_geom)
                all_coords = trans_corners["coordinates"][0]
                lons = [pt[0] for pt in all_coords]
                lats = [pt[1] for pt in all_coords]
                bounds = [
                    round(min(lons), 6),
                    round(min(lats), 6),
                    round(max(lons), 6),
                    round(max(lats), 6)
                ]

            # -----------------------------------------------------------------
            # 11. Return Final Standard SatQuery AI Response
            # -----------------------------------------------------------------
            return {
                "analysis_type": "flood_detection",
                "status": "success",
                "affected_area_km2": affected_area_km2,
                "bounds": bounds,
                "result": {
                    "type": "FeatureCollection",
                    "features": features
                }
            }

    except RasterioIOError as e:
        return {
            "analysis_type": "flood_detection",
            "status": "error",
            "message": f"Could not read raster file: {str(e)}",
            "affected_area_km2": 0.0,
            "bounds": None,
            "result": {"type": "FeatureCollection", "features": []}
        }
    except Exception as e:
        return {
            "analysis_type": "flood_detection",
            "status": "error",
            "message": f"Analysis failed: {str(e)}",
            "affected_area_km2": 0.0,
            "bounds": None,
            "result": {"type": "FeatureCollection", "features": []}
        }
