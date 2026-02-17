#!/bin/bash

# Flowin Admin Panel Development Setup Script
# This script sets up the development environment for the Flowin Admin Panel

set -e

echo "🚀 Setting up Flowin Admin Panel Development Environment..."

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
    print_status "Checking Node.js installation..."
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_success "Node.js is installed: $NODE_VERSION"
        
        # Check if version is 18 or higher
        NODE_MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
        if [ "$NODE_MAJOR_VERSION" -lt 18 ]; then
            print_warning "Node.js version 18 or higher is recommended. Current version: $NODE_VERSION"
        fi
    else
        print_error "Node.js is not installed. Please install Node.js 18 or higher."
        exit 1
    fi
}

# Check if npm or yarn is available
check_package_manager() {
    print_status "Checking package manager..."
    if command -v yarn &> /dev/null; then
        print_success "Yarn is available"
        PACKAGE_MANAGER="yarn"
    elif command -v npm &> /dev/null; then
        print_success "NPM is available"
        PACKAGE_MANAGER="npm"
    else
        print_error "Neither npm nor yarn is available. Please install one of them."
        exit 1
    fi
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies with $PACKAGE_MANAGER..."
    
    if [ "$PACKAGE_MANAGER" = "yarn" ]; then
        yarn install
    else
        npm install
    fi
    
    print_success "Dependencies installed successfully"
}

# Setup environment variables
setup_env() {
    print_status "Setting up environment variables..."
    
    if [ ! -f ".env.local" ]; then
        if [ -f "env.example" ]; then
            cp env.example .env.local
            print_success "Environment file created from example"
        else
            print_warning "No env.example file found. Creating basic .env.local..."
            cat > .env.local << EOF
# Flowin Admin Panel Environment Variables
NEXT_PUBLIC_APP_NAME=Flowin Admin Panel
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_API_TIMEOUT=30000
NODE_ENV=development
EOF
            print_success "Basic environment file created"
        fi
    else
        print_warning ".env.local already exists. Skipping environment setup."
    fi
}

# Setup Git hooks
setup_git_hooks() {
    print_status "Setting up Git hooks..."
    
    if [ -d ".git" ]; then
        # Create pre-commit hook
        cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
# Pre-commit hook for Flowin Admin Panel

echo "Running pre-commit checks..."

# Run linting
npm run lint

# Run type checking
npm run type-check

echo "Pre-commit checks completed successfully!"
EOF
        chmod +x .git/hooks/pre-commit
        print_success "Git hooks configured"
    else
        print_warning "Not a Git repository. Skipping Git hooks setup."
    fi
}

# Create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    
    mkdir -p public/assets/images
    mkdir -p public/assets/logos
    mkdir -p uploads/temp
    mkdir -p logs
    
    print_success "Directories created"
}

# Setup TypeScript
setup_typescript() {
    print_status "Setting up TypeScript..."
    
    if [ ! -f "tsconfig.json" ]; then
        print_warning "tsconfig.json not found. Creating basic configuration..."
        cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
EOF
        print_success "TypeScript configuration created"
    fi
}

# Run initial build
run_build() {
    print_status "Running initial build..."
    
    if [ "$PACKAGE_MANAGER" = "yarn" ]; then
        yarn build
    else
        npm run build
    fi
    
    print_success "Build completed successfully"
}

# Display final instructions
show_final_instructions() {
    echo ""
    echo "🎉 Flowin Admin Panel development environment setup completed!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Start the development server:"
    if [ "$PACKAGE_MANAGER" = "yarn" ]; then
        echo "   yarn dev"
    else
        echo "   npm run dev"
    fi
    echo ""
    echo "2. Open your browser and navigate to:"
    echo "   http://localhost:3000"
    echo ""
    echo "3. Login with demo credentials:"
    echo "   Username: admin"
    echo "   Password: admin123"
    echo ""
    echo "📚 Documentation:"
    echo "   - README.md: General information"
    echo "   - TECHNICAL_DOCUMENTATION.md: Technical details"
    echo ""
    echo "🔧 Available scripts:"
    if [ "$PACKAGE_MANAGER" = "yarn" ]; then
        echo "   yarn dev          - Start development server"
        echo "   yarn build        - Build for production"
        echo "   yarn start        - Start production server"
        echo "   yarn lint         - Run ESLint"
        echo "   yarn type-check   - Run TypeScript checks"
    else
        echo "   npm run dev       - Start development server"
        echo "   npm run build     - Build for production"
        echo "   npm run start     - Start production server"
        echo "   npm run lint      - Run ESLint"
        echo "   npm run type-check - Run TypeScript checks"
    fi
    echo ""
    echo "🐳 Docker setup:"
    echo "   docker-compose up -d"
    echo ""
    echo "Happy coding! 🚀"
}

# Main execution
main() {
    echo "=========================================="
    echo "  Flowin Admin Panel Development Setup"
    echo "=========================================="
    echo ""
    
    check_node
    check_package_manager
    install_dependencies
    setup_env
    setup_git_hooks
    create_directories
    setup_typescript
    run_build
    show_final_instructions
}

# Run main function
main "$@"
