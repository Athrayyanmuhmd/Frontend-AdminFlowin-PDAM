#!/bin/bash

# Flowin Admin Panel Test Script
# This script runs tests for the Flowin Admin Panel

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
check_node() {
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_success "Node.js is installed: $NODE_VERSION"
    else
        print_error "Node.js is not installed. Please install Node.js 18 or higher."
        exit 1
    fi
}

# Check if package manager is available
check_package_manager() {
    if command -v yarn &> /dev/null; then
        PACKAGE_MANAGER="yarn"
    elif command -v npm &> /dev/null; then
        PACKAGE_MANAGER="npm"
    else
        print_error "Neither npm nor yarn is available. Please install one of them."
        exit 1
    fi
}

# Run linting
run_lint() {
    print_status "Running linting..."
    
    if [ "$PACKAGE_MANAGER" = "yarn" ]; then
        yarn lint
    else
        npm run lint
    fi
    
    print_success "Linting completed"
}

# Run type checking
run_type_check() {
    print_status "Running type checking..."
    
    if [ "$PACKAGE_MANAGER" = "yarn" ]; then
        yarn type-check
    else
        npm run type-check
    fi
    
    print_success "Type checking completed"
}

# Run unit tests
run_unit_tests() {
    print_status "Running unit tests..."
    
    if [ "$PACKAGE_MANAGER" = "yarn" ]; then
        yarn test
    else
        npm test
    fi
    
    print_success "Unit tests completed"
}

# Run E2E tests
run_e2e_tests() {
    print_status "Running E2E tests..."
    
    if [ "$PACKAGE_MANAGER" = "yarn" ]; then
        yarn test:e2e
    else
        npm run test:e2e
    fi
    
    print_success "E2E tests completed"
}

# Run all tests
run_all_tests() {
    print_status "Running all tests..."
    
    run_lint
    run_type_check
    run_unit_tests
    
    if [ "$1" = "--e2e" ]; then
        run_e2e_tests
    fi
    
    print_success "All tests completed successfully!"
}

# Main execution
main() {
    echo "=========================================="
    echo "  Flowin Admin Panel Test Suite"
    echo "=========================================="
    echo ""
    
    check_node
    check_package_manager
    
    case "${1:-all}" in
        "lint")
            run_lint
            ;;
        "type-check")
            run_type_check
            ;;
        "unit")
            run_unit_tests
            ;;
        "e2e")
            run_e2e_tests
            ;;
        "all")
            run_all_tests "$2"
            ;;
        *)
            print_error "Unknown test type: $1"
            print_status "Available types: lint, type-check, unit, e2e, all"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
