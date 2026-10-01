"""LangGraph routing and retrieval for the EduAgent tutor."""

from __future__ import annotations

import re
from typing import Any, TypedDict

from langgraph.graph import END, StateGraph

from agent.llm_client import call_llm_for_json
from backend.curriculum import CONCEPTS


class TutorState(TypedDict, total=False):
    question: str
    topic: str
    level: str
    documents: list[dict[str, str]]
    route: str
    context: list[dict[str, str]]
    result: dict[str, Any]


def _tokens(text: str) -> set[str]:
    return {word for word in re.findall(r"[a-z0-9+#.-]+", text.lower()) if len(word) > 2}


def _intent_route(state: TutorState) -> TutorState:
    question = state.get("question", "").lower()
    document_intent = any(term in question for term in (
        "uploaded", "my file", "this file", "this document", "in the document", "in my notes",
        "quote", "quotation", "fact-check", "fact check", "verify", "according to", "source says",
        "latest", "current", "recent", "is it true", "fact check whether", "what year", "who wrote",
    ))
    conceptual_intent = any(term in question for term in (
        "explain", "compare", "comparison", "difference", "differ", "how does", "how do",
        "why does", "why do", "when should i use", "which is better", "pros and cons", " versus ", " vs ",
        "learning path", "roadmap", "what should i learn", "prerequisite",
    ))
    if document_intent:
        route = "standard_rag"
    elif conceptual_intent:
        route = "graph_rag"
    else:
        # Specific terms in a learner's own files take precedence for lookup questions.
        query_terms = _tokens(state.get("question", ""))
        doc_match = any(len(query_terms & _tokens(doc.get("text", ""))) >= 2 for doc in state.get("documents", []))
        route = "standard_rag" if doc_match else "graph_rag"
    return {"route": route}


def _graph_retrieve(state: TutorState) -> TutorState:
    question = state.get("question", "")
    terms = _tokens(f"{question} {state.get('topic', '')}")
    scored = []
    for concept in CONCEPTS.values():
        title_terms = _tokens(concept["title"])
        all_terms = _tokens(f"{concept['title']} {concept['description']} {concept['category']}")
        score = len(terms & title_terms) * 3 + len(terms & all_terms)
        if score:
            scored.append((score, concept))
    scored.sort(key=lambda entry: (-entry[0], entry[1]["title"]))
    selected: dict[str, dict[str, str]] = {}
    for _, concept in scored[:4]:
        selected[concept["id"]] = {
            "title": concept["title"], "track": concept["category"],
            "description": concept["description"], "relation": "matched concept",
        }
        same_track = sorted(
            (item for item in CONCEPTS.values() if item["trackId"] == concept["trackId"]),
            key=lambda item: item["order"],
        )
        index = next(i for i, item in enumerate(same_track) if item["id"] == concept["id"])
        for neighbor_index, relation in ((index - 1, "prerequisite"), (index + 1, "next concept")):
            if 0 <= neighbor_index < len(same_track) and len(selected) < 7:
                neighbor = same_track[neighbor_index]
                selected.setdefault(neighbor["id"], {
                    "title": neighbor["title"], "track": neighbor["category"],
                    "description": neighbor["description"], "relation": relation,
                })
    context = list(selected.values())
    return {"context": context}


def _standard_retrieve(state: TutorState) -> TutorState:
    query_terms = _tokens(state.get("question", ""))
    chunks: list[tuple[int, str, str]] = []
    for document in state.get("documents", []):
        paragraphs = [part.strip() for part in re.split(r"\n\s*\n", document.get("text", "")) if part.strip()]
        merged: list[str] = []
        current = ""
        for paragraph in paragraphs:
            if current and len(current) + len(paragraph) > 1200:
                merged.append(current)
                current = ""
            current = f"{current}\n{paragraph}".strip()
        if current:
            merged.append(current)
        for chunk in merged:
            chunk_terms = _tokens(chunk)
            overlap = query_terms & chunk_terms
            score = sum(2 if len(term) > 6 else 1 for term in overlap)
            if score:
                chunks.append((score, document.get("filename", "Uploaded document"), chunk))
    chunks.sort(key=lambda item: -item[0])
    return {"context": [
        {"source": filename, "excerpt": chunk[:1400], "relation": "uploaded document passage"}
        for _, filename, chunk in chunks[:5]
    ]}


def _synthesize(state: TutorState) -> TutorState:
    route = state.get("route", "graph_rag")
    context = state.get("context", [])
    if route == "standard_rag" and not context:
        return {"result": {
            "reply": "I couldn't find a matching passage in your uploaded files. Add the relevant notes or document, then ask me to look it up. I don't have live web search enabled, so I can't verify current facts from the internet.",
            "suggestedPrompt": "Which uploaded document should I search?",
            "citations": [],
        }}
    prompt = (
        "You are EduAgent, an adaptive AI tutor. Answer the student's question clearly at their level. "
        "Use only the supplied retrieved context for claims attributed to it; explain when the context is incomplete. "
        "For GraphRAG context, connect prerequisite and related concepts and give a useful learning sequence. "
        "For document passages, stay faithful to the excerpts and do not invent quotations. Return JSON with reply "
        "(string) and suggestedPrompt (string)."
    )
    payload = {
        "question": state.get("question", ""), "topic": state.get("topic", ""),
        "learnerLevel": state.get("level", "beginner"), "retrievalMode": route,
        "retrievedContext": context,
    }
    try:
        output = call_llm_for_json(prompt, str(payload))
        reply = str(output.get("reply", "")).strip()
        suggestion = str(output.get("suggestedPrompt", "Can you give me an example?")).strip()
        if not reply:
            raise ValueError("Tutor returned an empty answer")
    except Exception:
        if route == "graph_rag":
            titles = ", ".join(item["title"] for item in context[:4])
            reply = (f"For {state.get('topic') or 'this topic'}, a useful place to start is {titles}. "
                     "I couldn't reach the lesson generator just now, but these connected concepts are in your curriculum. Try asking about one of them.")
        else:
            excerpts = " ".join(item["excerpt"] for item in context[:2])
            reply = f"Here are the most relevant passages I found in your uploads: {excerpts[:900]}"
        suggestion = "Can you break that down with an example?"
    citations = [
        {"label": item.get("source") or item.get("title", "Curriculum concept"), "relation": item.get("relation", "")}
        for item in context
    ]
    return {"result": {"reply": reply, "suggestedPrompt": suggestion, "citations": citations}}


def _route(state: TutorState) -> str:
    return state.get("route", "graph_rag")


builder = StateGraph(TutorState)
builder.add_node("intent_router", _intent_route)
builder.add_node("graph_retrieval", _graph_retrieve)
builder.add_node("standard_retrieval", _standard_retrieve)
builder.add_node("synthesize", _synthesize)
builder.set_entry_point("intent_router")
builder.add_conditional_edges("intent_router", _route, {
    "graph_rag": "graph_retrieval", "standard_rag": "standard_retrieval",
})
builder.add_edge("graph_retrieval", "synthesize")
builder.add_edge("standard_retrieval", "synthesize")
builder.add_edge("synthesize", END)
tutor_graph = builder.compile()


def answer_tutor_question(*, question: str, topic: str, level: str, documents: list[dict[str, str]]) -> dict[str, Any]:
    result = tutor_graph.invoke({
        "question": question, "topic": topic, "level": level, "documents": documents,
    })
    return result["result"] | {"route": result.get("route", "graph_rag")}
