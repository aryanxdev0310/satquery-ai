from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers.upload import router as upload_router
from routers.analyze import router as analyze_router
from routers.multispectral import router as multispectral_router

app = FastAPI(
    title="SatQuery AI API",
    description="Backend foundation for SatQuery AI platform",
    version="0.2.0"
)

# CORS configuration to enable frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register application routers
app.include_router(upload_router)
app.include_router(analyze_router)
app.include_router(multispectral_router)


@app.get("/")
def root():
    return {
        "name": "SatQuery AI API",
        "status": "online",
        "version": "0.2.0"
    }


@app.get("/health", tags=["System"])
def health_check():
    """Health check endpoint to verify backend operational status."""
    return {
        "status": "healthy",
        "service": "satquery-backend"
    }