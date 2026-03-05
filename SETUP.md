# Guia de Configuração - TV Corporativa

Siga estes passos para colocar o sistema em funcionamento.

## 1. Backend (Supabase Self-Hosted)
O backend roda via Docker no seu servidor interno.

1. Navegue até a pasta: `backend/supabase-docker`
2. Certifique-se de que o Docker está rodando.
3. Execute o comando:
   ```bash
   docker compose up -d
   ```
4. Após o sistema iniciar (pode levar alguns minutos na primeira vez), acesse o painel do Supabase (geralmente em `http://localhost:8000`).
5. No editor SQL do Supabase, copie e cole o conteúdo de `backend/schema.sql` e execute para criar as tabelas.

## 2. Dashboard Web (Next.js)
Interface de gerenciamento.

1. Navegue até a pasta `web`.
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
4. Acesse em `http://localhost:3000`.

## 3. App de TV (Flutter)
Requer o Flutter SDK instalado.

1. Navegue até a pasta `mobile`.
2. Se o ambiente estiver pronto, crie o projeto:
   ```bash
   flutter create .
   ```
3. O código base já foi preparado em `mobile/lib/main.dart` (será criado a seguir).

---
## 🧪 Roteiro de Teste Fim-a-Fim

Siga estes passos para validar todo o sistema:

1.  **Dashboard Web**:
    *   Navegue até a pasta `web/` e rode `npm run dev`.
    *   Acesse `http://localhost:3000`.
    *   Vá em **TVs** e clique em **Registrar Terminal**. Dê o nome de "TV Recepção".
    *   Copie o `ID` gerado para esta TV (um UUID).

2.  **Conteúdo e Playlists**:
    *   Vá em **Mídia** e faça upload de um vídeo e uma imagem.
    *   Vá em **Playlists**, crie uma nova chamada "Destaques".
    *   Clique em **Configurar Sequência** na playlist "Destaques".
    *   Clique no botão `+` das mídias na biblioteca à direita para adicioná-las.
    *   Volte para a página de **TVs**, clique no ícone de engrenagem da "TV Recepção" e escolha a playlist "Destaques".

3.  **App de TV (Simulação/Real)**:
    *   No arquivo `mobile/lib/main.dart`, substitua o valor de `_tvId` pelo ID que você copiou no passo 1.
    *   Rode o app Flutter em um emulador ou TV real.
    *   **O que deve acontecer**: O app deve baixar os arquivos automaticamente, começar a passar o vídeo/imagem em loop e aparecer como **Online** no seu Dashboard Web em instantes.

---
**Dica**: Você pode abrir a página de **Monitoramento** no Dashboard para ver os logs de conexão do banco de dados em tempo real.
