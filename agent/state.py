from typing import TypedDict, Literal, List, Dict

class LearnerState(TypedDict, total=False):
    session_id: str
    requested_topic: str
    diagnostic_questions: List[Dict[str, str]]
    diagnostic_answers: List[str]
    diagnosed_level: str
    content_depth: str
    reasoning: str
    learning_path: List[str]
    current_topic_index: int
    attempt: int
    completed_topics: List[str]
    weak_topics: List[str]
    last_explanation: str
    last_question: str
    last_answer: str
    last_correct: bool
    last_feedback: str
    phase: Literal[
        "start",
        "await_diagnostic_answers",
        "await_practice_answer",
        "done",
    ]
