@echo off
cls

echo ==========================================
echo Voleena Foods - Docker Setup
echo ==========================================
echo.

if not exist .env (
    echo Creating root .env from .env.example...
    copy .env.example .env >nul
)

echo.
echo ==========================================
echo Docker setup complete
echo ==========================================
echo.
echo Edit .env if needed, then run:
echo.
echo    docker-compose up --build
echo.
echo Application URLs:
echo    Frontend: http://localhost:8080
echo    Backend:  http://localhost:3001
echo.
pause
