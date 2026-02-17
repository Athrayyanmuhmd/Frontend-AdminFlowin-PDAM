# Flowin Admin Panel Test Script for Windows
# This script runs tests for the Flowin Admin Panel

param(
    [string]$TestType = "all",
    [switch]$E2E,
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

# Run unit tests
function Start-UnitTests {
    Write-Status "Running unit tests..."
    
    try {
        if ($packageManager -eq "yarn") {
            yarn test
        } else {
            npm test
        }
        Write-Success "Unit tests completed"
        return $true
    }
    catch {
        Write-Error "Unit tests failed: $_"
        return $false
    }
}

# Run E2E tests
function Start-E2ETests {
    Write-Status "Running E2E tests..."
    
    try {
        if ($packageManager -eq "yarn") {
            yarn test:e2e
        } else {
            npm run test:e2e
        }
        Write-Success "E2E tests completed"
        return $true
    }
    catch {
        Write-Error "E2E tests failed: $_"
        return $false
    }
}

# Run all tests
function Start-AllTests {
    Write-Status "Running all tests..."
    
    $success = $true
    
    if (-not (Start-Lint)) {
        $success = $false
    }
    
    if (-not (Start-TypeCheck)) {
        $success = $false
    }
    
    if (-not (Start-UnitTests)) {
        $success = $false
    }
    
    if ($E2E -and -not (Start-E2ETests)) {
        $success = $false
    }
    
    if ($success) {
        Write-Success "All tests completed successfully!"
    } else {
        Write-Error "Some tests failed!"
    }
    
    return $success
}

# Main execution
function Main {
    Write-Host "==========================================" -ForegroundColor $Blue
    Write-Host "  Flowin Admin Panel Test Suite" -ForegroundColor $Blue
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
    
    # Run tests based on type
    $success = $false
    
    switch ($TestType.ToLower()) {
        "lint" {
            $success = Start-Lint
        }
        "type-check" {
            $success = Start-TypeCheck
        }
        "unit" {
            $success = Start-UnitTests
        }
        "e2e" {
            $success = Start-E2ETests
        }
        "all" {
            $success = Start-AllTests
        }
        default {
            Write-Error "Unknown test type: $TestType"
            Write-Status "Available types: lint, type-check, unit, e2e, all"
            exit 1
        }
    }
    
    if (-not $success) {
        exit 1
    }
}

# Run main function
Main
