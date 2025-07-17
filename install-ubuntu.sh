#!/bin/bash

# E-Kerja Karawang - Ubuntu Installation Script
# This script automates the installation process for Ubuntu systems

set -e  # Exit on any error

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

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check Node.js version
check_node_version() {
    if command_exists node; then
        NODE_VERSION=$(node --version | cut -d'v' -f2)
        MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1)
        if [ "$MAJOR_VERSION" -ge 16 ]; then
            return 0
        else
            return 1
        fi
    else
        return 1
    fi
}

print_header() {
    echo -e "${BLUE}"
    echo "=================================================="
    echo "    E-Kerja Karawang - Ubuntu Installation"
    echo "=================================================="
    echo -e "${NC}"
}

print_header

# Check if running on Ubuntu
if ! command_exists lsb_release || [ "$(lsb_release -si)" != "Ubuntu" ]; then
    print_warning "This script is designed for Ubuntu. Continuing anyway..."
fi

# Step 1: Update system
print_status "Updating system packages..."
sudo apt update

# Step 2: Install required system packages
print_status "Installing required system packages..."
sudo apt install -y curl wget unzip sqlite3 build-essential

# Step 3: Install Node.js if not present or version is too old
if ! check_node_version; then
    print_status "Installing Node.js 18.x LTS..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    print_success "Node.js $(node --version) is already installed and compatible"
fi

# Verify Node.js installation
if check_node_version; then
    print_success "Node.js $(node --version) installed successfully"
    print_success "npm $(npm --version) installed successfully"
else
    print_error "Node.js installation failed or version is too old"
    exit 1
fi

# Step 4: Check if we're in the project directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root directory."
    print_status "Expected directory structure:"
    print_status "  next-ekerja-main/"
    print_status "  ├── package.json"
    print_status "  ├── src/"
    print_status "  ├── prisma/"
    print_status "  └── ..."
    exit 1
fi

# Step 5: Install project dependencies
print_status "Installing project dependencies..."
if npm install; then
    print_success "Dependencies installed successfully"
else
    print_warning "npm install failed, trying with --legacy-peer-deps..."
    if npm install --legacy-peer-deps; then
        print_success "Dependencies installed successfully with --legacy-peer-deps"
    else
        print_error "Failed to install dependencies"
        exit 1
    fi
fi

# Step 6: Setup environment file
print_status "Setting up environment file..."
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        print_success "Environment file created from .env.example"
    else
        print_status "Creating default .env file..."
        cat > .env << EOF
# Database
DATABASE_URL="file:./dev.db"

# Next Auth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here-$(openssl rand -hex 32)"

# App Settings
NODE_ENV="development"
EOF
        print_success "Default .env file created"
    fi
else
    print_success ".env file already exists"
fi

# Step 7: Setup database
print_status "Setting up database..."

# Generate Prisma client
if npx prisma generate; then
    print_success "Prisma client generated"
else
    print_error "Failed to generate Prisma client"
    exit 1
fi

# Push database schema
if npx prisma db push; then
    print_success "Database schema pushed"
else
    print_error "Failed to push database schema"
    exit 1
fi

# Optional: Seed database
if [ -f "prisma/seed.js" ] || [ -f "prisma/seed.ts" ]; then
    print_status "Seeding database with initial data..."
    if npx prisma db seed; then
        print_success "Database seeded successfully"
    else
        print_warning "Database seeding failed, but installation can continue"
    fi
fi

# Step 8: Build the application (optional for development)
read -p "Do you want to build the application for production? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Building application for production..."
    if npm run build; then
        print_success "Application built successfully"
    else
        print_error "Build failed"
        exit 1
    fi
fi

# Step 9: Final instructions
print_success "Installation completed successfully!"
echo
echo -e "${GREEN}=================================================="
echo "           Installation Complete!"
echo -e "==================================================${NC}"
echo
echo -e "${BLUE}To start the development server:${NC}"
echo "  npm run dev"
echo
echo -e "${BLUE}To start the production server:${NC}"
echo "  npm start"
echo
echo -e "${BLUE}Access the application at:${NC}"
echo "  http://localhost:3000"
echo
echo -e "${BLUE}Default test accounts:${NC}"
echo "  Admin: admin@ekerja.com / admin123"
echo "  Customer: customer@ekerja.com / customer123"
echo "  Provider: provider@ekerja.com / provider123"
echo
echo -e "${BLUE}Useful commands:${NC}"
echo "  npm run dev          - Start development server"
echo "  npm run build        - Build for production"
echo "  npm start            - Start production server"
echo "  npx prisma studio    - Open database GUI"
echo
echo -e "${BLUE}For more information, check:${NC}"
echo "  - README.md"
echo "  - INSTALL-UBUNTU.md"
echo "  - https://github.com/kyeiki/next-ekerja"
echo

# Ask if user wants to start the development server
read -p "Do you want to start the development server now? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Starting development server..."
    npm run dev
fi
