# Guia de Deploy no Vercel

Este documento contém as instruções detalhadas para realizar o deploy do sistema Paulo Cell no Vercel, incluindo a configuração do banco de dados.

## Pré-requisitos

1. Uma conta no [Vercel](https://vercel.com)
2. Uma conta no [Neon PostgreSQL](https://neon.tech) ou outro provedor de PostgreSQL compatível com o Vercel
3. Acesso ao repositório GitHub do projeto

## Passo a Passo para Deploy

### 1. Preparando o Banco de Dados

#### Opção 1: Usando Neon PostgreSQL (Recomendado)

1. Crie uma conta no [Neon PostgreSQL](https://neon.tech)
2. Crie um novo projeto
3. Na seção "Connection Details", copie a string de conexão no formato:
   ```
   postgres://user:password@endpoint/neondb?sslmode=require
   ```
4. Guarde esta string para usar nas variáveis de ambiente do Vercel

#### Opção 2: Usando Vercel Postgres

1. Durante o processo de deploy no Vercel, acesse a seção "Storage"
2. Escolha "Postgres" e siga as instruções para criar um novo banco de dados
3. As variáveis de ambiente serão configuradas automaticamente pelo Vercel

### 2. Deploy no Vercel

1. Acesse sua conta no [Vercel](https://vercel.com)
2. Clique em "Add New" e selecione "Project"
3. Conecte sua conta do GitHub e selecione o repositório `paulocell-10`
4. Configure as seguintes variáveis de ambiente:

   ```
   # Conexão com o banco de dados
   DATABASE_URL=postgres://user:password@endpoint/neondb?sslmode=require
   
   # Configurações de autenticação
   JWT_SECRET=sua_chave_secreta_do_jwt_aqui
   JWT_EXPIRES_IN=8h
   REFRESH_TOKEN_SECRET=sua_chave_secreta_do_refresh_token_aqui
   REFRESH_TOKEN_EXPIRES_IN=7d
   
   # Configuração do tipo de banco de dados
   DB_TYPE=prisma
   
   # Chave para inicialização do banco (segurança adicional)
   DB_INIT_KEY=chave_aleatoria_aqui
   ```

5. No projeto recomendamos deixar as configurações:
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

6. Clique em "Deploy"

### 3. Inicialização do Banco de Dados

Após o deploy, é necessário inicializar o banco de dados:

1. Acesse o endpoint de inicialização:
   ```
   https://seu-projeto.vercel.app/api/db-initialize?key=sua_db_init_key
   ```
   Substitua `sua_db_init_key` pelo valor configurado na variável `DB_INIT_KEY`

2. Verifique se a resposta foi bem-sucedida:
   ```json
   {
     "success": true,
     "message": "Banco de dados inicializado com sucesso",
     "dbType": "prisma",
     "timestamp": "2023-XX-XXXX:XX:XXZ"
   }
   ```

3. Em caso de erro, verifique os logs no dashboard do Vercel.

### 4. Configuração do Prisma (Primeiro Deploy)

Se for a primeira vez que o projeto está sendo implantado, o Prisma Client pode precisar ser gerado durante o build:

1. Adicione ao arquivo `package.json` na seção de scripts:
   ```json
   "vercel-build": "prisma generate && vite build"
   ```

2. No dashboard do Vercel, vá para a seção "Settings" > "General"
3. Em "Build & Development Settings", defina o comando de build para:
   ```
   npm run vercel-build
   ```

### 5. Verificando o Deploy

1. Acesse a URL fornecida pelo Vercel (formato: `https://seu-projeto.vercel.app`)
2. Faça login com as credenciais padrão:
   - Usuário: `admin`
   - Senha: `paulo123`
3. Verifique se todas as funcionalidades estão operando corretamente:
   - Cadastro de inventário
   - Gerenciamento de serviços
   - Autenticação e refresh de token

## Gerenciamento de Operações

### Atualizações

Para atualizar o aplicativo:

1. Envie as alterações para o repositório GitHub
2. O Vercel detectará as mudanças e realizará um novo deploy automaticamente

### Monitoramento

1. No dashboard do Vercel, acesse a seção "Analytics" para monitorar o desempenho
2. Para investigar erros, vá para a seção "Logs"

### Rollback

Se necessário reverter para uma versão anterior:

1. No dashboard do Vercel, acesse a seção "Deployments"
2. Localize o deploy anterior bem-sucedido
3. Clique em "..." e selecione "Promote to Production"

## Suporte a Múltiplos Bancos de Dados

O sistema Paulo Cell foi projetado para suportar diferentes provedores de banco de dados:

1. **Prisma com PostgreSQL** (padrão, recomendado):
   ```
   DB_TYPE=prisma
   ```

2. **Vercel Postgres** (acesso SQL direto):
   ```
   DB_TYPE=vercel-postgres
   ```

3. **MongoDB** (via Mongoose, experimental):
   ```
   DB_TYPE=mongoose
   MONGODB_URI=sua_string_de_conexao_mongodb
   ```

## Perguntas Frequentes

**P: O que fazer se ocorrer um erro durante o deploy?**
R: Verifique os logs no dashboard do Vercel. Os erros mais comuns estão relacionados à conexão com o banco de dados ou variáveis de ambiente ausentes.

**P: Como migrar do cPanel para o Vercel?**
R: É necessário exportar os dados do MySQL e importá-los no PostgreSQL do Vercel. Use a endpoint `/api/db-initialize` após o setup inicial.

**P: O Vercel suporta as funções necessárias para o Paulo Cell?**
R: Sim, o Vercel suporta todas as funções necessárias, incluindo autenticação, APIs REST e renderização do frontend. 