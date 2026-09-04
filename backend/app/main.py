import sys
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


# Add the repository root to Python's module search path
PROJECT_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(PROJECT_ROOT))


from app.routes.upload import router as upload_router
from app.routes.query import router as query_router
from app.routes.analyze import router as analyze_router


app = FastAPI(
    title="SatQuery AI Backend",
    description="Backend API for the SatQuery AI SIH 2026 prototype",
    version="1.0.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(upload_router)
app.include_router(query_router)
app.include_router(analyze_router)


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "satquery-backend",
    }