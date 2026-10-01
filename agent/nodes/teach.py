from agent.state import LearnerState
from agent.llm_client import call_llm_for_json

def teach_node(state: LearnerState) -> LearnerState:
    topic = state["learning_path"][state["current_topic_index"]]
    level = state["diagnosed_level"]
    content_depth = state["content_depth"]
    simplify = state.get("attempt", 0) > 0
    system_prompt = (
        f"You are a tutor explaining '{topic}' to a {level} learner. "
        f"Content depth guidance: {content_depth}. "
        + (
            "The learner struggled last time -- explain it MORE SIMPLY, with "
            "a concrete analogy, in 3-4 sentences. "
            if simplify
            else "Explain it clearly in 3-4 sentences, matched to their level. "
        )
        + 'Return strict JSON: {"explanation": "..."}'
    )
    data = call_llm_for_json(system_prompt, f"Explain: {topic}")
    return {"last_explanation": data["explanation"]}
