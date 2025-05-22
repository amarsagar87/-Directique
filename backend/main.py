@app.post("/upload-script")
async def upload_script(request: UploadScriptRequest):
    try:
        prompt = f"""
Return ONLY the key characters from this script (2–5 max) in *valid JSON* format.
Each character must include:
- name
- age
- role
- personality
- appearance
- voice_style

FORMAT:
[
  {{
    "name": "Name",
    "age": 30,
    "role": "Main role",
    "personality": "sarcastic, witty",
    "appearance": "tall, messy hair, glasses",
    "voice_style": "raspy and fast-talking"
  }}
]

DO NOT include any explanation. JUST the JSON array.

SCRIPT:
{request.script}
"""

        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}]
        )

        raw = response.choices[0].message.content.strip()

        # TEMP: return raw to see what breaks it
        return { "raw_output": raw }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
