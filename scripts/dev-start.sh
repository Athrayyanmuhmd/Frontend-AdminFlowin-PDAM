#!/bin/bash

# Flowin Admin Panel Development Start Script
# This script starts the development environment for the Flowin Admin Panel

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

# Install dependencies if needed
install_dependencies() {
    if [ ! -d "node_modules" ]; then
        print_status "Installing dependencies..."
        if [ "$PACKAGE_MANAGER" = "yarn" ]; then
            yarn install
        else
            npm install
        fi
        print_success "Dependencies installed"
    fi
}

# Start development server
start_dev_server() {
    print_status "Starting development server..."
    
    if [ "$PACKAGE_MANAGER" = "yarn" ]; then
        yarn dev
    else
        npm run dev
    fi
}

# Main execution
main() {
    echo "=========================================="
    echo "  Flowin Admin Panel Development Start"
    echo "=========================================="
    echo ""
    
    check_node
    check_package_manager
    install_dependencies
    start_dev_server
}

# Run main function
main "$@"
