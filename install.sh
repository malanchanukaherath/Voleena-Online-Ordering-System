#!/bin/bash

echo "=========================================="
echo "Voleena Foods - Installation Script"
echo "=========================================="
echo ""

# Backend setup
echo "📦 Installing backend dependencies..."
cd server
npm install

if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  IMPORTANT: Edit server/.env with your credentials!"
fi

cd ..

# Frontend setup
echo ""
echo "📦 Installing frontend dependencies..."
cd client
npm install

if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env || echo "VITE_API_BASE_URL=http://localhost:3001" > .env
fi

cd ..

echo ""
echo "=========================================="
echo "✅ Installation Complete!"
echo "=========================================="
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Configure your environment variables:"
echo "   - Edit server/.env (Database, Google Maps API, SMTP)"
echo ""
echo "2. Import the database:"
echo "   mysql -u root -p"
echo "   CREATE DATABASE voleena_foods_db;"
echo "   USE voleena_foods_db;"
echo "   SOURCE current\ database.sql;"
echo "   EXIT;"
echo ""
echo "3. Seed test data:"
echo "   cd server"
echo "   node seed_roles_and_staff.js"
echo ""
echo "4. Start the servers:"
echo "   Terminal 1: cd server && npm run start"
echo "   Terminal 2: cd client && npm run dev"
echo ""
echo "5. Access the application:"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:3001"
echo ""
echo "📚 Read IMPLEMENTATION_GUIDE.md for detailed setup instructions"
echo "📚 Read COMPLETION_STATUS.md for what's complete and next steps"
echo ""
