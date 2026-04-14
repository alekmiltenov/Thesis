from .presets_helper import ROLE_PRESETS, MODEL_PROVIDER_MAP, Role
from .prompts import BASE_PROMPT
from .provider_router import api_call


class Participant:
    id:                         str
    model:                      str
    provider:                   str

    role:                       Role
    role_type :                 str
    system_prompt:              str
    temperature:                float


    def __init__(
                self,
                id: int,
                model: str,
                role: Role,
                provider: str | None = None,
                role_type: str | None = None,
                system_prompt: str | None = None,
                temperature: float | None = None,
                ):
        
        self.id = id
        self.model = model
        self.role = role

        self.provider = provider or MODEL_PROVIDER_MAP[model]
        preset = ROLE_PRESETS[role]

        self.role_type = role_type or preset["role_type"]
        self.system_prompt = system_prompt or (BASE_PROMPT + "\n\n" + preset["system_prompt"])
        self.temperature = temperature if temperature is not None else preset["temperature"]


    def run_participant(self, prompt):
        return api_call(self.provider, self.model, self.system_prompt, prompt, self.temperature)