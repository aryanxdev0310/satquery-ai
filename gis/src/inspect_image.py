import sys
import os
import rasterio
from rasterio.errors import RasterioIOError


def inspect_satellite_image(image_path: str):
    """
    Safely opens a raster satellite image and prints its key geospatial metadata.
    """
    # 1. Check if the file exists on your computer
    if not os.path.exists(image_path):
        print(f"Error: The file '{image_path}' does not exist.")
        print("Please check the file path and try again.")
        sys.exit(1)

    # 2. Try to open the image using rasterio
    try:
        with rasterio.open(image_path) as src:
            print("=" * 50)
            print(" SATELLITE IMAGE METADATA INSPECTION")
            print("=" * 50)
            print(f"File Path        : {image_path}")
            print(f"Width            : {src.width} pixels")
            print(f"Height           : {src.height} pixels")
            print(f"Number of Bands  : {src.count}")
            print(f"Data Type        : {src.dtypes}")
            print(f"CRS              : {src.crs if src.crs else 'None (No Coordinate Reference System found)'}")
            print(f"Bounds           : {src.bounds}")
            print(f"Pixel Resolution : X = {src.res[0]}, Y = {src.res[1]}")

            # Check for band descriptions or labels
            if src.descriptions and any(src.descriptions):
                print(f"Band Descriptions: {src.descriptions}")
            else:
                print("Band Descriptions: Not specified in metadata")
            print("=" * 50)

    except RasterioIOError as e:
        print(f"Error: Could not open raster image '{image_path}'.")
        print(f"Details: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        sys.exit(1)


def main():
    # Ensure the user provided an image path in the command line
    if len(sys.argv) < 2:
        print("Usage: python src/inspect_image.py <path_to_raster_image>")
        print("Example: python src/inspect_image.py data/demo/sample.tif")
        sys.exit(1)

    image_path = sys.argv[1]
    inspect_satellite_image(image_path)


if __name__ == "__main__":
    main()
