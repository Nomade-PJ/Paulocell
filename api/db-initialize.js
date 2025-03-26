import { initializeDatabase } from './_lib/database-config';

/**
 * Endpoint para inicializar o banco de dados
 * Este endpoint é usado na primeira execução no Vercel para:
 * 1. Verificar se o banco de dados está configurado corretamente
 * 2. Criar tabelas se não existirem (para Vercel Postgres direto)
 * 3. Configurar relações e índices
 * 
 * ATENÇÃO: Endpoint apenas para uso interno/primeiro deploy
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
    // Verifica a chave secreta (se fornecida em produção)
    const secretKey = req.query.key || '';
    const expectedKey = process.env.DB_INIT_KEY || '';
    
    // Em produção, verifica a chave secreta para segurança
    if (process.env.NODE_ENV === 'production' && expectedKey && secretKey !== expectedKey) {
      return res.status(401).json({
        success: false,
        message: 'Acesso não autorizado'
      });
    }
    
    // Inicializa o banco de dados
    const success = await initializeDatabase();
    
    if (success) {
      return res.status(200).json({
        success: true,
        message: 'Banco de dados inicializado com sucesso',
        dbType: process.env.DB_TYPE || 'prisma',
        timestamp: new Date().toISOString()
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Falha ao inicializar banco de dados'
      });
    }
  } catch (error) {
    console.error('Erro ao inicializar banco de dados:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
} 