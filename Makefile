.PHONY: dev install test eval seed

dev:
	@echo "Starting Altrix Health Copilot..."
	@bash ./run.sh

install:
	@echo "Installing backend dependencies..."
	python -m pip install -r backend/requirements.txt
	@echo "Installing frontend dependencies..."
	cd frontend && npm install

seed:
	cd backend && python -m app.seed

test:
	python -m pytest backend/tests/test_pipeline.py -v

eval:
	python backend/tests/eval_extraction.py
