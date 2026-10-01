from langgraph.graph import StateGraph, END
from agent.state import LearnerState
from agent.nodes.diagnose import generate_diagnostic_questions, evaluate_diagnosis
from agent.nodes.teach import teach_node
from agent.nodes.practice import generate_practice_node, grade_node
from agent.nodes.adapt import adapt_node

def route_entry(state: LearnerState) -> str:
    phase = state.get("phase", "start")
    if phase == "start":
        return "generate_questions"
    if phase == "await_diagnostic_answers":
        return "evaluate_diagnosis"
    if phase == "await_practice_answer":
        return "grade"
    return "teach"

def route_after_adapt(state: LearnerState) -> str:
    return END if state["phase"] == "done" else "teach"

graph = StateGraph(LearnerState)
graph.add_node("generate_questions", generate_diagnostic_questions)
graph.add_node("evaluate_diagnosis", evaluate_diagnosis)
graph.add_node("teach", teach_node)
graph.add_node("practice", generate_practice_node)
graph.add_node("grade", grade_node)
graph.add_node("adapt", adapt_node)

graph.set_conditional_entry_point(
    route_entry,
    {
        "generate_questions": "generate_questions",
        "evaluate_diagnosis": "evaluate_diagnosis",
        "grade": "grade",
        "teach": "teach",
    },
)

graph.add_edge("generate_questions", END)
graph.add_edge("evaluate_diagnosis", "teach")
graph.add_edge("teach", "practice")
graph.add_edge("practice", END)
graph.add_edge("grade", "adapt")
graph.add_conditional_edges("adapt", route_after_adapt, {"teach": "teach", END: END})

compiled_graph = graph.compile()
