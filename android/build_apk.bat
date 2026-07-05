@echo off
set ANDROID_HOME=C:\Android\sdk
set ANDROID_SDK_ROOT=C:\Android\sdk
set JAVA_HOME=C:\Program Files\Microsoft\jdk-21.0.11.10-hotspot
set PATH=%JAVA_HOME%\bin;%ANDROID_HOME%\platform-tools;%PATH%

cd /d "%~dp0"
echo Building Careroot APK...
call gradlew.bat assembleDebug
echo.
echo Exit code: %ERRORLEVEL%
if %ERRORLEVEL% == 0 (
  echo BUILD SUCCESS
) else (
  echo BUILD FAILED
)
