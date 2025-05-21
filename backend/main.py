from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
import os
import json
import requests

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize OpenAI
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# ----- Data Models -----
class ScriptRequest(BaseModel):
    title: str
    genre: str
    idea: str

class UploadScriptRequest(BaseModel):
    script: str

class AvatarRequest(BaseModel):
    name: str
    age: int
    appearance: str
    personality: str
    emotion: str  # e.g. "angry", "happy", "serious", "worried"

# ----- API Endpoints -----

@app.post("/generate-script")
async def generate_script(request: ScriptRequest):
    try:
        prompt = f"""Write a 3-act structured TV show or movie script based on the following:
Title: {request.title}
Genre: {request.genre}
Story Idea: {request.idea}
Include: Beginning, Climax, and Ending."""

        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}]
        )

        return {"script": response.choices[0].message.content}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/upload-script")
async def upload_script(request: UploadScriptRequest):
    try:
        prompt = f"""
Read this movie/TV script and extract 2–5 key characters.

Return a JSON array of objects, each with:
- name
- age
- role
- personality
- appearance
- voice_style

JSON format only. No extra commentary.

SCRIPT:
{request.script}
"""

        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}]
        )

        raw = response.choices[0].message.content.strip()

        try:
            characters = json.loads(raw)
        except json.JSONDecodeError:
            try:
                json_str = raw[raw.index("["): raw.rindex("]") + 1]
                characters = json.loads(json_str)
            except Exception:
                raise HTTPException(status_code=500, detail="Could not parse valid character data.")

        return {"characters": characters}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/generate-avatar")
async def generate_avatar(request: AvatarRequest):
    try:
        prompt = (
            f"portrait of {request.name}, age {request.age}, "
            f"{request.appearance}, personality: {request.personality}, "
            f"facial expression: {request.emotion}, ultra-detailed, "
            f"cinematic lighting, studio background"
        )

        replicate_api_token = os.getenv("REPLICATE_API_TOKEN")
        if not replicate_api_token:
            raise HTTPException(status_code=500, detail="Replicate API token is missing")

        response = requests.post(
            "https://api.replicate.com/v1/predictions",
            headers={
                "Authorization": f"Token {replicate_api_token}",
                "Content-Type": "application/json"
            },
            json={
                "version": "7b0b37de0758655e73a3adf2daaf8b67aa8c45135d25f4d832da1f3c651d4f9a",
                "input": {
                    "prompt": prompt,
                    "width": 512,
                    "height": 768,
                    "num_outputs": 1
                }
            }
        )

        if response.status_code != 201:
            raise HTTPException(status_code=500, detail="Failed to generate avatar")

        output = response.json()
        return {"avatar_url": output.get("urls", {}).get("get")}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
