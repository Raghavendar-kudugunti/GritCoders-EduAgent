from agent.state import LearnerState
from agent.llm_client import call_llm_for_json

def generate_practice_node(state: LearnerState) -> LearnerState:
    topic = state["learning_path"][state["current_topic_index"]]
    level = state["diagnosed_level"]
    system_prompt = (
        f"Generate ONE short practice question testing understanding of "
        f"'{topic}', pitched at a {level} learner. Not multiple choice -- "
        f"a question they answer in their own words. "
        'Return strict JSON: {"question": "..."}'
    )
    data = call_llm_for_json(system_prompt, f"Topic: {topic}")
    return {
        "last_question": data["question"],
        "phase": "await_practice_answer",
    }

def grade_node(state: LearnerState) -> LearnerState:
    topic = state["learning_path"][state["current_topic_index"]]
    question = state["last_question"]
    answer = state["last_answer"]
    system_prompt = (
        f"Grade this learner's answer about '{topic}'. Be reasonably lenient "
        f"-- focus on whether the core idea is understood, not exact wording. "
        'Return strict JSON: {"correct": true|false, "feedback": "one short sentence"}'
    )
    data = call_llm_for_json(system_prompt, f"Question: {question}\nAnswer: {answer}")
    return {
        "last_correct": data["correct"],
        "last_feedback": data["feedback"],
    }
