"""LangGraph workflows for assessment, personalized planning, and teaching."""

from __future__ import annotations

from copy import deepcopy
from typing import Any, TypedDict

from langgraph.graph import END, StateGraph

from agent.llm_client import call_llm_for_json
from backend.curriculum import (
    CONCEPTS,
    FOCUS_TRACK,
    ROLE_TRACK,
    TRACKS,
    get_concept,
    get_track_concepts,
)
from backend.lesson_extras import enrich_lesson


def _fallback_questions(profile: dict[str, Any]) -> dict[str, Any]:
    focus = profile.get("focus", "fundamentals")
    question_sets = {
        "machineLearning": [
            ("A model predicts house prices. What is the target?", ["The price the model should predict", "The street name used as an input", "The number of rows in the dataset"]),
            ("Why keep test examples separate from training examples?", ["To estimate performance on data the model did not learn from", "To make training run faster", "To ensure every prediction is correct"]),
            ("A classifier misses many positive cases. What should you inspect first?", ["Recall and the cost of false negatives", "Only the overall accuracy", "The color of the chart"]),
        ],
        "generativeAI": [
            ("How does a language model usually produce the next part of a response?", ["By predicting likely next tokens from its context", "By searching the internet for every sentence", "By retrieving a fixed paragraph for every question"]),
            ("A prompt needs a reliable JSON answer. What helps most?", ["Specify the fields and required output format", "Ask for a longer answer", "Remove all context"]),
            ("When should an AI agent use a tool?", ["When the task needs information or an action the model cannot do by itself", "After every sentence", "Only to make the response sound more certain"]),
        ],
        "rag": [
            ("What is the purpose of retrieval in a RAG system?", ["Find relevant source passages to ground the answer", "Train the language model from scratch", "Convert every document into an image"]),
            ("Why split documents into chunks?", ["To retrieve focused passages that fit the model's context", "To remove the need for source metadata", "To guarantee every answer is correct"]),
            ("A RAG answer cites the wrong passage. What should you inspect?", ["Retrieval results and their source metadata", "The UI color palette", "The number of model parameters only"]),
        ],
        "programming": [
            ("What does a Python function help you do?", ["Package reusable steps under a name", "Store every value permanently", "Make a program run without input"]),
            ("Why use a dictionary in Python?", ["To look up values by keys", "To sort all values automatically", "To repeat a block of code"]),
            ("An API returns JSON. What is a useful next step?", ["Parse it and check the fields your program needs", "Assume every field is present", "Rename the server"]),
        ],
        "deepLearning": [
            ("What does a neural network learn during training?", ["Parameter values that reduce prediction error", "A fixed list of every possible input", "The meaning of its source code comments"]),
            ("What does a loss function measure?", ["How far predictions are from the desired outcomes", "How many files are in a project", "How quickly a screen loads"]),
            ("Why use a validation set during training?", ["To compare model choices without using the final test set", "To increase the size of each input", "To guarantee zero errors"]),
        ],
        "dataEngineering": [
            ("What is a data pipeline for?", ["Moving and transforming data through repeatable steps", "Designing a model's user interface", "Replacing all data checks with guesses"]),
            ("Why define a data schema?", ["To make expected fields and types clear", "To hide missing values", "To make every table identical"]),
            ("A daily job fails after an upstream change. What helps diagnose it?", ["Pipeline logs, data quality checks, and lineage", "Increasing model temperature", "Deleting the output without inspection"]),
        ],
        "mlops": [
            ("Why track a model's training data and code version?", ["To reproduce and audit how the model was built", "To make inference always instant", "To avoid monitoring the deployed model"]),
            ("What can data drift indicate?", ["Production inputs have changed from the data the model learned from", "The database password has expired", "The model has more parameters"]),
            ("What is a safe model deployment practice?", ["Monitor the release and keep a rollback path", "Replace the current model without checks", "Evaluate only on training data"]),
        ],
    }
    selected = question_sets.get(focus, [
        ("What is machine learning mainly used for?", ["Learning patterns from examples to make predictions or decisions", "Making computers conscious", "Avoiding the need to evaluate results"]),
        ("Why should an AI result be checked?", ["Models can make mistakes, so results need evidence and review", "A confident answer is always correct", "Checking results changes the model's name"]),
        ("What is a good first step for an AI project?", ["Define the problem and what a useful result means", "Choose the largest model available", "Deploy before understanding the data"]),
    ])
    return {"questions": [
        {"prompt": prompt, "options": [
            {"label": answer, "correct": index == 0}
            for index, answer in enumerate(options)
        ]}
        for prompt, options in selected
    ]}


def _valid_questions(result: Any) -> bool:
    questions = result.get("questions") if isinstance(result, dict) else None
    if not isinstance(questions, list) or len(questions) != 3:
        return False
    for question in questions:
        if not isinstance(question, dict):
            return False
        options = question.get("options")
        if not isinstance(question.get("prompt"), str) or len(question["prompt"].strip()) < 15:
            return False
        if not isinstance(options, list) or len(options) != 3:
            return False
        labels = [option.get("text") or option.get("value") or option.get("label") for option in options if isinstance(option, dict)]
        correct = [option for option in options if isinstance(option, dict) and option.get("correct") is True]
        if len(labels) != 3 or len(correct) != 1 or any(
            not isinstance(label, str) or len(label.strip()) < 8 or label.strip().upper() in {"A", "B", "C", "1", "2", "3"}
            for label in labels
        ):
            return False
    return True


def _normalize_questions(result: dict[str, Any]) -> dict[str, Any]:
    return {"questions": [
        {"prompt": item["prompt"].strip(), "options": [
            {"label": option.get("text") or option.get("value") or option["label"], "correct": option["correct"]}
            for option in item["options"]
        ]}
        for item in result["questions"]
    ]}


class LearningTask(TypedDict, total=False):
    action: str
    input: dict[str, Any]
    assessment: dict[str, Any]
    plan: dict[str, Any]
    output: dict[str, Any]


def _onboarding_assessment(state: LearningTask) -> LearningTask:
    learner = state.get("input", {})
    safe_profile = {
        "role": learner.get("role"),
        "ageGroup": learner.get("ageGroup"),
        "focus": learner.get("focus"),
        "quizSignals": learner.get("answers", []),
    }
    prompt = (
        "Assess this AI learner from their chosen focus, role, and three diagnostic signals. "
        "The signals are correct/miss labels for increasing difficulty. Do not infer knowledge "
        "from age or gender. Return JSON with evaluatedLevel (beginner|developing|intermediate|advanced), "
        "accuracyPercent (integer 0-100), focusLabel, pathSummary, message, strengths (string array), "
        "and focusAreas (string array). Describe demonstrated knowledge honestly; do not overstate it."
    )
    try:
        assessment = call_llm_for_json(prompt, str(safe_profile))
    except Exception:
        answers = learner.get("answers", [])
        score = sum("correct" in str(value).lower() for value in answers)
        assessment = {
            "evaluatedLevel": "advanced" if score == 3 else "intermediate" if score == 2 else "developing" if score == 1 else "beginner",
            "accuracyPercent": round(100 * score / max(1, len(answers))),
            "focusLabel": TRACKS.get(FOCUS_TRACK.get(learner.get("focus"), "foundations"), {}).get("title", "AI foundations"),
            "pathSummary": "Your path starts from your diagnostic answers and chosen focus. It will become more precise as you complete lessons and practice.",
            "message": "Your starting point is based on the ideas you demonstrated in the diagnostic.",
            "strengths": ["You completed a focus-specific diagnostic"],
            "focusAreas": [learner.get("focus", "fundamentals")],
        }
    return {"assessment": assessment}


def _plan_curriculum(state: LearningTask) -> LearningTask:
    learner = state.get("input", {})
    assessment = state.get("assessment", {})
    focus = learner.get("focus", "fundamentals")
    role = learner.get("role", "curious")
    primary_track = FOCUS_TRACK.get(focus, "foundations")
    role_track = ROLE_TRACK.get(role, "foundations")
    track_ids = [primary_track]
    if role_track not in track_ids:
        track_ids.append(role_track)
    if "foundations" not in track_ids and assessment.get("evaluatedLevel") == "beginner":
        track_ids.append("foundations")
    candidates = [concept for track_id in track_ids for concept in get_track_concepts(track_id)]
    level = assessment.get("evaluatedLevel", "beginner")
    prompt = (
        "You are the curriculum-planning node in an adaptive AI learning graph. Select 6 to 9 "
        "lesson IDs from the allowed catalog and order them for this individual learner. Use the "
        "assessment level, quiz signals, role, focus, and strengths to choose the entry point and "
        "sequence. A beginner needs prerequisites; a developing learner should skip concepts already "
        "demonstrated; an advanced learner should get deeper or applied concepts. Include role-relevant "
        "concepts when useful. Do not return any IDs outside the catalog. Make the sequence specific, "
        "not the same default order for every person. Return JSON with conceptIds (array of IDs), "
        "and fitNotes (object mapping selected IDs to a short personal reason)."
    )
    request = {
        "learner": {
            "role": role,
            "focus": focus,
            "level": level,
            "quizSignals": learner.get("answers", []),
            "strengths": assessment.get("strengths", []),
            "focusAreas": assessment.get("focusAreas", []),
        },
        "catalog": [
            {"id": item["id"], "title": item["title"], "description": item["description"]}
            for item in candidates
        ],
    }
    try:
        plan = call_llm_for_json(prompt, str(request))
    except Exception:
        plan = {}
    chosen_ids = []
    for concept_id in plan.get("conceptIds", []):
        if concept_id in CONCEPTS and concept_id not in chosen_ids and any(
            concept_id == candidate["id"] for candidate in candidates
        ):
            chosen_ids.append(concept_id)
    if not 4 <= len(chosen_ids) <= 10:
        # Deterministic fallback still uses assessment level, focus, role, and
        # quiz result, so a provider outage never sends every learner the same map.
        score = sum("correct" in str(value).lower() for value in learner.get("answers", []))
        if level == "advanced" or score >= 3:
            skip = 2
        elif level in {"intermediate", "developing"} or score == 2:
            skip = 1
        else:
            skip = 0
        primary = get_track_concepts(primary_track)
        secondary = get_track_concepts(role_track) if role_track != primary_track else []
        chosen_ids = [item["id"] for item in primary[skip:]]
        if secondary:
            # Weave in role-relevant work at a stable, user-specific position.
            insertion = (sum(ord(char) for char in str(learner.get("userVariant", ""))) % 3) + 2
            chosen_ids[insertion:insertion] = [item["id"] for item in secondary[:2]]
        chosen_ids = list(dict.fromkeys(chosen_ids))[:8]

    # Reserve the final step for a stable, pseudonymous learner-specific
    # variant. This creates a useful elective difference even when two people
    # have the same role, focus, and assessment score.
    variant = str(learner.get("userVariant", ""))
    variant_candidates = [
        item["id"] for item in candidates
        if item["id"] not in chosen_ids[:-1]
    ]
    if chosen_ids and variant_candidates:
        variant_index = int(variant[:8], 16) % len(variant_candidates) if variant else 0
        chosen_ids[-1] = variant_candidates[variant_index]

    fit_notes = plan.get("fitNotes", {}) if isinstance(plan.get("fitNotes"), dict) else {}
    path = []
    score = int(assessment.get("accuracyPercent", 0) or 0)
    for index, concept_id in enumerate(chosen_ids):
        node = get_concept(concept_id)
        if not node:
            continue
        node.update(
            status="current" if index == 0 else "upcoming",
            order=index + 1,
            confidence=max(35, min(98, 100 - score + (index % 3) * 4)),
            fitNote=str(fit_notes.get(concept_id, ""))[:220],
        )
        path.append(node)
    return {"plan": {"path": path}}


def _finish_onboarding(state: LearningTask) -> LearningTask:
    return {"output": {**state.get("assessment", {}), "path": state.get("plan", {}).get("path", [])}}


def _coach(state: LearningTask) -> LearningTask:
    action = state["action"]
    data = state.get("input", {})
    prompts = {
        "onboarding_questions": (
            "Create exactly three distinct multiple-choice diagnostic questions for this learner's selected "
            "AI focus. Make question 1 foundational, question 2 practical/intermediate, and question 3 "
            "challenging. Tailor examples to the focus and role. Each question must have three plausible "
            "options and exactly one correct option. Return JSON: {questions:[{prompt:string, options:[{label:string, correct:boolean}]}]}"
        ),
        "lesson": (
            "You are a clear, adaptive AI tutor. Teach the requested curriculum concept at the learner's level. "
            "Use the provided concept description as the lesson scope. Explain the concept accurately in plain "
            "language in plain text, then add a concrete example and a short retrieval-practice question. Return JSON with "
            "objective, explanation, keyIdeas (3-5 strings), workedExample, practiceQuestion, checkAnswer, "
            "visualSteps (3-5 short, specific stages suitable for a visual flow diagram), codeExample "
            "(null when code would not teach this concept, otherwise {language, code, explanation, tryIt}; code must be plain source without markdown fences), "
            "and miniProject ({title, brief, steps (3-5 strings), stretchGoal}). Do not return resource URLs; "
            "the app adds vetted resources. Keep the example and project specific to the concept and learner level. "
            "Avoid filler and do not assume prior knowledge beyond the provided level."
        ),
        "practice_prompt": (
            "Create an interactive practice set for this specific concept and learner level. Return JSON with title, "
            "prompt, options (exactly four concise strings for the main multiple-choice question), minutes (integer), "
            "difficulty, and activities: an array with exactly three activities, one each of type explain, scenario, "
            "and order. Every activity has id, type, title, and prompt. Scenario also has exactly three options. "
            "Order has 3-5 short steps in the correct order. Keep all activities concept-specific, useful, and clear. "
            "Do not include answers or solutions in the returned JSON."
        ),
        "diagnostic": (
            "Assess the learner's stated experience and answer for the requested topic. Return JSON with evaluatedLevel, "
            "accuracyPercent (integer 0-100), strengths (string array), focusAreas (string array), and a supportive message."
        ),
        "practice": (
            "Grade the learner's response to the supplied practice prompt and activity leniently for conceptual understanding. "
            "For ordering activities, judge whether the sequence is sensible; for scenarios, consider both the choice and its reason. "
            "Return JSON with correct (boolean), scorePercent (integer 0-100), feedback, and nextStep."
        ),
        "tutor": (
            "You are EduAgent, an adaptive tutor for the full field of AI. Explain clearly, meet the learner's level, "
            "and answer the message directly in a few sentences. Return JSON with reply and suggestedPrompt."
        ),
    }
    try:
        output = call_llm_for_json(prompts[action], str(data))
        if action == "onboarding_questions" and not _valid_questions(output):
            output = _fallback_questions(data)
    except Exception:
        if action == "onboarding_questions":
            output = _fallback_questions(data)
        elif action == "lesson":
            concept = data.get("concept", {})
            title = concept.get("title", "this concept")
            description = concept.get("description", "Build an understanding of the idea and when it is useful.")
            output = {"objective": f"Understand {title} and when it is useful.", "explanation": description, "keyIdeas": [description, "Connect the idea to a concrete problem", "Check results with evidence"], "workedExample": f"Suppose you are working on a small project involving {title.lower()}. First define the outcome you need, then apply this idea and inspect whether the result supports that outcome.", "practiceQuestion": f"In your own words, where could {title.lower()} help solve a problem?", "checkAnswer": f"A strong answer connects {title.lower()} to the problem it addresses and explains how you would check the result."}
        elif action == "practice_prompt":
            concept = data.get("concept", {})
            title = concept.get("title", "this concept")
            output = {"title": f"Check your understanding: {title}", "prompt": f"Which statement best describes {title}?", "options": ["Use the concept to solve a specific problem and check the result", "Choose the most complex tool before defining the problem", "Assume the first output is always correct", "Skip evaluation and explanation"], "minutes": 8, "difficulty": data.get("level", "beginner")}
        elif action == "practice":
            output = {"correct": True, "scorePercent": 70, "feedback": "Your response was recorded. Compare it with the prompt and explain the key idea in your own words.", "nextStep": "Review the lesson and try another example."}
        elif action == "diagnostic":
            output = {"evaluatedLevel": data.get("claimedLevel", "developing"), "accuracyPercent": 50, "strengths": [], "focusAreas": [data.get("topic", "AI")], "message": "We saved your response; use lesson practice to sharpen this estimate."}
        else:
            output = {"reply": "I can help you work through that. Start by naming the part that feels unclear, and we can break it into a small example.", "suggestedPrompt": "Can you show me a simple example?"}
    return {"output": output}


def _route(state: LearningTask) -> str:
    return "assess" if state.get("action") == "onboarding" else "coach"


builder = StateGraph(LearningTask)
builder.add_node("assess", _onboarding_assessment)
builder.add_node("plan", _plan_curriculum)
builder.add_node("finish", _finish_onboarding)
builder.add_node("coach", _coach)
builder.set_conditional_entry_point(_route, {"assess": "assess", "coach": "coach"})
builder.add_edge("assess", "plan")
builder.add_edge("plan", "finish")
builder.add_edge("finish", END)
builder.add_edge("coach", END)
learning_graph = builder.compile()


def complete(action: str, data: dict[str, Any]) -> dict[str, Any]:
    return learning_graph.invoke({"action": action, "input": data})["output"]


def generate_onboarding_questions(profile: dict[str, Any]) -> dict[str, Any]:
    result = complete("onboarding_questions", profile)
    if not _valid_questions(result):
        result = _fallback_questions(profile)
    return _normalize_questions(result)


def generate_lesson(data: dict[str, Any]) -> dict[str, Any]:
    lesson = complete("lesson", data)
    return enrich_lesson(data.get("concept", {}), lesson)


def enrich_practice(data: dict[str, Any], concept: dict[str, Any]) -> dict[str, Any]:
    """Add usable activity formats to older or incomplete cached practice prompts."""
    result = dict(data)
    title = concept.get("title", result.get("topic", "this concept"))
    activities = result.get("activities")
    required_types = {"explain", "scenario", "order"}
    valid = isinstance(activities, list) and all(
        isinstance(item, dict) and item.get("id") and item.get("title") and item.get("prompt")
        and (item.get("type") != "scenario" or isinstance(item.get("options"), list) and len(item["options"]) >= 2)
        and (item.get("type") != "order" or isinstance(item.get("steps"), list) and len(item["steps"]) >= 3)
        for item in activities
    ) and required_types.issubset({item.get("type") for item in activities})
    if not valid:
        result["activities"] = [
            {"id": "explain", "type": "explain", "title": "Teach it back", "prompt": f"Explain {title} in your own words. Include one example and how you would check that it worked."},
            {"id": "scenario", "type": "scenario", "title": "Choose a move", "prompt": f"You need to use {title} in a small project. What is the most useful next move?", "options": ["Define the goal, apply the idea, then inspect the result", "Pick the largest tool before understanding the task", "Trust the first result without checking it"]},
            {"id": "order", "type": "order", "title": "Build the workflow", "prompt": f"Put these steps for applying {title} in a sensible order.", "steps": ["Define the question and success check", "Prepare the inputs or evidence", f"Apply {title} to the problem", "Inspect the result and revise if needed"]},
        ]
    return result
