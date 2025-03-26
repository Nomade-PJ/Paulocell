import { verifyAuthHeader } from '../_lib/auth';
import prisma from '../_lib/prisma-client';

export default async function handler(req, res) {
  // Configuração de CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // Lidar com requisição OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Verificar autenticação
    const user = verifyAuthHeader(req);
    
    // Rota GET - Listar itens do inventário
    if (req.method === 'GET') {
      // Extrair parâmetros de filtro
      const { name, category, lowStock, page = 1, limit = 10 } = req.query;
      
      // Construir condições de filtro
      const where = {};
      
      if (name) where.name = { contains: name };
      if (category) where.category = category;
      
      // Filtrar por itens com estoque baixo
      if (lowStock === 'true') {
        where.quantity = {
          lte: prisma.inventoryItem.fields.minQuantity
        };
      }
      
      // Calcular paginação
      const skip = (page - 1) * Number(limit);
      
      // Consultar itens do inventário com paginação
      const inventoryItems = await prisma.inventoryItem.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: {
          name: 'asc'
        }
      });
      
      // Contar o total de registros para paginação
      const total = await prisma.inventoryItem.count({ where });
      
      return res.status(200).json({
        success: true,
        data: inventoryItems,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      });
    }
    
    // Rota POST - Criar item do inventário
    if (req.method === 'POST') {
      const { name, description, quantity, minQuantity, price, category } = req.body;
      
      // Validar campos obrigatórios
      if (!name) {
        return res.status(400).json({
          success: false,
          message: 'Nome do item é obrigatório'
        });
      }
      
      // Criar item do inventário
      const newItem = await prisma.inventoryItem.create({
        data: {
          name,
          description,
          quantity: quantity || 0,
          minQuantity: minQuantity || 5,
          price,
          category
        }
      });
      
      return res.status(201).json({
        success: true,
        data: newItem,
        message: 'Item do inventário criado com sucesso'
      });
    }
    
    // Método não permitido
    return res.status(405).json({
      success: false,
      message: 'Método não permitido'
    });
    
  } catch (error) {
    console.error('Erro ao processar requisição de inventário:', error);
    
    // Erro de autenticação
    if (error.message === 'Token não fornecido ou inválido' || error.message === 'Token inválido ou expirado') {
      return res.status(401).json({
        success: false,
        message: error.message
      });
    }
    
    // Outros erros
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
} 