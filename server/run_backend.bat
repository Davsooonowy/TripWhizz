@echo off
setlocal

set VENV_PATH=.\venv\Scripts\activate

if not exist "%VENV_PATH%" (
    echo Nie znaleziono środowiska wirtualnego w %VENV_PATH%.
    exit /b 1
)

call "%VENV_PATH%"

start cmd /k "python manage.py runserver"

start cmd /k "celery -A tripwhizz worker --loglevel=info --pool=solo"

start cmd /k "celery -A tripwhizz beat --loglevel=info"

echo backend is running.
pause