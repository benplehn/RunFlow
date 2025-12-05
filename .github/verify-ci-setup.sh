#!/bin/bash

# Script to verify CI/CD setup is complete
# Run this before pushing to GitHub

set -e

echo "🔍 Verifying CI/CD Setup..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check files
check_file() {
  if [ -f "$1" ]; then
    echo -e "${GREEN}✓${NC} $1 exists"
    return 0
  else
    echo -e "${RED}✗${NC} $1 missing"
    return 1
  fi
}

check_dir() {
  if [ -d "$1" ]; then
    echo -e "${GREEN}✓${NC} $1 exists"
    return 0
  else
    echo -e "${RED}✗${NC} $1 missing"
    return 1
  fi
}

echo "📁 Checking required files..."
echo ""

# GitHub Actions
check_file ".github/workflows/ci.yml"
check_file ".github/CONTRIBUTING.md"

# Package files
check_file "package.json"
check_file "pnpm-lock.yaml"
check_file "turbo.json"

# TypeScript config
check_file "tsconfig.base.json"

# Infra files
check_file "infra/supabase/config.toml"
check_dir "infra/supabase/migrations"
check_dir "infra/supabase/tests"

# Test files
check_file "infra/supabase/tests/001_extensions.sql"
check_file "infra/supabase/tests/002_schema_structure.sql"
check_file "infra/supabase/tests/003_rls_policies.sql"
check_file "infra/supabase/tests/004_functions.sql"

# Makefile
check_file "Makefile"

echo ""
echo "📦 Checking apps structure..."
echo ""

check_dir "apps/api"
check_dir "apps/worker"

echo ""
echo "📚 Checking packages structure..."
echo ""

check_dir "packages/domain"
check_dir "packages/db"
check_dir "packages/schemas"
check_dir "packages/config"
check_dir "packages/telemetry"

echo ""
echo "🧪 Checking that commands work..."
echo ""

# Check pnpm
if command -v pnpm &> /dev/null; then
  echo -e "${GREEN}✓${NC} pnpm is installed"
else
  echo -e "${RED}✗${NC} pnpm not found - install with: npm install -g pnpm"
  exit 1
fi

# Check Docker
if command -v docker &> /dev/null; then
  echo -e "${GREEN}✓${NC} docker is installed"
else
  echo -e "${YELLOW}⚠${NC} docker not found - needed for local development"
fi

# Check Supabase CLI
if command -v supabase &> /dev/null; then
  echo -e "${GREEN}✓${NC} supabase CLI is installed"
else
  echo -e "${YELLOW}⚠${NC} supabase CLI not found - install from https://supabase.com/docs/guides/cli"
fi

echo ""
echo "✅ CI/CD setup verification complete!"
echo ""
echo "Next steps:"
echo "  1. Update the badge URL in README.md with your GitHub username/repo"
echo "  2. Push to GitHub and check the Actions tab"
echo "  3. Ensure all CI checks pass"
echo ""
