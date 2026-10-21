@echo off
chcp 65001 >nul
cd /d "%~dp0"

where git >nul 2>nul
if errorlevel 1 (
  echo Git не найден. Установи Git for Windows: https://git-scm.com/download/win
  pause
  exit /b 1
)

set "MSG=%*"
if "%MSG%"=="" set "MSG=Обновление %date% %time:~0,5%"

git add -A
git diff --cached --quiet
if not errorlevel 1 (
  echo Нет изменений для публикации.
  pause
  exit /b 0
)

git commit -m "%MSG%"
if errorlevel 1 goto fail
git pull --rebase
if errorlevel 1 goto fail
git push
if errorlevel 1 goto fail

echo.
echo Готово. Сборка на GitHub займёт 1-2 минуты.
pause
exit /b 0

:fail
echo.
echo Что-то пошло не так — пришли скриншот этого окна.
pause
exit /b 1
