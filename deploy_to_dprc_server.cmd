cd /d "C:\Users\913678186\IdeaProjects\ATI_Analysis\app\frontend\src"
call npm run build
if %errorlevel% neq 0 (
    echo Build failed but continuing with deployment...
)

cd /d "C:\Users\913678186\IdeaProjects\ATI_Analysis"

:: Step 1: Copy the full app folder (excluding node_modules and wsgi.py)
robocopy "C:\Users\913678186\IdeaProjects\ATI_Analysis\app" "\\DPRC-SERVER\ati\app" /E /Z /R:2 /W:5 ^
    /XD "C:\Users\913678186\IdeaProjects\ATI_Analysis\app\frontend\src\node_modules" ^
    /XF "C:\Users\913678186\IdeaProjects\ATI_Analysis\app\wsgi.py"

:: Step 2: Copy wsgi.py separately to the destination root
robocopy "C:\Users\913678186\IdeaProjects\ATI_Analysis\app" "\\DPRC-SERVER\ati" wsgi.py /Z /R:2 /W:5
