# Flowin Admin Panel Development Start Script for Windows
# This script starts the development environment for the Flowin Admin Panel

param(
    [switch]$SkipInstall,
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

# Install dependencies if needed
function Install-Dependencies {
    param([string]$PackageManager)
    
    if (-not (Test-Path "node_modules")) {
        Write-Status "Installing dependencies..."
        try {
            if ($PackageManager -eq "yarn") {
                yarn install
            } else {
                npm install
            }
            Write-Success "Dependencies installed"
        }
        catch {
            Write-Error "Failed to install dependencies: $_"
            return $false
        }
    } else {
        Write-Status "Dependencies already installed"
    }
    
    return $true
}

# Start development server
function Start-DevServer {
    param([string]$PackageManager)
    
    Write-Status "Starting development server..."
    
    try {
        if ($PackageManager -eq "yarn") {
            yarn dev
        } else {
            npm run dev
        }
    }
    catch {
        Write-Error "Failed to start development server: $_"
        return $false
    }
}

# Main execution
function Main {
    Write-Host "==========================================" -ForegroundColor $Blue
    Write-Host "  Flowin Admin Panel Development Start" -ForegroundColor $Blue
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
    
    # Install dependencies if needed
    if (-not $SkipInstall) {
        if (-not (Install-Dependencies -PackageManager $packageManager)) {
            exit 1
        }
    }
    
    # Start development server
    Start-DevServer -PackageManager $packageManager
}

# Run main function
Main
