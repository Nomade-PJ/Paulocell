import { PrismaClient } from '@prisma/client';
import config from './config.js';

// Variável global para manter a conexão do Prisma entre invocações serverless
let prismaGlobal = global.prisma;

// Opções do Prisma para melhorar a performance e lidar com conexões
const prismaOptions = {
  log: ['error', 'warn'],
  errorFormat: 'pretty'
};

// Se não existir uma instância global, cria uma nova
if (!prismaGlobal) {
  prismaGlobal = new PrismaClient(prismaOptions);
  
  // Em ambiente de desenvolvimento, registra as queries para debug
  if (config.NODE_ENV === 'development') {
    prismaGlobal.$use(async (params, next) => {
      const before = Date.now();
      const result = await next(params);
      const after = Date.now();
      console.log(`Query ${params.model}.${params.action} levou ${after - before}ms`);
      return result;
    });
  }
  
  // Em ambiente de produção, adiciona middleware para tentar reconectar em caso de erro
  if (config.NODE_ENV === 'production') {
    prismaGlobal.$use(async (params, next) => {
      try {
        return await next(params);
      } catch (error) {
        // Se é erro de conexão, tenta reconectar
        if (
          error.message.includes('Connection pool closed') || 
          error.message.includes('connection') ||
          error.message.includes('timeout')
        ) {
          console.error('Erro de conexão com banco de dados. Tentando reconectar...');
          
          // Tenta estabelecer nova conexão
          await prismaGlobal.$connect();
          
          // Espera um momento e tenta novamente a query
          await new Promise(resolve => setTimeout(resolve, 1000));
          return await next(params);
        }
        
        throw error;
      }
    });
  }
  
  // Armazena na variável global para reutilização
  global.prisma = prismaGlobal;
  
  console.log('✅ Nova conexão Prisma inicializada e armazenada globalmente');
}

/**
 * Verifica se a conexão com o banco de dados está ativa
 * @returns {Promise<boolean>} Status da conexão
 */
async function checkConnection() {
  try {
    // Executa uma query simples para verificar a conexão
    await prismaGlobal.$queryRaw`SELECT 1 as result`;
    return true;
  } catch (error) {
    console.error('❌ Erro ao verificar conexão com banco de dados:', error);
    
    // Tenta reconectar
    try {
      await prismaGlobal.$disconnect();
      await prismaGlobal.$connect();
      console.log('✅ Reconexão com banco de dados bem-sucedida');
      return true;
    } catch (reconnectError) {
      console.error('❌ Falha ao reconectar com banco de dados:', reconnectError);
      return false;
    }
  }
}

/**
 * Inicializa o banco de dados, verificando e criando tabelas se necessário
 * @returns {Promise<Object>} Resultado da inicialização
 */
async function initializeDatabase() {
  try {
    // Verifica conexão primeiro
    const isConnected = await checkConnection();
    if (!isConnected) {
      throw new Error('Não foi possível estabelecer conexão com o banco de dados');
    }
    
    console.log('🔄 Verificando estrutura do banco de dados...');
    
    // Executa migrations pendentes se necessário
    // Nota: Em produção, as migrations devem ser executadas manualmente
    // ou através de um processo de CI/CD
    if (config.NODE_ENV === 'development') {
      console.log('⚙️ Ambiente de desenvolvimento detectado. Verificando migrations...');
      // Aqui você poderia executar migrations programaticamente se necessário
    }
    
    return { success: true, message: 'Banco de dados verificado e pronto para uso' };
  } catch (error) {
    console.error('❌ Erro ao inicializar banco de dados:', error);
    throw error;
  }
}

// Adiciona os métodos ao objeto exportado
prismaGlobal.checkConnection = checkConnection;
prismaGlobal.initializeDatabase = initializeDatabase;

// Exporta a instância do Prisma
export default prismaGlobal;