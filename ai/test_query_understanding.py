"""
SatQuery AI - Query Understanding Test Suite (Member 5)
File: ai/test_query_understanding.py

Run this script anytime to verify that the AI Query Understanding module
correctly interprets natural language geospatial questions.

Usage:
    python ai/test_query_understanding.py
"""

import json
import sys
import unittest
from pathlib import Path

# Ensure project root is on sys.path
_project_root = Path(__file__).resolve().parent.parent
if str(_project_root) not in sys.path:
    sys.path.insert(0, str(_project_root))

from ai.query_understanding import understand_query

# The core queries specified by Member 5
CORE_SAMPLE_QUERIES = [
    {
        "query": "Show me the areas affected by flooding.",
        "expected": "flood_detection",
        "description": "Flood Detection Example",
    },
    {
        "query": "Show vegetation health.",
        "expected": "ndvi",
        "description": "Vegetation / NDVI Example",
    },
    {
        "query": "Find changes between these two images.",
        "expected": "change_detection",
        "description": "Change Detection Example",
    },
    {
        "query": "Analyze the land use in this area.",
        "expected": "land_use",
        "description": "Land Use / LULC Example",
    },
    {
        "query": "What is the capital of France?",
        "expected": "unknown",
        "description": "Non-geospatial Fallback Example",
    },
]


def run_demonstration():
    """Prints a clean, friendly demonstration of the query understanding module."""
    print("\n" + "=" * 70)
    print("  SatQuery AI - Member 5: AI Query Understanding Verification")
    print("=" * 70)

    all_passed = True

    for i, test in enumerate(CORE_SAMPLE_QUERIES, start=1):
        query = test["query"]
        expected = test["expected"]
        desc = test["description"]

        result = understand_query(query)
        actual = result.get("analysis_type")
        confidence = result.get("confidence", 0.0)

        passed = actual == expected
        status_text = "[PASSED]" if passed else "[FAILED]"
        if not passed:
            all_passed = False

        print(f"\nTest {i}: {desc}")
        print(f"  User Query:      \"{query}\"")
        print(f"  Expected Output: {expected}")
        print(f"  Detected Output: {actual} (Confidence: {confidence}) -> {status_text}")
        print("  Full Structured JSON:")
        print("  " + json.dumps(result, indent=4).replace("\n", "\n  "))
        print("-" * 70)

    print("\n" + "=" * 70)
    if all_passed:
        print("  SUCCESS: All query-understanding tests passed perfectly!")
    else:
        print("  WARNING: Some tests did not match expectations.")
    print("=" * 70 + "\n")
    return all_passed


class TestQueryUnderstanding(unittest.TestCase):
    """Standard unit tests for automated CI / testing frameworks."""

    def test_sample_queries(self):
        for test in CORE_SAMPLE_QUERIES:
            with self.subTest(query=test["query"]):
                result = understand_query(test["query"])
                self.assertIn("analysis_type", result)
                self.assertIn("confidence", result)
                self.assertIn("original_query", result)
                self.assertEqual(result["analysis_type"], test["expected"])
                self.assertTrue(0.0 <= result["confidence"] <= 1.0)
                self.assertEqual(result["original_query"], test["query"])

    def test_empty_query(self):
        result = understand_query("")
        self.assertEqual(result["analysis_type"], "unknown")
        self.assertEqual(result["confidence"], 0.0)


if __name__ == "__main__":
    success = run_demonstration()
    sys.exit(0 if success else 1)
