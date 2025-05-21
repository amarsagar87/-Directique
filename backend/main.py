from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import openai
import os
from fastapi.middleware.cors import CORSMiddleware

openai.api_key = os.getenv("OPENAI_API_KEY")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ScriptRequest(BaseModel):
    title: str
    genre: str
    idea: str

@app.post("/generate-script")
async def generate_script(request: ScriptRequest):
    try:
        prompt = f"Write a 3-act structured TV show or movie script based on the following:\\nTitle: {request.title}\\nGenre: {request.genre}\\nStory Idea: {request.idea}\\nInclude: Beginning, Climax, and Ending."
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}]
        )
        script = response.choices[0].message['content']
        return {"script": script}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
