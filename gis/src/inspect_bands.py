import os
import sys
import numpy as np
import rasterio
from rasterio.errors import RasterioIOError


def inspect_bands(image_path: str = "data/demo/sample.tif"):
    """
    Inspects specific spectral bands (B3, B8, B11) of a satellite image.
    Calculates pixel statistics (min, max, mean) and prints spatial transform.
    """
    # 1. Verify file existence
    if not os.path.exists(image_path):
        print(f"Error: The file '{image_path}' was not found.")
        print("Please ensure the file exists at the specified path.")
        sys.exit(1)

    try:
        with rasterio.open(image_path) as src:
            print("=" * 60)
            print(" BAND INSPECTION & PIXEL STATISTICS")
            print("=" * 60)
            print(f"Image Path : {image_path}")
            print(f"CRS        : {src.crs}")
            print(f"Transform  :\n{src.transform}")
            print(f"Total Grid : {src.width} x {src.height} = {src.width * src.height} pixels per band")
            print("-" * 60)

            # Map band names to their 1-based rasterio band index
            # Sentinel-2 images often have band descriptions ('B1', 'B2', ... 'B8A', ... 'B11')
            target_bands = ["B3", "B8", "B11"]
            descriptions = list(src.descriptions) if src.descriptions else []

            # If descriptions are present, find the exact index for each band
            # Otherwise, fall back to default Sentinel-2 13-band layout
            band_indices = {}
            for b_name in target_bands:
                if b_name in descriptions:
                    band_indices[b_name] = descriptions.index(b_name) + 1
                else:
                    # Fallback standard indexing for 13-band Sentinel-2:
                    # B1=1, B2=2, B3=3, B4=4, B5=5, B6=6, B7=7, B8=8, B8A=9, B9=10, B10=11, B11=12, B12=13
                    fallback_map = {"B3": 3, "B8": 8, "B11": 12}
                    band_indices[b_name] = fallback_map.get(b_name)

            nodata_val = src.nodata

            for b_name in target_bands:
                b_idx = band_indices.get(b_name)

                if b_idx is None or b_idx > src.count:
                    print(f"Band {b_name}: Not available in this image (image only has {src.count} bands).")
                    continue

                # Read the band data into a NumPy array
                band_data = src.read(b_idx).astype("float64")

                # Filter out nodata and non-finite values (like NaN or Inf)
                valid_mask = np.isfinite(band_data)
                if nodata_val is not None:
                    valid_mask &= (band_data != nodata_val)

                valid_pixels = band_data[valid_mask]
                count_valid = valid_pixels.size

                if count_valid > 0:
                    min_val = np.min(valid_pixels)
                    max_val = np.max(valid_pixels)
                    mean_val = np.mean(valid_pixels)

                    print(f"Band {b_name:4} (Raster Band #{b_idx}):")
                    print(f"  - Valid Pixels : {count_valid:,} / {band_data.size:,}")
                    print(f"  - Min Value    : {min_val:.2f}")
                    print(f"  - Max Value    : {max_val:.2f}")
                    print(f"  - Mean Value   : {mean_val:.2f}")
                else:
                    print(f"Band {b_name:4} (Raster Band #{b_idx}): No valid pixels found.")

                print("-" * 60)

    except RasterioIOError as e:
        print(f"Error: Could not open or read '{image_path}'.")
        print(f"Details: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"Unexpected error: {e}")
        sys.exit(1)


def main():
    # Allow an optional command-line argument, default to data/demo/sample.tif
    image_path = sys.argv[1] if len(sys.argv) > 1 else "data/demo/sample.tif"
    inspect_bands(image_path)


if __name__ == "__main__":
    main()
