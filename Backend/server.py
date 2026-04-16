import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import asyncio
import json
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from dotenv import load_dotenv
load_dotenv()

from Debate.Debate import Debate


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class ParticipantInput(BaseModel):
    model: str
    role: str

class DebateRequest(BaseModel):
    rounds: int
    participants: list[ParticipantInput]
    user_prompt: str


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/debate/stream")
async def debate_stream(request: DebateRequest):
    queue = asyncio.Queue()

    async def on_event(event):
        await queue.put(event)

    debate = Debate(
        rounds=request.rounds,
        participants=[p.model_dump() for p in request.participants],
        user_prompt=request.user_prompt,
    )

    async def run():
        try:
            await debate.run_debate(on_event=on_event)
            await queue.put({
                "type": "debate_complete",
                "final_answer": debate.final_answer,
                "history": debate.history,
            })
        except Exception as e:
            await queue.put({"type": "error", "message": str(e)})
        finally:
            await queue.put(None)

    async def stream():
        asyncio.create_task(run())
        while True:
            event = await queue.get()
            if event is None:
                break
            yield json.dumps(event) + "\n"

    return StreamingResponse(stream(), media_type="application/x-ndjson")
