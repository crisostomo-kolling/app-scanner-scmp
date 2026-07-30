# scanner-tombos-web (módulo OSGi Liferay)

Módulo OSGi que serve os arquivos do PWA [Scanner de Tombos](../../README.md) diretamente
pelo Liferay, em `/scanner-tombos/*`, usando o padrão **HTTP Whiteboard** do OSGi (spec 140).
Testado para Liferay Portal CE 7.3.7 GA8.

Não há nenhuma lógica Java real aqui — `ScannerTombosResourceComponent` é só um componente
"marcador" que registra a pasta `static/` (empacotada dentro do próprio bundle, veja
`bnd.bnd` → `-includeresource: static=static`) como recurso HTTP estático.

## Estrutura

```
bnd.bnd                          cabeçalhos OSGi do bundle + inclusão da pasta static/
build.gradle                     dependência apenas das anotações do OSGi Declarative Services
src/main/java/.../ScannerTombosResourceComponent.java   componente que registra o recurso
static/                          cópia dos arquivos do PWA (index.html, css/, js/, etc.)
```

`static/` é uma **cópia** dos arquivos da raiz deste repositório. Sempre que alterar o app
(`index.html`, `css/style.css`, `js/app.js`, etc.), copie os arquivos atualizados para dentro
de `static/` aqui antes de gerar um novo build do módulo.

## 1. Colocar este módulo dentro do seu projeto Liferay

Se você já tem (ou vai criar) um Liferay Workspace/Blade com uma pasta `modules/`, copie a
pasta inteira `scanner-tombos-web/` para dentro de `modules/`:

```bash
cp -r liferay-module/scanner-tombos-web /caminho/do/seu/liferay-workspace/modules/
```

Se ainda não tem nenhum workspace, o Blade CLI cria um em segundos:

```bash
blade init trt-liferay-workspace
cd trt-liferay-workspace
cp -r /caminho/deste/repo/liferay-module/scanner-tombos-web modules/
```

## 2. Build e deploy

Dentro do workspace, com o Liferay 7.3.7 já rodando e o Blade configurado apontando para o
servidor (`blade server start` ou apontando para uma instância remota):

```bash
./gradlew :modules:scanner-tombos-web:deploy
```

Isso compila o bundle e copia o `.jar` gerado para a pasta de auto-deploy do Liferay
(`[LIFERAY_HOME]/deploy`), que instala e ativa o módulo em segundos.

Alternativa manual, sem Gradle/Workspace: gerar o jar (`./gradlew :modules:scanner-tombos-web:jar`,
o arquivo sai em `build/libs/`) e copiar manualmente para `[LIFERAY_HOME]/deploy` do servidor.

## 3. Conferir se subiu

No **Gogo Shell** (Server Administration > interface web, ou telnet na porta configurada) ou
no **Control Panel > Apps > App Manager**, procure por "TRT - Scanner de Tombos" — deve
aparecer como **Active**.

Depois acesse:

```
https://<seu-portal>/scanner-tombos/index.html
```

(É necessário o `index.html` explícito na URL — o whiteboard de recursos estáticos não faz
resolução automática de "index" numa pasta.)

## 4. Colocar o link no portal

Use exatamente essa URL (`.../scanner-tombos/index.html`) no link do portal. Como o app já
usa caminhos relativos internamente, funciona em qualquer path — não precisa mudar nada no
`manifest.webmanifest` nem no `service-worker.js`.
