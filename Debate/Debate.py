import os
import asyncio
from dotenv import load_dotenv
load_dotenv()
from .Participants.participant import Participant
from .Participants.presets_helper import Role


class Debate:
    rounds:                     int
    participants:               list
    user_prompt:                str

    processed_prompt:           str
    context:                    str | None
    task:                       str | None

    current_round:              int
    history:                    list
    final_answer:               str | None

    def __init__(self, rounds: int, participants: list, user_prompt: str):
        self.rounds = rounds
        self.participants = []
        for i, participant_data in enumerate(participants):
            participant = Participant(
                id = i+1,
                model = participant_data["model"],
                role = Role(participant_data["role"])
            )
            self.participants.append(participant)
        
        self.user_prompt = user_prompt

        self.processed_prompt = user_prompt
        self.context = None
        self.task = None

        self.current_round = 0
        self.history = []
        self.final_answer = None


    # def Process_Prompt(Prompt: str):
    #     # process user prompt ( shorten and extract core mission )
    #     # extract contex ( used by validators )
    #     # extract clear task ( small but always appended so we dont lose track)
    #     return processed_prompt, context, task

    async def Debate_Round(self, on_event=None):
        self.current_round += 1

        round_block = {
            "round": self.current_round,
            "thinker_outputs": [],
            "reviewer_outputs": [],
            "final_thinker_outputs": [],
            "judge_outputs": []
        }

        prompt_text = self.processed_prompt

        if self.task:
            prompt_text += "\n\nTASK:\n" + self.task

        if self.context:
            prompt_text += "\n\nCONTEXT:\n" + self.context

        if self.history:
            last_round = self.history[-1]

            prompt_text += "\n\nLAST ROUND THINKERS:\n"
            for output in last_round["thinker_outputs"]:
                prompt_text += f"{output['role']} ({output['model']}):\n{output['text']}\n\n"

            prompt_text += "\nLAST ROUND REVIEWERS:\n"
            for output in last_round["reviewer_outputs"]:
                prompt_text += f"{output['role']} ({output['model']}):\n{output['text']}\n\n"

        async def run_one(participant, prompt):
            res = await asyncio.to_thread(participant.run_participant, prompt)
            return participant, res

        thinkers = [participant for participant in self.participants if participant.role_type == "thinker"]
        thinker_tasks = [run_one(participant, prompt_text) for participant in thinkers]

        for task in asyncio.as_completed(thinker_tasks):
            participant, res = await task

            item = {
                "id": participant.id,
                "role": participant.role.value,
                "model": participant.model,
                "text": res["text"]
            }

            round_block["thinker_outputs"].append(item)

            print(res["model"])
            print(res["text"])

            if on_event:
                await on_event({
                    "type": "participant_response",
                    "round": self.current_round,
                    "phase": "thinker",
                    "participant": item
                })

        reviewer_prompt = prompt_text + "\n\nCURRENT ROUND THINKERS:\n"
        for output in round_block["thinker_outputs"]:
            reviewer_prompt += f"{output['role']} ({output['model']}):\n{output['text']}\n\n"

        reviewers = [participant for participant in self.participants if participant.role_type == "reviewer"]
        reviewer_tasks = [run_one(participant, reviewer_prompt) for participant in reviewers]

        for task in asyncio.as_completed(reviewer_tasks):
            participant, res = await task

            item = {
                "id": participant.id,
                "role": participant.role.value,
                "model": participant.model,
                "text": res["text"]
            }

            round_block["reviewer_outputs"].append(item)

            print(res["model"])
            print(res["text"])

            if on_event:
                await on_event({
                    "type": "participant_response",
                    "round": self.current_round,
                    "phase": "reviewer",
                    "participant": item
                })

        if self.current_round == self.rounds:
            final_thinker_prompt = reviewer_prompt + "\n\nCURRENT ROUND REVIEWERS:\n"
            for output in round_block["reviewer_outputs"]:
                final_thinker_prompt += f"{output['role']} ({output['model']}):\n{output['text']}\n\n"

            final_thinkers = [participant for participant in self.participants if participant.role_type == "thinker"]
            final_thinker_tasks = [run_one(participant, final_thinker_prompt) for participant in final_thinkers]

            for task in asyncio.as_completed(final_thinker_tasks):
                participant, res = await task

                item = {
                    "id": participant.id,
                    "role": participant.role.value,
                    "model": participant.model,
                    "text": res["text"]
                }

                round_block["final_thinker_outputs"].append(item)

                print(res["model"])
                print(res["text"])

                if on_event:
                    await on_event({
                        "type": "participant_response",
                        "round": self.current_round,
                        "phase": "final_thinker",
                        "participant": item
                    })

            judge_prompt = final_thinker_prompt + "\n\nFINAL THINKERS:\n"
            for output in round_block["final_thinker_outputs"]:
                judge_prompt += f"{output['role']} ({output['model']}):\n{output['text']}\n\n"

            judges = [participant for participant in self.participants if participant.role_type == "judge"]
            judge_tasks = [run_one(participant, judge_prompt) for participant in judges]

            for task in asyncio.as_completed(judge_tasks):
                participant, res = await task

                item = {
                    "id": participant.id,
                    "role": participant.role.value,
                    "model": participant.model,
                    "text": res["text"]
                }

                round_block["judge_outputs"].append(item)
                self.final_answer = res["text"]

                print(res["model"])
                print(res["text"])

                if on_event:
                    await on_event({
                        "type": "participant_response",
                        "round": self.current_round,
                        "phase": "judge",
                        "participant": item
                    })

        self.history.append(round_block)

        if on_event:
            await on_event({
                "type": "round_complete",
                "round": self.current_round,
                "round_block": round_block
            })

        return round_block
    

    async def run_debate(self, on_event=None):
        if on_event:
            await on_event({
                "type": "debate_started",
                "rounds": self.rounds,
                "participants": [
                    {"id": p.id, "model": p.model, "role": p.role.value, "role_type": p.role_type}
                    for p in self.participants
                ]
            })

        for _ in range(self.rounds):
            await self.Debate_Round(on_event=on_event)


if __name__ == "__main__":
    participants = [
        {"model": "deepseek-chat", "role": "solver"},
        # {"model": "claude-sonnet-4-6", "role": "solver"},
        # {"model": "qwen/qwen3.6-plus", "role": "explorer"},
        # {"model": "qwen/qwen3.6-plus", "role": "critic"},
        # {"model": "llama-3.1-8b-instant", "role": "critic"},
        # {"model": "gpt-5.4-mini", "role": "validator"},
        # {"model": "llama-3.1-8b-instant", "role": "judge"},

    ]

    debate = Debate(
        rounds=1,
        participants=participants,
        user_prompt=""
    )

    async def main():
        for _ in range(debate.rounds):
            await debate.Debate_Round()

    asyncio.run(main())