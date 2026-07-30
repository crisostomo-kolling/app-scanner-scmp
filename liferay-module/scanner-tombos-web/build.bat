@echo off
setlocal

set MODULE_DIR=%~dp0
set OSGI_JAR=%MODULE_DIR%org.osgi.core-6.0.0.jar
set OUT_DIR=%MODULE_DIR%build
set OUT_JAR=%MODULE_DIR%scanner-tombos-web-1.0.0.jar

where javac >nul 2>nul
if errorlevel 1 (
    echo ERRO: javac nao encontrado. Instale um JDK ^(ex: Eclipse Temurin^) e tente de novo.
    exit /b 1
)

if not exist "%OSGI_JAR%" (
    echo Baixando org.osgi.core-6.0.0.jar do Maven Central ^(API padrao do OSGi, ~200KB^)...
    curl -L -o "%OSGI_JAR%" "https://repo1.maven.org/maven2/org/osgi/org.osgi.core/6.0.0/org.osgi.core-6.0.0.jar"
    if errorlevel 1 (
        echo ERRO: falha ao baixar org.osgi.core-6.0.0.jar. Baixe manualmente e coloque nesta pasta.
        exit /b 1
    )
)

if exist "%OUT_DIR%" rmdir /s /q "%OUT_DIR%"
mkdir "%OUT_DIR%"

echo Compilando...
javac -cp "%OSGI_JAR%" -d "%OUT_DIR%" "%MODULE_DIR%src\main\java\com\trt\scannertombos\web\internal\ScannerTombosActivator.java"
if errorlevel 1 (
    echo ERRO: falha na compilacao.
    exit /b 1
)

if exist "%OUT_JAR%" del "%OUT_JAR%"

echo Empacotando %OUT_JAR%...
pushd "%MODULE_DIR%"
jar cfm "%OUT_JAR%" MANIFEST.MF -C build . -C . static
popd

echo.
echo Pronto: %OUT_JAR%
echo Agora va no Liferay em Painel de Controle ^> Apps ^> Gerenciador de Aplicativos ^> Upload, e envie esse arquivo.

endlocal
