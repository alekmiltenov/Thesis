from enum import Enum
from . import prompts


# ── Orchestrator config ────────────────────────────────────────────────────────
# Change model/provider here to use a different cheap model.
ORCHESTRATOR_MODEL    = "claude-haiku-4-5"
ORCHESTRATOR_PROVIDER = "anthropic"

ORCHESTRATOR_SYSTEM_PROMPT = prompts.ORCHESTRATOR_SYSTEM_PROMPT
# ──────────────────────────────────────────────────────────────────────────────

class Role(Enum):
    SOLVER = "solver"
    EXPLORER = "explorer"

    CRITIC = "critic"

    VALIDATOR = "validator"
    JUDGE = "judge"


MODEL_PROVIDER_MAP = {
    "gpt-4.1": "openai",
    "gpt-4.1-mini": "openai",
    "gpt-5.4": "openai",
    "gpt-5.4-mini": "openai",

    "claude-sonnet-4-6": "anthropic",
    "claude-opus-4-6": "anthropic",
    "claude-haiku-4-5": "anthropic",

    "gemini-2.5-pro": "google",
    "gemini-2.5-flash": "google",

    "deepseek-chat": "deepseek",
    "deepseek-reasoner": "deepseek",

    "openrouter/free": "openrouter",
    "meta-llama/llama-3.2-3b-instruct:free": "openrouter",
    "deepseek/deepseek-r1:free": "openrouter",
    "llama-3.1-8b-instant": "groq",
    "llama-3.3-70b-versatile": "groq",

    "qwen/qwen3.6-plus": "openrouter",
}

ROLE_PRESETS = {
    Role.SOLVER: {
        "role_type": "thinker",
        "system_prompt": prompts.SOLVER_SYSTEM_PROMPT,
        "temperature": 0.5
    },
    Role.EXPLORER: {
        "role_type": "thinker",
        "system_prompt": prompts.EXPLORER_SYSTEM_PROMPT,
        "temperature": 0.8
    },
    Role.CRITIC: {
        "role_type": "reviewer",
        "system_prompt": prompts.CRITIC_SYSTEM_PROMPT,
        "temperature": 0.8
    },
    Role.VALIDATOR: {
        "role_type": "reviewer",
        "system_prompt": prompts.VALIDATOR_SYSTEM_PROMPT,
        "temperature": 0.5
    },
    Role.JUDGE: {
        "role_type": "judge",
        "system_prompt": prompts.JUDGE_SYSTEM_PROMPT,
        "temperature": 0.4
    },

}