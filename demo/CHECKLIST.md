# NOVA Pre-Demo Checklist

A step-by-step checklist to run through 30 minutes before going live for a presentation or judging session.

- [ ] Run demo reset to clear SQLite and start with fresh database state
- [ ] Run E2E smoke test and verify all 8 integration steps pass green
- [ ] Verify environment file contains a real active Rime API key rather than placeholder text
- [ ] Verify Qdrant Cloud connection is reachable and healthy
- [ ] Open frontend in browser at localhost:5173 and confirm Risk Overview loads with 2 zone cards visible
- [ ] Press Command-K to open Demo Control and verify the WebSocket event log shows connected status
- [ ] Start Hero Scenario at 2x playback speed and verify the stepper navigation advances to Signals within 20 seconds
- [ ] Confirm Voice page activates within 45 seconds as the Rime speech call begins
- [ ] Interrupt the live voice response by asking "wait which permit" and verify NOVA answers the interruption and resumes the workflow
- [ ] Navigate to Confirm page, select Yes, and verify the authorized action entry appears in the Audit log
- [ ] Navigate to Memory page and verify the lessons learned banner appears after incident resolution
- [ ] Reset scenario state, start the Second Incident scenario, and verify the Retrieval page displays the historical lesson learned from the previous incident
- [ ] Test fallback resilience: disconnect network/Rime key and verify the browser text-to-speech fallback banner appears while the pipeline continues operating
