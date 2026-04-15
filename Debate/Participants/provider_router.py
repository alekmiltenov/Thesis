import os
from openai import OpenAI
from anthropic import Anthropic
from google import genai
from google.genai import types


def api_call(provider: str, model: str, system_prompt:str, prompt: str, temperature: float):


    if provider == "openai":
        client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

        response = client.responses.create(
        model=model,
        instructions=system_prompt,
        input=prompt,
        temperature=temperature,
        )

        return {
            "text": response.output_text,
            "model": model,
            "provider": provider,
            "usage": getattr(response, "usage", None),
            # "raw_response": response,
        }
    

    if provider == "anthropic":
        client = Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

        response = client.messages.create(
            model=model,
            system=system_prompt,
            messages=[
                {"role": "user", "content": prompt}
            ],
            temperature=temperature,
            max_tokens=1024,
        )

        return {
            "text": response.content[0].text,
            "model": model,
            "provider": provider,
            "usage": getattr(response, "usage", None),
            # "raw_response": response,
        }
    

    if provider == "google":
        client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

        response = client.models.generate_content(
            model=model,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
                temperature=temperature,
            ),
        )

        return {
            "text": response.text,
            "model": model,
            "provider": provider,
            "usage": getattr(response, "usage_metadata", None),
            # "raw_response": response,
        }
    

    if provider == "groq":
        client = OpenAI(
            api_key=os.environ.get("GROQ_API_KEY"),
            base_url="https://api.groq.com/openai/v1",
        )

        response = client.responses.create(
            model=model,
            instructions=system_prompt,
            input=prompt,
            temperature=temperature,
        )

        return {
            "text": response.output_text,
            "model": model,
            "provider": provider,
            "usage": getattr(response, "usage", None),
            # "raw_response": response,
        }


    if provider == "deepseek":
        client = OpenAI(
            api_key=os.environ.get("DEEPSEEK_API_KEY"),
            base_url="https://api.deepseek.com",
        )

        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt},
            ],
            temperature=temperature,
        )

        return {
            "text": response.choices[0].message.content,
            "model": model,
            "provider": provider,
            "usage": getattr(response, "usage", None),
            "raw_response": response,
        }
    

    if provider == "openrouter":
        client = OpenAI(
            api_key=os.environ.get("OPENROUTER_API_KEY"),
            base_url="https://openrouter.ai/api/v1",
            default_headers={
                "HTTP-Referer": "http://localhost:3000",
                "X-OpenRouter-Title": "Thesis",
            },
        )

        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt},
            ],
            temperature=temperature,
            max_tokens=200,
        )

        return {
            "text": response.choices[0].message.content,
            "model": model,
            "provider": provider,
            "usage": getattr(response, "usage", None),
            "raw_response": response,
        }
