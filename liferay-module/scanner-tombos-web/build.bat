@echo off
setlocal enabledelayedexpansion

set MODULE_DIR=%~dp0
set OSGI_JAR=%MODULE_DIR%org.osgi.core-6.0.0.jar
set OUT_DIR=%MODULE_DIR%build
set OUT_JAR=%MODULE_DIR%scanner-tombos-web.jar

for /f "tokens=2 delims=: " %%V in ('findstr /b "Bundle-Version" "%MODULE_DIR%MANIFEST.MF"') do set BUNDLE_VERSION=%%V

set JAVAC_CMD=javac
set JAR_CMD=jar

where javac >nul 2>nul
if errorlevel 1 (
    echo AVISO: javac nao encontrado no PATH. Procurando instalacao do JDK nas pastas usuais...
    set "FOUND_JAVAC="
    for /f "delims=" %%F in ('dir /b /s "C:\Program Files\Eclipse Adoptium\javac.exe" 2^>nul') do set "FOUND_JAVAC=%%F"
    if not defined FOUND_JAVAC (
        for /f "delims=" %%F in ('dir /b /s "C:\Program Files\Java\javac.exe" 2^>nul') do set "FOUND_JAVAC=%%F"
    )
    if not defined FOUND_JAVAC (
        echo ERRO: javac nao encontrado nem no PATH nem nas pastas usuais de instalacao do JDK.
        echo Feche esta janela do terminal, abra uma NOVA ^(ou faca logoff/login^) para o PATH atualizar, e tente de novo.
        exit /b 1
    )
    set "JAVAC_CMD=!FOUND_JAVAC!"
    for %%F in ("!FOUND_JAVAC!") do set "JDK_BIN=%%~dpF"
    set "JAR_CMD=!JDK_BIN!jar.exe"
    echo Usando JDK encontrado em: !JDK_BIN!
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
"!JAVAC_CMD!" --release 8 -cp "%OSGI_JAR%" -d "%OUT_DIR%" "%MODULE_DIR%src\main\java\com\trt\scannertombos\web\internal\ScannerTombosActivator.java"
if errorlevel 1 (
    echo ERRO: falha na compilacao.
    exit /b 1
)

if exist "%OUT_JAR%" del "%OUT_JAR%"

echo Empacotando %OUT_JAR%...
pushd "%MODULE_DIR%"
"!JAR_CMD!" cfm "%OUT_JAR%" MANIFEST.MF -C build . -C . static
popd

echo.
echo Pronto: %OUT_JAR%  (Bundle-Version: %BUNDLE_VERSION%)
echo Agora va no Liferay em Painel de Controle ^> Apps ^> Gerenciador de Aplicativos ^> Upload, e envie esse arquivo.
echo Se voce alterou o app desde o ultimo envio, confirme que a versao acima e MAIOR que a instalada.

endlocal
