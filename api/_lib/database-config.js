/**
 * Configuração e gerenciamento de conexão com o banco de dados.
 * Este módulo suporta diferentes tipos de conexão:
 * - Prisma: ORM para conexão com PostgreSQL ou MongoDB
 * - Mongoose: ODM para conexão com MongoDB
 */

import config from './config.js';
import prismaClient from './prisma-client';

// Configuração do banco de dados baseada nas variáveis de ambiente do config centralizado
const DB_TYPE = config.DB_TYPE || 'prisma';
const DB_INIT_KEY = config.DB_INIT_KEY || 'default-key-insecure';

// Instância do cliente de banco de dados (será inicializada sob demanda)
let dbClientInstance = null;

/**
 * Obtém o cliente de banco de dados, inicializando-o se necessário
 * @returns {Object} Cliente de banco de dados configurado
 */
export async function getDbClient() {
  // Se já foi inicializado, retorna a instância existente
  if (dbClientInstance) {
    return dbClientInstance;
  }

  console.log(`🔌 Inicializando conexão de banco de dados (tipo: ${DB_TYPE})...`);

  // Inicializa o cliente de banco de dados com base no tipo configurado
  try {
    switch (DB_TYPE) {
      case 'prisma':
        // Verifica a conexão com o banco de dados via Prisma
        await prismaClient.checkConnection();
        dbClientInstance = prismaClient;
        console.log('✅ Conexão estabelecida com Prisma');
        break;

      case 'mongoose':
        // Verificar a conexão com MongoDB via Mongoose
        const mongooseModule = await import('./mongoose-client.js');
        await mongooseModule.default.checkConnection();
        dbClientInstance = mongooseModule.default;
        console.log('✅ Conexão estabelecida com MongoDB (Mongoose)');
        break;

      default:
        console.warn(`⚠️ Tipo de banco de dados desconhecido: ${DB_TYPE}. Usando Prisma como padrão.`);
        await prismaClient.checkConnection();
        dbClientInstance = prismaClient;
        break;
    }

    return dbClientInstance;
  } catch (error) {
    console.error('❌ Erro ao inicializar conexão com banco de dados:', error);
    throw new Error(`Falha ao conectar ao banco de dados: ${error.message}`);
  }
}

/**
 * Inicializa o banco de dados, criando tabelas e estruturas necessárias
 * @param {string} initKey Chave de inicialização para autorizar a operação
 */
export async function initializeDatabase(initKey) {
  // Verificar chave de segurança
  if (initKey !== DB_INIT_KEY) {
    throw new Error('Chave de inicialização inválida');
  }

  try {
    const dbClient = await getDbClient();

    // Dependendo do tipo de banco, inicializa as estruturas adequadas
    if (DB_TYPE === 'prisma') {
      await prismaClient.initializeDatabase();
    } else if (DB_TYPE === 'mongoose') {
      const mongooseModule = await import('./mongoose-client.js');
      await mongooseModule.default.initializeDatabase();
    }

    return { success: true };
  } catch (error) {
    console.error('❌ Erro ao inicializar banco de dados:', error);
    throw new Error(`Falha ao inicializar estruturas do banco: ${error.message}`);
  }
}

/**
 * Verifica se a conexão com o banco de dados está ativa
 * @returns {Object} Status da conexão
 */
export async function checkDatabaseConnection() {
  try {
    const dbClient = await getDbClient();
    
    let connectionStatus = {};
    
    // Verificar status específico por tipo de banco
    if (DB_TYPE === 'prisma') {
      connectionStatus = {
        connected: true,
        type: 'PostgreSQL/MySQL via Prisma',
        message: 'Conexão com Prisma estabelecida com sucesso',
      };
    } else if (DB_TYPE === 'mongoose') {
      connectionStatus = {
        connected: true,
        type: 'MongoDB via Mongoose',
        message: 'Conexão com MongoDB estabelecida com sucesso',
      };
    }
    
    return connectionStatus;
  } catch (error) {
    console.error('❌ Erro ao verificar conexão:', error);
    return {
      connected: false,
      error: error.message,
      details: error.stack
    };
  }
}

export default {
  getDbClient,
  initializeDatabase,
  checkDatabaseConnection
};