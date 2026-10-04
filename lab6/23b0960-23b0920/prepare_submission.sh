#!/bin/bash

echo "Preparing project for submission..."

# Function to clean a directory
clean_dir() {
    local dir=$1
    if [ -d "$dir" ]; then
        echo "Cleaning $dir..."
        rm -rf "$dir/node_modules"
        rm -rf "$dir/.expo"
        rm -rf "$dir/package-lock.json"
        rm -rf "$dir/yarn.lock"

    else
        echo "⚠️ Directory $dir not found, please check."
    fi
}

# Clean backend
clean_dir "backend"

# Clean frontend
clean_dir "frontend"

# Remove hidden folders and system files recursively
echo "Removing hidden folders and system files (.DS_Store)..."
find . -name ".DS_Store" -delete
find . -type d -name ".*" -not -name "." -not -name ".." -exec rm -rf {} +

echo "Project is ready for submission!"
