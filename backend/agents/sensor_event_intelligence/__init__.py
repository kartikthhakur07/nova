"""Sensor/Event Intelligence agent package.

Re-exports the public API so consumers can write:
    from backend.agents.sensor_event_intelligence import SensorEventIntelligenceAgent
    from backend.agents.sensor_event_intelligence import sensor_agent
"""

from .agent import SensorEventIntelligenceAgent, sensor_agent
from .normalizer import normalize
from .schemas import RawEvent

# Backward-compatible alias (old name used by _dev_fixtures tests)
SensorEventIntelligence = SensorEventIntelligenceAgent

__all__ = [
    "SensorEventIntelligenceAgent",
    "SensorEventIntelligence",  # alias
    "sensor_agent",
    "normalize",
    "RawEvent",
]
