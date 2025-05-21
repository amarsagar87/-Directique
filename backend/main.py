from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import requests
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AvatarRequest(BaseModel):
    name: str
    age: int
    appearance: str
    personality: str
    expression: str  # e.g., "smile", "angry", "sad"

@app.post("/generate-avatar")
async def generate_avatar(request: AvatarRequest):
    try:
        prompt = f"Portrait of a {request.age}-year-old named {request.name}, {request.appearance}, personality: {request.personality}, facial expression: {request.expression}"
        
        response = requests.post(
            "https://api.replicate.com/v1/predictions",  # Example API
            headers={
                "Authorization": f"Token {os.getenv('REPLICATE_API_KEY')}",
                "Content-Type": "application/json",
            },
            json={
                "version": "stable-diffusion-v1-5-id",  # Replace with working model ID
                "input": {"prompt": prompt}
            }
        )
        data = response.json()
        return {"image_url": data["urls"]["get"]}  # This varies by API

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
