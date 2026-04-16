import os
import asyncio
from dotenv import load_dotenv
load_dotenv()
from Participants.participant import Participant
from Participants.presets_helper import Role


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

    async def Debate_Round(self):
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

        thinkers = [participant for participant in self.participants if participant.role_type == "thinker"]
        thinker_results = await asyncio.gather(*[
            asyncio.to_thread(participant.run_participant, prompt_text)
            for participant in thinkers
        ])

        for participant, res in zip(thinkers, thinker_results):
            round_block["thinker_outputs"].append({
                "id": participant.id,
                "role": participant.role.value,
                "model": participant.model,
                "text": res["text"]
            })

            print(res["model"])
            print(res["text"])

        reviewer_prompt = prompt_text + "\n\nCURRENT ROUND THINKERS:\n"
        for output in round_block["thinker_outputs"]:
            reviewer_prompt += f"{output['role']} ({output['model']}):\n{output['text']}\n\n"

        reviewers = [participant for participant in self.participants if participant.role_type == "reviewer"]
        reviewer_results = await asyncio.gather(*[
            asyncio.to_thread(participant.run_participant, reviewer_prompt)
            for participant in reviewers
        ])

        for participant, res in zip(reviewers, reviewer_results):
            round_block["reviewer_outputs"].append({
                "id": participant.id,
                "role": participant.role.value,
                "model": participant.model,
                "text": res["text"]
            })

            print(res["model"])
            print(res["text"])

        if self.current_round == self.rounds:
            final_thinker_prompt = reviewer_prompt + "\n\nCURRENT ROUND REVIEWERS:\n"
            for output in round_block["reviewer_outputs"]:
                final_thinker_prompt += f"{output['role']} ({output['model']}):\n{output['text']}\n\n"

            final_thinkers = [participant for participant in self.participants if participant.role_type == "thinker"]
            final_thinker_results = await asyncio.gather(*[
                asyncio.to_thread(participant.run_participant, final_thinker_prompt)
                for participant in final_thinkers
            ])

            for participant, res in zip(final_thinkers, final_thinker_results):
                round_block["final_thinker_outputs"].append({
                    "id": participant.id,
                    "role": participant.role.value,
                    "model": participant.model,
                    "text": res["text"]
                })

                print(res["model"])
                print(res["text"])

            judge_prompt = final_thinker_prompt + "\n\nFINAL THINKERS:\n"
            for output in round_block["final_thinker_outputs"]:
                judge_prompt += f"{output['role']} ({output['model']}):\n{output['text']}\n\n"

            judges = [participant for participant in self.participants if participant.role_type == "judge"]
            judge_results = await asyncio.gather(*[
                asyncio.to_thread(participant.run_participant, judge_prompt)
                for participant in judges
            ])

            for participant, res in zip(judges, judge_results):
                round_block["judge_outputs"].append({
                    "id": participant.id,
                    "role": participant.role.value,
                    "model": participant.model,
                    "text": res["text"]
                })

                print(res["model"])
                print(res["text"])

        self.history.append(round_block)
        return round_block
    


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