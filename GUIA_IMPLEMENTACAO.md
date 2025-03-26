# Guia de Implementação - Paulo Cell

Este guia fornece instruções detalhadas para implementar a persistência de dados usando PostgreSQL no projeto Paulo Cell.

## Índice
1. [Estrutura de Pastas](#estrutura-de-pastas)
2. [Arquivos da API](#arquivos-da-api)
3. [Arquivos do Frontend](#arquivos-do-frontend)
4. [Configuração do Banco de Dados](#configuração-do-banco-de-dados)
5. [Passos para Implementação](#passos-para-implementação)
6. [Configuração no Vercel](#configuração-no-vercel)

## Estrutura de Pastas

Primeiro, crie a seguinte estrutura de pastas:

```bash
mkdir -p api/_lib
mkdir -p api/customers
mkdir -p api/services
mkdir -p api/inventory
```

## Arquivos da API

### 1. `api/_lib/database-config.js`
```javascript
const { PrismaClient } = require('@prisma/client');
const { sql } = require('@vercel/postgres');

let prisma;
let postgres;

function getDatabaseClient() {
  const dbType = process.env.DB_TYPE || 'prisma';
  
  if (dbType === 'prisma') {
    if (!prisma) {
      prisma = new PrismaClient();
    }
    return prisma;
  } else if (dbType === 'vercel-postgres') {
    if (!postgres) {
      postgres = sql;
    }
    return postgres;
  }
  
  throw new Error(`Tipo de banco de dados não suportado: ${dbType}`);
}

async function initializeDatabase() {
  const dbType = process.env.DB_TYPE || 'prisma';
  
  if (dbType === 'vercel-postgres') {
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS customers (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          phone VARCHAR(20),
          email VARCHAR(255),
          address TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS services (
          id SERIAL PRIMARY KEY,
          customer_id INTEGER REFERENCES customers(id),
          device VARCHAR(255) NOT NULL,
          problem TEXT,
          status VARCHAR(50) DEFAULT 'pending',
          price DECIMAL(10,2),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS inventory (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          quantity INTEGER DEFAULT 0,
          price DECIMAL(10,2),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `;
      console.log('Banco de dados PostgreSQL inicializado com sucesso');
    } catch (error) {
      console.error('Erro ao inicializar banco de dados:', error);
      throw error;
    }
  }
}

module.exports = {
  getDatabaseClient,
  initializeDatabase
};
```

### 2. `api/_lib/prisma-client.js`
```javascript
const { PrismaClient } = require('@prisma/client');

let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient();
  }
  prisma = global.prisma;
}

module.exports = prisma;
```

### 3. `api/customers/index.js`
```javascript
const { getDatabaseClient } = require('../_lib/database-config');

export default async function handler(req, res) {
  const db = getDatabaseClient();
  
  // Configuração CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === 'GET') {
      const customers = await db.customer.findMany({
        orderBy: { createdAt: 'desc' }
      });
      return res.status(200).json(customers);
    }

    if (req.method === 'POST') {
      const customer = await db.customer.create({
        data: req.body
      });
      return res.status(201).json(customer);
    }

    return res.status(405).json({ error: 'Método não permitido' });
  } catch (error) {
    console.error('Erro na API de clientes:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
```

### 4. `api/customers/[id].js`
```javascript
const { getDatabaseClient } = require('../_lib/database-config');

export default async function handler(req, res) {
  const db = getDatabaseClient();
  const { id } = req.query;

  // Configuração CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === 'GET') {
      const customer = await db.customer.findUnique({
        where: { id: parseInt(id) }
      });
      if (!customer) {
        return res.status(404).json({ error: 'Cliente não encontrado' });
      }
      return res.status(200).json(customer);
    }

    if (req.method === 'PUT') {
      const customer = await db.customer.update({
        where: { id: parseInt(id) },
        data: req.body
      });
      return res.status(200).json(customer);
    }

    if (req.method === 'DELETE') {
      await db.customer.delete({
        where: { id: parseInt(id) }
      });
      return res.status(204).end();
    }

    return res.status(405).json({ error: 'Método não permitido' });
  } catch (error) {
    console.error('Erro na API de cliente:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
```

## Arquivos do Frontend

### 1. `src/services/api.js`
```javascript
import axios from 'axios';

const API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://seu-dominio.vercel.app/api'
  : 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para tratamento de erros
api.interceptors.response.use(
  response => response,
  error => {
    console.error('Erro na requisição:', error);
    return Promise.reject(error);
  }
);

export default api;
```

### 2. `src/services/customerService.js`
```javascript
import api from './api';

export const customerService = {
  async getAll() {
    try {
      const response = await api.get('/customers');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      throw error;
    }
  },

  async create(customerData) {
    try {
      const response = await api.post('/customers', customerData);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      throw error;
    }
  },

  async update(id, customerData) {
    try {
      const response = await api.put(`/customers/${id}`, customerData);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error);
      throw error;
    }
  },

  async delete(id) {
    try {
      await api.delete(`/customers/${id}`);
    } catch (error) {
      console.error('Erro ao deletar cliente:', error);
      throw error;
    }
  }
};
```

## Configuração do Banco de Dados

### 1. `prisma/schema.prisma`
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Customer {
  id        Int       @id @default(autoincrement())
  name      String
  phone     String?
  email     String?
  address   String?
  services  Service[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}

model Service {
  id         Int      @id @default(autoincrement())
  customerId Int
  customer   Customer @relation(fields: [customerId], references: [id])
  device     String
  problem    String?
  status     String   @default("pending")
  price      Float?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}

model Inventory {
  id        Int      @id @default(autoincrement())
  name      String
  quantity  Int      @default(0)
  price     Float?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### 2. `.env`
```env
DATABASE_URL="postgresql://seu_usuario:sua_senha@seu_host:5432/seu_banco"
DB_TYPE="prisma"
```

### 3. Atualize o `package.json`
Adicione estas dependências:
```json
{
  "dependencies": {
    "@prisma/client": "^5.10.0",
    "@vercel/postgres": "^0.7.2",
    "axios": "^1.6.7"
  },
  "devDependencies": {
    "prisma": "^5.10.0"
  }
}
```

## Passos para Implementação

1. Clone o repositório:
```bash
git clone https://github.com/Nomade-PJ/paulocell-10.git
cd paulocell-10
```

2. Crie a estrutura de pastas conforme indicado acima

3. Crie todos os arquivos mencionados com o código fornecido

4. Instale as dependências:
```bash
npm install
```

5. Gere o cliente Prisma:
```bash
npx prisma generate
```

6. Faça commit das alterações:
```bash
git add .
git commit -m "Implementação de persistência com PostgreSQL"
git push origin main
```

## Configuração no Vercel

1. Acesse o painel do Vercel
2. Selecione seu projeto
3. Vá para "Settings" → "Environment Variables"
4. Adicione as seguintes variáveis:
   - `DATABASE_URL`: URL de conexão do PostgreSQL
   - `DB_TYPE`: "prisma" ou "vercel-postgres"

5. Faça o deploy do projeto

## Verificação

Após a implementação, verifique se:
1. Os dados estão sendo salvos no banco de dados
2. As operações CRUD estão funcionando corretamente
3. Os dados persistem após limpar o cache do navegador
4. A aplicação funciona em diferentes dispositivos

## Suporte

Se encontrar algum problema durante a implementação, verifique:
1. Se todas as dependências foram instaladas corretamente
2. Se as variáveis de ambiente estão configuradas
3. Se o banco de dados está acessível
4. Se as APIs estão respondendo corretamente 