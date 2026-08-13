import json
from datetime import datetime, timezone
from backend.db.db import get_db
from backend.services.groq_client import chat

async def generate_prediction(case_id: str, counterfactual: bool = False) -> dict:
    """
    1. Queries recent decision_traces for the case.
    2. Extracts (timestamp, value) pairs.
    3. Computes linear regression to project future values.
    4. Uses Groq to generate a narrative prediction.
    """
    async with get_db() as db:
        cursor = await db.execute(
            "SELECT raw_reading, created_at FROM decision_traces WHERE case_id = ? ORDER BY created_at ASC LIMIT 50",
            (case_id,)
        )
        rows = await cursor.fetchall()

    data_points = []
    start_time = None
    
    for row in rows:
        try:
            reading = json.loads(row["raw_reading"])
            val = reading.get("value")
            if val is not None and isinstance(val, (int, float)):
                dt = datetime.fromisoformat(row["created_at"].replace("Z", "+00:00"))
                if start_time is None:
                    start_time = dt
                
                seconds = (dt - start_time).total_seconds()
                data_points.append((seconds, float(val)))
        except Exception:
            continue
            
    if len(data_points) < 2:
        return {
            "slope": 0.0,
            "intercept": 0.0,
            "projections": [],
            "narrative": "Insufficient data points for prediction.",
            "counterfactual": counterfactual
        }
        
    # Linear Regression: y = mx + b
    n = len(data_points)
    sum_x = sum(pt[0] for pt in data_points)
    sum_y = sum(pt[1] for pt in data_points)
    sum_xy = sum(pt[0] * pt[1] for pt in data_points)
    sum_xx = sum(pt[0] ** 2 for pt in data_points)
    
    denominator = (n * sum_xx - sum_x ** 2)
    if denominator == 0:
        m = 0
    else:
        m = (n * sum_xy - sum_x * sum_y) / denominator
        
    b = (sum_y - m * sum_x) / n
    
    last_t = data_points[-1][0]
    
    # Counterfactual modifier
    if counterfactual:
        # Assume actions were not taken; perhaps steeper slope
        m *= 1.2
    
    projections = []
    # Predict for +1, +3, +5 minutes
    for offset_minutes in [1, 3, 5]:
        t_future = last_t + (offset_minutes * 60)
        proj_val = m * t_future + b
        projections.append({"offset_minutes": offset_minutes, "projected_value": round(proj_val, 2)})
        
    # Generate Narrative via Groq
    system_prompt = "You are a predictive intelligence model for an industrial safety system. Provide a brief (1-2 sentence) narrative of what this trajectory implies."
    user_prompt = f"Current trend is slope {m:.3f} per second. Projections: {json.dumps(projections)}. Context: {'COUNTERFACTUAL (Assuming no intervention)' if counterfactual else 'ACTIVE PREDICTION'}."
    
    narrative = await chat(system_prompt, user_prompt)
    
    return {
        "slope": m,
        "intercept": b,
        "projections": projections,
        "narrative": narrative,
        "counterfactual": counterfactual
    }
