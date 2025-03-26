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
      message: 'ID do serviço não fornecido'
    });
  }

  try {
    // Verificar autenticação
    const user = verifyAuthHeader(req);
    
    // Rota GET - Obter serviço por ID
    if (req.method === 'GET') {
      const service = await prisma.service.findUnique({
        where: { id: Number(id) },
        include: {
          serviceItems: true
        }
      });
      
      if (!service) {
        return res.status(404).json({
          success: false,
          message: 'Serviço não encontrado'
        });
      }
      
      return res.status(200).json({
        success: true,
        data: service
      });
    }
    
    // Rota PUT - Atualizar serviço
    if (req.method === 'PUT') {
      const { description, clientName, clientPhone, status, serviceItems, completedAt } = req.body;
      
      // Verificar se o serviço existe
      const existingService = await prisma.service.findUnique({
        where: { id: Number(id) }
      });
      
      if (!existingService) {
        return res.status(404).json({
          success: false,
          message: 'Serviço não encontrado'
        });
      }
      
      // Calcular preço total se houver itens
      let totalPrice = 0;
      if (serviceItems && serviceItems.length > 0) {
        totalPrice = serviceItems.reduce((total, item) => (
          total + (item.price * (item.quantity || 1))
        ), 0);
      }
      
      // Preparar dados para atualização
      const updateData = {
        description,
        clientName,
        clientPhone,
        status,
        totalPrice,
        updatedAt: new Date()
      };
      
      // Adicionar data de conclusão se o status for "completed"
      if (status === 'completed') {
        updateData.completedAt = completedAt || new Date();
      }
      
      // Remover propriedades indefinidas
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });
      
      // Atualizar o serviço em uma transação para garantir integridade
      const updatedService = await prisma.$transaction(async (tx) => {
        // Se há itens, remover todos os itens existentes e recriar
        if (serviceItems) {
          // Remover itens existentes
          await tx.serviceItem.deleteMany({
            where: { serviceId: Number(id) }
          });
          
          // Criar novos itens
          for (const item of serviceItems) {
            await tx.serviceItem.create({
              data: {
                ...item,
                serviceId: Number(id)
              }
            });
          }
        }
        
        // Atualizar o serviço
        return tx.service.update({
          where: { id: Number(id) },
          data: updateData,
          include: {
            serviceItems: true
          }
        });
      });
      
      return res.status(200).json({
        success: true,
        data: updatedService,
        message: 'Serviço atualizado com sucesso'
      });
    }
    
    // Rota DELETE - Remover serviço
    if (req.method === 'DELETE') {
      // Verificar se o serviço existe
      const existingService = await prisma.service.findUnique({
        where: { id: Number(id) }
      });
      
      if (!existingService) {
        return res.status(404).json({
          success: false,
          message: 'Serviço não encontrado'
        });
      }
      
      // Remover o serviço em uma transação para garantir integridade
      await prisma.$transaction(async (tx) => {
        // Remover itens do serviço
        await tx.serviceItem.deleteMany({
          where: { serviceId: Number(id) }
        });
        
        // Remover o serviço
        await tx.service.delete({
          where: { id: Number(id) }
        });
      });
      
      return res.status(200).json({
        success: true,
        message: 'Serviço removido com sucesso'
      });
    }
    
    // Método não permitido
    return res.status(405).json({
      success: false,
      message: 'Método não permitido'
    });
    
  } catch (error) {
    console.error(`Erro ao processar requisição para serviço ID ${id}:`, error);
    
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