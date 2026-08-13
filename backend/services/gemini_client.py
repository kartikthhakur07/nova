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

    # We use gemini-1.5-flash as the default classifier
    model = "gemini-3.5-flash"
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
        try:
            resp = await client.post(url, json=payload, timeout=10.0)
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
            print(f"Error calling Gemini classify API: {e}")
            return {"flagged": False, "reason": f"API Error: {str(e)}", "confidence": 0.0}, ""
