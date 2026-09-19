from __future__ import annotations
import traceback
import uvicorn
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import config
from routes.jobs import router as jobs_router
from routes.candidates import router as candidates_router
from routes.interviews import router as interviews_router
from routes.voice import router as voice_router
from routes.avatar import router as avatar_router
from routes.websocket import router as ws_router
from routes.stats import router as stats_router
from routes.proctoring import router as proctoring_router

app = FastAPI(
    title="ARYNOX AI HIRE",
    description="AI-Powered Technical Hiring Platform",
    version="1.0.0",
    redirect_slashes=False,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[config.NEXT_PUBLIC_APP_URL, "http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---- Error contract: always return proper HTTP status codes with {"error": ...} ----
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(status_code=exc.status_code, content={"error": str(exc.detail)})


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    # Log full traceback server-side; never leak internals to the client
    traceback.print_exc()
    return JSONResponse(status_code=500, content={"error": "Internal server error"})

app.include_router(jobs_router)
app.include_router(candidates_router)
app.include_router(interviews_router)
app.include_router(voice_router)
app.include_router(avatar_router)
app.include_router(ws_router)
app.include_router(stats_router)
app.include_router(proctoring_router)


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "version": "1.0.0",
        "mode": config.APP_MODE,
        "mockMode": config.APP_MODE == "local",
    }


@app.get("/api/health")
async def api_health():
    return {"status": "ok", "api": "v1"}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=config.PORT, reload=config.APP_MODE == "local")
