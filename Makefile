.PHONY: help dev test test-unit test-db test-all lint format build clean

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

dev: ## Start development environment
	cd infra/docker && docker compose -f docker-compose.dev.yml up -d
	pnpm db:migrate
	pnpm dev

test: test-all ## Run all tests (alias for test-all)

test-unit: ## Run unit tests
	pnpm test:unit

test-db: ## Run database tests
	pnpm test:db

test-all: ## Run all tests (unit + database)
	pnpm test:all

test-coverage: ## Generate test coverage report
	pnpm test:coverage

lint: ## Run linter
	pnpm lint

format: ## Format code
	pnpm format

build: ## Build all packages
	pnpm build

db-migrate: ## Apply database migrations
	pnpm db:migrate

db-reset: ## Reset database and reapply migrations
	pnpm db:reset

db-test: ## Run database tests
	pnpm db:test

clean: ## Clean build artifacts and dependencies
	rm -rf node_modules apps/*/node_modules packages/*/node_modules
	rm -rf apps/*/dist packages/*/dist
	find . -name ".turbo" -type d -exec rm -rf {} +

docker-up: ## Start Docker services
	cd infra/docker && docker compose -f docker-compose.dev.yml up -d

docker-down: ## Stop Docker services
	cd infra/docker && docker compose -f docker-compose.dev.yml down

docker-reset: ## Reset Docker services (removes volumes)
	cd infra/docker && docker compose -f docker-compose.dev.yml down -v

ci: lint build test-all ## Run CI pipeline locally
	@echo "✓ CI pipeline completed successfully"
