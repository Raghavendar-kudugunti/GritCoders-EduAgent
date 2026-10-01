"""Curated AI curriculum tracks used by the adaptive planner and lesson agent."""

from __future__ import annotations

from copy import deepcopy
import re


TRACKS = {
    "foundations": {
        "title": "AI foundations",
        "description": "Core ideas that connect data, models, evaluation, and responsible use.",
        "color": "teal",
        "concepts": [
            ("What AI can and cannot do", "Distinguish automation, machine learning, and generative systems.", 25),
            ("Data, examples, and labels", "Understand how examples and labels shape what a model can learn.", 30),
            ("Training and inference", "Follow a model from training through prediction in a real application.", 25),
            ("Generalization and overfitting", "Recognize memorization and test whether a model handles new cases.", 35),
            ("Evaluation and error analysis", "Choose useful metrics and learn from the examples a model gets wrong.", 35),
            ("Responsible AI and privacy", "Identify bias, privacy, safety, and human oversight concerns.", 30),
        ],
    },
    "python": {
        "title": "Python for AI",
        "description": "The practical Python skills used to inspect data and build AI systems.",
        "color": "orange",
        "concepts": [
            ("Python setup and notebooks", "Run Python code, inspect results, and keep experiments reproducible.", 25),
            ("Values and data types", "Use strings, numbers, booleans, and conversions safely.", 30),
            ("Conditions and loops", "Express decisions and repeat work over data.", 35),
            ("Functions and modules", "Break programs into reusable, testable pieces.", 40),
            ("Lists, dictionaries, and sets", "Choose useful containers for examples, labels, and lookups.", 35),
            ("Files, errors, and testing", "Read data, handle failures, and check behavior with small tests.", 40),
            ("NumPy arrays", "Represent numerical data and perform vectorized calculations.", 45),
            ("Pandas data frames", "Load, inspect, clean, and summarize tabular datasets.", 50),
            ("HTTP APIs and JSON", "Call model services and exchange structured data.", 35),
            ("A small end-to-end AI project", "Combine data preparation, a model call, and a clear result.", 60),
        ],
    },
    "machineLearning": {
        "title": "Machine learning",
        "description": "From a measurable problem to validated models and useful predictions.",
        "color": "blue",
        "concepts": [
            ("Frame a prediction problem", "Define examples, features, target, and what a useful prediction means.", 30),
            ("Train, validation, and test data", "Separate data correctly and avoid leakage from the future.", 35),
            ("Baselines and regression", "Build a simple baseline and predict numerical outcomes.", 45),
            ("Classification and decision thresholds", "Predict categories while accounting for the cost of mistakes.", 45),
            ("Decision trees and ensembles", "Learn how tree models split data and combine many learners.", 50),
            ("Features and preprocessing", "Turn raw values into useful model inputs without leaking information.", 45),
            ("Metrics and cross-validation", "Measure model quality with metrics matched to the task.", 45),
            ("Clustering and dimensionality reduction", "Find structure when labels are missing.", 50),
            ("Error analysis and calibration", "Inspect failures and understand confidence in predictions.", 40),
            ("Fairness and model limits", "Check performance across groups and identify deployment risks.", 35),
        ],
    },
    "deepLearning": {
        "title": "Deep learning",
        "description": "Neural networks, representation learning, and modern architectures.",
        "color": "purple",
        "concepts": [
            ("Tensors and neural network layers", "Represent batches of data and compose learnable transformations.", 40),
            ("Loss, gradients, and backpropagation", "Connect prediction error to parameter updates.", 50),
            ("Optimization and regularization", "Train reliably with learning rates, batches, and regularization.", 45),
            ("Embeddings and representations", "Map items into vectors whose geometry captures useful patterns.", 40),
            ("Convolutional networks", "Understand local filters and image feature hierarchies.", 45),
            ("Attention and transformers", "Model relationships between tokens using attention.", 55),
            ("Transfer learning and fine-tuning", "Adapt a pretrained network to a smaller target task.", 45),
            ("Deep learning evaluation", "Diagnose underfitting, overfitting, and data distribution shifts.", 40),
        ],
    },
    "generativeAI": {
        "title": "Generative AI",
        "description": "Language models, prompting, grounded generation, evaluation, and agents.",
        "color": "blue",
        "concepts": [
            ("How language models generate text", "Understand tokens, next-token prediction, and sampling.", 35),
            ("Transformers and attention", "See how attention lets a model use context across a sequence.", 45),
            ("Prompt design and context windows", "Give models clear tasks, examples, constraints, and relevant context.", 35),
            ("Structured outputs and tool calling", "Use schemas and tools to make model behavior easier to integrate.", 40),
            ("Embeddings and semantic search", "Represent meaning as vectors and retrieve related information.", 40),
            ("Retrieval-augmented generation", "Ground answers in selected source material and expose citations.", 50),
            ("Fine-tuning and model adaptation", "Choose between prompting, retrieval, and parameter updates.", 45),
            ("Generative AI evaluation and safety", "Test factuality, usefulness, privacy, and harmful failure modes.", 45),
            ("Multimodal models", "Combine text with images, audio, or other input types.", 40),
            ("Agents and multi-step workflows", "Connect model decisions to tools, state, and recovery steps.", 50),
        ],
    },
    "rag": {
        "title": "Retrieval-augmented generation",
        "description": "Build grounded question-answering systems from documents and data.",
        "color": "teal",
        "concepts": [
            ("RAG architecture and tradeoffs", "Trace ingestion, indexing, retrieval, context, and generation.", 30),
            ("Document ingestion and parsing", "Extract clean text and metadata from files and data sources.", 35),
            ("Chunking and metadata", "Split documents to preserve meaning and useful source boundaries.", 40),
            ("Embeddings and vector indexes", "Create vector representations and search an index efficiently.", 45),
            ("Hybrid retrieval", "Combine semantic and keyword search to improve recall.", 45),
            ("Reranking and query expansion", "Improve candidate ordering and handle ambiguous questions.", 40),
            ("Context assembly and citations", "Fit evidence into a prompt and retain links to its source.", 35),
            ("RAG evaluation and debugging", "Measure retrieval and answer quality separately, then find failure causes.", 50),
            ("RAG security and access control", "Keep private documents isolated and defend against prompt injection.", 40),
        ],
    },
    "dataEngineering": {
        "title": "Data engineering for AI",
        "description": "Reliable data pipelines, storage, quality, and feature preparation.",
        "color": "orange",
        "concepts": [
            ("SQL and relational modeling", "Query, join, and model data for reliable downstream use.", 45),
            ("Ingestion and data contracts", "Bring data in with explicit schemas and change expectations.", 40),
            ("Batch transformation", "Clean and transform large datasets in repeatable jobs.", 45),
            ("Data warehouses and lakehouses", "Choose storage patterns for analytics and machine learning.", 40),
            ("Streaming and event data", "Process continuously arriving events with ordering and delay in mind.", 45),
            ("Data quality and lineage", "Detect bad data and trace where a dataset came from.", 40),
            ("Workflow orchestration", "Schedule, retry, and observe dependencies between data jobs.", 40),
            ("Feature pipelines and stores", "Keep training and inference features consistent.", 45),
        ],
    },
    "mlops": {
        "title": "MLOps",
        "description": "Ship models safely and keep their data, behavior, and service healthy.",
        "color": "green",
        "concepts": [
            ("Reproducible experiments", "Track code, data, parameters, and results for each run.", 35),
            ("Model packaging and registries", "Version models and record how they were built.", 40),
            ("Inference APIs and deployment", "Serve predictions with clear latency and reliability targets.", 45),
            ("CI/CD for machine learning", "Automate checks and safe releases for model systems.", 45),
            ("Training and feature pipelines", "Automate repeatable preparation, training, and validation.", 45),
            ("Monitoring and data drift", "Track service health and changes in production inputs.", 40),
            ("Model quality and feedback loops", "Detect quality decline and use new outcomes to improve models.", 40),
            ("Security, governance, and rollback", "Manage access, audit changes, and recover from unsafe releases.", 40),
        ],
    },
}

FOCUS_TRACK = {
    "programming": "python",
    "fundamentals": "foundations",
    "math": "foundations",
    "machineLearning": "machineLearning",
    "deepLearning": "deepLearning",
    "nlp": "generativeAI",
    "generativeAI": "generativeAI",
    "rag": "rag",
    "dataEngineering": "dataEngineering",
    "agents": "generativeAI",
    "mlops": "mlops",
}

ROLE_TRACK = {
    "student": "foundations",
    "engineer": "python",
    "entrepreneur": "generativeAI",
    "teacher": "foundations",
    "parent": "foundations",
    "curious": "generativeAI",
}


def _slug(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


CONCEPTS: dict[str, dict] = {}
for track_id, track in TRACKS.items():
    for order, (title, description, minutes) in enumerate(track["concepts"], start=1):
        concept_id = f"{track_id}-{_slug(title)}"
        CONCEPTS[concept_id] = {
            "id": concept_id,
            "title": title,
            "category": track["title"],
            "trackId": track_id,
            "description": description,
            "durationMinutes": minutes,
            "order": order,
            "accent": track["color"],
        }


def get_concept(concept_id: str) -> dict | None:
    concept = CONCEPTS.get(concept_id)
    return deepcopy(concept) if concept else None


def get_track_concepts(track_id: str) -> list[dict]:
    track = TRACKS[track_id]
    return [deepcopy(CONCEPTS[f"{track_id}-{_slug(title)}"]) for title, _, _ in track["concepts"]]


def topic_catalog() -> list[dict]:
    return [
        {
            "id": track_id,
            "title": track["title"],
            "category": "AI curriculum",
            "description": track["description"],
            "lessonCount": len(track["concepts"]),
            "color": track["color"],
            "progressPercent": 0,
        }
        for track_id, track in TRACKS.items()
    ]
