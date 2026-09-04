from app.services.ai_service import understand_user_query
from gis.src.flood_analysis import analyze_flood


def analyze_image(image_path: str, query: str) -> dict:
    """
    Understand the user's query and run the appropriate GIS analysis.
    """

    query_result = understand_user_query(query)
    analysis_type = query_result["analysis_type"]

    if analysis_type == "flood_detection":
        result = analyze_flood(image_path)

        return {
            **result,
            "original_query": query,
            "confidence": query_result["confidence"],
        }

    return {
        "analysis_type": analysis_type,
        "status": "error",
        "message": f"Analysis type '{analysis_type}' is not supported yet.",
        "original_query": query,
        "confidence": query_result["confidence"],
        "result": {
            "type": "FeatureCollection",
            "features": [],
        },
    }
    