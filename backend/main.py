from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
import os
import json
import requests
import re
import logging

# --- SETUP LOGGING ---
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)

# --- FASTAPI APP ---
app = FastAPI()

# --- CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change to specific domains in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- OPENAI ---
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
    emotion: str

# --- ENDPOINTS ---

@app.post("/generate-script")
async def generate_script(request: ScriptRequest):
    try:
        logging.info(f"Generating script for: {request.title} | Genre: {request.genre}")

        prompt = f"""Write a 3-act TV or movie script based on:
Title: {request.title}
Genre: {request.genre}
Idea: {request.idea}
Structure it with a clear Beginning, Climax, and Ending."""

        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}]
        )

        script = response.choices[0].message.content
        logging.info("Script generated successfully.")
        return {"script": script}

    except Exception as e:
        logging.error(f"Script generation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Script generation failed: {str(e)}")


@app.post("/upload-script")
async def upload_script(request: UploadScriptRequest):
    try:
        logging.info("Parsing script to extract characters.")

        prompt = f"""
Extract 2–5 main characters from this script.

For each character, return a JSON object with:
- name
- age
- role
- personality
- appearance
- voice_style

Only return a JSON array. No extra commentary.

SCRIPT:
{request.script}
"""

        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}]
        )

        raw = response.choices[0].message.content.strip()
        logging.info("Raw OpenAI response received.")

        # Try parsing JSON content using regex
        json_match = re.search(r"\[.*\]", raw, re.DOTALL)
        if json_match:
            characters = json.loads(json_match.group())
            logging.info("Characters parsed successfully.")
        else:
            logging.warning("Failed to extract JSON from OpenAI response.")
            raise HTTPException(status_code=400, detail="Failed to parse character data. Try a simpler script.")

        return {"characters": characters}

    except Exception as e:
        logging.error(f"Upload parsing failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Upload parsing failed: {str(e)}")


@app.post("/generate-avatar")
async def generate_avatar(request: AvatarRequest):
    try:
        logging.info(f"Generating avatar for: {request.name}")

        full_prompt = (
            f"portrait of {request.name}, age {request.age}, {request.appearance}, "
            f"personality: {request.personality}, facial expression: {request.emotion}, "
            f"ultra-detailed, cinematic lighting, studio background"
        )

        replicate_api_token = os.getenv("REPLICATE_API_TOKEN")
        if not replicate_api_token:
            logging.error("Missing Replicate API token")
            raise HTTPException(status_code=500, detail="Missing Replicate API token")

        response = requests.post(
            "https://api.replicate.com/v1/predictions",
            headers={
                "Authorization": f"Token {replicate_api_token}",
                "Content-Type": "application/json"
            },
            json={
                "version": "7b0b37de0758655e73a3adf2daaf8b67aa8c45135d25f4d832da1f3c651d4f9a",
                "input": {
                    "prompt": full_prompt,
                    "width": 512,
                    "height": 768,
                    "num_outputs": 1
                }
            }
        )

        if response.status_code != 201:
            logging.warning("Replicate API failed to generate avatar.")
            raise HTTPException(status_code=500, detail="Avatar generation failed")

        output = response.json()
        logging.info("Avatar generated successfully.")
        return {"avatar_url": output.get("urls", {}).get("get")}

    except Exception as e:
        logging.error(f"Avatar generation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Avatar generation failed: {str(e)}")
