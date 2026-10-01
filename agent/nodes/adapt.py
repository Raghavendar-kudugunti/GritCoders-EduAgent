from agent.state import LearnerState

MAX_ATTEMPTS = 2

def adapt_node(state: LearnerState) -> LearnerState:
    topic = state["learning_path"][state["current_topic_index"]]
    completed = list(state.get("completed_topics", []))
    weak = list(state.get("weak_topics", []))
    attempt = state.get("attempt", 0)

    if state["last_correct"]:
        completed.append(topic)
        next_index = state["current_topic_index"] + 1
        next_attempt = 0
    else:
        attempt += 1
        if attempt >= MAX_ATTEMPTS:
            weak.append(topic)
            next_index = state["current_topic_index"] + 1
            next_attempt = 0
        else:
            next_index = state["current_topic_index"]
            next_attempt = attempt

    finished = next_index >= len(state["learning_path"])

    return {
        "completed_topics": completed,
        "weak_topics": weak,
        "current_topic_index": next_index,
        "attempt": next_attempt,
        "phase": "done" if finished else "await_practice_answer",
    }
