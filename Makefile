.PHONY: help setup models dev down build logs clean deploy test

help: ## Show this help message
	@echo "CareerGini Development Commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\\033[36m%-20s\\033[0m %s\\n", $$1, $$2}'

setup: ## Initial setup - copy env and start infrastructure
	@echo "🚀 Setting up CareerGini..."
	@cp -n .env.example .env || true
	@echo "📝 Please edit .env with your configuration"
	@echo "🐳 Starting infrastructure services..."
	@sudo docker compose up -d postgres redis chromadb ollama
	@echo "⏳ Waiting for services to be ready..."
	@sleep 15
	@echo "✅ Infrastructure ready!"

models: ## Download Ollama models (~12 GB)
	@./scripts/download-models.sh

dev: models ## Start all services in development mode
	@echo "🚀 Starting CareerGini in development mode..."
	@docker-compose up

down: ## Stop all services
	@docker-compose down

build: ## Build all Docker images
	@sudo docker compose build

logs: ## Show logs from all services
	@sudo docker compose logs -f

clean: ## Remove all containers, volumes, and images
	@echo "⚠️  This will delete all data. Press Ctrl+C to cancel..."
	@sleep 5
	@sudo docker compose down -v --rmi all

deploy: ## Deploy to production
	@./scripts/deploy.sh

test: ## Run tests for all services
	@echo "🧪 Running tests..."
	@cd frontend && npm test
	@cd api-gateway && npm test
	@cd ai-service && pytest

db-init: ## Initialize database
	@sudo docker compose exec postgres psql -U careergini -d careergini -f /docker-entrypoint-initdb.d/init.sql

db-reset: ## Reset database (WARNING: DELETES ALL DATA)
	@echo "⚠️  Resetting database - all data will be lost!"
	@sudo docker compose down postgres
	@docker volume rm careergini_postgres_data || true
	@sudo docker compose up -d postgres
	@sleep 5
	@make db-init
