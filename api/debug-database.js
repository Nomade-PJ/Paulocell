import { testDatabaseConnection, getDatabaseClient } from './_lib/database-config';

/**
 * API endpoint para testar e diagnosticar a conexão com o banco de dados
 * Esta rota é útil para verificar se todos os dispositivos estão vendo os mesmos dados
 * e se a conexão com o banco de dados está funcionando corretamente.
 */
export default async function handler(req, res) {
  // Configuração de CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Lidar com requisição OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Apenas permitir método GET
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Método não permitido'
    });
  }

  try {
    // Obter modo de teste
    const mode = req.query.mode || 'basic';
    
    // Teste básico de conexão
    const connectionTest = await testDatabaseConnection();
    
    if (mode === 'detailed') {
      // Modo detalhado: busca dados reais das tabelas
      const db = await getDatabaseClient();
      
      // Determina qual cliente usar com base no tipo de banco de dados
      let clients = [];
      let services = [];
      let inventory = [];
      
      // Obtém dados dependendo do tipo de banco
      if (process.env.DB_TYPE === 'prisma') {
        // Usando Prisma
        try {
          clients = await db.client.findMany({ take: 10 });
          services = await db.service.findMany({ take: 10 });
          inventory = await db.inventoryItem.findMany({ take: 10 });
        } catch (error) {
          console.error('Erro ao buscar dados via Prisma:', error);
        }
      } else {
        // Usando Vercel Postgres direto
        try {
          const clientsResult = await db.sql`SELECT * FROM users LIMIT 10`;
          const servicesResult = await db.sql`SELECT * FROM services LIMIT 10`;
          const inventoryResult = await db.sql`SELECT * FROM inventory_items LIMIT 10`;
          
          clients = clientsResult.rows;
          services = servicesResult.rows;
          inventory = inventoryResult.rows;
        } catch (error) {
          console.error('Erro ao buscar dados via SQL direto:', error);
        }
      }
      
      return res.status(200).json({
        ...connectionTest,
        timestamp: new Date().toISOString(),
        data: {
          clients,
          services,
          inventory
        },
        environment: {
          nodeEnv: process.env.NODE_ENV,
          dbType: process.env.DB_TYPE,
          vercelEnv: process.env.VERCEL_ENV,
          region: process.env.VERCEL_REGION
        }
      });
    }
    
    // Retorna apenas informações básicas
    return res.status(200).json({
      ...connectionTest,
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        dbType: process.env.DB_TYPE,
        vercelEnv: process.env.VERCEL_ENV
      }
    });
  } catch (error) {
    console.error('Erro no diagnóstico de banco de dados:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
} 