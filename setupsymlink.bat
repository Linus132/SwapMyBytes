@echo off
if exist frontend\.env (
  echo Symlink already exists
) else (
  mklink frontend\.env .env
)
pause