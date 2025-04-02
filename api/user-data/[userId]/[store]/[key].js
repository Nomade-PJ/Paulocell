import { getDbClient } from '../../../_lib/database-config';

/**
 * API para gerenciar dados do usuário
 * Este endpoint permite salvar, recuperar e excluir dados vinculados ao ID do usuário
 * Formato da URL: /api/user-data/[userId]/[store]/[key]
 */
export default async function handler(req, res) {
  // Configuração de CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // Lidar com requisição OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Extrair parâmetros da URL
  const { userId, store, key } = req.query;

  // Validar parâmetros
  if (!userId || !store || !key) {
    return res.status(400).json({
      success: false,
      message: 'Parâmetros inválidos. userId, store e key são obrigatórios.'
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

    // Processar a requisição com base no método HTTP
    switch (req.method) {
      case 'GET':
        // Buscar um item específico
        try {
          const item = await models.UserData.findOne({
            userId,
            store,
            key
          }).lean();

          if (!item) {
            return res.status(404).json({
              success: false,
              message: 'Item não encontrado'
            });
          }

          return res.status(200).json({
            success: true,
            data: item.data
          });
        } catch (error) {
          console.error('Erro ao buscar item:', error);
          return res.status(500).json({
            success: false,
            message: `Erro ao buscar item: ${error.message}`
          });
        }

      case 'POST':
      case 'PUT':
        // Salvar ou atualizar um item
        try {
          const { data } = req.body;

          if (data === undefined) {
            return res.status(400).json({
              success: false,
              message: 'Dados não fornecidos'
            });
          }

          // Usar upsert para criar ou atualizar
          const result = await models.UserData.findOneAndUpdate(
            { userId, store, key },
            { 
              userId, 
              store, 
              key, 
              data,
              updatedAt: new Date()
            },
            { 
              upsert: true, 
              new: true,
              setDefaultsOnInsert: true
            }
          );

          return res.status(200).json({
            success: true,
            id: result._id,
            key: result.key,
            message: 'Dados salvos com sucesso'
          });
        } catch (error) {
          console.error('Erro ao salvar item:', error);
          return res.status(500).json({
            success: false,
            message: `Erro ao salvar item: ${error.message}`
          });
        }

      case 'DELETE':
        // Excluir um item
        try {
          const result = await models.UserData.findOneAndDelete({
            userId,
            store,
            key
          });

          if (!result) {
            return res.status(404).json({
              success: false,
              message: 'Item não encontrado'
            });
          }

          return res.status(200).json({
            success: true,
            message: 'Item excluído com sucesso'
          });
        } catch (error) {
          console.error('Erro ao excluir item:', error);
          return res.status(500).json({
            success: false,
            message: `Erro ao excluir item: ${error.message}`
          });
        }

      default:
        return res.status(405).json({
          success: false,
          message: 'Método não permitido'
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