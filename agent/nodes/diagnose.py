from agent.state import LearnerState
from agent.llm_client import call_llm_for_json

def generate_diagnostic_questions(state: LearnerState) -> LearnerState:
    topic = state["requested_topic"]
    system_prompt = (
        "You are a diagnostic-question generator for an AI tutor. "
        "Given a topic the learner wants to study, generate exactly 4 short "
        "diagnostic questions that test real understanding, not trivia. "
        "Order them: 1 foundational, 2 intermediate, 1 advanced. "
        "Return strict JSON: "
        '{"questions": [{"question": "...", "difficulty": "foundational|intermediate|advanced"}]}'
    )
    data = call_llm_for_json(system_prompt, f"Topic: {topic}")
    return {
        "diagnostic_questions": data["questions"],
        "phase": "await_diagnostic_answers",
    }

def evaluate_diagnosis(state: LearnerState) -> LearnerState:
    topic = state["requested_topic"]
    questions = state["diagnostic_questions"]
    answers = state["diagnostic_answers"]
    qa_text = "\n".join(
        f"Q ({q['difficulty']}): {q['question']}\nA: {a}"
        for q, a in zip(questions, answers)
    )
    system_prompt = (
        "You assess a learner's real level on a topic from their answers to "
        "questions of increasing difficulty. Judge understanding, not just "
        "correctness -- a vague or hedged answer to an easy question signals "
        "something different than a confidently wrong answer. Output: "
        "diagnosed_level (beginner/intermediate/advanced), reasoning, "
        "content_depth (how content should be pitched, e.g. 'needs analogies "
        "and basics' vs 'can handle technical depth'), and an ordered "
        "learning_path of 3-5 topic names starting from where they are. "
        "Return strict JSON: "
        '{"diagnosed_level": "...", "reasoning": "...", "content_depth": "...", '
        '"learning_path": ["...", "..."]}'
    )
    data = call_llm_for_json(system_prompt, f"Topic: {topic}\n\n{qa_text}")
    return {
        "diagnosed_level": data["diagnosed_level"],
        "reasoning": data["reasoning"],
        "content_depth": data["content_depth"],
        "learning_path": data["learning_path"],
        "current_topic_index": 0,
        "attempt": 0,
        "completed_topics": [],
        "weak_topics": [],
    }
