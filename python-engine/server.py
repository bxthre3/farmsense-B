from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Optional, List
from farmsense.core.platform import FarmSensePlatform

app = FastAPI(title="FarmSense Platform API")
platform = FarmSensePlatform()

class DomainInput(BaseModel):
    domain: str
    inputs: Optional[Dict[str, Any]] = None
    lat: Optional[float] = None
    lon: Optional[float] = None

class BatchInput(BaseModel):
    all_inputs: Dict[str, Dict[str, Any]]

@app.get("/")
def read_root():
    return {"message": "FarmSense Deterministic Farming Operations Platform API"}

@app.post("/recommendation")
def get_recommendation(data: DomainInput):
    try:
        if data.lat is not None and data.lon is not None:
            return platform.get_recommendation_with_real_data(data.domain, data.lat, data.lon, data.inputs)
        return platform.get_recommendation(data.domain, data.inputs or {})
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/recommendations/batch")
def get_batch_recommendations(data: BatchInput):
    return platform.get_all_recommendations(data.all_inputs)

@app.post("/confirm_emergency/{audit_id}")
def confirm_emergency(audit_id: str):
    try:
        return platform.confirm_emergency(audit_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
