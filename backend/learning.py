from copy import deepcopy
from datetime import datetime, timezone
from hashlib import sha256
from html.parser import HTMLParser
from typing import Annotated
from uuid import uuid4
from urllib.parse import unquote

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field

from backend.auth import current_user_id
from backend.curriculum import CONCEPTS, TRACKS, get_concept, get_track_concepts, topic_catalog
from backend.database import (
    DiagnosticRecord,
    LearnerRecord,
    PeerConversationMemberRecord,
    PeerConversationRecord,
    PeerMessageRecord,
    PracticeRecord,
    TutorDocumentRecord,
    TutorMessageRecord,
    get_db,
)
from backend.lesson_extras import enrich_lesson
from backend.tutor_routing import answer_tutor_question
from backend.workflows import complete, enrich_practice, generate_lesson, generate_onboarding_questions
from sqlalchemy.orm import Session

router = APIRouter(prefix="/api", dependencies=[Depends(current_user_id)])

activity = [
    {"day": day, "minutes": minutes, "isToday": day == "Sun"}
    for day, minutes in [("Mon", 32), ("Tue", 18), ("Wed", 46), ("Thu", 27), ("Fri", 54), ("Sat", 12), ("Sun", 38)]
]
seed_dashboard = {
    "learnerName": "Learner", "greeting": "Welcome back", "currentTopic": "",
    "currentTopicLabel": "Your first lesson", "progressPercent": 0,
    "streakDays": 0, "weeklyMinutes": 0, "completedTopics": 0, "totalTopics": 0,
    "nextAction": "Start your first lesson", "weeklyActivity": activity,
    "focusAreas": [],
}
practice_prompt = {"id": "embeddings-check", "topic": "Embeddings", "title": "A five-minute mental model", "prompt": "Why can two sentences with completely different words still end up close together in embedding space?", "options": ["Because the model maps related meaning to nearby vectors", "Because every sentence has the same number of words", "Because embeddings only compare exact spelling", "Because the database sorts them alphabetically"], "minutes": 5, "difficulty": "Just right"}


def learner(db: Session, user_id: str) -> LearnerRecord:
    record = db.get(LearnerRecord, user_id)
    if record is None:
        record = LearnerRecord(user_id=user_id, profile={}, dashboard=deepcopy(seed_dashboard), learning_path=[])
        db.add(record)
        db.commit()
        db.refresh(record)
    return record


def personalize_legacy_record(record: LearnerRecord, user_id: str, db: Session) -> None:
    if not record.profile.get("userName") or record.profile.get("planVersion") == 2:
        return
    previously_completed = {
        (item.get("id"), item.get("title"))
        for item in (record.learning_path or [])
        if item.get("status") == "completed"
    }
    result = complete("onboarding", {
        **record.profile,
        "answers": record.profile.get("assessmentSignals", []),
        "userVariant": sha256(user_id.encode()).hexdigest()[:8],
    })
    path = result["path"]
    for item in path:
        if (item.get("id"), item.get("title")) in previously_completed:
            item["status"] = "completed"
    first_incomplete = next((item for item in path if item.get("status") != "completed"), None)
    if first_incomplete:
        first_incomplete["status"] = "current"
    record.learning_path = path
    record.profile = {
        **record.profile,
        "planVersion": 2,
        "level": result["evaluatedLevel"],
        "assessmentAccuracy": result["accuracyPercent"],
        "strengths": result.get("strengths", []),
        "focusAreas": result.get("focusAreas", []),
    }
    first = first_incomplete or (path[0] if path else None)
    done_count = sum(item.get("status") == "completed" for item in path)
    record.dashboard = {
        **record.dashboard,
        "currentTopic": first["id"] if first else "",
        "currentTopicLabel": first["title"] if first else result["focusLabel"],
        "completedTopics": done_count,
        "totalTopics": len(record.learning_path),
        "progressPercent": round(100 * done_count / max(1, len(path))),
        "nextAction": (
            f"Continue with {first['title']}" if first_incomplete and done_count
            else f"Start with {first['title']}" if first_incomplete
            else "Your personalized path is complete. Choose a new topic to keep exploring." if path
            else "Explore your learning path"
        ),
        "focusAreas": result.get("focusAreas", []),
    }
    db.commit()


class Onboarding(BaseModel):
    userName: str
    gender: str
    ageGroup: str
    role: str
    focus: str
    answers: list[str]


class OnboardingProfile(BaseModel):
    role: str
    ageGroup: str
    focus: str


class Diagnostic(BaseModel):
    topic: str
    answer: str
    claimedLevel: str


class PracticeCompletion(BaseModel):
    promptId: str
    answer: str
    activityId: str | None = None


class TutorMessage(BaseModel):
    message: str = Field(min_length=1, max_length=8000)
    topic: str | None = None


class TutorTopicContext(BaseModel):
    topic: str = Field(min_length=1, max_length=160)


class PeerConversationCreate(BaseModel):
    memberIds: list[str] = Field(min_length=1, max_length=19)
    name: str | None = Field(default=None, max_length=120)


class PeerMessageInput(BaseModel):
    body: str = Field(min_length=1, max_length=4000)


class _HTMLText(HTMLParser):
    def __init__(self):
        super().__init__()
        self.parts: list[str] = []

    def handle_data(self, data: str) -> None:
        self.parts.append(data)


@router.get("/dashboard")
def dashboard(user_id: Annotated[str, Depends(current_user_id)], db: Session = Depends(get_db)):
    return learner(db, user_id).dashboard


@router.get("/profile")
def learner_profile(user_id: Annotated[str, Depends(current_user_id)], db: Session = Depends(get_db)):
    record = learner(db, user_id)
    personalize_legacy_record(record, user_id, db)
    return {
        "onboardingComplete": bool(record.profile.get("userName")),
        "profile": record.profile,
    }


@router.get("/learning-path")
def learning_path(user_id: Annotated[str, Depends(current_user_id)], db: Session = Depends(get_db)):
    record = learner(db, user_id)
    personalize_legacy_record(record, user_id, db)
    return record.learning_path


@router.get("/topics")
def get_topics(user_id: Annotated[str, Depends(current_user_id)], db: Session = Depends(get_db)):
    record = learner(db, user_id)
    personalize_legacy_record(record, user_id, db)
    completed_ids = {item["id"] for item in record.learning_path if item.get("status") == "completed"}
    catalog = topic_catalog()
    for topic in catalog:
        track_ids = [concept_id for concept_id, item in CONCEPTS.items() if item["trackId"] == topic["id"]]
        topic["progressPercent"] = round(100 * sum(cid in completed_ids for cid in track_ids) / max(1, len(track_ids)))
    return catalog


@router.get("/topics/{track_id}/concepts")
def get_topic_concepts(track_id: str, user_id: Annotated[str, Depends(current_user_id)], db: Session = Depends(get_db)):
    if track_id not in TRACKS:
        raise HTTPException(status_code=404, detail="Topic track not found")
    record = learner(db, user_id)
    status_by_id = {item["id"]: item.get("status", "upcoming") for item in record.learning_path}
    return [
        {**concept, "status": status_by_id.get(concept["id"], "upcoming")}
        for concept in get_track_concepts(track_id)
    ]


@router.get("/daily-practice")
def daily_practice(user_id: Annotated[str, Depends(current_user_id)], db: Session = Depends(get_db)):
    record = learner(db, user_id)
    current = next((item for item in record.learning_path if item.get("status") == "current"), None)
    if current is None:
        return enrich_practice(practice_prompt, {"title": practice_prompt["topic"]})
    prompt = current.get("practicePrompt")
    if prompt is None:
        prompt = complete("practice_prompt", {
            "concept": {"title": current["title"], "description": current["description"]},
            "level": record.profile.get("level", "beginner"),
            "focus": record.profile.get("focus", "fundamentals"),
        })
    enriched_prompt = enrich_practice(prompt, current)
    if enriched_prompt != prompt:
        current["practicePrompt"] = enriched_prompt
        record.learning_path = deepcopy(record.learning_path)
        db.commit()
    prompt = enriched_prompt
    return {
        **prompt,
        "id": f"{current['id']}-practice",
        "topic": current["title"],
        "difficulty": record.profile.get("level", prompt.get("difficulty", "beginner")),
    }


@router.post("/onboarding/questions")
def onboarding_questions(body: OnboardingProfile):
    return generate_onboarding_questions(body.model_dump())


@router.post("/diagnostic/submit")
def submit_diagnostic(body: Diagnostic, user_id: Annotated[str, Depends(current_user_id)], db: Session = Depends(get_db)):
    result = complete("diagnostic", body.model_dump())
    db.add(DiagnosticRecord(user_id=user_id, topic=body.topic, answer=body.answer, claimed_level=body.claimedLevel, evaluated_level=result["evaluatedLevel"], accuracy_percent=int(result["accuracyPercent"]), result=result))
    db.commit()
    return result


@router.post("/onboarding/complete")
def complete_onboarding(body: Onboarding, user_id: Annotated[str, Depends(current_user_id)], db: Session = Depends(get_db)):
    learner_input = {
        **body.model_dump(),
        "userVariant": sha256(user_id.encode()).hexdigest()[:8],
    }
    result = complete("onboarding", learner_input)
    data = learner(db, user_id)
    path = result["path"]
    data.profile = {
        "userName": body.userName,
        "gender": body.gender,
        "ageGroup": body.ageGroup,
        "role": body.role,
        "focus": body.focus,
        "level": result["evaluatedLevel"],
        "assessmentAccuracy": result["accuracyPercent"],
        "strengths": result.get("strengths", []),
        "focusAreas": result.get("focusAreas", []),
        "assessmentSignals": body.answers,
        "planVersion": 2,
    }
    data.learning_path = path
    first = path[0] if path else None
    data.dashboard = {
        **data.dashboard,
        "learnerName": body.userName,
        "greeting": f"Welcome back, {body.userName}",
        "currentTopic": first["id"] if first else "",
        "currentTopicLabel": first["title"] if first else result["focusLabel"],
        "progressPercent": 0,
        "completedTopics": 0,
        "totalTopics": len(path),
        "nextAction": f"Start with {first['title']}" if first else "Explore your learning path",
        "focusAreas": result.get("focusAreas", []),
    }
    db.commit()
    return {key: value for key, value in result.items() if key != "path"}


@router.get("/learning-path/{concept_id}/lesson")
def get_lesson(concept_id: str, user_id: Annotated[str, Depends(current_user_id)], db: Session = Depends(get_db)):
    record = learner(db, user_id)
    path = deepcopy(record.learning_path)
    node = next((item for item in path if item.get("id") == concept_id), None)
    in_path = node is not None
    if node is None:
        node = get_concept(concept_id)
    if node is None:
        raise HTTPException(status_code=404, detail="Lesson not found in this learner's path")
    lesson = node.get("lessonContent") if in_path else record.profile.get("exploredLessons", {}).get(concept_id)
    if lesson is None:
        lesson = generate_lesson({
            "concept": {key: node.get(key) for key in ("id", "title", "category", "trackId", "description")},
            "learner": {
                "level": record.profile.get("level", "beginner"),
                "role": record.profile.get("role", "curious"),
                "focus": record.profile.get("focus", "fundamentals"),
                "strengths": record.profile.get("strengths", []),
                "focusAreas": record.profile.get("focusAreas", []),
            },
        })
        if in_path:
            node["lessonContent"] = lesson
            record.learning_path = path
        else:
            record.profile = {
                **record.profile,
                "exploredLessons": {**record.profile.get("exploredLessons", {}), concept_id: lesson},
            }
    else:
        lesson = enrich_lesson(node, lesson)
    if in_path:
        node["lessonContent"] = lesson
        record.learning_path = path
    else:
        record.profile = {
            **record.profile,
            "exploredLessons": {**record.profile.get("exploredLessons", {}), concept_id: lesson},
        }
    db.commit()
    return {"conceptId": concept_id, "title": node["title"], **lesson}


@router.post("/learning-path/{concept_id}/complete")
def complete_lesson(concept_id: str, user_id: Annotated[str, Depends(current_user_id)], db: Session = Depends(get_db)):
    record = learner(db, user_id)
    path = deepcopy(record.learning_path)
    completed = next((item for item in path if item.get("id") == concept_id), None)
    if completed is None:
        completed = get_concept(concept_id)
        if completed is None:
            raise HTTPException(status_code=404, detail="Lesson not found")
        completed.update(status="upcoming", order=len(path) + 1, confidence=0, fitNote="Elective concept explored from the topic map.", elective=True)
        path.append(completed)
    completed["status"] = "completed"
    next_node = next((item for item in path if not item.get("elective") and item.get("status") != "completed"), None)
    if next_node:
        next_node["status"] = "current"
    record.learning_path = path
    planned_path = [item for item in path if not item.get("elective")]
    done_count = sum(item.get("status") == "completed" for item in planned_path)
    if next_node:
        next_action = f"Continue with {next_node['title']}"
        current_id = next_node["id"]
        current_title = next_node["title"]
    else:
        next_action = "Your personalized path is complete. Choose a new topic to keep exploring."
        current_id = concept_id
        current_title = completed["title"]
    record.dashboard = {
        **record.dashboard,
        "completedTopics": done_count,
        "totalTopics": len(planned_path),
        "progressPercent": round(100 * done_count / max(1, len(planned_path))),
        "currentTopic": current_id,
        "currentTopicLabel": current_title,
        "nextAction": next_action,
    }
    db.commit()
    return {"learningPath": path, "dashboard": record.dashboard}


@router.post("/practice/complete")
def complete_practice(body: PracticeCompletion, user_id: Annotated[str, Depends(current_user_id)], db: Session = Depends(get_db)):
    data = learner(db, user_id)
    matching_node = next(
        (item for item in data.learning_path if f"{item.get('id')}-practice" == body.promptId),
        None,
    )
    if matching_node is not None:
        active_practice = matching_node.get("practicePrompt")
        if not isinstance(active_practice, dict) or not active_practice.get("prompt"):
            active_practice = complete("practice_prompt", {
                "concept": {"title": matching_node.get("title", "this concept"), "description": matching_node.get("description", "")},
                "level": data.profile.get("level", "beginner"),
                "focus": data.profile.get("focus", "fundamentals"),
            })
            matching_node["practicePrompt"] = active_practice
            data.learning_path = deepcopy(data.learning_path)
            db.commit()
        active_practice = enrich_practice(active_practice, matching_node)
        selected_activity = next(
            (item for item in active_practice.get("activities", []) if item.get("id") == body.activityId),
            None,
        ) if body.activityId else None
        if body.activityId and selected_activity is None:
            raise HTTPException(status_code=404, detail="Practice activity not found. Refresh today's practice and try again.")
    elif body.promptId == practice_prompt["id"]:
        active_practice = practice_prompt
        active_practice = enrich_practice(active_practice, {"title": practice_prompt["topic"]})
        selected_activity = next(
            (item for item in active_practice["activities"] if item["id"] == body.activityId),
            None,
        ) if body.activityId else None
        if body.activityId and selected_activity is None:
            raise HTTPException(status_code=404, detail="Practice activity not found. Refresh today's practice and try again.")
    else:
        raise HTTPException(status_code=404, detail="Practice question not found. Refresh today's practice and try again.")

    result = complete("practice", {
        "prompt": selected_activity["prompt"] if selected_activity else active_practice["prompt"],
        "activity": selected_activity or {"type": "multiple_choice"},
        "answer": body.answer,
        "level": data.profile.get("level", "beginner"),
        "focus": data.profile.get("focus", "fundamentals"),
    })
    # Practice contributes study time and feedback, while path progress changes
    # only when the learner completes a lesson.
    data.dashboard = {**data.dashboard, "weeklyMinutes": data.dashboard["weeklyMinutes"] + 5, "streakDays": data.dashboard["streakDays"] + 1}
    saved_prompt_id = f"{body.promptId}:{body.activityId}" if body.activityId else body.promptId
    db.add(PracticeRecord(user_id=user_id, prompt_id=saved_prompt_id, answer=body.answer, correct=bool(result["correct"]), score_percent=int(result["scorePercent"]), feedback=result["feedback"], next_step=result["nextStep"]))
    db.commit()
    return result


@router.get("/peers")
def get_peers(user_id: Annotated[str, Depends(current_user_id)], db: Session = Depends(get_db)):
    current = learner(db, user_id)
    learners = db.query(LearnerRecord).all()
    current_focus = {
        str(value).strip().lower()
        for value in [current.profile.get("focus"), current.dashboard.get("currentTopicLabel"), *(current.profile.get("focusAreas") or [])]
        if value
    }
    colors = ["#dce9e0", "#fae4bf", "#e5e3f5", "#d8eceb"]
    peers = []
    for candidate in learners:
        name = str(candidate.profile.get("userName", "")).strip()
        if candidate.user_id == user_id or not name:
            continue
        candidate_focus = {
            str(value).strip().lower()
            for value in [candidate.profile.get("focus"), candidate.dashboard.get("currentTopicLabel"), *(candidate.profile.get("focusAreas") or [])]
            if value
        }
        overlap = current_focus.intersection(candidate_focus)
        match = min(99, 65 + 12 * len(overlap))
        if current.profile.get("role") and current.profile.get("role") == candidate.profile.get("role"):
            match = min(99, match + 5)
        initials = "".join(part[0] for part in name.split()[:2]).upper()
        peers.append({
            "id": sha256(candidate.user_id.encode()).hexdigest()[:32],
            "name": name,
            "role": candidate.profile.get("role", "Learner"),
            "focus": candidate.dashboard.get("currentTopicLabel") or candidate.profile.get("focus", "Exploring AI"),
            "level": candidate.profile.get("level", "Learning"),
            "matchPercent": match,
            "initials": initials,
            "accent": colors[int(sha256(candidate.user_id.encode()).hexdigest()[:2], 16) % len(colors)],
        })
    return sorted(peers, key=lambda peer: (-peer["matchPercent"], peer["name"].lower()))


def _peer_directory(db: Session) -> dict[str, LearnerRecord]:
    return {
        sha256(record.user_id.encode()).hexdigest()[:32]: record
        for record in db.query(LearnerRecord).all()
        if str(record.profile.get("userName", "")).strip()
    }


def _peer_name(record: LearnerRecord | None) -> str:
    return str(record.profile.get("userName", "Learner")).strip() if record else "Learner"


def _conversation_members(db: Session, conversation_id: str) -> list[str]:
    return [row.user_id for row in db.query(PeerConversationMemberRecord).filter_by(conversation_id=conversation_id).all()]


def _require_conversation_member(db: Session, conversation_id: str, user_id: str) -> PeerConversationRecord:
    conversation = db.get(PeerConversationRecord, conversation_id)
    is_member = db.query(PeerConversationMemberRecord).filter_by(conversation_id=conversation_id, user_id=user_id).first()
    if not conversation or not is_member:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conversation


@router.get("/peers/conversations")
def list_peer_conversations(user_id: Annotated[str, Depends(current_user_id)], db: Session = Depends(get_db)):
    memberships = db.query(PeerConversationMemberRecord).filter_by(user_id=user_id).all()
    result = []
    for membership in memberships:
        conversation = db.get(PeerConversationRecord, membership.conversation_id)
        if not conversation:
            continue
        member_ids = _conversation_members(db, conversation.id)
        members = [db.get(LearnerRecord, member_id) for member_id in member_ids]
        others = [_peer_name(member) for member in members if member and member.user_id != user_id]
        latest = db.query(PeerMessageRecord).filter_by(conversation_id=conversation.id).order_by(PeerMessageRecord.created_at.desc(), PeerMessageRecord.id.desc()).first()
        result.append({
            "id": conversation.id,
            "name": conversation.name or (", ".join(others) if conversation.is_group else (others[0] if others else "Conversation")),
            "isGroup": conversation.is_group,
            "members": [{"id": sha256(member.user_id.encode()).hexdigest()[:32], "name": _peer_name(member)} for member in members if member],
            "lastMessage": latest.body if latest else "Start the conversation",
            "updatedAt": (latest.created_at if latest else conversation.updated_at).isoformat() if (latest.created_at if latest else conversation.updated_at) else None,
        })
    return sorted(result, key=lambda item: item["updatedAt"] or "", reverse=True)


@router.post("/peers/conversations")
def create_peer_conversation(body: PeerConversationCreate, user_id: Annotated[str, Depends(current_user_id)], db: Session = Depends(get_db)):
    requested_ids = list(dict.fromkeys(body.memberIds))
    directory = _peer_directory(db)
    if any(peer_id not in directory for peer_id in requested_ids):
        raise HTTPException(status_code=404, detail="One or more learners are no longer available")
    participant_ids = {user_id, *(directory[peer_id].user_id for peer_id in requested_ids)}
    if len(participant_ids) < 2:
        raise HTTPException(status_code=422, detail="Choose at least one other learner")
    if len(participant_ids) > 20:
        raise HTTPException(status_code=422, detail="A peer group can have up to 20 members")
    is_group = len(participant_ids) > 2
    if not is_group:
        for membership in db.query(PeerConversationMemberRecord).filter_by(user_id=user_id).all():
            existing_members = set(_conversation_members(db, membership.conversation_id))
            conversation = db.get(PeerConversationRecord, membership.conversation_id)
            if conversation and not conversation.is_group and existing_members == participant_ids:
                other_user_id = next(iter(participant_ids - {user_id}))
                return {"id": conversation.id, "name": _peer_name(db.get(LearnerRecord, other_user_id)), "isGroup": False}
    conversation = PeerConversationRecord(
        id=str(uuid4()), created_by=user_id, name=body.name.strip() if is_group and body.name and body.name.strip() else None,
        is_group=is_group,
    )
    db.add(conversation)
    # Persist the referenced row before adding its member rows. There is no ORM
    # relationship between these models, so make the foreign-key insert order explicit.
    db.flush()
    for member_id in participant_ids:
        db.add(PeerConversationMemberRecord(conversation_id=conversation.id, user_id=member_id))
    db.commit()
    return {"id": conversation.id, "name": conversation.name or "Group conversation", "isGroup": conversation.is_group}


@router.get("/peers/conversations/{conversation_id}/messages")
def get_peer_messages(conversation_id: str, user_id: Annotated[str, Depends(current_user_id)], db: Session = Depends(get_db)):
    _require_conversation_member(db, conversation_id, user_id)
    records = list(reversed(db.query(PeerMessageRecord).filter_by(conversation_id=conversation_id).order_by(PeerMessageRecord.created_at.desc(), PeerMessageRecord.id.desc()).limit(500).all()))
    names = {member_id: _peer_name(db.get(LearnerRecord, member_id)) for member_id in _conversation_members(db, conversation_id)}
    return [{
        "id": str(message.id), "senderId": sha256(message.sender_id.encode()).hexdigest()[:32],
        "senderName": names.get(message.sender_id, "Learner"), "isMine": message.sender_id == user_id, "body": message.body,
        "createdAt": message.created_at.isoformat() if message.created_at else None,
    } for message in records]


@router.post("/peers/conversations/{conversation_id}/messages")
def send_peer_message(conversation_id: str, body: PeerMessageInput, user_id: Annotated[str, Depends(current_user_id)], db: Session = Depends(get_db)):
    conversation = _require_conversation_member(db, conversation_id, user_id)
    message_text = body.body.strip()
    if not message_text:
        raise HTTPException(status_code=422, detail="Enter a message before sending")
    message = PeerMessageRecord(conversation_id=conversation_id, sender_id=user_id, body=message_text)
    conversation.updated_at = datetime.now(timezone.utc)
    db.add(message)
    db.commit()
    db.refresh(message)
    return {"id": str(message.id), "senderId": sha256(user_id.encode()).hexdigest()[:32], "senderName": _peer_name(db.get(LearnerRecord, user_id)), "isMine": True, "body": message.body, "createdAt": message.created_at.isoformat() if message.created_at else None}


@router.put("/tutor/context")
def save_tutor_context(body: TutorTopicContext, user_id: Annotated[str, Depends(current_user_id)], db: Session = Depends(get_db)):
    record = learner(db, user_id)
    topic = body.topic.strip()
    if not topic:
        raise HTTPException(status_code=422, detail="Enter a topic to use as tutor context.")
    record.profile = {**record.profile, "tutorTopic": topic}
    db.commit()
    return {"topic": topic}


@router.post("/tutor/message")
def tutor_message(body: TutorMessage, user_id: Annotated[str, Depends(current_user_id)], db: Session = Depends(get_db)):
    profile = learner(db, user_id)
    topic = body.topic or profile.profile.get("tutorTopic") or profile.dashboard.get("currentTopicLabel") or profile.dashboard.get("currentTopic", "")
    documents = db.query(TutorDocumentRecord).filter_by(user_id=user_id).order_by(TutorDocumentRecord.created_at.desc()).all()
    result = answer_tutor_question(
        question=body.message,
        topic=topic,
        level=profile.profile.get("level", "beginner"),
        documents=[{"filename": item.filename, "text": item.content_text} for item in documents],
    )
    db.add(TutorMessageRecord(user_id=user_id, topic=topic, message=body.message, reply=result["reply"]))
    db.commit()
    return {"reply": result["reply"], "topic": topic, "suggestedPrompt": result.get("suggestedPrompt", "Can you give me a simple example?"), "route": result["route"], "citations": result.get("citations", [])}


@router.get("/tutor/documents")
def list_tutor_documents(user_id: Annotated[str, Depends(current_user_id)], db: Session = Depends(get_db)):
    records = db.query(TutorDocumentRecord).filter_by(user_id=user_id).order_by(TutorDocumentRecord.created_at.desc()).all()
    return [{"id": record.id, "filename": record.filename, "createdAt": record.created_at.isoformat() if record.created_at else None} for record in records]


@router.post("/tutor/documents")
async def upload_tutor_document(request: Request, user_id: str = Depends(current_user_id), db: Session = Depends(get_db)):
    filename = unquote(request.headers.get("x-filename", "upload")).replace("\\", "/").split("/")[-1][:255]
    extension = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if extension not in {"txt", "md", "markdown", "csv", "html", "htm"}:
        raise HTTPException(status_code=415, detail="Upload a TXT, Markdown, CSV, or HTML document.")
    raw = await request.body()
    if len(raw) > 5 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Each upload must be 5 MB or smaller.")
    text = raw.decode("utf-8-sig", errors="replace")
    if extension in {"html", "htm"}:
        parser = _HTMLText()
        parser.feed(text)
        text = " ".join(parser.parts)
    text = text.strip()
    if len(text) < 20:
        raise HTTPException(status_code=400, detail="This file does not contain enough readable text to search.")
    existing_count = db.query(TutorDocumentRecord).filter_by(user_id=user_id).count()
    if existing_count >= 20:
        raise HTTPException(status_code=409, detail="You can keep up to 20 tutor documents. Remove one before adding another.")
    record = TutorDocumentRecord(id=str(uuid4()), user_id=user_id, filename=filename, content_text=text[:2_000_000])
    db.add(record)
    db.commit()
    return {"id": record.id, "filename": record.filename, "createdAt": record.created_at.isoformat() if record.created_at else None}


@router.delete("/tutor/documents/{document_id}")
def delete_tutor_document(document_id: str, user_id: Annotated[str, Depends(current_user_id)], db: Session = Depends(get_db)):
    record = db.query(TutorDocumentRecord).filter_by(id=document_id, user_id=user_id).first()
    if record is None:
        raise HTTPException(status_code=404, detail="Document not found")
    db.delete(record)
    db.commit()
    return {"deleted": True}
