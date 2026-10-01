"""Visual, hands-on, and further-learning material for concept lessons."""

from urllib.parse import quote_plus


TRACK_RESOURCES = {
    "foundations": [{"title": "Google Machine Learning Crash Course", "url": "https://developers.google.com/machine-learning/crash-course", "kind": "Interactive videos", "description": "Animated explanations, visualizations, and guided exercises."}],
    "machineLearning": [{"title": "Google Machine Learning Crash Course", "url": "https://developers.google.com/machine-learning/crash-course", "kind": "Interactive videos", "description": "Topic modules include videos, interactive visualizations, and practice."}],
    "deepLearning": [{"title": "3Blue1Brown neural network lessons", "url": "https://www.3blue1brown.com/?topic=neural-networks", "kind": "Visual video lessons", "description": "Animated intuition for neural networks and the math behind them."}],
    "generativeAI": [{"title": "Hugging Face LLM Course", "url": "https://huggingface.co/learn/llm-course/en/chapter1/1", "kind": "Video and coding course", "description": "LLM and transformer lessons with code you can follow along with."}],
    "rag": [{"title": "Build a RAG system with Hugging Face", "url": "https://huggingface.co/learn/agents-course/en/unit3/agentic-rag/agentic-rag", "kind": "Project course", "description": "Build a retrieval-augmented agent step by step."}],
    "python": [{"title": "The Python Tutorial", "url": "https://docs.python.org/3/tutorial/", "kind": "Official tutorial", "description": "A hands-on reference for Python syntax and core programming ideas."}],
    "dataEngineering": [{"title": "Pandas getting started tutorials", "url": "https://pandas.pydata.org/docs/getting_started/intro_tutorials/", "kind": "Code tutorial", "description": "Work through data loading, selection, plotting, and summary operations."}],
    "mlops": [{"title": "Google Machine Learning Crash Course", "url": "https://developers.google.com/machine-learning/crash-course", "kind": "Interactive course", "description": "Choose the production ML systems module for deployment and monitoring concepts."}],
}

INDIA_SCHOOL_DATA_PROJECT = {
    "title": "Explore India’s school infrastructure data",
    "source": "data.gov.in · UDISE+ 2023–24",
    "url": "https://www.data.gov.in/resource/stateuts-wise-number-schools-all-types-management-and-school-category-during-2023-24",
    "brief": "Use the official state/UT school-count table to practice inspecting, cleaning, summarizing, and visualizing real tabular data.",
    "steps": [
        "Open the official resource and download its CSV. Read the notes and column names before analyzing it.",
        "Load the file with pandas; inspect missing values, numeric types, and the difference between total and category columns.",
        "Compare state/UT totals or school categories and make a labeled chart that can be checked against the source table.",
        "Write one evidence-based observation and one limitation. This is an aggregate 2023–24 snapshot, not student-level data or a measure of learning outcomes.",
    ],
    "stretchGoal": "Repeat the analysis with a second year only if you find a comparable source, then explain any changes in definitions before comparing values.",
    "note": "Attribute the Ministry of Education/UDISE+ source and follow the dataset’s displayed terms. Do not infer school quality or student achievement from school counts.",
}


FALLBACK_CODE = {
    "python": {"language": "python", "code": "values = [2, 4, 6]\naverage = sum(values) / len(values)\nprint(average)", "explanation": "A tiny runnable example: a list is input, sum and len compute a summary, and print shows the result.", "tryIt": "Change one value and predict the new average before running it."},
    "machineLearning": {"language": "python", "code": "from sklearn.model_selection import train_test_split\n\nX_train, X_test, y_train, y_test = train_test_split(\n    features, labels, test_size=0.2, random_state=7\n)", "explanation": "Keep evaluation examples separate so you can measure how well a model handles data it did not train on.", "tryIt": "Change test_size and explain what changes in the evaluation."},
    "deepLearning": {"language": "python", "code": "# One training step, conceptually\nprediction = model(batch)\nloss = loss_fn(prediction, labels)\nloss.backward()\noptimizer.step()\noptimizer.zero_grad()", "explanation": "A model predicts, loss measures its error, and gradients guide the next parameter update.", "tryIt": "Point to the line that measures error and the line that updates the model."},
    "generativeAI": {"language": "python", "code": "from openai import OpenAI\n\nclient = OpenAI()\nresponse = client.chat.completions.create(\n    model=\"YOUR_MODEL\",\n    messages=[{\"role\": \"user\", \"content\": \"Explain this idea simply.\"}],\n)\nprint(response.choices[0].message.content)", "explanation": "This shows the basic request and response shape for an OpenAI-compatible chat API. Configure the provider and model for your account.", "tryIt": "Change the user prompt and compare how the instruction changes the response."},
    "rag": {"language": "python", "code": "question = \"How does retrieval help?\"\npassages = search_documents(question, documents)\ncontext = \"\\n\".join(passages)\nanswer = generate_answer(question, context)", "explanation": "Retrieval finds passages first; generation then receives both the question and those passages as evidence.", "tryIt": "Print the retrieved passages before generating an answer. Are they actually relevant?"},
    "dataEngineering": {"language": "python", "code": "import pandas as pd\n\ndf = pd.read_csv(\"events.csv\")\nclean = df.dropna(subset=[\"user_id\"])\nsummary = clean.groupby(\"event_type\").size()\nprint(summary)", "explanation": "This small batch pipeline loads rows, removes records missing a required field, then summarizes events by type.", "tryIt": "Add a check for duplicate event IDs before creating the summary."},
    "mlops": {"language": "python", "code": "run = {\"model\": \"classifier-v1\", \"data_version\": \"2026-01\", \"metric\": 0.91}\nprint(run)", "explanation": "Recording model, data, and metric together makes an experiment easier to compare and reproduce.", "tryIt": "Add a code version and a timestamp to the recorded run."},
}


def lesson_extras(concept: dict) -> dict:
    track_id = concept.get("trackId", "foundations")
    title = concept.get("title", "this concept")
    description = concept.get("description", "Explore the concept and test it with an example.")
    code = FALLBACK_CODE.get(track_id)
    resources = list(TRACK_RESOURCES.get(track_id, TRACK_RESOURCES["foundations"]))
    if track_id in {"dataEngineering", "machineLearning"}:
        resources.append({
            "title": "UDISE+ school infrastructure data (2023–24)",
            "url": INDIA_SCHOOL_DATA_PROJECT["url"],
            "kind": "India public dataset",
            "description": "An optional real-data exercise in inspecting, summarizing, and visualizing state/UT school counts.",
        })
    resources.append({
        "title": f"Video search: {title}",
        "url": f"https://www.youtube.com/results?search_query={quote_plus(title + ' visual explanation tutorial')}",
        "kind": "Video search",
        "description": "Open topic-matched video results and choose a lesson at your level.",
    })
    return {
        "visualSteps": [
            f"Question: what are we trying to understand about {title.lower()}?",
            f"Core idea: {description}",
            "Apply the idea to a small example",
            "Check the result and explain what it means",
        ],
        "codeExample": code,
        "miniProject": {
            "title": f"Build a {title.lower()} demo",
            "brief": f"Create a tiny demonstration that helps another learner see {title.lower()} in action.",
            "steps": [
                f"Write down the question your {title.lower()} demo should answer.",
                "Create or choose a small example dataset/input.",
                "Apply the core idea and show the result clearly.",
                "Test one edge case and write what you learned.",
            ],
            "stretchGoal": "Add a visual comparison that shows how changing one input affects the result.",
        },
        "recommendedResources": resources,
        "publicDataProject": INDIA_SCHOOL_DATA_PROJECT if track_id in {"dataEngineering", "machineLearning"} else None,
    }


def enrich_lesson(concept: dict, lesson: dict) -> dict:
    enriched = dict(lesson)
    defaults = lesson_extras(concept)
    visual_steps = enriched.get("visualSteps")
    if (not isinstance(visual_steps, list) or len(visual_steps) < 3
            or not all(isinstance(step, str) and step.strip() for step in visual_steps)):
        enriched["visualSteps"] = defaults["visualSteps"]
    code_example = enriched.get("codeExample")
    if "codeExample" not in enriched or (
        code_example is not None and (
            not isinstance(code_example, dict) or not code_example.get("code")
            or not all(code_example.get(key) for key in ("language", "explanation", "tryIt"))
            or not all(isinstance(code_example.get(key), str) for key in ("language", "code", "explanation", "tryIt"))
        )
    ):
        enriched["codeExample"] = defaults["codeExample"]
    project = enriched.get("miniProject")
    if (not isinstance(project, dict) or not isinstance(project.get("steps"), list)
            or not project.get("steps") or not all(project.get(key) for key in ("title", "brief", "stretchGoal"))):
        enriched["miniProject"] = defaults["miniProject"]
    elif not all(isinstance(step, str) for step in project["steps"]):
        enriched["miniProject"] = defaults["miniProject"]
    if not isinstance(enriched.get("recommendedResources"), list) or not enriched["recommendedResources"]:
        enriched["recommendedResources"] = defaults["recommendedResources"]
    if defaults.get("publicDataProject"):
        enriched["publicDataProject"] = defaults["publicDataProject"]
    return enriched
