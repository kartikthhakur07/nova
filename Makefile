# Makefile

.PHONY: install install-backend install-frontend \
        dev dev-backend dev-frontend \
        seed-qdrant demo reset-demo \
        e2e benchmark lint \
        deploy-check

# ── Setup ────────────────────────────────────────────────────────
install: install-backend install-frontend

install-backend:
	cd backend && pip install -r ../requirements.txt

install-frontend:
	cd frontend && npm install

# ── Development ──────────────────────────────────────────────────
dev:
	@echo "Starting NOVA backend + frontend..."
	@make -j2 dev-backend dev-frontend

dev-backend:
	cd backend && uvicorn main:app --host 0.0.0.0 --port 8000 --reload

dev-frontend:
	cd frontend && npm run dev

# ── Demo ─────────────────────────────────────────────────────────
demo:
	@echo "═══════════════════════════════════"
	@echo "  NOVA — StarForge 2026 Demo Start "
	@echo "═══════════════════════════════════"
	@make _check-env
	@make _seed-db
	@echo "Starting backend..."
	@make -j2 dev-backend _open-browser

_open-browser:
	@sleep 4 && open http://localhost:5173 || xdg-open http://localhost:5173 || start http://localhost:5173

_seed-db:
	cd backend && python -c "import asyncio; from db.db import init_db, seed_demo_cases; asyncio.run(init_db()); asyncio.run(seed_demo_cases())"

_check-env:
	@test -f .env || (echo "ERROR: .env not found. Copy .env.example and fill in RIME_API_KEY." && exit 1)
	@grep -q "RIME_API_KEY" .env || (echo "ERROR: RIME_API_KEY missing from .env" && exit 1)
	@echo "✓ .env present"

reset-demo:
	@rm -f vigil.db
	@make _seed-db
	@echo "✓ Demo state reset"

# ── Evaluation ───────────────────────────────────────────────────
e2e:
	python evaluation/e2e_smoke.py

benchmark:
	python evaluation/benchmark_runner.py --output evaluation/results/latest.json

# ── Quality ──────────────────────────────────────────────────────
lint:
	cd frontend && npx tsc --noEmit
	cd backend && python -m py_compile main.py api/routes_cases.py bus/event_bus.py

# ── Deploy check ─────────────────────────────────────────────────
deploy-check:
	@echo "Checking for hardcoded secrets..."
	@grep -r "sk-" backend/ --include="*.py" && echo "FAIL: found API key in backend" || echo "✓ backend clean"
	@grep -r "sk-" frontend/src/ --include="*.ts" --include="*.tsx" && echo "FAIL: found API key in frontend" || echo "✓ frontend clean"
	@echo "Checking .env is gitignored..."
	@grep -q "^.env$$" .gitignore && echo "✓ .env gitignored" || echo "FAIL: .env not in .gitignore"
