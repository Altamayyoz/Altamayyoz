@echo off
echo Creating Supervisor User in Database...
echo.

REM Run the SQL script using MySQL
C:\xampp\mysql\bin\mysql.exe -u root technician_management < create_supervisor_user.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Supervisor user created successfully!
    echo.
    echo Login Credentials:
    echo ==================
    echo Username: mysupervisor
    echo Password: password
    echo Role: supervisor
    echo.
) else (
    echo.
    echo ❌ Error creating supervisor user
    echo Please check if MySQL is running and the database exists
    echo.
)

pause


