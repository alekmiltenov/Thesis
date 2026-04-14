class Debate():
    rounds:                     float
    participants:               list
    roles:                      list
    user_prompt:                str

    processed_prompt:           str
    context:                    str
    task:                       str

    



    def Process_Prompt(Prompt: str):
        # process user prompt ( shorten and extract core mission )
        # extract contex ( used by validators )
        # extract clear task ( small but always appended so we dont lose track)
        return processed_prompt, context, task

    def Debate_Round():

        # runn all models and save responses in history
        return 0 