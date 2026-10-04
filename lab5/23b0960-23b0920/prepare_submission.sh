#!/bin/bash

echo "Prepare for Submission: Cleaning up project files..."

# Clean Backend
echo "Cleaning Backend..."
rm -rf backend/node_modules
rm -f backend/package-lock.json
echo "Backend clean."

# Clean Frontend
echo "Cleaning Frontend..."
rm -rf frontend/node_modules
rm -f frontend/package-lock.json
rm -rf frontend/dist
rm -rf frontend/.vite
echo "Frontend clean."

# Clean Common
echo "Cleaning System Files..."
find . -name ".DS_Store" -delete
echo "System files clean."

echo "======================================"
echo "Cleanup Complete! The project is ready for submission."
echo "Please zip the 'lab5-files' folder (excluding this script if preferred)."
echo "======================================"
