# AUDIT.md

### Part 0: Data Authenticity Audit

**1. `data_simulator/event_generator.py`**
- **Verdict**: **FAKE**
- **Exact lines**: 72-82 (in `_enrich_event`)
- **Reason**: The `ScenarioRunner` uses `raw.get("value")` straight from the JSON file to populate the emitted event. It completely bypasses runtime generation.

**2. `backend/scripts/run_continuous.py`**
- **Verdict**: **FAKE**
- **Exact lines**: 38-46
- **Reason**: Loads events from JSON and passes `event.get("value")` unmodified into `run_pipeline`. No variance or dynamic generation is applied.

**3. `data_simulator/sources/gas_sensor.py`**
- **Verdict**: **REAL**
- **Reason**: Contains actual stochastic logic (`random.gauss(0, self._drift_sigma)` and dynamic linear ramps `(target - current) / steps`). However, this logic is currently bypassed by the main runners.

**4. `data_simulator/scenarios/hero_scenario.json` and others**
- **Verdict**: **FAKE** (in usage)
- **Reason**: They contain hardcoded values (e.g. `15.2`, `18.5`) rather than parameters triggering the `gas_sensor.py` to reach target values dynamically.

### Action Plan (To be executed before Phase 1)
- Modify `event_generator.py` and `run_continuous.py` to instantiate `GasSensorSimulator` and its siblings.
- Scenario JSONs will specify `target_value` (if spiking) or just the event, and the generator computes every tick using realistic drift.
