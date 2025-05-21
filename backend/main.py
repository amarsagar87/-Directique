from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
import os
import json

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

JSON format only, no extra commentary.

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
                start = raw.index("[")
                end = raw.rindex("]") + 1
                json_str = raw[start:end]
                characters = json.loads(json_str)
            except Exception:
                raise HTTPException(status_code=500, detail="Could not parse valid character data.")

        return {"characters": json.dumps(characters)}  # ✅ return as string

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
