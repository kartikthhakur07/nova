import uuid
from datetime import datetime, timezone
from backend.db.db import get_db

async def propose_permit_suspension(case_id: str, permit_id: str, reason: str) -> dict:
    """
    Creates a pending_action for a permit suspension.
    Requires human-in-the-loop approval.
    """
    action_id = f"act-{uuid.uuid4().hex[:8]}"
    details = f"Suspend Permit {permit_id}: {reason}"
    
    async with get_db() as db:
        await db.execute(
            """
            INSERT INTO pending_actions
            (action_id, case_id, action_type, details, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (action_id, case_id, "permit_suspend", details, "pending", datetime.now(timezone.utc).isoformat())
        )
        
    return {
        "action_id": action_id,
        "case_id": case_id,
        "type": "permit_suspend",
        "details": details,
        "status": "pending"
    }

async def resolve_pending_action(action_id: str, approved: bool) -> dict:
    """
    Approves or dismisses a pending action, moving it to the `actions` table.
    """
    async with get_db() as db:
        cursor = await db.execute("SELECT * FROM pending_actions WHERE action_id = ?", (action_id,))
        pending = await cursor.fetchone()
        
        if not pending:
            raise ValueError(f"Pending action {action_id} not found.")
            
        status = "executed" if approved else "dismissed"
        
        await db.execute(
            """
            INSERT INTO actions (action_id, case_id, action_type, details, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (pending["action_id"], pending["case_id"], pending["action_type"], pending["details"], status, datetime.now(timezone.utc).isoformat())
        )
        
        await db.execute("DELETE FROM pending_actions WHERE action_id = ?", (action_id,))
        
        # If this was a permit suspend and approved, we should theoretically update the permits table
        if pending["action_type"] == "permit_suspend" and approved:
            # Extract permit ID assuming format "Suspend Permit {permit_id}: ..."
            parts = pending["details"].split(" ")
            if len(parts) >= 3:
                permit_id = parts[2].strip(":")
                await db.execute("UPDATE permits SET status = 'suspended' WHERE permit_id = ?", (permit_id,))
                
    return {"action_id": action_id, "status": status}
