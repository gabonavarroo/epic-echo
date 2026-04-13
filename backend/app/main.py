from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings

app = FastAPI(
    title="EPIC Echo",
    description="Content intelligence pipeline for EPIC Lab talks",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    return {"status": "ok", "project": "epic-echo"}


@app.get("/")
async def root():
    return {
        "message": "EPIC Echo API — pipeline runner (local only, not deployed)",
        "docs": "/docs",
    }
