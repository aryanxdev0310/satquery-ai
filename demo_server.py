# SatQuery AI - Interactive Demo Server
# Role: Member 6 (Dataset + Testing + Demo)

import os
import sys
import json
from pathlib import Path
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse

ROOT_DIR = Path(__file__).resolve().parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))
if str(ROOT_DIR / "gis") not in sys.path:
    sys.path.insert(0, str(ROOT_DIR / "gis"))

from backend.ai.query_router import route_query
from src.flood_analysis import analyze_flood


class DemoRequestHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        # Clean terminal logging
        sys.stdout.write(f"[HTTP {self.command}] {self.path} -> {args[1]}\n")
        sys.stdout.flush()

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path in ["/", "/index.html"]:
            html_file = ROOT_DIR / "frontend" / "index.html"
            if html_file.exists():
                with open(html_file, "rb") as f:
                    content = f.read()
                self.send_response(200)
                self.send_header("Content-Type", "text/html; charset=utf-8")
                self.send_header("Content-Length", str(len(content)))
                self.end_headers()
                self.wfile.write(content)
            else:
                self.send_response(404)
                self.end_headers()
        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/analyze":
            content_len = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_len).decode("utf-8")
            payload = json.loads(body)

            query = payload.get("query", "Which areas are flooded in this satellite image?")
            dataset_rel = payload.get("dataset", "data/demo/sample.tif")
            threshold = float(payload.get("threshold", 0.0))

            dataset_path = ROOT_DIR / dataset_rel
            if not dataset_path.exists():
                dataset_path = ROOT_DIR / "gis" / dataset_rel

            # 1. AI Query Routing
            ai_res = route_query(query)

            # 2. Geospatial Flood Detection
            gis_res = analyze_flood(str(dataset_path), threshold=threshold)

            response_data = {
                "query_analysis": ai_res,
                "gis_analysis": gis_res
            }

            resp_bytes = json.dumps(response_data).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(resp_bytes)))
            self.end_headers()
            self.wfile.write(resp_bytes)
        else:
            self.send_response(404)
            self.end_headers()


def start_server(port=8000):
    server = HTTPServer(("0.0.0.0", port), DemoRequestHandler)
    print("=" * 70)
    print("   SATQUERY AI - INTERACTIVE DEMO SERVER (LEAFLET + RASTERIO)")
    print("=" * 70)
    print(f" Demo Web UI : http://localhost:{port}")
    print(" Press Ctrl+C to stop the server.")
    print("=" * 70)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")


if __name__ == "__main__":
    start_server(8000)
