import { PrismaClient } from '@prisma/client';

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
  if (process.env.NODE_ENV === 'development') {
    prismaGlobal.$use(async (params, next) => {
      const before = Date.now();
      const result = await next(params);
      const after = Date.now();
      console.log(`Query ${params.model}.${params.action} levou ${after - before}ms`);
      return result;
    });
  }
  
  // Em ambiente de produção, adiciona middleware para tentar reconectar em caso de erro
  if (process.env.NODE_ENV === 'production') {
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

// Exporta a instância do Prisma
export default prismaGlobal; 