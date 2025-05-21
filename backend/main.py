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

# OpenAI client (new SDK)
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Request model
class ScriptRequest(BaseModel):
    title: str
    genre: str
    idea: str

# API endpoint
@app.post("/generate-script")
async def generate_script(request: ScriptRequest):
    try:
        prompt = f"""Write a 3-act structured TV show or movie script based on the following:
Title: {request.title}
Genre: {request.genre}
Story Idea: {request.idea}
Include: Beginning, Climax, and Ending."""

        response = client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}]
        )

        script = response.choices[0].message.content
        return {"script": script}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
