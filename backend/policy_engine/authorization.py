"""Authorization policy and choke point for tool execution.

STRUCTURAL ENFORCEMENT:
The LLM is NEVER the sole authority for tool execution in VIGIL.
The function ``is_tool_call_authorized`` is the single, non-bypassable choke
point that must be called before ANY tool executes anywhere in the backend.
"""

from __future__ import annotations

from typing import Literal

from backend.models.action import ToolCall


def required_authorization(
    tier: Literal["low", "medium", "high", "critical"] | str,
) -> Literal["none", "notify", "confirm"]:
    """Determine the authorization level required for a given risk tier.

    - low      -> "none"    (log only, automated recording)
    - medium   -> "notify"  (voice notification sent, no action requested)
    - high     -> "confirm" (explicit human approval required before tool execution)
    - critical -> "confirm" (explicit human approval required before tool execution)

    Args:
        tier: Risk tier string ("low", "medium", "high", or "critical").

    Returns:
        One of "none", "notify", or "confirm".

    Raises:
        ValueError: If tier is not one of the four recognized risk tiers.
    """
    tier_lower = tier.lower()
    if tier_lower == "low":
        return "none"
    elif tier_lower == "medium":
        return "notify"
    elif tier_lower in ("high", "critical"):
        return "confirm"
    else:
        raise ValueError(f"Unrecognized risk tier: {tier!r}")


def is_tool_call_authorized(tool_call: ToolCall) -> bool:
    """Validate whether a proposed tool call is fully authorized to execute.

    This function is the single choke point that MUST be called before any tool
    executes anywhere in the system. It returns True ONLY if:
    - ``tool_call.authorized`` is True, AND
    - ``tool_call.authorized_by`` is not None, AND
    - ``tool_call.authorized_at`` is not None.

    This function existing and being the ONLY path to "yes, execute" is the
    structural enforcement of "the LLM is never sole authority" — no tool handler
    or agent may invoke system capabilities without passing through this gate.

    Args:
        tool_call: The proposed ``ToolCall`` instance.

    Returns:
        True if all three authorization fields are present and valid, False otherwise.
    """
    if not tool_call.authorized:
        return False
    if tool_call.authorized_by is None:
        return False
    if tool_call.authorized_at is None:
        return False
    return True
