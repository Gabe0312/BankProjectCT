from fastapi import FastAPI
from app.database.db import lifespan
from app.controllers import account_controller
from app.controllers import customer_controller
from app.controllers import audit_controller

app = FastAPI(title="Banking System API", lifespan=lifespan)

# Register all routers under the /api prefix
app.include_router(account_controller.router, prefix="/api")
app.include_router(customer_controller.router, prefix="/api")
app.include_router(audit_controller.router, prefix="/api")


@app.get("/")
async def root():
    return {"message": "Banking System API is running"}
