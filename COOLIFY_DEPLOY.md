# Guia de Deploy no Coolify

O projeto TV Corp consiste em um monorepo que pode ser facilmente implantado no **Coolify** criando **dois recursos separados**, um para o banco de dados/backend (Supabase) e outro para o painel web (Next.js).

Siga os passos abaixo:

## 1. Banco de Dados / Backend (Supabase)

O backend é orquestrado via Docker Compose.

1. No Coolify, vá em **Add New Resource** > **Project** > **Environment**.
2. Clique em **Add Resource** > escolhe **Docker Compose** (ou Baseado em Docker Compose através de repositório Git).
3. Selecione o repositório do GitHub onde você subiu este código.
4. **Configurações essenciais no Coolify:**
   - **Base Directory**: `/backend/supabase-docker`
   - **Compose File**: `docker-compose.yml`
5. **Environment Variables (.env)**:
   - Abra o arquivo `/backend/supabase-docker/.env.example` do seu código.
   - Copie o conteúdo dele e cole na seção "Environment Variables" / ".env" do Coolify.
   - **MUITO IMPORTANTE:** Substitua as chaves padrão (`JWT_SECRET`, `ANON_KEY`, `SERVICE_ROLE_KEY`, `POSTGRES_PASSWORD`, etc.) por chaves seguras geradas por você. (Você pode usar um gerador online ou `openssl rand -hex 32` / JWT baseados em HS256).
   - Não esqueça de configurar `API_EXTERNAL_URL` e `SITE_URL` para o domínio/IP público onde o Supabase vai rodar, além do `SUPABASE_PUBLIC_URL`.
6. Salve e clique em **Deploy**. O Coolify vai ler o `docker-compose.yml` e subir todos os contêineres do Supabase.

> **Importante**: As configurações de persistência (`./volumes/...`) vão funcionar corretamente SE E SOMENTE SE você ativar a opção descrita no passo abaixo.
> 
> **MUITO IMPORTANTE (ERRO DE VOLUME VAZIO / VECTOR UNHEALTHY):** Nas configurações do projeto no Coolify, na aba **Advanced**, você **DEVE** marcar a opção **"Preserve Repository During Deployment"** (ou "Keep Folder"). 
> Se você não marcar isso, o Coolify apagará os arquivos de configuração após o build. Isso faz com que o Docker monte pastas vazias no lugar de arquivos críticos (como o `vector.yml` e scripts do banco), travando o Supabase.
---

## 2. Dashboard Web (Next.js)

O painel web Next.js usa o Nixpacks, que é o sistema padrão e automatizado do Coolify.

1. No Coolify, no mesmo projeto/ambiente, clique em **Add Resource** > **Public Repository** (ou Private, se o seu repo for privado).
2. Selecione o mesmo repositório do Git.
3. **Configurações essenciais:**
   - **Base Directory**: `/web`
   - O Coolify vai detectar automaticamente que é um app Next.js (via pacote Nixpacks) e configurar os comandos `npm install`, `npm run build` e `npm start`.
4. **Environment Variables**:
   Va na aba **Environment Variables** e adicione as variáveis que estão no seu `web/.env.example`:
   - `NEXT_PUBLIC_SUPABASE_URL`: A URL pública do Supabase configurado no passo 1.
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: A chave anônima (ANON_KEY) que você gerou no passo 1.
5. Salve as variáveis.
6. Vá na rota de **Domains** e adicione o domínio ou subdomínio do seu dashboard web.
7. Clique em **Deploy**.

## Conclusão

Após os dois deploys concluírem com sucesso:
- O banco de dados estará rodando na URL definida e operando no background.
- O Dashboard Web estará acessível na web, listando as TVs, pronto para pareamento.
- Use as URLs definidas para configurar o aplicativo Flutter!
