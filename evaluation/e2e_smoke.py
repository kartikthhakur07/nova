"""
NOVA E2E Smoke Test
Tests: backend reachable → demo API → WS events → case state → authorize gate
Run: python evaluation/e2e_smoke.py
Pass condition: all 8 assertions green, exits 0
Fail condition: any assertion fails, prints which step failed, exits 1
"""
from __future__ import annotations

import asyncio
import json
import sys
import httpx
import websockets

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

BASE_URL = "http://localhost:8000"
WS_URL = "ws://localhost:8000/ws/session/e2e-test-session"


async def run_smoke_test() -> None:
    passed_steps: list[str] = []
    client = httpx.AsyncClient(base_url=BASE_URL, timeout=10.0)

    try:
        # STEP 1 — Backend health
        try:
            resp = await client.get("/api/cases")
            assert resp.status_code == 200, f"Expected status 200, got {resp.status_code}"
            data = resp.json()
            assert isinstance(data, list), f"Expected list response, got {type(data)}"
            passed_steps.append("STEP 1 — Backend health")
            print("✓ STEP 1 — Backend health")
        except Exception as exc:
            print(f"✗ STEP 1 — Backend health FAILED: {exc}")
            sys.exit(1)

        # STEP 2 — Seed data present
        try:
            resp = await client.get("/api/cases")
            assert resp.status_code == 200
            cases = resp.json()
            assert len(cases) >= 1, f"Expected len(cases) >= 1, got {len(cases)}"
            first = cases[0]
            for key in ("case_id", "zone_id", "state", "compound_score"):
                assert key in first, f"Missing key '{key}' in case item: {first}"
            assert "tier" in first or "risk_tier" in first, f"Missing tier/risk_tier in case item: {first}"
            passed_steps.append("STEP 2 — Seed data present")
            print("✓ STEP 2 — Seed data present")
        except Exception as exc:
            print(f"✗ STEP 2 — Seed data present FAILED: {exc}")
            sys.exit(1)

        # STEP 3 — Demo control API
        try:
            resp = await client.post("/api/demo/scenarios/hero_scenario/play")
            assert resp.status_code == 200, f"Play endpoint returned {resp.status_code}: {resp.text}"
            
            # Allow brief moment for background play loop to start
            await asyncio.sleep(0.5)
            
            status_resp = await client.get("/api/demo/status")
            assert status_resp.status_code == 200
            status = status_resp.json()
            assert status.get("playing") is True, f"Expected playing=True, got {status}"
            scenario_id = status.get("active_scenario") or status.get("scenario_id")
            assert scenario_id == "hero_scenario", f"Expected hero_scenario, got {scenario_id}"
            passed_steps.append("STEP 3 — Demo control API")
            print("✓ STEP 3 — Demo control API")
        except Exception as exc:
            print(f"✗ STEP 3 — Demo control API FAILED: {exc}")
            sys.exit(1)

        # STEP 4 — WebSocket connection
        ws_conn = None
        first_msg = None
        try:
            ws_conn = await asyncio.wait_for(
                websockets.connect(WS_URL),
                timeout=3.0,
            )
            raw_msg = await asyncio.wait_for(ws_conn.recv(), timeout=5.0)
            first_msg = json.loads(raw_msg)
            for k in ("type", "payload", "ts"):
                assert k in first_msg, f"Message missing key '{k}': {first_msg}"
            assert first_msg["type"] == "connection.status", f"Expected type 'connection.status', got {first_msg.get('type')}"
            passed_steps.append("STEP 4 — WebSocket connection")
            print("✓ STEP 4 — WebSocket connection")
        except Exception as exc:
            print(f"✗ STEP 4 — WebSocket connection FAILED: {exc}")
            if ws_conn:
                await ws_conn.close()
            sys.exit(1)

        # STEP 5 — WS event flow (wait up to 30s)
        try:
            risk_updated_received = False
            start_time = asyncio.get_event_loop().time()

            while (asyncio.get_event_loop().time() - start_time) < 30.0:
                try:
                    raw = await asyncio.wait_for(ws_conn.recv(), timeout=2.0)
                    msg = json.loads(raw)
                    if msg.get("type") == "risk.updated":
                        payload = msg.get("payload", {})
                        assert "case_id" in payload, f"Missing case_id in risk.updated payload: {payload}"
                        assert "compound_score" in payload, f"Missing compound_score in risk.updated: {payload}"
                        assert "tier" in payload or "risk_tier" in payload, f"Missing tier in risk.updated: {payload}"
                        evidence = payload.get("evidence")
                        assert isinstance(evidence, list), f"Evidence must be a list, got {type(evidence)}"
                        assert len(evidence) >= 1, f"Evidence list must have len >= 1, got {len(evidence)}"
                        risk_updated_received = True
                        break
                except asyncio.TimeoutError:
                    continue

            assert risk_updated_received, "Timed out waiting for 'risk.updated' envelope over WebSocket"
            passed_steps.append("STEP 5 — WS event flow")
            print("✓ STEP 5 — WS event flow")
        except Exception as exc:
            print(f"✗ STEP 5 — WS event flow FAILED: {exc}")
            if ws_conn:
                await ws_conn.close()
            sys.exit(1)
        finally:
            if ws_conn:
                await ws_conn.close()

        # STEP 6 — Case state in DB
        try:
            resp = await client.get("/api/cases/c_8f21")
            assert resp.status_code == 200, f"Expected 200 for case c_8f21, got {resp.status_code}"
            case_data = resp.json()
            assert "state" in case_data and case_data["state"] is not None, f"Expected non-null state in case data: {case_data}"
            passed_steps.append("STEP 6 — Case state in DB")
            print("✓ STEP 6 — Case state in DB")
        except Exception as exc:
            print(f"✗ STEP 6 — Case state in DB FAILED: {exc}")
            sys.exit(1)

        # STEP 7 — Authorization gate
        try:
            auth_resp = await client.post("/api/cases/c_8f21/authorize", json={"decision": "yes"})
            assert auth_resp.status_code == 200, f"Expected 200 on authorize, got {auth_resp.status_code}: {auth_resp.text}"
            auth_data = auth_resp.json()
            assert auth_data.get("authorized") is True, f"Expected authorized=True, got {auth_data}"

            audit_resp = await client.get("/api/cases/c_8f21/audit")
            assert audit_resp.status_code == 200, f"Expected 200 on audit, got {audit_resp.status_code}"
            audit_entries = audit_resp.json()
            assert isinstance(audit_entries, list) and len(audit_entries) >= 1, f"Expected audit list len >= 1, got {audit_entries}"
            passed_steps.append("STEP 7 — Authorization gate")
            print("✓ STEP 7 — Authorization gate")
        except Exception as exc:
            print(f"✗ STEP 7 — Authorization gate FAILED: {exc}")
            sys.exit(1)

        # STEP 8 — Reset
        try:
            reset_resp = await client.post("/api/demo/scenarios/hero_scenario/reset")
            assert reset_resp.status_code == 200, f"Expected 200 on reset, got {reset_resp.status_code}"
            
            status_resp = await client.get("/api/demo/status")
            assert status_resp.status_code == 200
            status = status_resp.json()
            assert status.get("playing") is False, f"Expected playing=False, got {status}"
            passed_steps.append("STEP 8 — Reset")
            print("✓ STEP 8 — Reset")
        except Exception as exc:
            print(f"✗ STEP 8 — Reset FAILED: {exc}")
            sys.exit(1)

        print("\n══════════════════════════")
        print("NOVA E2E Smoke Test")
        print("══════════════════════════")
        for step in passed_steps:
            print(f"✓ {step}")
        print("══════════════════════════")
        print(f"PASSED {len(passed_steps)}/8 — integration layer verified")
        print("══════════════════════════")
        sys.exit(0)

    finally:
        await client.aclose()


if __name__ == "__main__":
    asyncio.run(run_smoke_test())
