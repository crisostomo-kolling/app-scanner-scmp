# Scanner de Tombos

App web (PWA) para ler códigos de barras de tombos com o celular e enviar cada leitura
para uma planilha do Google Sheets (DATA_HORA, TOMBO, DISPOSITIVO).

## 1. Configurar o Google Sheets (backend)

1. Abra a planilha onde os tombos devem ser gravados.
2. Menu **Extensões > Apps Script**.
3. Apague o conteúdo do arquivo `Code.gs` que abrir e cole o conteúdo do arquivo
   [`apps-script/Code.gs`](apps-script/Code.gs) deste projeto.
4. Salve (ícone de disquete).
5. Clique em **Implantar > Nova implantação**.
   - Tipo: **Aplicativo da Web**.
   - Executar como: **Eu (seu e-mail)**.
   - Quem pode acessar: **Qualquer pessoa**.
6. Clique em **Implantar** e autorize as permissões solicitadas (é o seu próprio script,
   pode confiar).
7. Copie a **URL do aplicativo da Web** gerada (termina em `/exec`). Você vai colar essa
   URL dentro do app no botão "Vincular Planilha".

Sempre que você editar o `Code.gs`, é preciso criar uma **nova implantação** (ou gerenciar
implantações > editar > nova versão) para que as mudanças valham.

O script cria automaticamente uma aba chamada `Scans` na planilha, com o cabeçalho
`DATA_HORA | TOMBO | DISPOSITIVO`.

## 2. Hospedar o app (obrigatório para instalar no celular)

O app precisa ser servido via **HTTPS** para a câmera funcionar no celular (exceção:
`http://localhost` durante testes no computador). A forma mais simples e gratuita é o
**GitHub Pages**:

1. Suba esta pasta para um repositório no GitHub.
2. Em **Settings > Pages**, selecione a branch principal e a raiz (`/`) como origem.
3. Acesse a URL gerada (algo como `https://seu-usuario.github.io/app-scanner-scmp/`) pelo
   Chrome do celular.

Outras opções que também funcionam: Netlify, Vercel, Firebase Hosting, ou qualquer
servidor web da sua organização com HTTPS.

Posso ajudar a configurar o GitHub Pages (ou outra hospedagem) se você quiser — é só
pedir.

## 3. Instalar no Galaxy

1. Abra a URL do app no **Chrome** do celular.
2. Toque no menu (⋮) > **Adicionar à tela inicial** (ou o banner de instalação
   automático do Chrome).
3. O app abre em tela cheia, como um app nativo.

## 4. Usando o app

1. Toque em **Vincular Planilha** e cole a URL do Apps Script (`.../exec`). O app valida
   a conexão antes de salvar.
2. Ajuste a **Identificação do coletor** (nome deste celular) se quiser algo mais
   descritivo que o padrão gerado automaticamente.
3. Toque em **Iniciar Scaneamento** (só habilita depois de vincular a planilha), aponte a
   câmera para o código de barras do tombo. Cada leitura é enviada automaticamente e
   aparece na lista "Últimas leituras".
4. Sem internet, as leituras ficam marcadas como "Pendente" e são reenviadas
   automaticamente assim que a conexão voltar.

## Estrutura do projeto

```
index.html              interface do app
css/style.css           estilo visual
js/app.js               lógica: vínculo da planilha, câmera/leitura, envio, fila offline
manifest.webmanifest    metadados do PWA (ícone, nome, modo standalone)
service-worker.js       cache do app shell para funcionar como app instalável
icons/icon.svg          ícone do app
apps-script/Code.gs     backend a ser colado no Google Apps Script da planilha
```

## Requisitos do navegador

A leitura de código de barras usa a API nativa `BarcodeDetector`, disponível no Chrome
para Android (o que cobre os aparelhos Galaxy). Formatos suportados: Code128, Code39,
Code93, Codabar, EAN-13, EAN-8, ITF, UPC-A, UPC-E e QR Code — cobre a grande maioria dos
tombos numéricos.
