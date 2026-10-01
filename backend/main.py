import os
import uuid
from contextlib import asynccontextmanager

from dotenv import load_dotenv

load_dotenv()

import httpx
from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from agent.graph import compiled_graph
from agent.state import LearnerState
from backend.database import TutorSessionRecord, close_database, get_db, init_database
from backend.learning import router as learning_router
from sqlalchemy.orm import Session
from fastapi import Depends


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_database()
    try:
        yield
    finally:
        close_database()


app = FastAPI(title="EduAgent API", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(learning_router)


@app.get("/api/healthz")
@app.get("/health")
def health():
    return {"status": "ok"}


@app.api_route("/api/__clerk/{clerk_path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])
async def clerk_proxy(clerk_path: str, request: Request):
    secret = os.getenv("CLERK_SECRET_KEY")
    if not secret:
        raise HTTPException(status_code=503, detail="Clerk proxy is not configured")
    host = (request.headers.get("x-forwarded-host") or request.headers.get("host", "")).split(",", 1)[0].strip()
    protocol = request.headers.get("x-forwarded-proto", "https").split(",", 1)[0].strip()
    headers = {key: value for key, value in request.headers.items() if key.lower() not in {"host", "content-length", "connection"}}
    headers["Clerk-Proxy-Url"] = f"{protocol}://{host}/api/__clerk"
    headers["Clerk-Secret-Key"] = secret
    url = f"https://frontend-api.clerk.dev/{clerk_path}"
    if request.url.query:
        url += f"?{request.url.query}"
    async with httpx.AsyncClient(timeout=30, follow_redirects=False) as client:
        upstream = await client.request(request.method, url, headers=headers, content=await request.body())
    response_headers = {key: value for key, value in upstream.headers.items() if key.lower() not in {"transfer-encoding", "connection", "content-encoding"}}
    return Response(upstream.content, status_code=upstream.status_code, headers=response_headers)


class StartRequest(BaseModel):
    topic: str


class DiagnosticAnswersRequest(BaseModel):
    session_id: str
    answers: list[str]


class AnswerRequest(BaseModel):
    session_id: str
    answer: str


@app.post("/session/start")
def start_session(req: StartRequest, db: Session = Depends(get_db)):
    session_id = str(uuid.uuid4())
    state: LearnerState = {"session_id": session_id, "requested_topic": req.topic, "phase": "start"}
    result = compiled_graph.invoke(state)
    db.add(TutorSessionRecord(session_id=session_id, state=result))
    db.commit()
    return {"session_id": session_id, "questions": result["diagnostic_questions"]}


@app.post("/session/diagnose-answers")
def submit_diagnostic_answers(req: DiagnosticAnswersRequest, db: Session = Depends(get_db)):
    record = db.get(TutorSessionRecord, req.session_id)
    if record is None:
        raise HTTPException(404, "Session not found")
    state = dict(record.state)
    state["diagnostic_answers"] = req.answers
    result = compiled_graph.invoke(state)
    record.state = result
    db.commit()
    index = result["current_topic_index"]
    return {"diagnosed_level": result["diagnosed_level"], "learning_path": result["learning_path"], "current_topic": result["learning_path"][index], "explanation": result["last_explanation"], "question": result["last_question"]}


@app.post("/session/answer")
def submit_answer(req: AnswerRequest, db: Session = Depends(get_db)):
    record = db.get(TutorSessionRecord, req.session_id)
    if record is None:
        raise HTTPException(404, "Session not found")
    state = dict(record.state)
    state["last_answer"] = req.answer
    result = compiled_graph.invoke(state)
    record.state = result
    db.commit()
    response = {"correct": result["last_correct"], "feedback": result["last_feedback"], "completed_topics": result["completed_topics"], "weak_topics": result["weak_topics"], "done": result["phase"] == "done"}
    if result["phase"] != "done":
        index = result["current_topic_index"]
        response.update({"next_topic": result["learning_path"][index], "explanation": result["last_explanation"], "question": result["last_question"]})
    return response
