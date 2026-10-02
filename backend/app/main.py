from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum
from app.database.db import lifespan
from app.controllers import account_controller
from app.controllers import customer_controller
from app.controllers import audit_controller
from app.controllers import auth_controller

app = FastAPI(title="Banking System API", lifespan=lifespan)

# CORS — allows local dev and S3/CloudFront origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Auth routes — no prefix, mounted at /auth/register and /auth/login
app.include_router(auth_controller.router)

# Business routes — all mounted under /api prefix
app.include_router(account_controller.router, prefix="/api")
app.include_router(customer_controller.router, prefix="/api")
app.include_router(audit_controller.router, prefix="/api")


@app.get("/")
async def root():
    return {"message": "Banking System API is running"}

# Lambda handler — Mangum wraps the ASGI app for AWS Lambda + API Gateway
handler = Mangum(app)
