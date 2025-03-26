import { verifyAuthHeader } from '../_lib/auth';
import prisma from '../_lib/prisma-client';

export default async function handler(req, res) {
  // Configuração de CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PUT,DELETE');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // Lidar com requisição OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Obter o ID da rota
  const { id } = req.query;
  
  if (!id) {
    return res.status(400).json({
      success: false,
      message: 'ID do item não fornecido'
    });
  }

  try {
    // Verificar autenticação
    const user = verifyAuthHeader(req);
    
    // Rota GET - Obter item por ID
    if (req.method === 'GET') {
      const item = await prisma.inventoryItem.findUnique({
        where: { id: Number(id) }
      });
      
      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Item não encontrado'
        });
      }
      
      return res.status(200).json({
        success: true,
        data: item
      });
    }
    
    // Rota PUT - Atualizar item
    if (req.method === 'PUT') {
      const { name, description, quantity, minQuantity, price, category } = req.body;
      
      // Verificar se o item existe
      const existingItem = await prisma.inventoryItem.findUnique({
        where: { id: Number(id) }
      });
      
      if (!existingItem) {
        return res.status(404).json({
          success: false,
          message: 'Item não encontrado'
        });
      }
      
      // Validar campos obrigatórios
      if (name === '') {
        return res.status(400).json({
          success: false,
          message: 'Nome do item não pode ser vazio'
        });
      }
      
      // Preparar dados para atualização
      const updateData = {
        name,
        description,
        quantity,
        minQuantity,
        price,
        category,
        updatedAt: new Date()
      };
      
      // Remover propriedades indefinidas
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });
      
      // Atualizar o item
      const updatedItem = await prisma.inventoryItem.update({
        where: { id: Number(id) },
        data: updateData
      });
      
      return res.status(200).json({
        success: true,
        data: updatedItem,
        message: 'Item atualizado com sucesso'
      });
    }
    
    // Rota DELETE - Remover item
    if (req.method === 'DELETE') {
      // Verificar se o item existe
      const existingItem = await prisma.inventoryItem.findUnique({
        where: { id: Number(id) }
      });
      
      if (!existingItem) {
        return res.status(404).json({
          success: false,
          message: 'Item não encontrado'
        });
      }
      
      // Remover o item
      await prisma.inventoryItem.delete({
        where: { id: Number(id) }
      });
      
      return res.status(200).json({
        success: true,
        message: 'Item removido com sucesso'
      });
    }
    
    // Método não permitido
    return res.status(405).json({
      success: false,
      message: 'Método não permitido'
    });
    
  } catch (error) {
    console.error(`Erro ao processar requisição para item ID ${id}:`, error);
    
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