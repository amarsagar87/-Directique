from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
import os
import json
import re
import requests
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)

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
        logging.info(f"Generating script for: {request.title}")

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
        logging.error(f"Script generation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/upload-script")
async def upload_script(request: UploadScriptRequest):
    try:
        logging.info("Extracting characters from uploaded script...")

        prompt = f"""
Read this movie/TV script and extract 2–5 key characters.

Return a JSON array of objects, each with:
- name
- age
- role
- personality
- appearance
- voice_style

Only return JSON. No extra commentary or formatting.

SCRIPT:
{request.script}
"""

        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}]
        )

        raw = response.choices[0].message.content.strip()
        logging.info(f"Raw OpenAI response:\n{raw}")

        # Try extracting JSON
        json_str = ""
        if raw.startswith("[") and raw.endswith("]"):
            json_str = raw
        else:
            match = re.search(r"\[.*\]", raw, re.DOTALL)
            if match:
                json_str = match.group(0)
            else:
                raise HTTPException(status_code=400, detail="Could not find character list. Try simplifying the script.")

        characters = json.loads(json_str)
        logging.info(f"Characters extracted: {characters}")
        return {"characters": characters}

    except Exception as e:
        logging.error(f"Failed to parse characters: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to parse character data. Try a simpler script.")


@app.post("/generate-avatar")
async def generate_avatar(request: AvatarRequest):
    try:
        logging.info(f"Generating avatar for {request.name}...")

        full_prompt = f"portrait of {request.name}, age {request.age}, {request.appearance}, personality: {request.personality}, facial expression: {request.emotion}, ultra-detailed, cinematic lighting, studio background"

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
                "version": "7b0b37de0758655e73a3adf2daaf8b67aa8c45135d25f4d832da1f3c651d4f9a",  # Stable Diffusion
                "input": {
                    "prompt": full_prompt,
                    "width": 512,
                    "height": 768,
                    "num_outputs": 1
                }
            }
        )

        if response.status_code != 201:
            logging.error(f"Replicate API error: {response.text}")
            raise HTTPException(status_code=500, detail="Failed to generate avatar")

        output = response.json()
        avatar_url = output.get("urls", {}).get("get")
        logging.info(f"Avatar URL: {avatar_url}")
        return {"avatar_url": avatar_url}

    except Exception as e:
        logging.error(f"Avatar generation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
