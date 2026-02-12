import os
import time
from datetime import date
from typing import Optional, Dict, Any

from langchain_core.prompts import PromptTemplate
from langchain_openai import ChatOpenAI
from langchain_core.output_parsers import JsonOutputParser

# ==========================================================
# CONFIG (CORRECT WAY TO LOAD API KEY)
# ==========================================================
import os
import pathlib
from dotenv import load_dotenv

# 🔹 EXPLICITLY LOAD YOUR PROJECT .env FILE
PROJECT_ROOT = pathlib.Path(__file__).resolve().parents[3]  # Go up to TaskMaster/
ENV_PATH = PROJECT_ROOT / ".env"

load_dotenv(ENV_PATH)

# Read from environment (Django already loaded .env)
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

if not OPENAI_API_KEY:
    raise RuntimeError(
        "OPENAI_API_KEY is not set in environment variables. "
        "Check your .env file."
    )

os.environ["OPENAI_API_KEY"] = OPENAI_API_KEY


DEFAULT_MODEL = "gpt-4o-mini"
FALLBACK_MODEL = "gpt-3.5-turbo"
DEFAULT_MAX_TOKENS = 500

# ==========================================================
# PROMPTS
# ==========================================================

SYSTEM_PROMPT_BREAKDOWN = """
You are an expert task decomposition assistant.

Your job is to break a high-level task into ALL the meaningful subtasks that a person would realistically need to complete it.

Rules you MUST follow:
1. Do NOT limit yourself to 2 subtasks — generate as many as are logically necessary.
2. Each subtask should be a real, actionable step a human would actually perform.
3. Subtasks should be ordered in a reasonable execution sequence.
4. Each subtask MUST include estimated time **in minutes as an integer**.
5. If something is ongoing/habitual, use 0 minutes.
6. Think in terms of: planning → execution → validation → completion.

Return JSON ONLY in exactly this schema (no extra text, no explanations):

{{
  "subtasks": [
    {{"title": "clear, actionable step", "estimated_time": "120"}},
    {{"title": "clear, actionable step", "estimated_time": "15"}}
  ],
  "reasoning": "Concise explanation of your breakdown logic."
}}
"""

USER_PROMPT_BREAKDOWN = """
Task Title: {title}
Task Description: {description}

Break this into subtasks with estimated time.
"""

SYSTEM_PROMPT_SUGGEST_PRIORITY = """
You are a friendly and practical task prioritization assistant for everyday people.

Your job is to suggest a sensible priority level for a task based on:
- How urgent the due date feels
- How important the task is in real life
- What happens if the user delays it
- Whether the task is routine or critical

Allowed priorities (use ONLY these exact values):
- "low"
- "medium"
- "high"

Rules you MUST follow:
1. Always choose exactly ONE priority from the allowed priorities.
2. Provide a numerical confidence score between 0.0 and 1.0.
3. Provide a concise but clear reasoning (2–4 sentences max).
4. Do NOT return any extra text outside the JSON.

Return JSON ONLY in exactly this schema:

{{
  "suggested_priority": "high",
  "confidence": 0.95,
  "reasoning": "Brief explanation of why this priority was chosen."
}}
"""

USER_PROMPT_SUGGEST_PRIORITY = """
Task Title: {title}
Task Description: {description}
Due Date: {due_date}

Analyze the above task and determine the most appropriate priority level.
"""

# ==========================================================
# LLM FACTORY (with fallback)
# ==========================================================

def _get_llm(model: str = DEFAULT_MODEL, max_tokens: int = DEFAULT_MAX_TOKENS) -> ChatOpenAI:
    """
    Returns a primary LLM, with automatic fallback if it fails to initialize.
    """
    try:
        return ChatOpenAI(model=model, max_completion_tokens=max_tokens)
    except Exception:
        # Graceful fallback
        return ChatOpenAI(model=FALLBACK_MODEL, max_completion_tokens=max_tokens)

# ==========================================================
# CORE FUNCTIONS
# ==========================================================

def analyze_task_for_breakdown(
    title: str,
    description: str,
    model: str = DEFAULT_MODEL,
    max_tokens: int = DEFAULT_MAX_TOKENS,
) -> Dict[str, Any]:
    """
    Break a task into structured subtasks.

    Returns:
    {
      "subtasks": [{"title": "...", "estimated_time": "2h"}],
      "reasoning": "..."
    }
    """

    prompt = PromptTemplate(
        template=SYSTEM_PROMPT_BREAKDOWN + "\n\n" + USER_PROMPT_BREAKDOWN,
        input_variables=["title", "description"],
    )

    parser = JsonOutputParser()
    llm = _get_llm(model=model, max_tokens=max_tokens)
    chain = prompt | llm | parser

    start = time.time()

    try:
        result = chain.invoke({
            "title": title,
            "description": description or ""
        })

        # Defensive normalization (in case LLM drifts slightly)
        result.setdefault("subtasks", [])
        result.setdefault("reasoning", "")

        return result

    except Exception as e:
        # Safe fallback (never crash your app)
        return {
            "subtasks": [],
            "reasoning": f"AI service unavailable: {str(e)}",
            "_error": str(e),
            "_latency_ms": int((time.time() - start) * 1000),
        }


def suggest_priority(
    title: str,
    description: str,
    due_date: Optional[str] = None,
    model: str = DEFAULT_MODEL,
    max_tokens: int = DEFAULT_MAX_TOKENS,
) -> Dict[str, Any]:
    """
    Suggest a task priority.

    Returns:
    {
      "suggested_priority": "high",
      "confidence": 0.95,
      "reasoning": "..."
    }
    """

    if due_date is None:
        due_date = date.today().isoformat()

    prompt = PromptTemplate(
        template=SYSTEM_PROMPT_SUGGEST_PRIORITY + "\n\n" + USER_PROMPT_SUGGEST_PRIORITY,
        input_variables=["title", "description", "due_date"],
    )

    parser = JsonOutputParser()
    llm = _get_llm(model=model, max_tokens=max_tokens)
    chain = prompt | llm | parser

    start = time.time()

    try:
        result = chain.invoke({
            "title": title,
            "description": description or "",
            "due_date": due_date,
        })

        # Defensive defaults (LLMs sometimes omit fields)
        result.setdefault("suggested_priority", "medium")
        result.setdefault("confidence", 0.0)
        result.setdefault("reasoning", "")

        return result

    except Exception as e:
        return {
            "suggested_priority": "medium",
            "confidence": 0.0,
            "reasoning": f"AI service unavailable: {str(e)}",
            "_error": str(e),
            "_latency_ms": int((time.time() - start) * 1000),
        }

# print(analyze_task_for_breakdown(title="Wake up at 4 AM", description="IDK how to do it"))
# print(suggest_priority(title="Wake up at 4 AM", description="IDK how to do it"))