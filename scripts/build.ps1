# Flowin Admin Panel Build Script for Windows
# This script builds the Flowin Admin Panel for production

param(
    [string]$BuildType = "all",
    [switch]$Docker,
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
    try {
        $nodeVersion = node --version
        Write-Success "Node.js is installed: $nodeVersion"
        return $true
    }
    catch {
        Write-Error "Node.js is not installed. Please install Node.js 18 or higher."
        return $false
    }
}

# Check if package manager is available
function Test-PackageManager {
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

# Clean build directory
function Clear-Build {
    Write-Status "Cleaning build directory..."
    
    if (Test-Path ".next") {
        Remove-Item -Recurse -Force ".next"
        Write-Success "Build directory cleaned"
    }
    
    if (Test-Path "out") {
        Remove-Item -Recurse -Force "out"
        Write-Success "Output directory cleaned"
    }
}

# Install dependencies
function Install-Dependencies {
    Write-Status "Installing dependencies..."
    
    try {
        if ($packageManager -eq "yarn") {
            yarn install --frozen-lockfile
        } else {
            npm ci
        }
        Write-Success "Dependencies installed"
        return $true
    }
    catch {
        Write-Error "Failed to install dependencies: $_"
        return $false
    }
}

# Run linting
function Start-Lint {
    Write-Status "Running linting..."
    
    try {
        if ($packageManager -eq "yarn") {
            yarn lint
        } else {
            npm run lint
        }
        Write-Success "Linting completed"
        return $true
    }
    catch {
        Write-Error "Linting failed: $_"
        return $false
    }
}

# Run type checking
function Start-TypeCheck {
    Write-Status "Running type checking..."
    
    try {
        if ($packageManager -eq "yarn") {
            yarn type-check
        } else {
            npm run type-check
        }
        Write-Success "Type checking completed"
        return $true
    }
    catch {
        Write-Error "Type checking failed: $_"
        return $false
    }
}

# Run tests
function Start-Tests {
    Write-Status "Running tests..."
    
    try {
        if ($packageManager -eq "yarn") {
            yarn test
        } else {
            npm test
        }
        Write-Success "Tests completed"
        return $true
    }
    catch {
        Write-Error "Tests failed: $_"
        return $false
    }
}

# Build application
function Start-Build {
    Write-Status "Building application..."
    
    try {
        if ($packageManager -eq "yarn") {
            yarn build
        } else {
            npm run build
        }
        Write-Success "Application built successfully"
        return $true
    }
    catch {
        Write-Error "Build failed: $_"
        return $false
    }
}

# Build Docker image
function Start-DockerBuild {
    Write-Status "Building Docker image..."
    
    try {
        docker build -t flowin/admin-panel:latest .
        Write-Success "Docker image built successfully"
        return $true
    }
    catch {
        Write-Error "Docker build failed: $_"
        return $false
    }
}

# Main execution
function Main {
    Write-Host "==========================================" -ForegroundColor $Blue
    Write-Host "  Flowin Admin Panel Build" -ForegroundColor $Blue
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
    
    # Run build based on type
    $success = $false
    
    switch ($BuildType.ToLower()) {
        "clean" {
            Clear-Build
            $success = $true
        }
        "install" {
            $success = Install-Dependencies
        }
        "lint" {
            $success = Start-Lint
        }
        "type-check" {
            $success = Start-TypeCheck
        }
        "test" {
            $success = Start-Tests
        }
        "build" {
            $success = Start-Build
        }
        "docker" {
            $success = Start-DockerBuild
        }
        "all" {
            Clear-Build
            $success = Install-Dependencies
            if ($success) { $success = Start-Lint }
            if ($success) { $success = Start-TypeCheck }
            if ($success) { $success = Start-Tests }
            if ($success) { $success = Start-Build }
            if ($success -and $Docker) { $success = Start-DockerBuild }
        }
        default {
            Write-Error "Unknown build type: $BuildType"
            Write-Status "Available types: clean, install, lint, type-check, test, build, docker, all"
            exit 1
        }
    }
    
    if ($success) {
        Write-Success "Build completed successfully!"
    } else {
        Write-Error "Build failed!"
        exit 1
    }
}

# Run main function
Main
