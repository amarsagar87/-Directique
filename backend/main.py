from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
from typing import List
import os

app = FastAPI()

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# OpenAI client (new SDK)
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Request model for script generation
class ScriptRequest(BaseModel):
    title: str
    genre: str
    idea: str

# Request model for uploaded script (for character extraction)
class UploadScriptRequest(BaseModel):
    script: str

# Endpoint 1: Generate a full 3-act script from an idea
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


# Endpoint 2: Upload a script and extract character profiles
@app.post("/upload-script")
async def upload_script(request: UploadScriptRequest):
    try:
        prompt = f"""
You are a script analyst. Extract a list of all characters from the following movie script.

For each character, generate a detailed JSON profile with:
- name
- age (guess if not mentioned)
- personality
- appearance
- voice_style
- role in story (e.g. protagonist, antagonist, comic relief)

Return only a JSON array of characters.

SCRIPT:
{request.script}
"""

        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "user", "content": prompt}
            ]
        )

        characters = response.choices[0].message.content
        return {"characters": characters}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
