#!/bin/bash

# DigitalOcean PostgreSQL Database Backup Script Wrapper
# This script provides a simple interface to run the Node.js backup tool

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

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

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 14+ first."
        exit 1
    fi
    
    # Check if npm is installed
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
    
    # Check if pg_dump is available
    if ! command -v pg_dump &> /dev/null; then
        print_warning "pg_dump is not found in PATH. Please install PostgreSQL client tools."
        print_warning "On Ubuntu/Debian: sudo apt-get install postgresql-client"
        print_warning "On macOS: brew install postgresql"
        print_warning "On CentOS/RHEL: sudo yum install postgresql"
    fi
    
    # Check if .env file exists
    if [ ! -f "$SCRIPT_DIR/.env" ]; then
        print_warning ".env file not found. Please copy env.example to .env and configure it."
        print_status "You can run: cp env.example .env"
        exit 1
    fi
    
    print_success "Prerequisites check completed"
}

# Function to install dependencies
install_dependencies() {
    print_status "Installing Node.js dependencies..."
    
    if [ ! -d "$SCRIPT_DIR/node_modules" ]; then
        npm install
        print_success "Dependencies installed successfully"
    else
        print_status "Dependencies already installed"
    fi
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  backup          Create a new database backup (default)"
    echo "  test            Test database connection"
    echo "  list            List existing backups"
    echo "  backup-with-test Test connection and create backup"
    echo "  install         Install Node.js dependencies"
    echo "  help            Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                    # Create backup"
    echo "  $0 test              # Test connection"
    echo "  $0 list              # List backups"
    echo "  $0 backup-with-test  # Test and backup"
}

# Main script logic
main() {
    local command=${1:-backup}
    
    case $command in
        "install")
            check_prerequisites
            install_dependencies
            ;;
        "backup"|"test"|"list"|"backup-with-test")
            check_prerequisites
            install_dependencies
            print_status "Running: node backup.js $command"
            cd "$SCRIPT_DIR"
            node backup.js "$command"
            ;;
        "help"|"--help"|"-h")
            show_usage
            ;;
        *)
            print_error "Unknown command: $command"
            show_usage
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
