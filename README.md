# Scanner de Tombos

App web (PWA) para ler códigos de barras de tombos com o celular e enviar cada leitura
para uma planilha do Google Sheets (DATA_HORA, TOMBO, DISPOSITIVO, USUARIO).

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
`DATA_HORA | TOMBO | DISPOSITIVO | USUARIO`. Se você já tinha uma planilha em uso antes da
coluna `USUARIO` existir, não precisa fazer nada manualmente — o script completa o cabeçalho
sozinho na primeira leitura enviada após atualizar o `Code.gs`.

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

**Hospedar dentro do portal Liferay do tribunal**: veja
[`liferay-module/scanner-tombos-web`](liferay-module/scanner-tombos-web/README.md) — um
módulo OSGi pronto para servir estes mesmos arquivos em `/scanner-tombos/*` direto pelo
Liferay 7.3.7, sem depender de hospedagem externa.

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

## 5. Exigir login e identificar o usuário (Liferay)

O app em si (`/o/scanner-tombos/index.html`, veja o [módulo Liferay](liferay-module/scanner-tombos-web/README.md))
continua público — ele só passa a exigir login se for acessado através de uma **página
privada do Liferay** que injete o nome do usuário logado na URL, via parâmetro `?usuario=`.
Sem esse parâmetro, o app mostra "Usuário não identificado" no topo e o botão "Iniciar
Scaneamento" fica clicável mas mostra um aviso em vez de abrir a câmera.

Para montar isso no Liferay:

1. No site desejado, vá em **Páginas do Site > Páginas Privadas** (essas já exigem login
   por padrão) e adicione uma página nova, ex: "Scanner de Tombos".
2. Edite a página e adicione qualquer widget que aceite colar HTML/JS cru (o widget genérico
   de "HTML"/"Objeto HTML" funciona bem aqui — **não precisa** ser o widget "Conteúdo Web").
   Cole:
   ```html
   <script>
     function abrirScanner() {
       if (window.Liferay && Liferay.ThemeDisplay && Liferay.ThemeDisplay.isSignedIn()) {
         var nome = Liferay.ThemeDisplay.getUserName();
         window.location.replace('/o/scanner-tombos/index.html?usuario=' + encodeURIComponent(nome));
       } else {
         document.body.innerHTML = '<p>Não foi possível identificar seu usuário. Faça login novamente.</p>';
       }
     }
     if (document.readyState === 'loading') {
       document.addEventListener('DOMContentLoaded', abrirScanner);
     } else {
       abrirScanner();
     }
   </script>
   <p>Abrindo o Scanner de Tombos...</p>
   ```
   Isso usa `Liferay.ThemeDisplay`, um objeto JavaScript que o próprio tema do Liferay
   disponibiliza em toda página para o usuário logado — pega o nome direto no navegador
   (sem precisar de Freemarker/Estrutura/Template) e redireciona a aba inteira para o app.
   O app abre em tela cheia, sem o menu/tema do Liferay em volta, já com o usuário correto.

   *(Tentativas anteriores com `${themeDisplay.getUser().getScreenName()}` dentro de um
   Conteúdo Web básico não funcionam: esse placeholder só é processado quando o artigo usa
   uma Estrutura + Template Freemarker próprios, o que é bem mais trabalhoso de configurar.
   A abordagem acima evita essa complicação inteira.)*

   *(Alternativa: se preferir manter o app dentro da página do Liferay, com o menu do portal
   visível, troque o `window.location.replace(...)` por um `<iframe src="...">` apontando
   pra mesma URL — mas para uso no celular, tela cheia costuma ser melhor.)*
3. Publique o widget/artigo e a página.
4. Use o link **dessa página privada** (não o link direto `/o/scanner-tombos/...`) como o
   link que vai no portal para os usuários.

*(Observação: os nomes exatos dos menus podem variar um pouco conforme a versão/idioma do
Liferay — se algo não bater com o que você vê na tela, me manda o que aparece que eu ajusto
o passo a passo.)*

Isso é uma exigência "branda": quem tiver o link direto do arquivo estático ainda consegue
abrir sem logar (só não vai ter usuário identificado, então o botão de escanear vai mostrar
o aviso de erro em vez de funcionar). Não bloqueia no nível do servidor — para isso seria
necessário reescrever o módulo com autenticação real do lado do Java, uma opção mais
trabalhosa que ficou de fora por ora.

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
