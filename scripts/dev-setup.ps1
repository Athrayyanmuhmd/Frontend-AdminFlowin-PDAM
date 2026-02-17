# Flowin Admin Panel Development Setup Script for Windows
# This script sets up the development environment for the Flowin Admin Panel

param(
    [switch]$SkipBuild,
    [switch]$Verbose
)

# Colors for output
$Red = "Red"
$Green = "Green"
$Yellow = "Yellow"
$Blue = "Blue"
$White = "White"

# Function to print colored output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor $Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor $Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor $Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor $Red
}

# Check if Node.js is installed
function Test-Node {
    Write-Status "Checking Node.js installation..."
    
    try {
        $nodeVersion = node --version
        Write-Success "Node.js is installed: $nodeVersion"
        
        # Check if version is 18 or higher
        $nodeMajorVersion = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
        if ($nodeMajorVersion -lt 18) {
            Write-Warning "Node.js version 18 or higher is recommended. Current version: $nodeVersion"
        }
        return $true
    }
    catch {
        Write-Error "Node.js is not installed. Please install Node.js 18 or higher."
        return $false
    }
}

# Check if npm or yarn is available
function Test-PackageManager {
    Write-Status "Checking package manager..."
    
    $packageManager = $null
    
    try {
        $yarnVersion = yarn --version
        Write-Success "Yarn is available: $yarnVersion"
        $packageManager = "yarn"
    }
    catch {
        try {
            $npmVersion = npm --version
            Write-Success "NPM is available: $npmVersion"
            $packageManager = "npm"
        }
        catch {
            Write-Error "Neither npm nor yarn is available. Please install one of them."
            return $null
        }
    }
    
    return $packageManager
}

# Install dependencies
function Install-Dependencies {
    param([string]$PackageManager)
    
    Write-Status "Installing dependencies with $PackageManager..."
    
    try {
        if ($PackageManager -eq "yarn") {
            yarn install
        } else {
            npm install
        }
        Write-Success "Dependencies installed successfully"
        return $true
    }
    catch {
        Write-Error "Failed to install dependencies: $_"
        return $false
    }
}

# Setup environment variables
function Set-Environment {
    Write-Status "Setting up environment variables..."
    
    if (-not (Test-Path ".env.local")) {
        if (Test-Path "env.example") {
            Copy-Item "env.example" ".env.local"
            Write-Success "Environment file created from example"
        } else {
            Write-Warning "No env.example file found. Creating basic .env.local..."
            $envContent = @"
# Flowin Admin Panel Environment Variables
NEXT_PUBLIC_APP_NAME=Flowin Admin Panel
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_API_TIMEOUT=30000
NODE_ENV=development
"@
            $envContent | Out-File -FilePath ".env.local" -Encoding UTF8
            Write-Success "Basic environment file created"
        }
    } else {
        Write-Warning ".env.local already exists. Skipping environment setup."
    }
}

# Setup Git hooks
function Set-GitHooks {
    Write-Status "Setting up Git hooks..."
    
    if (Test-Path ".git") {
        $hooksDir = ".git\hooks"
        if (-not (Test-Path $hooksDir)) {
            New-Item -ItemType Directory -Path $hooksDir -Force
        }
        
        $preCommitContent = @"
#!/bin/bash
# Pre-commit hook for Flowin Admin Panel

echo "Running pre-commit checks..."

# Run linting
npm run lint

# Run type checking
npm run type-check

echo "Pre-commit checks completed successfully!"
"@
        
        $preCommitContent | Out-File -FilePath "$hooksDir\pre-commit" -Encoding UTF8
        Write-Success "Git hooks configured"
    } else {
        Write-Warning "Not a Git repository. Skipping Git hooks setup."
    }
}

# Create necessary directories
function New-Directories {
    Write-Status "Creating necessary directories..."
    
    $directories = @(
        "public\assets\images",
        "public\assets\logos",
        "uploads\temp",
        "logs"
    )
    
    foreach ($dir in $directories) {
        if (-not (Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
        }
    }
    
    Write-Success "Directories created"
}

# Setup TypeScript
function Set-TypeScript {
    Write-Status "Setting up TypeScript..."
    
    if (-not (Test-Path "tsconfig.json")) {
        Write-Warning "tsconfig.json not found. Creating basic configuration..."
        $tsConfig = @"
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
"@
        $tsConfig | Out-File -FilePath "tsconfig.json" -Encoding UTF8
        Write-Success "TypeScript configuration created"
    }
}

# Run initial build
function Start-Build {
    param([string]$PackageManager)
    
    if ($SkipBuild) {
        Write-Warning "Skipping build as requested"
        return $true
    }
    
    Write-Status "Running initial build..."
    
    try {
        if ($PackageManager -eq "yarn") {
            yarn build
        } else {
            npm run build
        }
        Write-Success "Build completed successfully"
        return $true
    }
    catch {
        Write-Error "Build failed: $_"
        return $false
    }
}

# Display final instructions
function Show-Instructions {
    param([string]$PackageManager)
    
    Write-Host ""
    Write-Host "🎉 Flowin Admin Panel development environment setup completed!" -ForegroundColor $Green
    Write-Host ""
    Write-Host "📋 Next steps:" -ForegroundColor $Blue
    Write-Host "1. Start the development server:"
    if ($PackageManager -eq "yarn") {
        Write-Host "   yarn dev" -ForegroundColor $White
    } else {
        Write-Host "   npm run dev" -ForegroundColor $White
    }
    Write-Host ""
    Write-Host "2. Open your browser and navigate to:" -ForegroundColor $Blue
    Write-Host "   http://localhost:3000" -ForegroundColor $White
    Write-Host ""
    Write-Host "3. Login with demo credentials:" -ForegroundColor $Blue
    Write-Host "   Username: admin" -ForegroundColor $White
    Write-Host "   Password: admin123" -ForegroundColor $White
    Write-Host ""
    Write-Host "📚 Documentation:" -ForegroundColor $Blue
    Write-Host "   - README.md: General information" -ForegroundColor $White
    Write-Host "   - TECHNICAL_DOCUMENTATION.md: Technical details" -ForegroundColor $White
    Write-Host ""
    Write-Host "🔧 Available scripts:" -ForegroundColor $Blue
    if ($PackageManager -eq "yarn") {
        Write-Host "   yarn dev          - Start development server" -ForegroundColor $White
        Write-Host "   yarn build        - Build for production" -ForegroundColor $White
        Write-Host "   yarn start        - Start production server" -ForegroundColor $White
        Write-Host "   yarn lint         - Run ESLint" -ForegroundColor $White
        Write-Host "   yarn type-check   - Run TypeScript checks" -ForegroundColor $White
    } else {
        Write-Host "   npm run dev       - Start development server" -ForegroundColor $White
        Write-Host "   npm run build     - Build for production" -ForegroundColor $White
        Write-Host "   npm run start     - Start production server" -ForegroundColor $White
        Write-Host "   npm run lint      - Run ESLint" -ForegroundColor $White
        Write-Host "   npm run type-check - Run TypeScript checks" -ForegroundColor $White
    }
    Write-Host ""
    Write-Host "🐳 Docker setup:" -ForegroundColor $Blue
    Write-Host "   docker-compose up -d" -ForegroundColor $White
    Write-Host ""
    Write-Host "Happy coding! 🚀" -ForegroundColor $Green
}

# Main execution
function Main {
    Write-Host "==========================================" -ForegroundColor $Blue
    Write-Host "  Flowin Admin Panel Development Setup" -ForegroundColor $Blue
    Write-Host "==========================================" -ForegroundColor $Blue
    Write-Host ""
    
    # Check prerequisites
    if (-not (Test-Node)) {
        exit 1
    }
    
    $packageManager = Test-PackageManager
    if (-not $packageManager) {
        exit 1
    }
    
    # Setup environment
    if (-not (Install-Dependencies -PackageManager $packageManager)) {
        exit 1
    }
    
    Set-Environment
    Set-GitHooks
    New-Directories
    Set-TypeScript
    
    if (-not (Start-Build -PackageManager $packageManager)) {
        Write-Warning "Build failed, but you can continue with development"
    }
    
    Show-Instructions -PackageManager $packageManager
}

# Run main function
Main