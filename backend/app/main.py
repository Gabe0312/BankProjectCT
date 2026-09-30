from fastapi import FastAPI
from app.controllers import account_controller

app = FastAPI(title="Banking System API")

app.include_router(account_controller.router, prefix="/api")


@app.get("/")
def root():
    return {"message": "Banking System API is running"}
