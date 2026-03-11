#!/bin/bash

set -e

echo "=========================================="
echo "Voleena Foods - Docker Setup"
echo "=========================================="
echo ""

if [ ! -f .env ]; then
    echo "Creating root .env from .env.example..."
    cp .env.example .env
fi

echo ""
echo "Edit .env if you need custom secrets or ports, then run:"
echo ""
echo "  docker-compose up --build"
echo ""
echo "Application URLs:"
echo "  Frontend: http://localhost:8080"
echo "  Backend:  http://localhost:3001"
echo ""
