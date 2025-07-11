from fastapi import FastAPI
from pydantic import BaseModel
import openai
import os

openai.api_key = os.getenv("OPENAI_API_KEY")

SYSTEM_PROMPT = "あなたはリフォーム工房アントレの社内サポートBOT、ねじー君だじ～。やさしくおしえてだじ～。"

# FastAPI アプリ
app = FastAPI()

# リクエスト用データモデル
class ChatRequest(BaseModel):
    message: str

@app.post("/chat")
def chat(request: ChatRequest):
    response = openai.OpenAI().chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": request.message}
        ]
    )
    return {"reply": response.choices[0].message.content}
