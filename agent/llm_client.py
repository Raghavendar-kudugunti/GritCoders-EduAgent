import os
import json
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

BASE_URL = os.getenv("LLM_BASE_URL", "https://api.groq.com/openai/v1")
API_KEY = os.getenv("LLM_API_KEY")
MODEL = os.getenv("LLM_MODEL", "openai/gpt-oss-20b")

def _client() -> OpenAI:
    if not API_KEY:
        raise RuntimeError("LLM_API_KEY is not configured")
    return OpenAI(base_url=BASE_URL, api_key=API_KEY)

def call_llm_for_json(system_prompt: str, user_prompt: str) -> dict:
    response = _client().chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        response_format={"type": "json_object"},
        temperature=0.3,
    )
    return json.loads(response.choices[0].message.content)
