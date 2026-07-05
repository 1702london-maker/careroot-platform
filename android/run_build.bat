@echo off
set ANDROID_HOME=C:\Android\sdk
set ANDROID_SDK_ROOT=C:\Android\sdk
set JAVA_HOME=C:\Program Files\Microsoft\jdk-21.0.11.10-hotspot
set PATH=%JAVA_HOME%\bin;C:\Android\sdk\platform-tools;%PATH%
cd /d "%~dp0"
call gradlew.bat assembleDebug
