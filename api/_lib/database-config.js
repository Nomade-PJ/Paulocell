/**
 * Configuração central do banco de dados com suporte a múltiplos provedores
 * 
 * Este arquivo gerencia as diferentes opções de banco de dados suportadas pela aplicação:
 * - Prisma: ORM para conexão com PostgreSQL (recomendado para produção no Vercel)
 * - Vercel Postgres: Conecta diretamente ao Vercel Postgres SQL sem ORM
 * - MongoDB: Conexão com MongoDB usando Mongoose
 */

import { connectToDatabase as connectToPrisma } from './database';
import vercelPg from './vercel-postgres';
import prismaClient from './prisma-client';

// Tipo de banco de dados configurado por variável de ambiente
const DB_TYPE = process.env.DB_TYPE || 'prisma'; // Usando Prisma como padrão

// Variável para armazenar a conexão persistente
let dbClientInstance = null;

/**
 * Retorna o cliente de banco de dados adequado com base na configuração
 * Garante que a mesma instância seja reusada para todas as solicitações
 * @returns Cliente de banco de dados configurado
 */
export async function getDatabaseClient() {
  // Se já temos uma instância, retorna ela (Singleton pattern)
  if (dbClientInstance) {
    console.log('✅ Reutilizando conexão existente com o banco de dados');
    return dbClientInstance;
  }

  console.log(`🔌 Criando nova conexão com o banco de dados (${DB_TYPE})...`);

  try {
    switch (DB_TYPE) {
      case 'prisma':
        // Usando Prisma (conexão compartilhada)
        dbClientInstance = prismaClient;
        console.log('✅ Conexão estabelecida com Prisma');
        break;
      
      case 'vercel-postgres':
        // Verifica a conexão com o Vercel Postgres
        await vercelPg.checkConnection();
        dbClientInstance = vercelPg;
        console.log('✅ Conexão estabelecida com Vercel Postgres');
        break;
      
      case 'mongoose':
      case 'mongodb':
        // Conecta ao MongoDB via Mongoose
        const { client, models } = await connectToPrisma();
        dbClientInstance = { client, models };
        console.log('✅ Conexão estabelecida com MongoDB');
        break;
      
      default:
        console.warn(`⚠️ Tipo de banco de dados desconhecido: ${DB_TYPE}. Usando Vercel Postgres como padrão.`);
        await vercelPg.checkConnection();
        dbClientInstance = vercelPg;
        break;
    }
    
    return dbClientInstance;
  } catch (error) {
    console.error('❌ Erro ao conectar com banco de dados:', error);
    throw new Error(`Falha ao conectar ao banco de dados: ${error.message}`);
  }
}

/**
 * Inicializa o banco de dados na primeira inicialização
 * Útil para configuração inicial em ambientes de desenvolvimento
 */
export async function initializeDatabase() {
  console.log(`🔌 Inicializando banco de dados (${DB_TYPE})...`);
  
  try {
    switch (DB_TYPE) {
      case 'vercel-postgres':
        await vercelPg.initializeDatabase();
        break;
      
      // Outros tipos podem ser adicionados conforme necessário
      
      default:
        // Para Prisma, a migração já cuida da inicialização
        console.log('✅ Usando Prisma que já gerencia a estrutura do banco de dados');
        break;
    }
    
    console.log('✅ Banco de dados inicializado com sucesso!');
    return true;
  } catch (error) {
    console.error('❌ Falha ao inicializar banco de dados:', error);
    return false;
  }
}

// Adicionando função para testar conexão e listar todos os dados 
// Útil para diagnóstico de problemas de compartilhamento de dados
export async function testDatabaseConnection() {
  try {
    const client = await getDatabaseClient();
    
    // Testa diferentes tipos de banco
    if (DB_TYPE === 'prisma') {
      const userCount = await client.$queryRaw`SELECT COUNT(*) FROM users`;
      const serviceCount = await client.$queryRaw`SELECT COUNT(*) FROM services`;
      const inventoryCount = await client.$queryRaw`SELECT COUNT(*) FROM inventory_items`;
      
      return {
        success: true,
        message: 'Conexão com Prisma estabelecida com sucesso',
        stats: {
          users: userCount[0].count,
          services: serviceCount[0].count,
          inventory: inventoryCount[0].count
        }
      };
      
    } else if (DB_TYPE === 'vercel-postgres') {
      const usersResult = await client.sql`SELECT COUNT(*) FROM users`;
      const servicesResult = await client.sql`SELECT COUNT(*) FROM services`;
      const inventoryResult = await client.sql`SELECT COUNT(*) FROM inventory_items`;
      
      return {
        success: true,
        message: 'Conexão com Vercel Postgres estabelecida com sucesso',
        stats: {
          users: usersResult.rows[0].count,
          services: servicesResult.rows[0].count,
          inventory: inventoryResult.rows[0].count
        }
      };
    }
    
    return {
      success: true, 
      message: 'Conexão estabelecida, mas não implementada verificação para este tipo',
      dbType: DB_TYPE
    };
  } catch (error) {
    console.error('❌ Falha no teste de conexão:', error);
    return {
      success: false,
      message: `Erro ao testar conexão: ${error.message}`,
      error: error.stack
    };
  }
}

export default {
  getDatabaseClient,
  initializeDatabase,
  testDatabaseConnection,
  DB_TYPE
};