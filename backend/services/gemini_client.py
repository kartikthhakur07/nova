import os
import json
import httpx

async def classify(system_prompt: str, reading: dict) -> dict:
    """
    Calls Gemini API with the system prompt and reading as user input.
    Returns a dictionary (parsed JSON).
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("WARNING: GEMINI_API_KEY not found. Fallback to flagged=False")
        return {"flagged": False, "reason": "No API key"}

    # We use the configured model or fall back to gemini-3.5-flash
    model = os.getenv("GEMINI_MODEL", "gemini-3.5-flash")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    
    payload = {
        "systemInstruction": {
            "parts": [{"text": system_prompt}]
        },
        "contents": [
            {
                "role": "user",
                "parts": [{"text": json.dumps(reading, indent=2)}]
            }
        ],
        "generationConfig": {
            "responseMimeType": "application/json"
        }
    }
    
    async with httpx.AsyncClient() as client:
        for attempt in range(5):
            try:
                resp = await client.post(url, json=payload, timeout=15.0)
                if resp.status_code == 429:
                    import asyncio
                    sleep_time = (2 ** attempt) + 1
                    print(f"Rate limited (429) calling Gemini. Retrying in {sleep_time}s (attempt {attempt+1}/5)...")
                    await asyncio.sleep(sleep_time)
                    continue
                
                resp.raise_for_status()
                data = resp.json()
                
                # Extract JSON string from response
                text_response = data.get("candidates", [])[0].get("content", {}).get("parts", [])[0].get("text", "{}")
                
                try:
                    parsed = json.loads(text_response)
                    return parsed, text_response
                except json.JSONDecodeError:
                    print(f"Failed to parse JSON from Gemini: {text_response}")
                    return {"flagged": False, "reason": "JSON decode error", "confidence": 0.0}, text_response
                    
            except Exception as e:
                # Retry on connection/network issues too
                if attempt < 4:
                    import asyncio
                    sleep_time = (2 ** attempt) + 1
                    print(f"Connection error or API error calling Gemini: {e}. Retrying in {sleep_time}s...")
                    await asyncio.sleep(sleep_time)
                    continue
                print(f"Error calling Gemini classify API: {e}")
                return {"flagged": False, "reason": f"API Error: {str(e)}", "confidence": 0.0}, ""

