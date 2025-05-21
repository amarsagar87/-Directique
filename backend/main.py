from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
import os
import json
import requests

app = FastAPI()

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# --- MODELS ---
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

# --- ENDPOINTS ---

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

        script = response.choices[0].message.content
        return {"script": script}

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

        # Try parsing the JSON directly
        try:
            characters = json.loads(raw)
        except json.JSONDecodeError:
            # Try extracting JSON substring manually
            try:
                start = raw.index("[")
                end = raw.rindex("]") + 1
                json_str = raw[start:end]
                characters = json.loads(json_str)
            except Exception:
                raise HTTPException(status_code=500, detail="Could not parse valid character data.")

        return {"characters": characters}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/generate-avatar")
async def generate_avatar(request: AvatarRequest):
    try:
        # Combine details for the prompt
        full_prompt = f"portrait of {request.name}, age {request.age}, {request.appearance}, personality: {request.personality}, facial expression: {request.emotion}, ultra-detailed, cinematic lighting, studio background"

        # Replicate API call
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
                "version": "7b0b37de0758655e73a3adf2daaf8b67aa8c45135d25f4d832da1f3c651d4f9a",  # example: stable-diffusion 1.5
                "input": {
                    "prompt": full_prompt,
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
