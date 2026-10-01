import os
import json
import logging
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

BASE_URL = os.getenv("LLM_BASE_URL", "https://api.groq.com/openai/v1")
API_KEY = os.getenv("LLM_API_KEY")
MODEL = os.getenv("LLM_MODEL", "openai/gpt-oss-20b")
FALLBACK_BASE_URL = os.getenv("LLM_FALLBACK_BASE_URL", "https://generativelanguage.googleapis.com/v1beta/openai/")
FALLBACK_API_KEY = os.getenv("LLM_FALLBACK_API_KEY")
FALLBACK_MODEL = os.getenv("LLM_FALLBACK_MODEL")
REQUEST_TIMEOUT_SECONDS = float(os.getenv("LLM_TIMEOUT_SECONDS", "30"))
logger = logging.getLogger(__name__)


def _providers() -> list[tuple[str, str, str, str]]:
    providers = []
    if API_KEY:
        providers.append(("primary", BASE_URL, API_KEY, MODEL))
    if FALLBACK_API_KEY and FALLBACK_MODEL:
        providers.append(("fallback", FALLBACK_BASE_URL, FALLBACK_API_KEY, FALLBACK_MODEL))
    return providers

def call_llm_for_json(system_prompt: str, user_prompt: str) -> dict:
    providers = _providers()
    if not providers:
        raise RuntimeError("Configure LLM_API_KEY or both LLM_FALLBACK_API_KEY and LLM_FALLBACK_MODEL")

    failures = []
    for label, base_url, api_key, model in providers:
        try:
            response = OpenAI(base_url=base_url, api_key=api_key, timeout=REQUEST_TIMEOUT_SECONDS, max_retries=0).chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                response_format={"type": "json_object"},
                temperature=0.3,
            )
            content = response.choices[0].message.content
            if not content:
                raise ValueError("Provider returned an empty response")
            result = json.loads(content)
            if label == "fallback":
                logger.info("LLM request succeeded using the fallback provider")
            return result
        except Exception as exc:
            failures.append(f"{label}: {type(exc).__name__}")
            logger.warning("LLM %s provider failed (%s)", label, type(exc).__name__)

    raise RuntimeError("All configured LLM providers failed (" + "; ".join(failures) + ")")
