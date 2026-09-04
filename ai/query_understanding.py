"""
SatQuery AI - AI Query Understanding Module
File: ai/query_understanding.py
Author: Member 5 (AI Query Understanding Module)

Purpose:
Analyzes natural-language queries from users (e.g. "Show me the areas affected by flooding")
and converts them into a structured JSON dictionary specifying the target geospatial analysis type.

Supported Analysis Types:
- flood_detection   : Water inundation, flooding, submerged areas, overflow
- ndvi              : Vegetation health, crop/forest vigor, plant wellness, NDVI
- change_detection  : Comparing multi-temporal satellite images, finding differences
- land_use          : Land use and land cover (LULC), urban/terrain classification
- unknown           : Unrelated or unclassifiable queries (e.g. "tell me a joke")

Architecture:
1. LLM-Powered: If an LLM API key (GEMINI_API_KEY or OPENAI_API_KEY) is configured
   in the environment, it uses the LLM for nuanced classification.
2. Deterministic Fallback: If no API key is set, or if an API call fails or times out,
   it falls back to a fast, reliable, rule-based keyword matching engine.
3. Separation of Concerns: This module NEVER executes GIS math or raster processing.
   It strictly outputs the structured analysis intent.
"""

import json
import os
import re
import urllib.error
import urllib.request
from typing import Any, Dict, Optional

# Supported analysis types
VALID_ANALYSIS_TYPES = {
    "flood_detection",
    "ndvi",
    "change_detection",
    "land_use",
    "unknown",
}

# Curated keyword trigger lists for deterministic rule-based matching
KEYWORD_RULES = {
    "flood_detection": [
        "flood",
        "flooded",
        "flooding",
        "inundation",
        "inundated",
        "submerged",
        "waterlogging",
        "waterlogged",
        "overflow",
        "deluge",
        "water level",
        "water body",
    ],
    "ndvi": [
        "ndvi",
        "vegetation",
        "plant health",
        "crop health",
        "healthy",
        "health",
        "greenery",
        "forest",
        "crops",
        "crop",
        "biomass",
        "chlorophyll",
        "foliage",
        "canopy",
        "vigor",
    ],
    "change_detection": [
        "compare",
        "comparison",
        "comparing",
        "change",
        "changes",
        "difference",
        "differences",
        "before and after",
        "over time",
        "temporal",
        "timeline",
    ],
    "land_use": [
        "land use",
        "land cover",
        "classify",
        "classification",
        "lulc",
        "urban",
        "built-up",
        "zoning",
        "terrain",
        "ground cover",
    ],
}


def _classify_with_gemini(query: str, api_key: str) -> Optional[Dict[str, Any]]:
    """
    Attempts to classify the user query using Google Gemini API.
    Uses Python's standard library (urllib.request) to avoid third-party dependencies.
    """
    endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
    system_instruction = (
        "You are an AI query-understanding classifier for a satellite intelligence platform. "
        "Classify the user's query into exactly ONE of the following analysis types: "
        "['flood_detection', 'ndvi', 'change_detection', 'land_use', 'unknown']. "
        "Respond ONLY with a JSON object in this format: "
        '{"analysis_type": "<type>", "confidence": <float between 0.0 and 1.0>}'
    )
    payload = {
        "contents": [
            {
                "parts": [
                    {"text": f"{system_instruction}\n\nUser Query: \"{query}\""}
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.0,
            "responseMimeType": "application/json",
        },
    }

    req = urllib.request.Request(
        endpoint,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=5) as response:
            data = json.loads(response.read().decode("utf-8"))
            content_text = data["candidates"][0]["content"]["parts"][0]["text"]
            parsed = json.loads(content_text)
            analysis_type = parsed.get("analysis_type", "unknown")
            confidence = float(parsed.get("confidence", 0.90))

            if analysis_type in VALID_ANALYSIS_TYPES:
                return {
                    "analysis_type": analysis_type,
                    "confidence": round(min(max(confidence, 0.0), 1.0), 2),
                    "original_query": query,
                    "provider": "gemini_llm",
                }
    except Exception:
        # Gracefully handle network errors, timeouts, or invalid API responses
        return None
    return None


def _classify_with_openai(query: str, api_key: str) -> Optional[Dict[str, Any]]:
    """
    Attempts to classify the user query using OpenAI API.
    Uses Python's standard library (urllib.request) to avoid third-party dependencies.
    """
    endpoint = "https://api.openai.com/v1/chat/completions"
    payload = {
        "model": "gpt-4o-mini",
        "temperature": 0.0,
        "messages": [
            {
                "role": "system",
                "content": (
                    "You are an AI query classifier for satellite intelligence. "
                    "Classify queries into one of: ['flood_detection', 'ndvi', 'change_detection', 'land_use', 'unknown']. "
                    "Return ONLY JSON: {\"analysis_type\": \"...\", \"confidence\": 0.95}"
                ),
            },
            {"role": "user", "content": query},
        ],
        "response_format": {"type": "json_object"},
    }

    req = urllib.request.Request(
        endpoint,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=5) as response:
            data = json.loads(response.read().decode("utf-8"))
            content_text = data["choices"][0]["message"]["content"]
            parsed = json.loads(content_text)
            analysis_type = parsed.get("analysis_type", "unknown")
            confidence = float(parsed.get("confidence", 0.90))

            if analysis_type in VALID_ANALYSIS_TYPES:
                return {
                    "analysis_type": analysis_type,
                    "confidence": round(min(max(confidence, 0.0), 1.0), 2),
                    "original_query": query,
                    "provider": "openai_llm",
                }
    except Exception:
        # Gracefully handle network errors, timeouts, or invalid API responses
        return None
    return None


def _classify_deterministic(query: str) -> Dict[str, Any]:
    """
    Reliable keyword-based classification engine.
    Used as the default or fallback when no LLM API is configured or available.
    """
    # Step 1: Normalize query (lowercase, remove extra punctuation and spaces)
    normalized = query.lower().strip()

    # Step 2: Score each category based on keyword matches
    category_scores = {}
    for category, keywords in KEYWORD_RULES.items():
        match_count = 0
        for keyword in keywords:
            if keyword in normalized:
                match_count += 1
        category_scores[category] = match_count

    # Step 3: Find category with highest match count
    best_category = max(category_scores, key=category_scores.get)
    highest_score = category_scores[best_category]

    # Step 4: If no keywords matched, return 'unknown'
    if highest_score == 0:
        return {
            "analysis_type": "unknown",
            "confidence": 0.0,
            "original_query": query,
        }

    # Step 5: Assign confidence based on keyword strength
    # 2 or more matching keywords indicates high confidence (0.95), 1 keyword indicates 0.85
    confidence = 0.95 if highest_score >= 2 else 0.85

    return {
        "analysis_type": best_category,
        "confidence": confidence,
        "original_query": query,
    }


def understand_query(query: str) -> Dict[str, Any]:
    """
    Main entry point for the AI query-understanding module.

    Accepts a natural-language question, classifies the requested satellite analysis type,
    and returns a structured JSON-compatible dictionary.

    Parameters:
        query (str): The natural language user query.
                     Example: "Show me the areas affected by flooding."

    Returns:
        dict: A structured dictionary containing:
            - "analysis_type": e.g. "flood_detection", "ndvi", "change_detection", "land_use", "unknown"
            - "confidence": float between 0.0 and 1.0
            - "original_query": the original user input query string
    """
    # Handle empty or non-string inputs safely
    if not isinstance(query, str) or not query.strip():
        return {
            "analysis_type": "unknown",
            "confidence": 0.0,
            "original_query": "" if query is None else str(query),
        }

    # Check for configured LLM API keys in environment
    gemini_key = os.getenv("GEMINI_API_KEY")
    openai_key = os.getenv("OPENAI_API_KEY")

    llm_result = None
    if gemini_key:
        llm_result = _classify_with_gemini(query, gemini_key)
    elif openai_key:
        llm_result = _classify_with_openai(query, openai_key)

    if llm_result is not None:
        return llm_result

    # If no LLM API is configured or if LLM call failed, use deterministic fallback
    return _classify_deterministic(query)


# Aliases for team compatibility
classify_query = understand_query
route_query = understand_query


if __name__ == "__main__":
    # Interactive demonstration when executed directly
    print("=" * 65)
    print(" SatQuery AI - Query Understanding Demo (Member 5)")
    print("=" * 65)

    sample_queries = [
        "Show me the areas affected by flooding.",
        "Show vegetation health.",
        "Find changes between these two images.",
        "Analyze the land use in this area.",
        "What is the capital of France?",
    ]

    for q in sample_queries:
        result = understand_query(q)
        print(f"\nUser Query:     \"{result['original_query']}\"")
        print(f"Analysis Type:  {result['analysis_type']}")
        print(f"Confidence:     {result['confidence']}")
        print(f"Structured JSON:\n{json.dumps(result, indent=2)}")

    print("\n" + "=" * 65)
