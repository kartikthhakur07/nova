import os
import json
import httpx

async def chat(system_prompt: str, user_prompt: str) -> str:
    """
    Calls Groq API with the system and user prompt.
    Returns plain text.
    """
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        print("WARNING: GROQ_API_KEY not found.")
        return "status nominal, awaiting details"

    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "llama-3.1-8b-instant",  # or any preferred Groq model
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
    }
    
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.post(url, json=payload, headers=headers, timeout=10.0)
            resp.raise_for_status()
            data = resp.json()
            return data.get("choices", [])[0].get("message", {}).get("content", "")
        except Exception as e:
            print(f"Error calling Groq chat API: {e}")
            return "status nominal, awaiting details"

async def chat_json(system_prompt: str, user_prompt: str) -> dict:
    """
    Calls Groq API requesting JSON format.
    """
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        print("WARNING: GROQ_API_KEY not found.")
        return {}

    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "llama-3.1-8b-instant",
        "response_format": {"type": "json_object"},
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
    }
    
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.post(url, json=payload, headers=headers, timeout=10.0)
            resp.raise_for_status()
            data = resp.json()
            text_response = data.get("choices", [])[0].get("message", {}).get("content", "{}")
            return json.loads(text_response)
        except Exception as e:
            print(f"Error calling Groq chat_json API: {e}")
            return {}
