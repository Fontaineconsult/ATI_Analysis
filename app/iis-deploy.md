# Deploying the ATI Python WSGI App on Windows Server IIS Using wfastcgi

This guide is tailored to deploying your ATI Flask-based WSGI application on Windows Server IIS using Python 3.12 and wfastcgi. Follow these steps to install Python, set up wfastcgi, deploy your app files, configure IIS, set permissions, and troubleshoot common issues.

---

## 1. Install Python 3.12 System-Wide

1. **Download** the 64-bit Python installer from [python.org/downloads/windows](https://www.python.org/downloads/windows/).
2. **Run the installer as Administrator** with the following options:
    - **Install for all users**
    - **Add Python to PATH**
    - **Include pip**

---

## 2. Install wfastcgi and Register It

Open a **Command Prompt as Administrator** and run:

```cmd
python -m pip install --upgrade pip
python -m pip install wfastcgi --break-system-packages
python -m wfastcgi install
```


## 3. Project Structure
C:\www\ati\
├── wsgi.py             # WSGI entry point
├── app\                # Your Python package (contains __init__.py, endpoints, etc.)
│   ├── __init__.py     # Defines create_app()
│   ├── endpoints\
│   └── web_config.py
└── logs\               # For log files (wfastcgi.log, app.log)


```cmd
:: Copy the app folder excluding node_modules and wsgi.py
robocopy "C:\Users\913678186\IdeaProjects\ATI_Analysis\app" "C:\www\ati\app" /E /Z /R:2 /W:5 ^
    /XD "C:\Users\913678186\IdeaProjects\ATI_Analysis\app\frontend\src\node_modules" ^
    /XF "C:\Users\913678186\IdeaProjects\ATI_Analysis\app\wsgi.py"

:: Copy wsgi.py to the root deployment folder
copy "C:\Users\913678186\IdeaProjects\ATI_Analysis\app\wsgi.py" "C:\www\ati\wsgi.py"

```


```cmd

import sys
import os

# Add the deployment root (C:\www\ati) to sys.path so that the "app" package is importable.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app

application = create_app()

```

```web.config

<configuration>
  <system.webServer>
    <handlers>
      <add name="PythonHandler"
           path="*"
           verb="*"
           modules="FastCgiModule"
           scriptProcessor="C:\Program Files\Python312\python.exe|C:\Program Files\Python312\Lib\site-packages\wfastcgi.py"
           resourceType="Unspecified"
           requireAccess="Script" />
    </handlers>
  </system.webServer>
  <appSettings>
    <!-- PYTHONPATH includes the deployment root and Python's site-packages -->
    <add key="PYTHONPATH" value="C:\www\ati;C:\Program Files\Python312\Lib\site-packages" />
    <!-- WSGI_HANDLER instructs wfastcgi to load the WSGI application from wsgi.py -->
    <add key="WSGI_HANDLER" value="wsgi.application" />
    <!-- Log file for wfastcgi -->
    <add key="WSGI_LOG" value="C:\www\ati\logs\wfastcgi.log" />
    <add key="WSGI_DEBUG" value="1" />
  </appSettings>
</configuration>

```

## 6  Set Folder and File Permissions
6.1 For the Deployment Root (C:\www\ati) and Its Subfolders:
Accounts to Grant Permissions:

IIS_IUSRS

Your application pool identity (e.g., IIS APPPOOL\YourAppPoolName)

Permissions:

Read & Execute

List folder contents

Read

6.2 For the Logs Folder (C:\www\ati\logs):
Grant the above accounts Modify (or Write) permissions so that log files can be created and updated.

Tip: Set permissions on the logs folder and allow inheritance to all subfolders and files.




## 7. Configure the IIS Website
Open IIS Manager.

Add a New Website:

Site Name: AtiApp

Physical Path: C:\www\ati

Port: 80 (or a custom port)

Application Pool Settings:

Ensure the app pool is set to No Managed Code (or the appropriate setting for WSGI).

Verify that the app pool identity has the necessary permissions as set above.


