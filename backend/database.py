import os
from collections.abc import Generator

from fastapi import HTTPException
from sqlalchemy import BigInteger, Boolean, DateTime, ForeignKey, Integer, String, Text, create_engine, func, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, sessionmaker


class Base(DeclarativeBase):
    pass


class LearnerRecord(Base):
    __tablename__ = "learners"

    user_id: Mapped[str] = mapped_column(String(255), primary_key=True)
    profile: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    dashboard: Mapped[dict] = mapped_column(JSONB, nullable=False)
    learning_path: Mapped[list] = mapped_column(JSONB, nullable=False)
    created_at: Mapped[object] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[object] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class TutorSessionRecord(Base):
    __tablename__ = "tutor_sessions"

    session_id: Mapped[str] = mapped_column(String(36), primary_key=True)
    state: Mapped[dict] = mapped_column(JSONB, nullable=False)
    created_at: Mapped[object] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[object] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class PracticeRecord(Base):
    __tablename__ = "practice_attempts"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    prompt_id: Mapped[str] = mapped_column(String(100), nullable=False)
    answer: Mapped[str] = mapped_column(String, nullable=False)
    correct: Mapped[bool] = mapped_column(nullable=False)
    score_percent: Mapped[int] = mapped_column(Integer, nullable=False)
    feedback: Mapped[str] = mapped_column(String, nullable=False)
    next_step: Mapped[str] = mapped_column(String, nullable=False)
    scored: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default=text("false"))
    created_at: Mapped[object] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class DiagnosticRecord(Base):
    __tablename__ = "diagnostic_results"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    topic: Mapped[str] = mapped_column(String(255), nullable=False)
    answer: Mapped[str] = mapped_column(String, nullable=False)
    claimed_level: Mapped[str] = mapped_column(String(100), nullable=False)
    evaluated_level: Mapped[str] = mapped_column(String(100), nullable=False)
    accuracy_percent: Mapped[int] = mapped_column(Integer, nullable=False)
    result: Mapped[dict] = mapped_column(JSONB, nullable=False)
    created_at: Mapped[object] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class TutorMessageRecord(Base):
    __tablename__ = "tutor_messages"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    topic: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(String, nullable=False)
    reply: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[object] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class TutorDocumentRecord(Base):
    __tablename__ = "tutor_documents"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    content_text: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[object] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class PeerConversationRecord(Base):
    __tablename__ = "peer_conversations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    created_by: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    is_group: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[object] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[object] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class PeerConversationMemberRecord(Base):
    __tablename__ = "peer_conversation_members"

    conversation_id: Mapped[str] = mapped_column(ForeignKey("peer_conversations.id", ondelete="CASCADE"), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(255), primary_key=True, index=True)
    joined_at: Mapped[object] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class PeerMessageRecord(Base):
    __tablename__ = "peer_messages"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    conversation_id: Mapped[str] = mapped_column(ForeignKey("peer_conversations.id", ondelete="CASCADE"), index=True, nullable=False)
    sender_id: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[object] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)


_engine = None
_session_factory = None


def _database_url() -> str:
    url = os.getenv("DATABASE_URL")
    if not url:
        raise RuntimeError("DATABASE_URL is required to start EduAgent")
    if url.startswith("postgres://"):
        return "postgresql+psycopg://" + url[len("postgres://"):]
    if url.startswith("postgresql://"):
        return "postgresql+psycopg://" + url[len("postgresql://"):]
    return url


def init_database() -> None:
    global _engine, _session_factory
    _engine = create_engine(_database_url(), pool_pre_ping=True)
    _session_factory = sessionmaker(bind=_engine, expire_on_commit=False)
    Base.metadata.create_all(_engine)
    # create_all does not add columns to existing tables. This additive migration
    # keeps existing local Postgres databases compatible with scored analytics.
    with _engine.begin() as connection:
        connection.execute(text("ALTER TABLE practice_attempts ADD COLUMN IF NOT EXISTS scored BOOLEAN NOT NULL DEFAULT FALSE"))


def close_database() -> None:
    global _engine, _session_factory
    if _engine is not None:
        _engine.dispose()
    _engine = None
    _session_factory = None


def get_db() -> Generator[Session, None, None]:
    if _session_factory is None:
        raise HTTPException(status_code=503, detail="Database is not initialized")
    session = _session_factory()
    try:
        yield session
    finally:
        session.close()
