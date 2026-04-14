from enum import Enum
import Debate.Participants.prompts as prompts

class Role(Enum):
    SOLVER = "solver"
    EXPLORER = "explorer"

    CRITIC = "critic"

    VALIDATOR = "validator"
    JUDGE = "judge"


MODEL_PROVIDER_MAP = {
    "gpt-4.1": "openai",
    "gpt-4.1-mini": "openai",
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