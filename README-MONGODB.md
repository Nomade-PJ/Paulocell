# Migração para MongoDB

Este projeto foi migrado para usar MongoDB como banco de dados principal. Este documento contém instruções sobre como configurar e usar o MongoDB com o projeto Paulo Cell.

## Configuração do MongoDB

### Instalação Local

1. Instale o MongoDB Community Edition seguindo as instruções oficiais para seu sistema operacional:
   - [Windows](https://docs.mongodb.com/manual/tutorial/install-mongodb-on-windows/)
   - [macOS](https://docs.mongodb.com/manual/tutorial/install-mongodb-on-os-x/)
   - [Linux](https://docs.mongodb.com/manual/administration/install-on-linux/)

2. Inicie o serviço MongoDB:
   - Windows: O serviço deve iniciar automaticamente após a instalação
   - macOS: `brew services start mongodb-community`
   - Linux: `sudo systemctl start mongod`

3. Verifique se o MongoDB está rodando:
   - Conecte-se usando o cliente MongoDB: `mongosh`

### Configuração do Banco de Dados

1. Crie o banco de dados e um usuário para a aplicação:

```bash
mongosh admin --eval '
  use paulocell;
  db.createUser({
    user: "paulocellApp",
    pwd: "senha_segura_aqui",
    roles: [ { role: "readWrite", db: "paulocell" } ]
  })
'
```

2. Atualize o arquivo `.env` com as credenciais corretas:

```
DB_URI=mongodb://paulocellApp:senha_segura_aqui@localhost:27017/paulocell
DB_NAME=paulocell
DB_TYPE=mongoose
```

## Configuração em Produção

Para ambientes de produção, siga as instruções no arquivo `GUIA-INSTALACAO-VPS.md` para configurar o MongoDB com autenticação e segurança adequadas.

## Estrutura de Dados

O projeto utiliza os seguintes modelos no MongoDB:

- **User**: Usuários do sistema
- **Customer**: Clientes cadastrados
- **Service**: Serviços realizados
- **ServiceItem**: Itens de serviço
- **InventoryItem**: Itens de inventário
- **UserData**: Dados genéricos do usuário (para sincronização)

## Inicialização do Banco de Dados

Para inicializar o banco de dados com as estruturas necessárias, acesse:

```
http://localhost:3000/api/db-initialize?key=chave-segura-para-inicializacao
```

A chave de inicialização deve corresponder ao valor definido em `DB_INIT_KEY` no arquivo `.env`.

## Sincronização Offline

O sistema suporta sincronização offline, armazenando dados localmente quando não há conexão com o servidor e sincronizando automaticamente quando a conexão é restabelecida.

## Migração de PostgreSQL para MongoDB

Se você estava usando PostgreSQL anteriormente e precisa migrar os dados para MongoDB, você pode usar ferramentas como:

- [pg2mongo](https://github.com/codeyu/pg2mongo)
- [Transporter](https://github.com/compose/transporter)

Ou implementar um script de migração personalizado usando as APIs do projeto.