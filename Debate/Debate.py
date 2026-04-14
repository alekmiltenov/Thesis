import os
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

    def Debate_Round(self):
        self.history = self.processed_prompt
        for participant in self.participants:
            if participant.role_type == "thinker":
                res = participant.run_participant(self.history)
                self.history += res["text"]
                print(res["model"])
                print(res["text"])
            if participant.role_type == "reviewer":
                self.history += res["text"]
                res = participant.run_participant(self.history)
                print(res["model"])
                print(res["text"])
            if participant.role_type == "judge":
                res = participant.run_participant(self.history)
                print(res["model"])
                print(res["text"])
            
        return 0 
    


if __name__ == "__main__":
    participants = [
        {"model": "llama-3.1-8b-instant", "role": "solver"},
        {"model": "llama-3.1-8b-instant", "role": "explorer"},
        {"model": "qwen/qwen3.6-plus", "role": "critic"},
        {"model": "llama-3.1-8b-instant", "role": "critic"},
        {"model": "llama-3.1-8b-instant", "role": "validator"},
        {"model": "llama-3.1-8b-instant", "role": "judge"},

    ]

    debate = Debate(
        rounds=1,
        participants=participants,
        user_prompt="Im simulating a qubit, and realistic noise environment for my project. I'm making T1 thermal excitation and i want to model how it depends on temperature. i want to calculate probabiloty each timestep dt fo excitation jump happening on my 2 by 2 density matrix represenation of the qubit. No lindblad. I want to be proper and correct so i can build it and then publish it in paper , so everything has to be good. I want to make it proper and for different temperatures because the RL agent environment will be stochastic so to adapt to different qubits , so it can make a generally better dd pulse sequence. How do i model it - what formula and what params do i bake into the qubit as specific qubit properties? Will nth bose work for thermal excitation? if yes, why , if no , why not SYNTHESIZED TASK : ANSWER THE FOLLOWING: IS NTH BOSE WHAT THE USER SHOULD MODEL THERMAL EXCITATION WITH IN HIS SPECIFIC CASE. SYNTHESIZED CONTEXT?SITUATION : NV CENTER QUBIT, SIMULATION, THERMAL EXCITTAION, SCIENTIFIC PAPER LEVEL CORRECTNESS"
    )

    debate.Debate_Round()