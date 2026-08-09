-- VIGIL Database Schema (§11.4)
-- SQLite-compatible DDL

CREATE TABLE IF NOT EXISTS cases (
    case_id       TEXT PRIMARY KEY,
    zone_id       TEXT NOT NULL,
    state         TEXT NOT NULL DEFAULT 'DETECTED',
    risk_tier     TEXT NOT NULL DEFAULT 'low',
    compound_score REAL NOT NULL DEFAULT 0.0,
    authorized    INTEGER NOT NULL DEFAULT 0,   -- SQLite boolean (0/1)
    authorized_by TEXT,
    authorized_at TEXT,                          -- ISO8601 string
    created_at    TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS audit_log (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    case_id       TEXT NOT NULL REFERENCES cases(case_id),
    action        TEXT NOT NULL,
    actor         TEXT NOT NULL DEFAULT 'system',
    decision      TEXT,
    payload       TEXT,                          -- JSON blob
    ts            TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS permits (
    permit_id     TEXT PRIMARY KEY,
    zone_id       TEXT NOT NULL,
    permit_type   TEXT NOT NULL,
    issued_to     TEXT NOT NULL,
    issued_at     TEXT NOT NULL,
    expires_at    TEXT NOT NULL,
    status        TEXT NOT NULL DEFAULT 'active',
    metadata      TEXT                           -- JSON blob
);

CREATE TABLE IF NOT EXISTS maintenance_records (
    record_id     TEXT PRIMARY KEY,
    equipment_id  TEXT NOT NULL,
    zone_id       TEXT NOT NULL,
    activity_type TEXT NOT NULL,
    technician    TEXT NOT NULL,
    started_at    TEXT NOT NULL,
    completed_at  TEXT,
    status        TEXT NOT NULL DEFAULT 'in_progress',
    notes         TEXT
);

CREATE TABLE IF NOT EXISTS shifts (
    shift_id      TEXT PRIMARY KEY,
    zone_id       TEXT NOT NULL,
    supervisor    TEXT NOT NULL,
    headcount     INTEGER NOT NULL DEFAULT 0,
    started_at    TEXT NOT NULL,
    ends_at       TEXT NOT NULL,
    is_changeover INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS equipment (
    equipment_id  TEXT PRIMARY KEY,
    zone_id       TEXT NOT NULL,
    name          TEXT NOT NULL,
    type          TEXT NOT NULL,
    status        TEXT NOT NULL DEFAULT 'operational',
    last_serviced TEXT,
    metadata      TEXT                           -- JSON blob
);

-- Index helpers for common look-ups
CREATE INDEX IF NOT EXISTS idx_audit_case ON audit_log(case_id);
CREATE INDEX IF NOT EXISTS idx_cases_zone ON cases(zone_id);
CREATE INDEX IF NOT EXISTS idx_permits_zone ON permits(zone_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_equipment ON maintenance_records(equipment_id);
CREATE INDEX IF NOT EXISTS idx_shifts_zone ON shifts(zone_id);
