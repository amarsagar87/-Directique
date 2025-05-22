from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
import os
import json
import requests
import logging

# --- Logging setup ---
logger = logging.getLogger("directique")
logger.setLevel(logging.DEBUG)
handler = logging.StreamHandler()
formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)
logger.addHandler(handler)

# --- FastAPI App ---
app = FastAPI()

# --- CORS Middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- OpenAI Client ---
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# --- Models ---
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

# --- Endpoints ---

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
        logger.info("Script successfully generated")
        return {"script": script}

    except Exception as e:
        logger.exception("Script generation failed")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/upload-script")
async def upload_script(request: UploadScriptRequest):
    try:
        prompt = f"""
Analyze this script and extract a JSON array of 2–5 main characters.
Return a list where each object contains:
- name
- age (if mentioned)
- role
- personality
- appearance
- voice_style
Return only valid JSON. No explanations or extra comments.

SCRIPT:
{request.script}
"""

        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}]
        )

        raw = response.choices[0].message.content.strip()
        logger.debug(f"Raw response from OpenAI:\n{raw}")

        try:
            characters = json.loads(raw)
        except json.JSONDecodeError:
            logger.warning("Initial JSON parsing failed. Trying to extract JSON substring...")
            try:
                start = raw.index("[")
                end = raw.rindex("]") + 1
                characters = json.loads(raw[start:end])
            except Exception as inner_e:
                logger.exception("JSON extraction failed")
                raise HTTPException(status_code=500, detail="Could not parse valid character data.")

        logger.info(f"Parsed characters: {characters}")
        return {"characters": characters}

    except Exception as e:
        logger.exception("Character extraction failed")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/generate-avatar")
async def generate_avatar(request: AvatarRequest):
    try:
        full_prompt = f"portrait of {request.name}, age {request.age}, {request.appearance}, personality: {request.personality}, facial expression: {request.emotion}, ultra-detailed, cinematic lighting, studio background"
        logger.debug(f"Avatar prompt: {full_prompt}")

        replicate_api_token = os.getenv("REPLICATE_API_TOKEN")
        if not replicate_api_token:
            logger.error("Missing Replicate API token")
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
                    "prompt": full_prompt,
                    "width": 512,
                    "height": 768,
                    "num_outputs": 1
                }
            }
        )

        logger.debug(f"Replicate status: {response.status_code}")
        logger.debug(f"Replicate raw output: {response.text}")

        if response.status_code not in [200, 201]:
            raise HTTPException(status_code=500, detail="Failed to generate avatar")

        output = response.json()
        avatar_url = output.get("urls", {}).get("get")
        if not avatar_url:
            raise HTTPException(status_code=500, detail="Avatar URL missing from response")

        logger.info(f"Generated avatar: {avatar_url}")
        return {"avatar_url": avatar_url}

    except Exception as e:
        logger.exception("Avatar generation failed")
        raise HTTPException(status_code=500, detail=str(e))
