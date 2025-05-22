from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
import os
import json
import requests
import re

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

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
    emotion: str

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
Read this movie or TV script and return 2–5 main characters in this JSON format:

[
  {{
    "name": "Character Name",
    "age": 30,
    "role": "short role description",
    "personality": "1-2 words",
    "appearance": "brief look",
    "voice_style": "tone/style of speaking"
  }}
]

Return ONLY JSON. Do not add extra text.

SCRIPT:
{request.script}
"""

        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}]
        )

        raw = response.choices[0].message.content.strip()

        # Clean up non-JSON parts if any
        json_str_match = re.search(r"\[\s*{.*?}\s*]", raw, re.DOTALL)
        if not json_str_match:
            raise HTTPException(status_code=500, detail="AI returned invalid data. Try a simpler script.")

        characters_json = json_str_match.group()
        characters = json.loads(characters_json)

        # Optional: validate structure
        for char in characters:
            for field in ["name", "age", "role", "personality", "appearance", "voice_style"]:
                if field not in char:
                    raise HTTPException(status_code=500, detail=f"Missing '{field}' in character output.")

        return {"characters": characters}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/generate-avatar")
async def generate_avatar(request: AvatarRequest):
    try:
        prompt = f"portrait of {request.name}, age {request.age}, {request.appearance}, personality: {request.personality}, facial expression: {request.emotion}, ultra-detailed, cinematic lighting, studio background"

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
