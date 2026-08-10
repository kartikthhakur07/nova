import logging
from backend.bus.event_bus import bus

logger = logging.getLogger(__name__)

async def process_voice_command(case_id: str, text: str) -> None:
    """
    Process a voice command transcription and emit UI directives.
    For the MVP, this uses a simple keyword heuristic to trigger tools.
    """
    text_lower = text.lower()
    logger.info(f"Processing voice command for case {case_id}: {text}")

    # Tool: switch_screen
    if any(keyword in text_lower for keyword in ["similar", "before", "lesson", "history", "memory"]):
        logger.info("Voice Agent Tool: switch_screen -> lessons")
        await bus.publish("ui.switch_screen", {"case_id": case_id, "screen": "lessons"})
        await bus.publish("ui.announce", {"case_id": case_id, "text": "Switching to Lessons Learned."})
        return

    if any(keyword in text_lower for keyword in ["latest", "incident", "audit", "log"]):
        logger.info("Voice Agent Tool: switch_screen -> audit")
        await bus.publish("ui.switch_screen", {"case_id": case_id, "screen": "audit"})
        await bus.publish("ui.announce", {"case_id": case_id, "text": "Opening the Audit Trail."})
        return

    if any(keyword in text_lower for keyword in ["home", "overview", "dashboard"]):
        logger.info("Voice Agent Tool: switch_screen -> overview")
        await bus.publish("ui.switch_screen", {"case_id": case_id, "screen": "/"})
        await bus.publish("ui.announce", {"case_id": case_id, "text": "Returning to Overview."})
        return

    # Tool: focus_zone
    if "zone" in text_lower or "bay" in text_lower:
        # Very simple extraction
        for bay in ["bay 1", "bay 2", "bay 3", "bay 4", "bay 5"]:
            if bay in text_lower:
                zone_id = bay.replace(" ", "").capitalize()
                logger.info(f"Voice Agent Tool: focus_zone -> {zone_id}")
                await bus.publish("ui.focus_zone", {"case_id": case_id, "zone_id": zone_id})
                await bus.publish("ui.announce", {"case_id": case_id, "text": f"Focusing on {zone_id}."})
                return
                
    # Fallback
    logger.info("Voice Agent: Command not recognized.")
    await bus.publish("ui.announce", {"case_id": case_id, "text": "I heard you, but I am not sure how to help with that yet."})
