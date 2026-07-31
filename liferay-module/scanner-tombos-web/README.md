# scanner-tombos-web (módulo OSGi Liferay)

Serve os arquivos do PWA [Scanner de Tombos](../../README.md) direto pelo Liferay, em
`/o/scanner-tombos/*`, usando o padrão **HTTP Whiteboard** do OSGi. Testado e confirmado
funcionando em produção no Liferay Portal CE 7.3.7 GA8 (o prefixo `/o/` é exigido pelo
Liferay para recursos registrados no contexto HTTP padrão — bare `/scanner-tombos/*` não
funciona, dá 404).

Esse módulo **não usa Gradle nem Blade CLI** — só o JDK (que já vem com `javac` e `jar`) para
gerar um único arquivo `.jar`, que depois você instala direto pelo navegador, sem precisar de
acesso ao servidor por SSH/RDP.

## O que tem aqui

```
MANIFEST.MF        cabeçalhos do bundle OSGi (nome, versão, classe de ativação)
src/.../ScannerTombosActivator.java   registra static/ como recurso HTTP, sem lógica de negócio
static/             cópia dos arquivos do PWA (index.html, css/, js/, etc.)
build.bat           script que compila e empacota tudo em um .jar
```

`static/` é uma **cópia** dos arquivos da raiz do repositório. Sempre que alterar o app
(`index.html`, `css/style.css`, `js/app.js`, etc.), copie os arquivos atualizados para dentro
de `static/` aqui antes de gerar um novo `.jar`.

## Pré-requisito: JDK instalado

Abra um terminal (cmd/PowerShell) e rode:

```bash
javac -version
```

Se der erro "comando não encontrado" (só existe um Java de execução, sem o compilador), instale
um JDK:

1. Acesse [adoptium.net](https://adoptium.net/) (Eclipse Temurin, gratuito e oficial).
2. Baixe o instalador **.msi** da versão **JDK 11 (LTS)** para Windows x64 — combina bem com o
   Java que o Liferay 7.3 costuma usar.
3. Rode o instalador. Na tela de opções, **marque** "Set JAVA_HOME variable" e "Add to PATH" (o
   instalador do Temurin já vem com essas caixinhas, só não vêm marcadas por padrão).
4. **Feche e abra um novo terminal** (o PATH só atualiza em janelas novas) e confirme:
   ```bash
   javac -version
   ```
   Deve responder algo como `javac 11.0.x`.

O `build.bat` compila com a flag `--release 8`, então o `.jar` gerado funciona tanto em Liferay
rodando com Java 8 quanto Java 11 — não precisa se preocupar em casar a versão exata do JDK
instalado com a do servidor.

*(Observação: eu não tenho um JDK disponível no ambiente onde estou rodando agora, então não
consegui compilar e testar o `.jar` por aqui — você vai rodar o `build.bat` na sua própria
máquina.)*

## 1. Gerar o .jar

Dentro da pasta `liferay-module/scanner-tombos-web`, dando duplo-clique em `build.bat` (ou
rodando `build.bat` no cmd). O script:

1. Baixa automaticamente o `org.osgi.core-6.0.0.jar` (API padrão do OSGi, ~200KB, do Maven
   Central) na própria pasta, se ainda não existir.
2. Compila `ScannerTombosActivator.java`.
3. Empacota tudo (classe compilada + pasta `static/`) em `scanner-tombos-web-X.X.X.jar` (o
   número vem direto do `Bundle-Version` do `MANIFEST.MF`, então o nome do arquivo nunca
   fica dessincronizado da versão real de dentro do jar), na mesma pasta.

Se tudo der certo, você vê `Pronto: ...scanner-tombos-web-X.X.X.jar` no final — confira que
o número é o que você esperava (veja "Atualizando depois de mudar o app" abaixo).

## 2. Instalar pelo navegador (sem precisar de acesso ao servidor)

1. Entre no portal Liferay com seu usuário administrador.
2. Vá em **Painel de Controle > Apps > Gerenciador de Aplicativos** (App Manager).
3. Clique no botão de opções (ícone "⋮" ou "Upload", dependendo da versão) e escolha
   **Upload**.
4. Selecione o arquivo `scanner-tombos-web-X.X.X.jar` gerado no passo anterior e confirme
   **Instalar**.
5. Confira na lista de apps que "TRT - Scanner de Tombos (Recursos Estaticos)" aparece como
   **Ativo/Active**. Se aparecer como inativo ou com erro, veja a seção de problemas comuns
   abaixo.

## 3. Acessar o app

```
https://<seu-portal>/o/scanner-tombos/index.html
```

(Precisa do `index.html` explícito na URL — o recurso estático não resolve "index" de pasta
automaticamente. E precisa do `/o/` na frente — veja a observação no topo deste arquivo.)
Não coloque esse link direto no portal para os usuários finais — veja a seção "Exigir login"
no [README principal](../../README.md#5-exigir-login-e-identificar-o-usuário-liferay) para
o link que deve realmente ser divulgado.

## Atualizando depois de mudar o app

1. Copie os arquivos atualizados para dentro de `static/`.
2. Abra o `MANIFEST.MF` e **aumente o `Bundle-Version`** (ex: `1.1.0` → `1.2.0`) — isso evita
   conflito com a versão já instalada e deixa claro no Gerenciador de Aplicativos que é uma
   versão nova. O `build.bat` mostra a versão empacotada no final, use isso para conferir
   antes de subir.
3. Rode `build.bat` de novo.
4. Volte no Gerenciador de Aplicativos e faça **Upload** do novo `.jar`.
5. **Desinstale a versão anterior manualmente** (menu **⋮** ao lado da versão antiga na
   lista de apps > desinstalar/remover). Na prática, o Liferay **não substitui** a versão
   antiga automaticamente ao subir uma nova — as duas ficam instaladas lado a lado, ambas
   "Ativas", e como registram o mesmo padrão de URL (`/scanner-tombos/*`), fica ambíguo qual
   delas está realmente servindo as requisições. Sempre confira na lista de apps que só
   existe **uma** versão do "TRT - Scanner de Tombos" depois de atualizar.

## Problemas comuns

- **"javac não é reconhecido"**: falta um JDK instalado ou ele não está no PATH do Windows.
- **App aparece como "Installed" mas não "Active"**: normalmente é erro de resolução de
  pacote. Confira nos logs do Liferay (`[LIFERAY_HOME]/logs`) ou em **Painel de Controle >
  Configuração > Logs de Log4j** por mensagens citando `br.jus.trt24.scmp.scannertombos.web`.
- **404 ao acessar**: confirme que usou o prefixo `/o/` (`/o/scanner-tombos/index.html`, não
  `/scanner-tombos/index.html`), que o app está "Active" no Gerenciador de Aplicativos, e que
  não existe outro módulo já registrando o mesmo padrão de URL.
