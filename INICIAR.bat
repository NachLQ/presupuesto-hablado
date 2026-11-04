@echo off
SET PATH=%PATH%;C:\Program Files\nodejs
cd /d "%~dp0"
IF NOT EXIST "node_modules" (
  echo Instalando dependencias la primera vez...
  npm run install:all
)
echo Arrancando Presupuesto Hablado...
start "" http://localhost:5173
npm run dev
