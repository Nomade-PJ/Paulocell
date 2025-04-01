# Guia para Verificar a Persistência de Dados no PostgreSQL (Hostinger)

Este guia contém instruções para verificar se os dados estão sendo persistidos corretamente no banco de dados PostgreSQL do projeto Paulo Cell através do terminal da Hostinger.

## 1. Acessar o Terminal da Hostinger

1. Faça login no painel de controle da Hostinger
2. Vá para a seção de Terminal/SSH

## 2. Verificar a Conexão com o Banco de Dados

```bash
# Navegue até o diretório do projeto
cd /var/www/paulocell

# Verifique o status da aplicação para confirmar que está rodando
pm2 status

# Verifique os logs da aplicação para confirmar que não há erros de conexão
pm2 logs paulocell | grep -i "database\|postgres\|sql\|conexão\|erro"
```

## 3. Acessar o PostgreSQL via Terminal

```bash
# Conectar ao PostgreSQL (substitua os valores pelos corretos do seu .env)
# Você pode verificar as credenciais no arquivo .env do projeto
cat .env | grep DATABASE_URL

# Exemplo de conexão usando psql (cliente PostgreSQL)
# Formato: psql postgresql://usuario:senha@host:porta/banco

# Método 1: Remover o parâmetro schema da URL
psql $(grep DATABASE_URL .env | cut -d '=' -f2 | tr -d '"' | sed 's/?schema=public//')

# Método 2: Usar os parâmetros separados
# Extrair componentes da string de conexão
DB_USER=$(grep DATABASE_URL .env | cut -d '=' -f2 | cut -d '/' -f3 | cut -d ':' -f1)
DB_PASS=$(grep DATABASE_URL .env | cut -d '=' -f2 | cut -d ':' -f3 | cut -d '@' -f1)
DB_HOST=$(grep DATABASE_URL .env | cut -d '=' -f2 | cut -d '@' -f2 | cut -d ':' -f1)
DB_PORT=$(grep DATABASE_URL .env | cut -d '=' -f2 | cut -d ':' -f4 | cut -d '/' -f1)
DB_NAME=$(grep DATABASE_URL .env | cut -d '=' -f2 | cut -d '/' -f4 | cut -d '?' -f1)

# Conectar usando os parâmetros extraídos
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME
```

## 4. Comandos SQL para Verificar os Dados

Uma vez conectado ao PostgreSQL, você pode executar os seguintes comandos SQL:

```sql
-- Listar todas as tabelas do banco de dados
\dt

-- Verificar a estrutura de uma tabela específica
\d users
\d services
\d inventory_items

-- Contar o número de registros em cada tabela
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM services;
SELECT COUNT(*) FROM inventory_items;

-- Visualizar os registros mais recentes
SELECT * FROM users ORDER BY created_at DESC LIMIT 10;
SELECT * FROM services ORDER BY created_at DESC LIMIT 10;
SELECT * FROM inventory_items ORDER BY created_at DESC LIMIT 10;

-- Verificar se um registro específico existe (substitua ID pelo valor desejado)
SELECT * FROM users WHERE id = 'ID';

-- Sair do cliente PostgreSQL
\q
```

## 5. Verificar a API de Diagnóstico

O projeto Paulo Cell possui uma API de diagnóstico que pode ser usada para verificar a conexão com o banco de dados:

```bash
# Usando curl para acessar a API de diagnóstico
curl https://seu-dominio.com/api/debug-database

# Para obter informações detalhadas, incluindo dados das tabelas
curl https://seu-dominio.com/api/debug-database?mode=detailed
```

## 6. Verificar a Inicialização do Banco de Dados

Se você precisar reinicializar o banco de dados ou verificar se as tabelas foram criadas corretamente:

```bash
# Acessar a API de inicialização do banco de dados
curl https://seu-dominio.com/api/db-initialize
```

## 7. Monitorar a Aplicação em Tempo Real

```bash
# Monitorar a aplicação e seus logs em tempo real
pm2 monit

# Verificar apenas os logs em tempo real
pm2 logs paulocell --lines 100 --follow
```

## 8. Verificar Sincronização de Dados

Para verificar se os dados estão sendo sincronizados corretamente entre o frontend e o backend:

```bash
# Verificar logs específicos de sincronização
pm2 logs paulocell | grep -i "sync\|sincroniz\|persist"
```

## Solução de Problemas Comuns

### Problema de Conexão com o Banco de Dados

```bash
# Verificar se as variáveis de ambiente estão configuradas corretamente
cat .env | grep -i "database\|postgres\|db_"

# Testar a conexão com o servidor PostgreSQL
telnet $(grep DATABASE_URL .env | cut -d '@' -f2 | cut -d '/' -f1 | cut -d ':' -f1) 5432
```

### Erro com Parâmetro 'schema' na URI de Conexão

Se você encontrar o erro `psql: error: missing key/value separator "=" in URI query parameter: "schema"`, isso ocorre porque o psql não suporta o parâmetro `?schema=public` na string de conexão. Use uma das soluções abaixo:

```bash
# Solução 1: Remover o parâmetro schema da URL
psql $(grep DATABASE_URL .env | cut -d '=' -f2 | tr -d '"' | sed 's/?schema=public//')

# Solução 2: Conectar usando os parâmetros separados
DB_USER=$(grep DATABASE_URL .env | cut -d '=' -f2 | cut -d '/' -f3 | cut -d ':' -f1)
DB_PASS=$(grep DATABASE_URL .env | cut -d '=' -f2 | cut -d ':' -f3 | cut -d '@' -f1)
DB_HOST=$(grep DATABASE_URL .env | cut -d '=' -f2 | cut -d '@' -f2 | cut -d ':' -f1)
DB_PORT=$(grep DATABASE_URL .env | cut -d '=' -f2 | cut -d ':' -f4 | cut -d '/' -f1)
DB_NAME=$(grep DATABASE_URL .env | cut -d '=' -f2 | cut -d '/' -f4 | cut -d '?' -f1)

psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME
```

### Erros nos Logs da Aplicação

```bash
# Verificar erros específicos do banco de dados
pm2 logs paulocell | grep -i "error\|erro\|falha\|failed" | grep -i "database\|postgres\|sql"
```

### Reiniciar a Aplicação Após Alterações

```bash
# Reiniciar a aplicação para aplicar alterações
pm2 restart paulocell

# Verificar se a aplicação reiniciou corretamente
pm2 status
```

## Observações Importantes

- O projeto Paulo Cell utiliza PostgreSQL como banco de dados principal
- A conexão é gerenciada através do Prisma ORM ou diretamente via Vercel Postgres
- As tabelas principais são: `users`, `services` e `inventory_items`
- Todas as operações de banco de dados são registradas nos logs da aplicação

Este guia assume que o projeto já está configurado e rodando no servidor Hostinger, e você apenas precisa verificar se os dados estão sendo persistidos corretamente.