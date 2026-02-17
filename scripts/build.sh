#!/bin/bash

# Flowin Admin Panel Build Script
# This script builds the Flowin Admin Panel for production

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

# Clean build directory
clean_build() {
    print_status "Cleaning build directory..."
    
    if [ -d ".next" ]; then
        rm -rf .next
        print_success "Build directory cleaned"
    fi
    
    if [ -d "out" ]; then
        rm -rf out
        print_success "Output directory cleaned"
    fi
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    if [ "$PACKAGE_MANAGER" = "yarn" ]; then
        yarn install --frozen-lockfile
    else
        npm ci
    fi
    
    print_success "Dependencies installed"
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

# Run tests
run_tests() {
    print_status "Running tests..."
    
    if [ "$PACKAGE_MANAGER" = "yarn" ]; then
        yarn test
    else
        npm test
    fi
    
    print_success "Tests completed"
}

# Build application
build_app() {
    print_status "Building application..."
    
    if [ "$PACKAGE_MANAGER" = "yarn" ]; then
        yarn build
    else
        npm run build
    fi
    
    print_success "Application built successfully"
}

# Build Docker image
build_docker() {
    print_status "Building Docker image..."
    
    docker build -t flowin/admin-panel:latest .
    
    print_success "Docker image built successfully"
}

# Main execution
main() {
    echo "=========================================="
    echo "  Flowin Admin Panel Build"
    echo "=========================================="
    echo ""
    
    check_node
    check_package_manager
    
    case "${1:-all}" in
        "clean")
            clean_build
            ;;
        "install")
            install_dependencies
            ;;
        "lint")
            run_lint
            ;;
        "type-check")
            run_type_check
            ;;
        "test")
            run_tests
            ;;
        "build")
            build_app
            ;;
        "docker")
            build_docker
            ;;
        "all")
            clean_build
            install_dependencies
            run_lint
            run_type_check
            run_tests
            build_app
            if [ "$2" = "--docker" ]; then
                build_docker
            fi
            ;;
        *)
            print_error "Unknown build type: $1"
            print_status "Available types: clean, install, lint, type-check, test, build, docker, all"
            exit 1
            ;;
    esac
    
    print_success "Build completed successfully!"
}

# Run main function
main "$@"
