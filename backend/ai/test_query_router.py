"""
SatQuery AI - Test Suite for Query Router
File: backend/ai/test_query_router.py

This test file verifies that route_query() correctly classifies natural-language
geospatial queries into one of the 5 supported analysis types:
- flood_detection
- ndvi
- change_detection
- land_use
- unknown
"""

import sys
import unittest
from pathlib import Path

# Ensure the project root directory is in sys.path so imports always work
current_dir = Path(__file__).resolve().parent
project_root = current_dir.parent.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

# Import route_query safely
try:
    from backend.ai.query_router import route_query
except ModuleNotFoundError:
    from query_router import route_query


# Test dataset containing 18 queries across all 5 categories
TEST_CASES = [
    # --- 1. flood_detection tests ---
    {
        "query": "Which areas are flooded?",
        "expected": "flood_detection",
        "description": "User example: flooded areas question",
    },
    {
        "query": "Show flood affected areas",
        "expected": "flood_detection",
        "description": "User example: flood affected areas command",
    },
    {
        "query": "Has the river submerged nearby villages?",
        "expected": "flood_detection",
        "description": "Submerged keyword test",
    },
    {
        "query": "Check water inundation levels after the storm",
        "expected": "flood_detection",
        "description": "Inundation keyword test",
    },

    # --- 2. ndvi tests ---
    {
        "query": "Show vegetation health",
        "expected": "ndvi",
        "description": "User example: vegetation health command",
    },
    {
        "query": "How healthy is the vegetation?",
        "expected": "ndvi",
        "description": "User example: vegetation health question",
    },
    {
        "query": "Calculate NDVI for these agricultural fields",
        "expected": "ndvi",
        "description": "Direct NDVI acronym test",
    },
    {
        "query": "Monitor forest greenery and plant health",
        "expected": "ndvi",
        "description": "Greenery and plant health keywords test",
    },

    # --- 3. change_detection tests ---
    {
        "query": "Compare these two satellite images",
        "expected": "change_detection",
        "description": "User example: compare images command",
    },
    {
        "query": "Find changes between these images",
        "expected": "change_detection",
        "description": "User example: find changes command",
    },
    {
        "query": "Show before and after difference in urban growth",
        "expected": "change_detection",
        "description": "Before and after / difference test",
    },
    {
        "query": "Detect temporal changes over time",
        "expected": "change_detection",
        "description": "Over time / changes test",
    },

    # --- 4. land_use tests ---
    {
        "query": "Show land use in this region",
        "expected": "land_use",
        "description": "User example: land use question",
    },
    {
        "query": "Classify this area",
        "expected": "land_use",
        "description": "User example: classify command",
    },
    {
        "query": "Generate a LULC map for this city",
        "expected": "land_use",
        "description": "LULC acronym test",
    },
    {
        "query": "Analyze urban built-up coverage",
        "expected": "land_use",
        "description": "Urban built-up test",
    },

    # --- 5. unknown / fallback tests ---
    {
        "query": "Tell me a joke",
        "expected": "unknown",
        "description": "User example: irrelevant joke query",
    },
    {
        "query": "What is the weather in Tokyo?",
        "expected": "unknown",
        "description": "General weather question",
    },
    {
        "query": "Hello there!",
        "expected": "unknown",
        "description": "Greeting query",
    },
    {
        "query": "",
        "expected": "unknown",
        "description": "Empty input string edge case",
    },
]


def run_pretty_test_runner():
    """
    Runs all test cases and prints a clean, easy-to-read summary table.
    Perfect for beginners running: python backend/ai/test_query_router.py
    """
    print("\n" + "=" * 80)
    print(" SatQuery AI - Query Router Test Suite")
    print(f" Total test queries: {len(TEST_CASES)}")
    print("=" * 80)

    passed_count = 0
    failed_count = 0

    for idx, item in enumerate(TEST_CASES, start=1):
        query = item["query"]
        expected = item["expected"]
        result = route_query(query)

        actual = result["analysis_type"]
        confidence = result["confidence"]
        is_pass = actual == expected

        if is_pass:
            status = "PASS [OK]"
            passed_count += 1
        else:
            status = "FAIL [X]"
            failed_count += 1

        print(f"Test #{idx:02d}: {status}")
        print(f"  Query:      \"{query}\"")
        print(f"  Expected:   {expected}")
        print(f"  Predicted:  {actual} (Confidence: {confidence})")
        print("-" * 80)

    print("\n" + "=" * 40)
    print(f"RESULTS: {passed_count}/{len(TEST_CASES)} tests passed.")
    if failed_count == 0:
        print("ALL TESTS PASSED SUCCESSFULLY!")
    else:
        print(f"{failed_count} tests failed.")
    print("=" * 40 + "\n")

    return failed_count == 0


class TestQueryRouter(unittest.TestCase):
    """
    Standard unittest test cases so pytest and python -m unittest can run automatically.
    """

    def test_all_queries(self):
        for item in TEST_CASES:
            with self.subTest(query=item["query"]):
                result = route_query(item["query"])
                self.assertEqual(
                    result["analysis_type"],
                    item["expected"],
                    f"Query '{item['query']}' classified as '{result['analysis_type']}', expected '{item['expected']}'"
                )
                self.assertIn("confidence", result)
                self.assertIn("original_query", result)
                self.assertIsInstance(result["confidence"], (float, int))
                self.assertTrue(0.0 <= result["confidence"] <= 1.0)


if __name__ == "__main__":
    # If run directly as a script, execute the pretty runner
    success = run_pretty_test_runner()
    # Exit with code 0 on success, 1 on failure
    sys.exit(0 if success else 1)
