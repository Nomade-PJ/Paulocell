import { getDbClient } from '../../../_lib/database-config';

/**
 * API para listar todos os dados do usuário em uma determinada store
 * Este endpoint permite recuperar todos os itens de uma store específica para um usuário
 * Formato da URL: /api/user-data/[userId]/[store]
 */
export default async function handler(req, res) {
  // Configuração de CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
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

  // Extrair parâmetros da URL
  const { userId, store } = req.query;

  // Validar parâmetros
  if (!userId || !store) {
    return res.status(400).json({
      success: false,
      message: 'Parâmetros inválidos. userId e store são obrigatórios.'
    });
  }

  try {
    // Obter cliente do banco de dados
    const dbClient = await getDbClient();
    
    // Verificar se estamos usando MongoDB
    if (process.env.DB_TYPE !== 'mongoose') {
      return res.status(500).json({
        success: false,
        message: 'Esta API requer MongoDB configurado com DB_TYPE=mongoose'
      });
    }

    // Obter modelos do Mongoose
    const mongooseModule = await import('../../../models/mongoose.js');
    const models = mongooseModule.default();
    
    if (!models || !models.UserData) {
      return res.status(500).json({
        success: false,
        message: 'Modelo UserData não disponível'
      });
    }

    // Buscar todos os itens da store para o usuário
    try {
      const items = await models.UserData.find({
        userId,
        store
      }).lean();

      // Transformar os resultados para o formato esperado pelo cliente
      const formattedItems = items.map(item => ({
        key: item.key,
        data: item.data,
        updatedAt: item.updatedAt
      }));

      return res.status(200).json({
        success: true,
        data: formattedItems,
        count: formattedItems.length
      });
    } catch (error) {
      console.error('Erro ao buscar itens:', error);
      return res.status(500).json({
        success: false,
        message: `Erro ao buscar itens: ${error.message}`
      });
    }
  } catch (error) {
    console.error('Erro no handler de user-data:', error);
    return res.status(500).json({
      success: false,
      message: `Erro interno do servidor: ${error.message}`
    });
  }
}