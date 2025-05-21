from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import os
import requests

app = FastAPI()

# CORS settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Model for avatar generation
class AvatarRequest(BaseModel):
    name: str
    age: int
    role: str
    personality: str
    appearance: str
    expression: str  # like "happy", "sad", "angry", etc.

@app.post("/generate-avatar")
async def generate_avatar(req: AvatarRequest):
    try:
        # Prompt construction
        prompt = f"{req.name}, {req.age} years old, {req.role}, {req.personality}, {req.appearance}, {req.expression} face, studio lighting, portrait"

        # Replicate API (example with Fooocus or SDXL - customize later)
        response = requests.post(
            "https://api.replicate.com/v1/predictions",
            headers={
                "Authorization": f"Token {os.getenv('REPLICATE_API_TOKEN')}",
                "Content-Type": "application/json"
            },
            json={
                "version": "sdxl-or-other-model-version-id",
                "input": {
                    "prompt": prompt
                }
            }
        )

        result = response.json()
        image_url = result["urls"]["get"]  # or "output" depending on API

        return {"image_url": image_url}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
