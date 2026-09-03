"""
SatQuery AI - Query Router (Backend AI Integration)
Module: backend/ai/query_router.py

Bridges backend modules with Member 5's core AI query understanding module
located at ai/query_understanding.py.
"""

import sys
from pathlib import Path

# Ensure project root is in sys.path so 'ai' package can be imported reliably
_project_root = Path(__file__).resolve().parent.parent.parent
if str(_project_root) not in sys.path:
    sys.path.insert(0, str(_project_root))

from ai.query_understanding import (
    KEYWORD_RULES,
    understand_query,
    route_query,
    classify_query,
)

__all__ = [
    "KEYWORD_RULES",
    "understand_query",
    "route_query",
    "classify_query",
]

if __name__ == "__main__":
    # Quick interactive demo if this file is run directly
    sample_queries = [
        "Which areas are flooded?",
        "Show vegetation health",
        "Compare these two satellite images",
        "Show land use in this region",
        "Tell me a joke",
    ]

    print("--- SatQuery AI: Backend Query Router Demo ---")
    for sample in sample_queries:
        result = route_query(sample)
        print(f"Query:      '{result['original_query']}'")
        print(f"Type:       {result['analysis_type']}")
        print(f"Confidence: {result['confidence']}\n")
