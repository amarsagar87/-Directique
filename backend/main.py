from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
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

# OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Models
class ScriptRequest(BaseModel):
    title: str
    genre: str
    idea: str

class UploadScriptRequest(BaseModel):
    script: str

# Generate full script
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

# Upload script and extract characters
@app.post("/upload-script")
async def upload_script(request: UploadScriptRequest):
    try:
        prompt = f"""
Read this script and extract the main characters. For each character, return:
- name
- age (estimate)
- role (e.g. protagonist, supporting)
- personality (one sentence)
- appearance (one sentence)
- voice_style (e.g. deep, soft, raspy)

Output format: JSON array of character objects.

SCRIPT:
{request.script}
"""

        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}]
        )

        characters_text = response.choices[0].message.content

        # Sanitize: ensure string is returned
        return {"characters": characters_text}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
