// Importações para diferentes bancos de dados
import { PrismaClient } from '@prisma/client';
import mongoose from 'mongoose';
import { Pool } from 'pg';
import getMongooseModels from '../../models/mongoose';
import config from './config.js';

// Variáveis que manterão as conexões ativas
let prismaClient = null;
let mongoClient = null;
let pgClient = null;

// Configuração do tipo de banco de dados - obtido do arquivo de configuração centralizado
const dbType = config.DB_TYPE || 'prisma'; // Opções: 'prisma', 'mongoose', 'pg'

/**
 * Conecta ao banco de dados especificado na configuração
 * @returns {Object} Cliente de banco de dados
 */
export async function connectToDatabase() {
  // Se já existe uma conexão ativa, retorna-a
  if (dbType === 'prisma' && prismaClient) return prismaClient;
  if (dbType === 'mongoose' && mongoClient) return { client: mongoClient, models: getMongooseModels() };
  if (dbType === 'pg' && pgClient) return pgClient;

  try {
    // Estabelecer conexão com base no tipo de banco de dados escolhido
    switch (dbType) {
      case 'prisma':
        // Usar Prisma com Neon PostgreSQL (configuração recomendada)
        prismaClient = new PrismaClient({
          datasources: {
            db: {
              url: config.DATABASE_URL
            }
          }
        });
        
        // Teste a conexão
        await prismaClient.$connect();
        console.log('📦 Conexão com Neon PostgreSQL via Prisma estabelecida');
        return prismaClient;

      case 'mongoose':
        // Usar MongoDB via Mongoose
        const mongoUri = config.DB_URI || 'mongodb://localhost:27017/paulocell';
        
        if (!mongoose.connection.readyState) {
          mongoClient = await mongoose.connect(mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
          });
          console.log('📦 Conexão com MongoDB estabelecida');
        } else {
          mongoClient = mongoose.connection;
        }
        
        return { client: mongoClient, models: getMongooseModels() };

      case 'pg':
        // Usar PostgreSQL diretamente via pg
        pgClient = new Pool({
          connectionString: config.DATABASE_URL,
          ssl: { rejectUnauthorized: false }
        });
        
        // Testar a conexão
        await pgClient.query('SELECT NOW()');
        console.log('📦 Conexão com PostgreSQL estabelecida');
        return pgClient;

      default:
        throw new Error(`Tipo de banco de dados não suportado: ${dbType}`);
    }
  } catch (error) {
    console.error('Erro ao conectar ao banco de dados:', error);
    throw error;
  }
}

/**
 * Executa uma consulta no banco de dados
 * @param {string} query - Consulta SQL ou operação equivalente
 * @param {Array} params - Parâmetros para a consulta
 * @returns {Promise<any>} Resultado da consulta
 */
export async function executeQuery(query, params = []) {
  try {
    const client = await connectToDatabase();
    
    // Executar a consulta de acordo com o tipo de banco de dados
    if (dbType === 'prisma') {
      // Para Prisma, se a consulta for SQL nativo
      return await client.$queryRawUnsafe(query, ...params);
    } else if (dbType === 'pg') {
      // Para PostgreSQL direto
      const result = await client.query(query, params);
      return result.rows;
    } else if (dbType === 'mongoose') {
      // Para Mongoose não usamos SQL diretamente, esta função seria apenas para compatibilidade
      console.warn('Tentativa de executar SQL no MongoDB. Use os modelos diretamente.');
      return null;
    }
  } catch (error) {
    console.error('Erro ao executar query:', error);
    throw error;
  }
}

/**
 * Fecha a conexão com o banco de dados
 */
export async function closeConnection() {
  try {
    if (dbType === 'prisma' && prismaClient) {
      await prismaClient.$disconnect();
      prismaClient = null;
      console.log('Conexão Prisma fechada');
    } else if (dbType === 'mongoose' && mongoose.connection.readyState) {
      await mongoose.connection.close();
      mongoClient = null;
      console.log('Conexão MongoDB fechada');
    } else if (dbType === 'pg' && pgClient) {
      await pgClient.end();
      pgClient = null;
      console.log('Conexão PostgreSQL fechada');
    }
  } catch (error) {
    console.error('Erro ao fechar conexão com o banco de dados:', error);
  }
} 